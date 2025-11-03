import React, { useEffect, useState, useRef } from 'react'

export default function AutoFullScreenQrScanner({ onDecode, onError, onClose, constraints, autoStart = true }) {
  const [ScannerComp, setScannerComp] = useState(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef(null)

  useEffect(() => {
    let mounted = true
    import('@yudiel/react-qr-scanner')
      .then((m) => {
        const C = m?.QrScanner || m?.default || null
        if (mounted) {
          setScannerComp(() => C)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setScannerComp(() => null)
          setIsLoading(false)
        }
      })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement
      setIsFullScreen(isCurrentlyFullScreen)
      
      // If user exits fullscreen, call onClose
      if (!isCurrentlyFullScreen && onClose) {
        onClose()
      }
    }

    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        exitFullScreen()
      }
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange)
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [isFullScreen, onClose])

  // Auto-enter fullscreen when component mounts and scanner is ready
  useEffect(() => {
    if (ScannerComp && autoStart && !isLoading && !isFullScreen) {
      enterFullScreen()
    }
  }, [ScannerComp, autoStart, isLoading, isFullScreen])

  const enterFullScreen = async () => {
    if (containerRef.current && containerRef.current.requestFullscreen) {
      try {
        await containerRef.current.requestFullscreen()
        setIsFullScreen(true)
      } catch (error) {
        console.error('Failed to enter fullscreen:', error)
        // If fullscreen fails, still show the scanner
      }
    }
  }

  const exitFullScreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
        setIsFullScreen(false)
      } catch (error) {
        console.error('Failed to exit fullscreen:', error)
      }
    }
    if (onClose) onClose()
  }

  const handleDecode = (result) => {
    if (onDecode) {
      onDecode(result)
    }
    // Auto-exit fullscreen after successful scan
    if (isFullScreen) {
      exitFullScreen()
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading QR Scanner...</p>
          <p className="text-sm text-gray-300 mt-2">Preparing camera access</p>
        </div>
      </div>
    )
  }

  if (!ScannerComp) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">📷</div>
          <h2 className="text-xl font-semibold mb-2">Camera Not Available</h2>
          <p className="text-gray-300 mb-4">Unable to access camera for QR scanning</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Full Screen Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 text-white">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <h2 className="text-lg font-semibold">QR Code Scanner</h2>
        </div>
        <button
          onClick={exitFullScreen}
          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          title="Close Scanner (ESC)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scanner Container */}
      <div className="flex-1 relative flex items-center justify-center">
        <div className="w-full h-full max-w-4xl relative">
          <ScannerComp
            onDecode={handleDecode}
            onError={onError}
            constraints={constraints || { facingMode: 'environment' }}
            className="w-full h-full object-cover"
          />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner brackets - larger for better visibility */}
            <div className="absolute top-8 left-8 w-12 h-12 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-white rounded-br-lg"></div>
            
            {/* Center scanning area */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                {/* Scanning line animation */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Instructions */}
      <div className="p-6 bg-black/80 text-white text-center">
        <div className="max-w-md mx-auto space-y-2">
          <p className="text-lg font-medium">📱 Point your camera at the QR code</p>
          <p className="text-sm text-gray-300">Position the QR code within the scanning area</p>
          <p className="text-xs text-gray-400">Press ESC or tap ✕ to close scanner</p>
        </div>
      </div>
    </div>
  )
}
