import React, { useEffect, useState, useRef } from 'react'

export default function FullScreenQrScanner({ onDecode, onError, onClose, constraints }) {
  const [ScannerComp, setScannerComp] = useState(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    let mounted = true
    import('@yudiel/react-qr-scanner')
      .then((m) => {
        const C = m?.QrScanner || m?.default || null
        if (mounted) setScannerComp(() => C)
      })
      .catch(() => {
        if (mounted) setScannerComp(() => null)
      })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
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
  }, [isFullScreen])

  const enterFullScreen = async () => {
    if (containerRef.current && containerRef.current.requestFullscreen) {
      try {
        await containerRef.current.requestFullscreen()
        setIsFullScreen(true)
      } catch (error) {
        console.error('Failed to enter fullscreen:', error)
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

  if (!ScannerComp) {
    return (
      <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Loading scanner…
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${
        isFullScreen 
          ? 'fixed inset-0 z-50 bg-black flex flex-col' 
          : 'aspect-square bg-black/5 rounded-lg overflow-hidden'
      }`}
    >
      {/* Full Screen Header */}
      {isFullScreen && (
        <div className="flex items-center justify-between p-4 bg-black/80 text-white">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold">QR Code Scanner</h2>
          </div>
          <button
            onClick={exitFullScreen}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            title="Exit Fullscreen (ESC)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Scanner Container */}
      <div className={`${isFullScreen ? 'flex-1 relative' : 'w-full h-full'} flex items-center justify-center`}>
        <div className={`${isFullScreen ? 'w-full h-full max-w-2xl' : 'w-full h-full'} relative`}>
          <ScannerComp
            onDecode={handleDecode}
            onError={onError}
            constraints={constraints || { facingMode: 'environment' }}
            className="w-full h-full object-cover"
          />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg"></div>
            
            {/* Scanning line animation */}
            <div className="absolute inset-x-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Full Screen Instructions */}
      {isFullScreen && (
        <div className="p-4 bg-black/80 text-white text-center">
          <p className="text-sm mb-2">📱 Point your camera at the QR code</p>
          <p className="text-xs text-gray-300">Press ESC or tap ✕ to exit fullscreen</p>
        </div>
      )}

      {/* Fullscreen Button (when not in fullscreen) */}
      {!isFullScreen && (
        <button
          onClick={enterFullScreen}
          className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors z-10"
          title="Open in Fullscreen"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}
    </div>
  )
}
