import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

const API_URL = 'http://localhost:5001'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const NUMBERS = '0123456789'.split('')
const ALL_SIGNS = [...LETTERS, ...NUMBERS]

const MATCH_HOLD_MS = 1000
const MASTERY_COUNT = 3

export default function PracticePage({ onSettingsOpen }) {
  const navigate = useNavigate()

  const [phase, setPhase] = useState('select') // 'select' | 'practicing' | 'mastered'
  const [targetLetter, setTargetLetter] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [prediction, setPrediction] = useState({ letter: '', confidence: 0 })
  const [matchProgress, setMatchProgress] = useState(0)
  const matchStartRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    if (phase !== 'practicing') return
    const fetchPrediction = async () => {
      try {
        const res = await fetch(`${API_URL}/prediction`)
        const data = await res.json()
        setPrediction(data)
      } catch { /* silent */ }
    }
    const interval = setInterval(fetchPrediction, 100)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (phase !== 'practicing' || !targetLetter) return

    const predictedLetter = (prediction.letter || '').toUpperCase()
    const isMatch = predictedLetter === targetLetter && prediction.confidence > 0.4

    if (isMatch) {
      if (!matchStartRef.current) {
        matchStartRef.current = Date.now()
      }
      const updateProgress = () => {
        const elapsed = Date.now() - matchStartRef.current
        const progress = Math.min(elapsed / MATCH_HOLD_MS, 1)
        setMatchProgress(progress)
        if (progress >= 1) {
          matchStartRef.current = null
          setMatchProgress(0)
          setMatchCount(c => {
            const next = c + 1
            if (next >= MASTERY_COUNT) {
              setPhase('mastered')
            }
            return next
          })
        } else {
          animFrameRef.current = requestAnimationFrame(updateProgress)
        }
      }
      animFrameRef.current = requestAnimationFrame(updateProgress)
    } else {
      matchStartRef.current = null
      setMatchProgress(0)
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [prediction.letter, prediction.confidence, targetLetter, phase])

  const startPractice = useCallback((letter) => {
    setTargetLetter(letter)
    setMatchCount(0)
    setMatchProgress(0)
    matchStartRef.current = null
    setPhase('practicing')
  }, [])

  const pickAnother = useCallback(() => {
    setPhase('select')
    setTargetLetter('')
    setMatchCount(0)
  }, [])

  const isMatching = (prediction.letter || '').toUpperCase() === targetLetter && prediction.confidence > 0.4

  if (phase === 'select') {
    return (
      <div className="tracker-page">
        <header className="header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
            <h1>📖 Practice Mode</h1>
          </div>
          <button className="settings-btn" onClick={onSettingsOpen}>⚙️</button>
        </header>

        <div className="practice-select">
          <h2>Choose a letter to practice</h2>
          <p className="practice-subtitle">Hold the correct sign for {MATCH_HOLD_MS / 1000}s, {MASTERY_COUNT} times to master it</p>
          <div className="practice-letter-grid">
            {ALL_SIGNS.map(char => (
              <button
                key={char}
                className="practice-letter-btn"
                onClick={() => startPractice(char)}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'mastered') {
    return (
      <div className="tracker-page">
        <header className="header">
          <button className="back-btn" onClick={pickAnother}>← Another Letter</button>
          <h1>📖 Practice</h1>
        </header>
        <div className="practice-mastered">
          <div className="mastered-badge">✅ Letter Mastered!</div>
          <div className="mastered-letter">{targetLetter}</div>
          <p>You held {targetLetter} correctly {MASTERY_COUNT} times!</p>
          <button className="btn btn-capture" onClick={pickAnother}>
            Practice Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="tracker-page">
      <header className="header">
        <div className="header-left">
          <button className="back-btn" onClick={pickAnother}>← Change Letter</button>
          <h1>📖 Practice: {targetLetter}</h1>
        </div>
        <span className="card-badge">{matchCount}/{MASTERY_COUNT} holds</span>
      </header>

      <div className="practice-playing-layout">
        <div className="practice-video-section">
          <div className="video-container">
            <img
              src={`${API_URL}/video_feed`}
              alt="Camera"
              className="video-feed"
            />
            {isMatching && (
              <div className="quiz-match-overlay">
                <svg className="quiz-match-ring" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" className="ring-bg" />
                  <circle
                    cx="50" cy="50" r="42"
                    className="ring-fill"
                    strokeDasharray={`${matchProgress * 264} 264`}
                  />
                </svg>
                <span className="quiz-match-text">Hold...</span>
              </div>
            )}
          </div>
          <div className="quiz-ai-reading">
            <span className="quiz-ai-label">AI detects:</span>
            <span className={`quiz-ai-letter ${isMatching ? 'matching' : ''}`}>
              {prediction.letter || '—'}
            </span>
            <span className="quiz-ai-conf">
              {prediction.confidence > 0 ? `${(prediction.confidence * 100).toFixed(0)}%` : ''}
            </span>
          </div>
        </div>

        <div className="practice-target-section">
          <div className="card quiz-target-card">
            <div className="card-header">
              <span className="card-title">Sign This</span>
            </div>
            <div className="quiz-target-display">
              <span className="quiz-target-letter">{targetLetter}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
