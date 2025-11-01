import React, { useCallback, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import StudentQrScanner from '../../components/StudentQrScanner.jsx'
import { apiPost } from '../../components/api.js'

export default function StudentScanAttendance(){
  const [scanState, setScanState] = useState({ status: 'idle', message: '' })
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const mode = searchParams.get('mode') || 'both' // 'scanner', 'manual', or 'both'
  const inputRef = useRef(null)

  const handleModeChange = (newMode) => {
    console.log('Changing mode to:', newMode)
    navigate(`/student/attendance?mode=${newMode}`, { replace: true })
  }

  const validateToken = async (token) => {
    try {
      setScanState({ status: 'validating', message: 'Validating…' })
      const res = await apiPost('/attendance/scan', { token })
      setScanState({ status: 'success', message: `Marked present at ${new Date(res.markedAt).toLocaleTimeString()}` })
    } catch (err) {
      const code = err.code
      const msg = code === 'expired_code' ? 'QR expired. Ask staff to regenerate.'
        : code === 'already_used' ? 'Code already used.'
        : code === 'not_enrolled' ? 'You are not enrolled for this session.'
        : code === 'session_closed' ? 'Session closed.'
        : code === 'network_error' ? 'Network error. Check your connection.'
        : 'Invalid QR code.'
      setScanState({ status: 'error', message: msg })
    }
  }

  const onSubmitToken = useCallback(async (e) => {
    e.preventDefault()
    const token = inputRef.current?.value?.trim()
    if (!token) return
    inputRef.current.value = ''
    await validateToken(token)
  }, [])

  const getTitle = () => {
    switch(mode) {
      case 'scanner': return 'QR Code Scanner'
      case 'manual': return 'Manual Token Entry'
      default: return 'Select Attendance Method'
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection Buttons */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Choose Attendance Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleModeChange('scanner')}
            className={`flex items-center justify-center gap-3 p-4 rounded-lg transition-colors ${
              mode === 'scanner' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-7h2M6 5h2m0 0h2m0 0h2m-6 0h2" />
            </svg>
            <div className="text-left">
              <div className="font-medium">QR Code Scanner</div>
              <div className="text-sm opacity-75">Scan QR code with camera</div>
            </div>
          </button>
          
          <button
            onClick={() => handleModeChange('manual')}
            className={`flex items-center justify-center gap-3 p-4 rounded-lg transition-colors ${
              mode === 'manual' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div className="text-left">
              <div className="font-medium">Manual Token Entry</div>
              <div className="text-sm opacity-75">Enter token code manually</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{getTitle()}</h2>
        </div>
        
        {/* QR Scanner Section - Show ONLY if mode is 'scanner' */}
        {mode === 'scanner' && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">📷 Camera Scanner</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="aspect-square bg-black/5 rounded-lg overflow-hidden flex items-center justify-center">
                  {typeof navigator !== 'undefined' && navigator.mediaDevices ? (
                    <StudentQrScanner
                      onDecode={(result) => validateToken(String(result))}
                      onError={() => {}}
                      constraints={{ facingMode: 'environment' }}
                    />
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-600">Camera not available in this context.</div>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">📱 Point your camera at the QR code displayed by your teacher</p>
                  <p>✅ Attendance will be marked automatically when scanned</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Token Entry Section - Show ONLY if mode is 'manual' */}
        {mode === 'manual' && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">⌨️ Manual Token Entry</h3>
            <form onSubmit={onSubmitToken} className="flex gap-2 mb-2">
              <input 
                ref={inputRef} 
                placeholder="Enter the 6-digit code from teacher" 
                className="flex-1 px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                maxLength="6"
                style={{ textTransform: 'uppercase' }}
              />
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Submit Code
              </button>
            </form>
            <div className="text-xs text-gray-500">Enter the 6-character code shown by your teacher if camera scanning doesn't work.</div>
          </div>
        )}

        {/* Default message when no mode is selected */}
        {mode === 'both' && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">👆 Please select an attendance method above</div>
            <div className="text-sm text-gray-400">Choose QR Scanner or Manual Token Entry to mark your attendance</div>
          </div>
        )}

        {/* Status Messages */}
        <div className="mt-4 text-sm">
          {scanState.status === 'validating' && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              {scanState.message}
            </div>
          )}
          {scanState.status === 'success' && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {scanState.message}
            </div>
          )}
          {scanState.status === 'error' && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {scanState.message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


