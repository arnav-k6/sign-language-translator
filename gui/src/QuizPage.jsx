import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

import { API_URL } from './config'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const NUMBERS = '0123456789'.split('')

const DIFFICULTY_CONFIG = {
    letters: { label: 'Letters (A–Z)', signs: LETTERS, icon: '🔤', rounds: 10 },
    numbers: { label: 'Numbers (0–9)', signs: NUMBERS, icon: '🔢', rounds: 10 },
    mixed: { label: 'Mixed (All)', signs: [...LETTERS, ...NUMBERS], icon: '🎲', rounds: 15 },
}

const MATCH_HOLD_MS = 1200 // hold correct sign for 1.2s to confirm
const ROUND_TIME_LIMIT = 15 // seconds per round

function shuffleArray(arr) {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

export default function QuizPage({ onSettingsOpen }) {
    const navigate = useNavigate()

    // Quiz state
    const [phase, setPhase] = useState('setup') // 'setup' | 'playing' | 'results'
    const [difficulty, setDifficulty] = useState('letters')
    const [targets, setTargets] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [roundResults, setRoundResults] = useState([]) // { target, answered, correct, timeMs }
    const [roundStartTime, setRoundStartTime] = useState(null)
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME_LIMIT)

    // Prediction state
    const [prediction, setPrediction] = useState({ letter: '', confidence: 0 })

    // Match tracking — user must hold correct sign
    const [matchProgress, setMatchProgress] = useState(0) // 0 to 1
    const matchStartRef = useRef(null)
    const animFrameRef = useRef(null)

    // Feedback animation
    const [feedback, setFeedback] = useState(null) // { type: 'correct'|'wrong'|'timeout', letter }

    // Stats persistence
    const [allTimeStats, setAllTimeStats] = useState(() => {
        return JSON.parse(localStorage.getItem('slt_quiz_stats') || '{"totalQuizzes":0,"totalCorrect":0,"totalRounds":0,"bestStreak":0}')
    })

    const target = targets[currentIndex] || null
    const config = DIFFICULTY_CONFIG[difficulty]

    // Fetch prediction
    useEffect(() => {
        if (phase !== 'playing') return
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

    // Round countdown timer
    useEffect(() => {
        if (phase !== 'playing') return
        setTimeLeft(ROUND_TIME_LIMIT)
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval)
                    handleTimeout()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [phase, currentIndex])

    // Match progress tracking — check if user is holding the correct sign
    useEffect(() => {
        if (phase !== 'playing' || !target) return

        const predictedLetter = (prediction.letter || '').toUpperCase()
        const isMatch = predictedLetter === target && prediction.confidence > 0.4

        if (isMatch) {
            if (!matchStartRef.current) {
                matchStartRef.current = Date.now()
            }

            const updateProgress = () => {
                const elapsed = Date.now() - matchStartRef.current
                const progress = Math.min(elapsed / MATCH_HOLD_MS, 1)
                setMatchProgress(progress)

                if (progress >= 1) {
                    // Correct!
                    handleCorrect()
                } else {
                    animFrameRef.current = requestAnimationFrame(updateProgress)
                }
            }
            animFrameRef.current = requestAnimationFrame(updateProgress)
        } else {
            matchStartRef.current = null
            setMatchProgress(0)
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current)
            }
        }

        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current)
            }
        }
    }, [prediction.letter, prediction.confidence, target, phase])

    // Use refs for values needed by callbacks to avoid stale closures
    const currentIndexRef = useRef(0)
    const targetsRef = useRef([])
    const scoreRef = useRef(0)
    const roundStartTimeRef = useRef(null)
    const roundResultsRef = useRef([])
    const bestStreakRef = useRef(0)

    // Keep refs in sync
    useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
    useEffect(() => { targetsRef.current = targets }, [targets])
    useEffect(() => { scoreRef.current = score }, [score])
    useEffect(() => { roundStartTimeRef.current = roundStartTime }, [roundStartTime])
    useEffect(() => { roundResultsRef.current = roundResults }, [roundResults])
    useEffect(() => { bestStreakRef.current = bestStreak }, [bestStreak])

    // Start quiz
    const startQuiz = useCallback(() => {
        const cfg = DIFFICULTY_CONFIG[difficulty]
        const shuffled = shuffleArray(cfg.signs).slice(0, cfg.rounds)
        setTargets(shuffled)
        setCurrentIndex(0)
        setScore(0)
        setStreak(0)
        setBestStreak(0)
        setRoundResults([])
        setMatchProgress(0)
        matchStartRef.current = null
        setRoundStartTime(Date.now())
        setFeedback(null)
        setPhase('playing')
    }, [difficulty])

    // Advance to next round or finish
    const advanceRound = useCallback(() => {
        const nextIndex = currentIndexRef.current + 1
        if (nextIndex >= targetsRef.current.length) {
            // Finish quiz & save stats
            setPhase('results')
            setAllTimeStats(prev => {
                const finalCorrect = roundResultsRef.current.filter(r => r.correct).length
                const updated = {
                    totalQuizzes: prev.totalQuizzes + 1,
                    totalCorrect: prev.totalCorrect + finalCorrect,
                    totalRounds: prev.totalRounds + targetsRef.current.length,
                    bestStreak: Math.max(prev.bestStreak, bestStreakRef.current)
                }
                localStorage.setItem('slt_quiz_stats', JSON.stringify(updated))
                return updated
            })
        } else {
            setCurrentIndex(nextIndex)
            setRoundStartTime(Date.now())
            matchStartRef.current = null
            setMatchProgress(0)
        }
    }, [])

    // Handle correct answer
    const handleCorrect = useCallback(() => {
        const timeMs = Date.now() - (roundStartTimeRef.current || Date.now())
        const t = targetsRef.current[currentIndexRef.current]
        setRoundResults(prev => [...prev, { target: t, answered: t, correct: true, timeMs }])
        setScore(prev => prev + 1)
        setStreak(prev => {
            const newStreak = prev + 1
            setBestStreak(best => Math.max(best, newStreak))
            return newStreak
        })
        setFeedback({ type: 'correct', letter: t })
        matchStartRef.current = null
        setMatchProgress(0)

        setTimeout(() => {
            setFeedback(null)
            advanceRound()
        }, 800)
    }, [advanceRound])

    // Handle timeout
    const handleTimeout = useCallback(() => {
        const t = targetsRef.current[currentIndexRef.current]
        setRoundResults(prev => [...prev, { target: t, answered: '—', correct: false, timeMs: ROUND_TIME_LIMIT * 1000 }])
        setStreak(0)
        setFeedback({ type: 'timeout', letter: t })

        setTimeout(() => {
            setFeedback(null)
            advanceRound()
        }, 1000)
    }, [advanceRound])

    // Skip current sign
    const skipSign = useCallback(() => {
        const t = targetsRef.current[currentIndexRef.current]
        const timeMs = Date.now() - (roundStartTimeRef.current || Date.now())
        setRoundResults(prev => [...prev, { target: t, answered: 'SKIP', correct: false, timeMs }])
        setStreak(0)
        setFeedback({ type: 'wrong', letter: t })

        setTimeout(() => {
            setFeedback(null)
            advanceRound()
        }, 600)
    }, [advanceRound])

    // ======================== RENDER ========================

    // Setup Screen
    if (phase === 'setup') {
        return (
            <div className="tracker-page">
                <header className="header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
                        <h1>🎮 Quiz Mode</h1>
                    </div>
                    <div className="header-status">
                        <button className="settings-btn" onClick={onSettingsOpen}>⚙️</button>
                    </div>
                </header>

                <div className="quiz-setup">
                    <div className="quiz-setup-title">Choose Your Challenge</div>
                    <div className="quiz-setup-subtitle">Sign the letters shown on screen — the AI will check your accuracy</div>

                    <div className="quiz-difficulty-grid">
                        {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                            <button
                                key={key}
                                className={`quiz-difficulty-card ${difficulty === key ? 'selected' : ''}`}
                                onClick={() => setDifficulty(key)}
                            >
                                <span className="quiz-diff-icon">{cfg.icon}</span>
                                <span className="quiz-diff-label">{cfg.label}</span>
                                <span className="quiz-diff-rounds">{cfg.rounds} rounds</span>
                            </button>
                        ))}
                    </div>

                    {/* All-time stats */}
                    {allTimeStats.totalQuizzes > 0 && (
                        <div className="quiz-alltime-stats">
                            <div className="quiz-stat-mini">
                                <span className="stat-value">{allTimeStats.totalQuizzes}</span>
                                <span className="stat-label">Quizzes</span>
                            </div>
                            <div className="quiz-stat-mini">
                                <span className="stat-value">
                                    {allTimeStats.totalRounds > 0 ? Math.round((allTimeStats.totalCorrect / allTimeStats.totalRounds) * 100) : 0}%
                                </span>
                                <span className="stat-label">Accuracy</span>
                            </div>
                            <div className="quiz-stat-mini">
                                <span className="stat-value">🔥 {allTimeStats.bestStreak}</span>
                                <span className="stat-label">Best Streak</span>
                            </div>
                        </div>
                    )}

                    <button className="btn btn-capture quiz-start-btn" onClick={startQuiz}>
                        ▶ Start Quiz
                    </button>
                </div>
            </div>
        )
    }

    // Results Screen
    if (phase === 'results') {
        const totalRounds = targets.length
        const correct = roundResults.filter(r => r.correct).length
        const accuracy = totalRounds > 0 ? Math.round((correct / totalRounds) * 100) : 0
        const avgTime = roundResults.length > 0
            ? Math.round(roundResults.reduce((sum, r) => sum + r.timeMs, 0) / roundResults.length / 1000 * 10) / 10
            : 0

        let grade = '🌟'
        if (accuracy >= 90) grade = '🏆 Amazing!'
        else if (accuracy >= 70) grade = '⭐ Great Job!'
        else if (accuracy >= 50) grade = '👍 Good Effort'
        else grade = '💪 Keep Practicing'

        return (
            <div className="tracker-page">
                <header className="header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
                        <h1>🎮 Quiz Results</h1>
                    </div>
                </header>

                <div className="quiz-results">
                    <div className="quiz-results-grade">{grade}</div>

                    <div className="quiz-results-stats">
                        <div className="quiz-result-stat big">
                            <span className="stat-value">{accuracy}%</span>
                            <span className="stat-label">Accuracy</span>
                        </div>
                        <div className="quiz-result-stat">
                            <span className="stat-value">{correct}/{totalRounds}</span>
                            <span className="stat-label">Correct</span>
                        </div>
                        <div className="quiz-result-stat">
                            <span className="stat-value">🔥 {bestStreak}</span>
                            <span className="stat-label">Best Streak</span>
                        </div>
                        <div className="quiz-result-stat">
                            <span className="stat-value">{avgTime}s</span>
                            <span className="stat-label">Avg Time</span>
                        </div>
                    </div>

                    {/* Round breakdown */}
                    <div className="quiz-results-breakdown">
                        <div className="card-header">
                            <span className="card-title">Round Breakdown</span>
                        </div>
                        <div className="quiz-rounds-list">
                            {roundResults.map((r, i) => (
                                <div key={i} className={`quiz-round-item ${r.correct ? 'correct' : 'wrong'}`}>
                                    <span className="round-num">#{i + 1}</span>
                                    <span className="round-target">{r.target}</span>
                                    <span className="round-answer">{r.answered}</span>
                                    <span className="round-time">{(r.timeMs / 1000).toFixed(1)}s</span>
                                    <span className="round-icon">{r.correct ? '✅' : '❌'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="quiz-results-actions">
                        <button className="btn btn-capture" onClick={startQuiz}>
                            🔄 Play Again
                        </button>
                        <button className="btn btn-secondary" onClick={() => setPhase('setup')}>
                            Change Difficulty
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Playing screen
    const progress = targets.length > 0 ? ((currentIndex) / targets.length) * 100 : 0
    const predictedLetter = (prediction.letter || '').toUpperCase()
    const isCurrentlyMatching = predictedLetter === target && prediction.confidence > 0.4

    return (
        <div className="tracker-page">
            <header className="header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => setPhase('setup')}>← Quit</button>
                    <h1>🎮 Quiz Mode</h1>
                </div>
                <div className="header-status">
                    <span className="card-badge">{currentIndex + 1}/{targets.length}</span>
                    <span className="card-badge active">Score: {score}</span>
                    {streak >= 2 && <span className="card-badge" style={{ color: '#f59e0b' }}>🔥 {streak}</span>}
                </div>
            </header>

            {/* Progress bar */}
            <div className="quiz-progress-bar">
                <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="quiz-playing-layout">
                {/* Left: Video feed */}
                <div className="quiz-video-section">
                    <div className="video-container">
                        <img
                            src={`${API_URL}/video_feed`}
                            alt="Camera Feed"
                            className="video-feed"
                            style={{ borderRadius: '5px' }}
                        />

                        {/* Match progress ring overlay */}
                        {isCurrentlyMatching && !feedback && (
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

                        {/* Feedback overlay */}
                        {feedback && (
                            <div className={`quiz-feedback-overlay ${feedback.type}`}>
                                {feedback.type === 'correct' ? '✅ Correct!' : feedback.type === 'timeout' ? '⏰ Time Up!' : '⏭ Skipped'}
                            </div>
                        )}
                    </div>

                    {/* What AI sees */}
                    <div className="quiz-ai-reading">
                        <span className="quiz-ai-label">AI detects:</span>
                        <span className={`quiz-ai-letter ${isCurrentlyMatching ? 'matching' : ''}`}>
                            {prediction.letter || '—'}
                        </span>
                        <span className="quiz-ai-conf">
                            {prediction.confidence > 0 ? `${(prediction.confidence * 100).toFixed(0)}%` : ''}
                        </span>
                    </div>
                </div>

                {/* Right: Target + stats */}
                <div className="quiz-info-section">
                    {/* Target card */}
                    <div className="card quiz-target-card">
                        <div className="card-header">
                            <span className="card-title">Sign This</span>
                            <span className="quiz-timer" style={{ color: timeLeft <= 5 ? '#ef4444' : 'var(--text-secondary)' }}>
                                ⏱ {timeLeft}s
                            </span>
                        </div>
                        <div className="quiz-target-display">
                            <span className="quiz-target-letter">{target}</span>
                        </div>
                        <button className="btn btn-small btn-secondary quiz-skip-btn" onClick={skipSign}>
                            ⏭ Skip
                        </button>
                    </div>

                    {/* Score card */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">📊 Score</span>
                        </div>
                        <div className="quiz-score-grid">
                            <div className="quiz-score-item">
                                <span className="stat-value">{score}</span>
                                <span className="stat-label">Correct</span>
                            </div>
                            <div className="quiz-score-item">
                                <span className="stat-value">{currentIndex > 0 ? Math.round((score / currentIndex) * 100) : 0}%</span>
                                <span className="stat-label">Accuracy</span>
                            </div>
                            <div className="quiz-score-item">
                                <span className="stat-value">{streak}</span>
                                <span className="stat-label">Streak</span>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming signs */}
                    {targets.length > currentIndex + 1 && (
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Coming Up</span>
                            </div>
                            <div className="quiz-upcoming">
                                {targets.slice(currentIndex + 1, currentIndex + 4).map((t, i) => (
                                    <span key={i} className="quiz-upcoming-letter">{t}</span>
                                ))}
                                {targets.length > currentIndex + 4 && (
                                    <span className="quiz-upcoming-more">+{targets.length - currentIndex - 4}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
