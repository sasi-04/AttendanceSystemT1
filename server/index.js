import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb, createSession as dbCreateSession, saveToken as dbSaveToken, saveShortCode as dbSaveShortCode, deactivateToken as dbDeactivateToken, deleteShortCode as dbDeleteShortCode, markPresent as dbMarkPresent, enrollStudent as dbEnrollStudent, unenrollStudent as dbUnenrollStudent, getEnrollments as dbGetEnrollments, isEnrolled as dbIsEnrolled, getEnrollmentRecords as dbGetEnrollmentRecords, createStudent as dbCreateStudent, getStudentByRegNo as dbGetStudentByRegNo, updateStudentPassword as dbUpdateStudentPassword, createStaff, getStaffByEmail, listStaff } from './db.js'

const app = express()
initDb()
const server = http.createServer(app)
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(s => s.trim())
const io = new SocketIOServer(server, { cors: { origin: allowedOrigins, methods: ['GET','POST'] } })

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

// Log all requests
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Allow clients to call API under '/api' as well as root paths
// This rewrites '/api/qr/generate' -> '/qr/generate', etc.
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/')) {
    req.url = req.url.slice(4)
  } else if (req.url === '/api') {
    req.url = '/'
  }
  next()
})

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

// One-time seed for demo data
;(async function seedOnce(){
  try {
    const courseId = '21CS701'
    const students = [
      'ES22CJ27','ES22CJ56','ES22CJ07','ES22CJ41','ES22CJ35','ES22CJ57','ES22CJ08','ES22CJ12','ES22CJ61','ES22CJ59','ES22CJ52','ES22CJ49','ES22CJ58','ES22CJ36','ES22CJ26','ES22CJ21','ES22CJ24','ES22CJ60','ES22CJ30','ES22CJ31','ES22CJ17','ES22CJ63','ES22CJ47','ES22CJ06','ES22CJ23','ES22CJ11','ES22CJ42','ES22CJ01','ES22CJ28','ES22CJ18','ES22CJ40','ES22CJ48','ES22CJ55'
    ]
    const existing = await dbGetEnrollments(courseId)
    if (!existing || existing.length === 0) {
      for (const sid of students) { await dbEnrollStudent(courseId, sid) }
      console.log(`[seed] Enrolled ${students.length} students to ${courseId}`)
    }
    // Create demo staff user
    const staffEmail = 'staff@demo.com'
    const found = await getStaffByEmail(staffEmail)
    if (!found) {
      await createStaff({ id: staffEmail, name: 'Demo Staff', email: staffEmail, password: 'staff123' })
      console.log('[seed] Created demo staff user: staff@demo.com / staff123')
    }
  } catch (e) {
    console.warn('[seed] skipped or failed:', e?.message)
  }
})()

// In-memory stores for demo
const sessions = new Map() // sessionId -> { courseId, startTime, endTime, status, windowSeconds, present:Set<string>, enrolled:Set<string>, currentTokenJti, tokenExpiresAt }
const tokens = new Map() // jti -> { sessionId, expiresAt, active, code? }
const shortCodes = new Map() // code -> jti 

