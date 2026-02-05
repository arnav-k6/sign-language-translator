import { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import HomePage from './HomePage'
import Settings from './Settings'
import './App.css'



import EnhancedPage from './EnhancedPage'
import Transcriber from './Transcriber'

const API_URL = 'http://localhost:5001'

function TrackerPage({ theme, onSettingsOpen }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState({
    buffer_level: 0,
    buffer_size: 200,
    capture_count: 0,
    is_running: true,
    has_hands: false,
    model_loaded: false
  })
  const [prediction, setPrediction] = useState({
    letter: '',
    confidence: 0,
    mode: 'both',
    top3: [],
    hand_position: null
  })
  const [landmarks, setLandmarks] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [landmarkHistory, setLandmarkHistory] = useState([])
  const [arOverlayEnabled, setArOverlayEnabled] = useState(true)
  const canvasRef = useRef(null)
  const videoContainerRef = useRef(null)

  // Sentence Builder state
  const [sentence, setSentence] = useState('')
  const [lastAddedLetter, setLastAddedLetter] = useState('')

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Prediction history for confusion matrix
  const [predictionHistory, setPredictionHistory] = useState([])

  // Auto-add tracking
  const stableLetterRef = useRef('')
  const stableTimerRef = useRef(null)
  const AUTO_ADD_DELAY = 2000 // 2 seconds

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

  // Fetch prediction periodically
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await fetch(`${API_URL}/prediction`)
        const data = await res.json()
        setPrediction(data)
      } catch (err) {
        // Silent fail
      }
    }

    const interval = setInterval(fetchPrediction, 100) // 10fps
    return () => clearInterval(interval)
  }, [])

  // Auto-add letter after 2 seconds of stable prediction
  useEffect(() => {
    const currentLetter = prediction.letter
    const confidence = prediction.confidence

    // Only consider high-confidence predictions
    if (!currentLetter || confidence < 0.5) {
      // Clear timer if no valid prediction
      if (stableTimerRef.current) {
        clearTimeout(stableTimerRef.current)
        stableTimerRef.current = null
      }
      stableLetterRef.current = ''
      return
    }

    // If same letter, don't restart timer
    if (currentLetter === stableLetterRef.current) {
      return // Keep existing timer running
    }

    // New letter - reset and start timer
    stableLetterRef.current = currentLetter

    // Clear existing timer
    if (stableTimerRef.current) {
      clearTimeout(stableTimerRef.current)
    }

    // Start new timer
    stableTimerRef.current = setTimeout(() => {
      // Add letter automatically after 2 seconds
      const letterToAdd = String(currentLetter)
      console.log('Auto-adding letter after 2s:', letterToAdd)
      setSentence(prev => prev + letterToAdd)
      setLastAddedLetter(letterToAdd)
      setPredictionHistory(prev => [...prev.slice(-99), {
        letter: letterToAdd,
        confidence: confidence,
        timestamp: Date.now()
      }])
      // Reset so it can auto-add again if held longer
      stableLetterRef.current = ''
      stableTimerRef.current = null
    }, AUTO_ADD_DELAY)

    // Don't clear timer in cleanup - we manage it manually
  }, [prediction.letter, prediction.confidence])

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

    // Clear - use theme-aware colors
    ctx.fillStyle = theme === 'light' ? '#f1f5f9' : '#12121a'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = theme === 'light' ? '#cbd5e1' : '#2a2a3a'
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
  }, [landmarkHistory, theme])

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

  // Handle mode change
  const handleModeChange = async (mode) => {
    try {
      await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prediction_mode: mode })
      })
      setPrediction(prev => ({ ...prev, mode }))
    } catch (err) {
      console.error('Mode change failed:', err)
    }
  }

  // Fullscreen toggle function (defined before useEffect that uses it)
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Copy sentence to clipboard
  const copySentence = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sentence)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }, [sentence])

  // Add letter to sentence helper
  const addLetterToSentence = useCallback(() => {
    console.log('addLetterToSentence called:', { letter: prediction.letter, confidence: prediction.confidence })
    if (prediction.letter && prediction.confidence > 0.3) {
      const letterToAdd = String(prediction.letter)
      console.log('Adding letter:', letterToAdd, 'charCode:', letterToAdd.charCodeAt(0))
      setSentence(prev => {
        const newSentence = prev + letterToAdd
        console.log('New sentence:', newSentence)
        return newSentence
      })
      setLastAddedLetter(letterToAdd)
      setPredictionHistory(prev => [...prev.slice(-99), {
        letter: letterToAdd,
        confidence: prediction.confidence,
        timestamp: Date.now()
      }])
    }
  }, [prediction.letter, prediction.confidence])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.key.toLowerCase()) {
        case 'c':
          // Capture gesture
          if (status.buffer_level >= status.buffer_size && !isCapturing) {
            handleCapture()
          }
          break
        case 'q':
          // Quit application
          handleQuit()
          break
        case '1':
          // Switch to letters mode
          handleModeChange('letters')
          break
        case '2':
          // Switch to numbers mode
          handleModeChange('numbers')
          break
        case '3':
          // Switch to both mode
          handleModeChange('both')
          break
        case 'a':
          // Toggle AR overlay
          setArOverlayEnabled(prev => !prev)
          break
        case ' ':
          // Add space to sentence
          e.preventDefault()
          setSentence(prev => prev + ' ')
          break
        case 'enter':
          // Add current prediction to sentence
          e.preventDefault()
          addLetterToSentence()
          break
        case 'backspace':
          // Remove last character from sentence
          e.preventDefault()
          setSentence(prev => prev.slice(0, -1))
          break
        case 'x':
          // Clear sentence
          setSentence('')
          setLastAddedLetter('')
          break
        case 'f':
          // Toggle fullscreen
          toggleFullscreen()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status.buffer_level, status.buffer_size, isCapturing, handleCapture, prediction, toggleFullscreen, addLetterToSentence])

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const bufferPercent = (status.buffer_level / status.buffer_size) * 100
  const isBufferFull = status.buffer_level >= status.buffer_size

  return (
    <div className="tracker-page">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1>🤟 Sign Language Translator</h1>
        </div>
        <div className="header-status">
          <div className="status-indicator">
            <span className={`status-dot ${status.is_running ? '' : 'offline'}`}></span>
            {status.is_running ? 'Connected' : 'Disconnected'}
          </div>
          {status.model_loaded && (
            <div className="status-indicator ai-badge">
              <span>🧠</span> AI Active
            </div>
          )}
          <button className="settings-btn" onClick={onSettingsOpen}>
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Video Section */}
        <div className="video-section">
          <div className={`video-container ${isFullscreen ? 'fullscreen' : ''}`} ref={videoContainerRef}>
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

            {/* Fullscreen button - positioned bottom right of video */}
            <button className="fullscreen-btn" onClick={toggleFullscreen}>
              {isFullscreen ? '⛶' : '⛶'}
            </button>

            {/* AR Prediction Overlay - Moves with hand, positioned to side */}
            {arOverlayEnabled && prediction.letter && prediction.confidence > 0.3 && (() => {
              const hp = prediction.hand_position
              if (!hp) return (
                <div className="ar-prediction-overlay">
                  <div className="ar-letter">{prediction.letter}</div>
                  <div className="ar-confidence">
                    {(prediction.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )

              // Position overlay to the LEFT of hand if hand is on right side, and vice versa
              const handOnRightSide = hp.x > 0.5
              const xOffset = handOnRightSide ? -12 : 12 // percentage offset from hand (closer)
              const xPos = Math.min(Math.max((hp.x * 100) + xOffset, 8), 92)
              const yPos = Math.min(Math.max(hp.y * 100, 10), 85)

              return (
                <div
                  className="ar-prediction-overlay"
                  style={{
                    left: `${xPos}%`,
                    top: `${yPos}%`,
                    transform: handOnRightSide ? 'translate(-100%, -50%)' : 'translate(0%, -50%)',
                    right: 'auto'
                  }}
                >
                  <div className="ar-letter">{prediction.letter}</div>
                  <div className="ar-confidence">
                    {(prediction.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )
            })()}
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
          {/* Prediction Card */}
          <div className="card prediction-card">
            <div className="card-header">
              <span className="card-title">🧠 AI Prediction</span>
              <span className={`card-badge ${status.model_loaded ? 'active' : ''}`}>
                {status.model_loaded ? 'ACTIVE' : 'LOADING'}
              </span>
            </div>

            <div className="prediction-display">
              {prediction.top3 && prediction.top3.length > 0 ? (
                <div className="top3-predictions">
                  {prediction.top3.map((pred, index) => (
                    <div key={index} className={`top3-item ${index === 0 ? 'primary' : ''}`}>
                      <div className="top3-rank">#{index + 1}</div>
                      <div className="top3-letter">{pred.letter}</div>
                      <div className="top3-bar-container">
                        <div
                          className="top3-bar-fill"
                          style={{ width: `${pred.confidence * 100}%` }}
                        ></div>
                      </div>
                      <div className="top3-confidence">
                        {(pred.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-prediction">
                  {status.has_hands ? 'Analyzing...' : 'Show a sign'}
                </div>
              )}
            </div>

            {/* Mode Selector */}
            <div className="mode-selector">
              <span className="mode-label">Mode:</span>
              <div className="mode-buttons">
                {['letters', 'numbers', 'both'].map(mode => (
                  <button
                    key={mode}
                    className={`mode-btn ${prediction.mode === mode ? 'active' : ''}`}
                    onClick={() => handleModeChange(mode)}
                  >
                    {mode === 'letters' ? 'A-Z' : mode === 'numbers' ? '0-9' : 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sentence Builder - moved to second position */}
          <div className="card sentence-builder-card">
            <div className="card-header">
              <span className="card-title">📝 Sentence Builder</span>
              <span className="card-badge">{sentence.length} chars</span>
            </div>

            <div className="sentence-display">
              {sentence || <span className="placeholder">Press Enter to add letters...</span>}
              {lastAddedLetter && <span className="last-added">+{lastAddedLetter}</span>}
            </div>

            <div className="sentence-controls">
              <button
                className="btn btn-small btn-primary"
                onClick={addLetterToSentence}
                disabled={!prediction.letter || prediction.confidence <= 0.3}
              >
                + Add Letter
              </button>
              <button
                className="btn btn-small"
                onClick={() => setSentence(prev => prev + ' ')}
              >
                Space
              </button>
              <button
                className="btn btn-small"
                onClick={() => setSentence('')}
                disabled={!sentence}
              >
                Clear
              </button>
              <button
                className="btn btn-small"
                onClick={copySentence}
                disabled={!sentence}
              >
                📋 Copy
              </button>
            </div>

            <div className="shortcut-hints">
              <span><kbd>Enter</kbd> Add</span>
              <span><kbd>Space</kbd> Space</span>
              <span><kbd>⌫</kbd> Delete</span>
              <span><kbd>X</kbd> Clear</span>
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

          {/* Confusion Matrix / Prediction History */}
          <div className="card confusion-matrix-card">
            <div className="card-header">
              <span className="card-title">📊 Prediction History</span>
              <span className="card-badge">{predictionHistory.length} samples</span>
            </div>

            {predictionHistory.length > 0 ? (
              <>
                <div className="letter-frequency-grid">
                  {Object.entries(
                    predictionHistory.reduce((acc, p) => {
                      acc[p.letter] = (acc[p.letter] || 0) + 1
                      return acc
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 12)
                    .map(([letter, count]) => (
                      <div key={letter} className="frequency-item">
                        <div className="frequency-letter">{letter}</div>
                        <div className="frequency-bar">
                          <div
                            className="frequency-fill"
                            style={{ width: `${(count / predictionHistory.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="frequency-count">{count}</div>
                      </div>
                    ))
                  }
                </div>
                <div className="avg-confidence">
                  Avg Confidence: {(predictionHistory.reduce((sum, p) => sum + p.confidence, 0) / predictionHistory.length * 100).toFixed(0)}%
                </div>
              </>
            ) : (
              <div className="no-data">Add letters to see prediction stats</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


import InteractiveBackground from './InteractiveBackground'

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div className="app">
      <InteractiveBackground />
      <Routes>
        <Route path="/" element={<HomePage onSettingsOpen={() => setSettingsOpen(true)} />} />
        <Route
          path="/tracker"
          element={
            <TrackerPage
              theme={theme}
              onSettingsOpen={() => setSettingsOpen(true)}
            />
          }
        />

        <Route path="/transcriber" element={<Transcriber onSettingsOpen={() => setSettingsOpen(true)} />} />
        <Route path="/enhanced" element={<EnhancedPage theme={theme} />} />
      </Routes>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  )
}

export default App
