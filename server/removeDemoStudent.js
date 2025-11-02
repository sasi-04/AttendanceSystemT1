import Datastore from 'nedb-promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function removeDemoStudent() {
  console.log('🗑️  Removing demo student...\n')
  
  // Open students database
  const studentsDb = Datastore.create({ 
    filename: path.resolve(__dirname, 'data/students.db'), 
    autoload: true 
  })
  
  // Remove demo student
  const studentRegNo = 'DEMO001'
  const result = await studentsDb.remove({ regNo: studentRegNo }, { multi: false })
  
  if (result > 0) {
    console.log('✅ Successfully removed demo student (DEMO001)')
  } else {
    console.log('⚠️  Demo student (DEMO001) not found')
  }
  
  // Also remove any enrollments for this student
  const enrollmentsDb = Datastore.create({ 
    filename: path.resolve(__dirname, 'data/enrollments.db'), 
    autoload: true 
  })
  
  const enrollmentResult = await enrollmentsDb.remove({ studentId: 'DEMO001' }, { multi: true })
  if (enrollmentResult > 0) {
    console.log(`✅ Removed ${enrollmentResult} enrollment(s) for demo student`)
  }
  
  // Remove any attendance records
  const presentsDb = Datastore.create({ 
    filename: path.resolve(__dirname, 'data/presents.db'), 
    autoload: true 
  })
  
  const attendanceResult = await presentsDb.remove({ studentId: 'DEMO001' }, { multi: true })
  if (attendanceResult > 0) {
    console.log(`✅ Removed ${attendanceResult} attendance record(s) for demo student`)
  }
  
  console.log('\n✅ Demo student data cleaned successfully!')
}

removeDemoStudent().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