function generateToken(sessionId) {
  const jti = `${sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 30
  const token = jwt.sign({ jti, sid: sessionId, iat, exp, ver: 1 }, JWT_SECRET, { algorithm: 'HS256' })
  // create 6-char short code [A-Z0-9]
  let code
  do {
    code = Math.random().toString(36).slice(2, 8).toUpperCase()
  } while (shortCodes.has(code))
  tokens.set(jti, { sessionId, expiresAt: exp * 1000, active: true, code })
  shortCodes.set(code, jti)
  // persist
  try { dbSaveToken({ jti, sessionId, expiresAt: exp * 1000, active: 1, code }); dbSaveShortCode(code, jti) } catch {}
  return { token, jti, exp }
}

function scheduleExpiry(jti) {
  const t = tokens.get(jti)
  if (!t) return
  const delay = Math.max(0, t.expiresAt - Date.now())
  setTimeout(() => {
    const tok = tokens.get(jti)
    if (tok) tok.active = false
    if (tok?.code) shortCodes.delete(tok.code)
    try { if (tok) dbDeactivateToken(jti); if (tok?.code) dbDeleteShortCode(tok.code) } catch {}
    const sess = sessions.get(t.sessionId)
    if (sess && sess.currentTokenJti === jti) {
      // window expired; keep session active to allow new generations
      io.to(`session:${t.sessionId}`).emit('session_closed', {
        sessionId: t.sessionId,
        summary: {
          present: sess.present.size,
          total: sess.enrolled.size,
          absent: Math.max(0, sess.enrolled.size - sess.present.size)
        }
      })
      // clear the current QR marker so clients know it's gone
      sess.currentTokenJti = null
      sess.tokenExpiresAt = null
    }
  }, delay)
}

// Socket.IO
io.on('connection', (socket) => {
  socket.on('subscribe', ({ sessionId }) => {
    socket.join(`session:${sessionId}`)
    const sess = sessions.get(sessionId)
    if (sess && sess.currentTokenJti) {
      const expMs = sess.tokenExpiresAt
      const secondsRemaining = Math.max(0, Math.ceil((expMs - Date.now()) / 1000))
      socket.emit('countdown', { secondsRemaining })
    }
  })
  socket.on('unsubscribe', ({ sessionId }) => {
    socket.leave(`session:${sessionId}`)
  })
})

// Routes

// Create session (teacher/admin)
app.post('/sessions', async (req, res) => {
  const { courseId, windowSeconds = 30 } = req.body || {}
  if (!courseId) return res.status(400).json({ error: 'courseId_required' })
  const sessionId = `S_${Date.now()}`
  const enrolledList = await dbGetEnrollments(courseId)
  const enrolled = new Set(enrolledList)
  const session = {
    courseId,
    startTime: Date.now(),
    endTime: null,
    status: 'active',
    windowSeconds,
    present: new Set(),
    enrolled: new Set(enrolled),
    currentTokenJti: null,
    tokenExpiresAt: null
  }
  sessions.set(sessionId, session)
  try { dbCreateSession({ id: sessionId, courseId, startTime: session.startTime, endTime: null, status: 'active', windowSeconds, currentTokenJti: null, tokenExpiresAt: null }) } catch {}

  const { token, jti, exp } = generateToken(sessionId)
  session.currentTokenJti = jti
  session.tokenExpiresAt = exp * 1000
  scheduleExpiry(jti)

  QRCode.toDataURL(token).then((imageDataUrl) => {
    const code = tokens.get(jti)?.code
    io.to(`session:${sessionId}`).emit('qr_updated', { imageDataUrl, token, code, expiresAt: new Date(exp * 1000).toISOString(), jti })
  }).catch(() => {})

  return res.json({ sessionId, status: session.status, startTime: session.startTime, windowSeconds })
})

// Current QR fetch (optional)
app.get('/sessions/:sessionId/qr', (req, res) => {
  const { sessionId } = req.params
  const sess = sessions.get(sessionId)
  if (!sess) return res.status(404).json({ error: 'not_found' })
  const jti = sess.currentTokenJti
  if (!jti) return res.status(404).json({ error: 'no_token' })
  const exp = Math.floor(sess.tokenExpiresAt / 1000)
  const token = jwt.sign({ jti, sid: sessionId, iat: Math.floor(Date.now()/1000), exp, ver: 1 }, JWT_SECRET)
  const code = tokens.get(jti)?.code
  QRCode.toDataURL(token).then((imageDataUrl) => {
    res.json({ imageDataUrl, token, code, expiresAt: new Date(exp * 1000).toISOString(), jti })
  }).catch(() => res.status(500).json({ error: 'qr_error' }))
})

// Student scan
app.post('/attendance/scan', async (req, res) => {
  const { token, studentId = 'student1' } = req.body || {}
  if (!token) return res.status(400).json({ error: 'token_required' })
  try {
    const cleaned = String(token).trim().toUpperCase()
    let jti
    let sessionId
    if (cleaned.includes('.')) {
      const payload = jwt.verify(cleaned, JWT_SECRET)
      jti = payload.jti
      sessionId = payload.sid
    } else {
      const mapped = shortCodes.get(cleaned)
      if (!mapped) return res.status(400).json({ error: 'invalid_code' })
      jti = mapped
      const tokRec = tokens.get(jti)
      sessionId = tokRec?.sessionId
    }
    const tok = tokens.get(jti)
    if (!tok || tok.sessionId !== sessionId) return res.status(400).json({ error: 'invalid_code' })
    if (!tok.active) return res.status(409).json({ error: 'already_used' })
    const sess = sessions.get(sessionId)
    if (!sess) return res.status(410).json({ error: 'session_closed' })
    if (Date.now() >= tok.expiresAt) return res.status(410).json({ error: 'expired_code' })
    const enrolled = await dbIsEnrolled(sess.courseId, studentId)
    if (!enrolled) return res.status(403).json({ error: 'not_enrolled' })

    sess.present.add(studentId)
    tok.active = false
    if (tok.code) shortCodes.delete(tok.code)
    try { dbMarkPresent(sessionId, studentId); dbDeactivateToken(jti); if (tok.code) dbDeleteShortCode(tok.code) } catch {}

    io.to(`session:${sessionId}`).emit('scan_confirmed', {
      sessionId,
      countPresent: sess.present.size,
      countRemaining: Math.max(0, sess.enrolled.size - sess.present.size)
    })

    return res.json({ status: 'present', sessionId, markedAt: new Date().toISOString() })
  } catch (e) {
    console.error('Scan validate error:', e)
    if (e.name === 'TokenExpiredError') return res.status(410).json({ error: 'expired_code' })
    return res.status(400).json({ error: 'invalid_code', message: e?.message })
  }
})

// Generate QR on-demand (new token per click). If sessionId missing or invalid, start new session
app.post('/qr/generate', async (req, res) => {
  try {
    const { sessionId: providedSessionId, courseId = 'COURSE1' } = req.body || {}
    if (!courseId) return res.status(400).json({ error: 'course_required', message: 'courseId is required' })
    let sessionId = providedSessionId
    let sess = sessionId && sessions.get(sessionId)
    if (!sess) {
      // create new session
      sessionId = `S_${Date.now()}`
      const enrolledList = await dbGetEnrollments(courseId)
      const enrolled = new Set(enrolledList)
      sess = {
        courseId,
        startTime: Date.now(),
        endTime: null,
        status: 'active',
        windowSeconds: 30,
        present: new Set(),
        enrolled: new Set(enrolled),
        currentTokenJti: null,
        tokenExpiresAt: null
      }
      sessions.set(sessionId, sess)
    }

    // Deactivate any previously active token for this session
    if (sess.currentTokenJti && tokens.has(sess.currentTokenJti)) {
      const prev = tokens.get(sess.currentTokenJti)
      prev.active = false
      if (prev.code) shortCodes.delete(prev.code)
    }
    const { token, jti, exp } = generateToken(sessionId)
    sess.currentTokenJti = jti
    sess.tokenExpiresAt = exp * 1000
    scheduleExpiry(jti)

    try {
      const imageDataUrl = await QRCode.toDataURL(token)
      const code = tokens.get(jti)?.code
      io.to(`session:${sessionId}`).emit('qr_updated', { imageDataUrl, token, code, expiresAt: new Date(exp * 1000).toISOString(), jti })
      io.to(`session:${sessionId}`).emit('countdown', { secondsRemaining: 30 })
      return res.json({ sessionId, imageDataUrl, token, code, expiresAt: new Date(exp * 1000).toISOString(), jti })
    } catch (imgErr) {
      console.error('QR image generation failed, falling back to token-only:', imgErr)
      // Emit token so clients can render QR locally
      const code = tokens.get(jti)?.code
      io.to(`session:${sessionId}`).emit('qr_updated', { imageDataUrl: null, token, code, expiresAt: new Date(exp * 1000).toISOString(), jti })
      io.to(`session:${sessionId}`).emit('countdown', { secondsRemaining: 30 })
      return res.json({ sessionId, imageDataUrl: null, token, code, expiresAt: new Date(exp * 1000).toISOString(), jti, clientRender: true })
    }
  } catch (e) {
    console.error('QR generate error:', e)
    return res.status(500).json({ error: 'qr_error', message: e?.message || 'QR generation failed' })
  }
})

// Close session explicitly (teacher/admin)
app.post('/sessions/:sessionId/close', (req, res) => {
  const { sessionId } = req.params
  const sess = sessions.get(sessionId)
  if (!sess) return res.status(404).json({ error: 'not_found' })
  if (sess.status === 'closed' || sess.status === 'expired') {
    return res.json({ sessionId, status: sess.status, endTime: sess.endTime })
  }
  sess.status = 'closed'
  sess.endTime = Date.now()
  // deactivate current token
  if (sess.currentTokenJti && tokens.has(sess.currentTokenJti)) {
    tokens.get(sess.currentTokenJti).active = false
  }
  io.to(`session:${sessionId}`).emit('session_closed', {
    sessionId,
    summary: {
      present: sess.present.size,
      total: sess.enrolled.size,
      absent: Math.max(0, sess.enrolled.size - sess.present.size)
    }
  })
  return res.json({ sessionId, status: sess.status, endTime: sess.endTime })
})

// Staff auth
app.post('/auth/staff/login', async (req, res) => {
  console.log('[AUTH] Staff login attempt:', req.body)
  const { email, password } = req.body || {}
  if (!email || !password) {
    console.log('[AUTH] Missing email or password')
    return res.status(400).json({ error: 'email_password_required' })
  }
  const staff = await getStaffByEmail(String(email).trim().toLowerCase())
  console.log('[AUTH] Staff found:', staff ? staff.email : 'null')
  if (!staff || staff.password !== password) {
    console.log('[AUTH] Invalid credentials - staff exists:', !!staff, 'password match:', staff?.password === password)
    return res.status(401).json({ error: 'invalid_credentials' })
  }
  console.log('[AUTH] Login successful for:', staff.email)
  return res.json({ id: staff.id, name: staff.name, email: staff.email, role: 'staff' })
})

// Student auth
app.post('/auth/student/login', async (req, res) => {
  const { regNo, password } = req.body || {}
  if (!regNo || !password) return res.status(400).json({ error: 'regno_password_required' })
  const normalized = String(regNo).replace(/\s+/g, '').trim()
  const student = await dbGetStudentByRegNo(normalized)
  if (!student || student.password !== password) return res.status(401).json({ error: 'invalid_credentials' })
  return res.json({ role: 'student', regNo: student.regNo, studentId: student.studentId, name: student.name })
})

// Student password change
app.post('/auth/student/change-password', async (req, res) => {
  console.log('Password change request received:', {
    body: req.body,
    studentId: req.body?.studentId,
    hasCurrentPassword: !!req.body?.currentPassword,
    hasNewPassword: !!req.body?.newPassword
  })
  
  const { studentId, currentPassword, newPassword } = req.body || {}
  
  if (!studentId || !currentPassword || !newPassword) {
    console.log('Missing required fields')
    return res.status(400).json({ error: 'missing_required_fields' })
  }
  
  if (newPassword.length < 6) {
    console.log('Password too short')
    return res.status(400).json({ error: 'password_too_short' })
  }
  
  try {
    const normalized = String(studentId).replace(/\s+/g, '').trim()
    console.log('Looking for student:', normalized)
    const student = await dbGetStudentByRegNo(normalized)
    
    if (!student) {
      console.log('Student not found')
      return res.status(404).json({ error: 'student_not_found' })
    }
    
    console.log('Student found:', { regNo: student.regNo, hasPassword: !!student.password })
    
    if (student.password !== currentPassword) {
      console.log('Current password incorrect')
      return res.status(401).json({ error: 'current_password_incorrect' })
    }
    
    console.log('Updating password...')
    await dbUpdateStudentPassword(normalized, newPassword)
    console.log('Password updated successfully')
    
    return res.json({ message: 'password_updated_successfully' })
    
  } catch (error) {
    console.error('Password update error:', error)
    return res.status(500).json({ error: 'internal_server_error' })
  }
})

// Admin auth (demo)
app.post('/auth/admin/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email_password_required' })
  if (email === 'admin@demo.com' && password === 'admin123') {
    return res.json({ id: 'admin', name: 'Admin User', email: 'admin@demo.com', role: 'admin' })
  }
  return res.status(401).json({ error: 'invalid_credentials' })
})

// Enrollment routes
app.get('/courses/:courseId/enrollments', async (req, res) => {
  const { courseId } = req.params
  const records = await dbGetEnrollmentRecords(courseId)
  return res.json({ courseId, students: records })
})

app.post('/courses/:courseId/enroll', async (req, res) => {
  const { courseId } = req.params
  const { studentId, name, regNo } = req.body || {}
  if (!studentId) return res.status(400).json({ error: 'studentId_required' })
  await dbEnrollStudent(courseId, studentId, name, regNo)
  return res.json({ courseId, studentId, name, regNo, status: 'enrolled' })
})

app.delete('/courses/:courseId/enroll', async (req, res) => {
  const { courseId } = req.params
  const { studentId } = req.body || {}
  if (!studentId) return res.status(400).json({ error: 'studentId_required' })
  await dbUnenrollStudent(courseId, studentId)
  return res.json({ courseId, studentId, status: 'unenrolled' })
})

// Serve frontend build (same-origin) if available
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 5174
const HOST = process.env.HOST || '0.0.0.0'
server.listen(PORT, HOST, () => console.log(`Attendance server (API + SPA) on http://${HOST}:${PORT}`))


