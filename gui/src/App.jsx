import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const API_URL = 'http://localhost:5000'

function App() {
  const [status, setStatus] = useState({
    buffer_level: 0,
    buffer_size: 200,
    capture_count: 0,
    is_running: true,
    has_hands: false
  })
  const [landmarks, setLandmarks] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [landmarkHistory, setLandmarkHistory] = useState([])
  const canvasRef = useRef(null)

  // Fetch status periodically
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/status`)
        const data = await res.json()
        setStatus(data)
      } catch (err) {
        setStatus(prev => ({ ...prev, is_running: false }))
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 500)
    return () => clearInterval(interval)
  }, [])

  // Fetch landmarks for graph
  useEffect(() => {
    const fetchLandmarks = async () => {
      try {
        const res = await fetch(`${API_URL}/landmarks`)
        const data = await res.json()
        if (data.has_data) {
          setLandmarks(data.fingertips)
          setLandmarkHistory(prev => {
            const newHistory = [...prev, data.fingertips]
            return newHistory.slice(-50) // Keep last 50 frames
          })
        }
      } catch (err) {
        // Silent fail
      }
    }

    const interval = setInterval(fetchLandmarks, 100) // 10fps
    return () => clearInterval(interval)
  }, [])

  // Draw landmark graph
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || landmarkHistory.length < 2) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear
    ctx.fillStyle = '#12121a'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#2a2a3a'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky']
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6']

    // Draw lines for each finger
    fingers.forEach((finger, fingerIdx) => {
      ctx.strokeStyle = colors[fingerIdx]
      ctx.lineWidth = 2
      ctx.beginPath()

      landmarkHistory.forEach((frame, i) => {
        const x = (width / (landmarkHistory.length - 1)) * i
        const y = height - (frame[finger]?.y || 0.5) * height

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    })
  }, [landmarkHistory])

  // Handle capture
  const handleCapture = useCallback(async () => {
    if (isCapturing || status.buffer_level < status.buffer_size) return
    
    setIsCapturing(true)
    try {
      const res = await fetch(`${API_URL}/capture`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setStatus(prev => ({ ...prev, capture_count: data.capture_count }))
      }
    } catch (err) {
      console.error('Capture failed:', err)
    }
    setIsCapturing(false)
  }, [isCapturing, status.buffer_level, status.buffer_size])

  // Handle quit
  const handleQuit = async () => {
    if (window.confirm('Are you sure you want to quit?')) {
      try {
        await fetch(`${API_URL}/quit`, { method: 'POST' })
      } catch (err) {
        console.error('Quit failed:', err)
      }
    }
  }

  const bufferPercent = (status.buffer_level / status.buffer_size) * 100
  const isBufferFull = status.buffer_level >= status.buffer_size

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>🤟 Sign Language Translator</h1>
        <div className="header-status">
          <div className="status-indicator">
            <span className={`status-dot ${status.is_running ? '' : 'offline'}`}></span>
            {status.is_running ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Video Section */}
        <div className="video-section">
          <div className="video-container">
            <img
              className="video-feed"
              src={`${API_URL}/video_feed`}
              alt="Hand Tracking Feed"
            />
            <div className="video-overlay">
              <span className="overlay-badge">LIVE</span>
              {status.has_hands && (
                <span className="overlay-badge recording">TRACKING</span>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="control-panel">
            <button
              className="btn btn-capture"
              onClick={handleCapture}
              disabled={!isBufferFull || isCapturing}
            >
              {isCapturing ? '⏳ Saving...' : '📸 Capture Gesture'}
            </button>
            <button className="btn btn-quit" onClick={handleQuit}>
              ⏹️ Quit
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Status Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Buffer Status</span>
              <span className="card-badge">{isBufferFull ? 'READY' : 'FILLING'}</span>
            </div>

            <div className="buffer-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${bufferPercent}%` }}
                ></div>
              </div>
              <div className="progress-text">
                <span>{status.buffer_level} frames</span>
                <span>{status.buffer_size} needed</span>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{status.capture_count}</div>
                <div className="stat-label">Captures</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{Math.round(bufferPercent)}%</div>
                <div className="stat-label">Buffer</div>
              </div>
            </div>

            <div className="hands-indicator">
              <span className="hand-icon">{status.has_hands ? '✋' : '👋'}</span>
              <span className={`hand-status ${status.has_hands ? 'detected' : ''}`}>
                {status.has_hands ? 'Hands Detected' : 'No Hands Detected'}
              </span>
            </div>
          </div>

          {/* Landmark Graph */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Fingertip Movement</span>
              <span className="card-badge">LIVE</span>
            </div>

            <div className="graph-container">
              <canvas
                ref={canvasRef}
                className="graph-canvas"
                width={340}
                height={180}
              />
            </div>

            <div className="graph-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                Thumb
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                Index
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#10b981' }}></span>
                Middle
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#6366f1' }}></span>
                Ring
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#8b5cf6' }}></span>
                Pinky
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
