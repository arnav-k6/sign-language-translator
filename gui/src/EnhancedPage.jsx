
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'


function EnhancedPage() {
    const navigate = useNavigate()
    const [isOffline, setIsOffline] = useState(false)
    const [predictionText, setPredictionText] = useState("...")

    // Use port 5001 as defined in server.py
    const API_URL = 'http://localhost:5001'

    useEffect(() => {
        // Check if backend is alive
        fetch(`${API_URL}/status`)
            .then(res => {
                if (!res.ok) throw new Error()
                return res.json()
            })
            .then(() => setIsOffline(false))
            .catch(() => setIsOffline(true))

        // Poll for enhanced prediction
        const interval = setInterval(() => {
            fetch(`${API_URL}/enhanced_output`)
                .then(res => {
                    if (!res.ok) throw new Error("Fetch failed")
                    return res.json()
                })
                .then(data => {
                    if (data.success) {
                        setPredictionText(data.text === "..." ? "Waiting..." : data.text)
                    }
                })
                .catch(err => {
                    // console.log("Prediction poll error", err)
                    // Don't clutter logs, but maybe set status?
                })
        }, 500) // Poll every 500ms

        return () => clearInterval(interval)
    }, [API_URL])

    return (
        <div className="tracker-page">
            {/* Header */}
            <header className="header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        ← Back
                    </button>
                    <h1>Enhanced Sign Language</h1>
                </div>

                <div className="header-status">
                    <div className="status-indicator">
                        <div className={`status-dot ${isOffline ? 'offline' : ''}`}></div>
                        {isOffline ? 'Offline' : 'Enhanced AI Active'}
                    </div>
                </div>
            </header>

            <div className="main-content" style={{ display: 'grid', gridTemplateColumns: '1fr', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Video Feed */}
                <div className="video-section">
                    <div className="card">
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <span className="card-badge">Rule-Based + AI Hybrid</span>
                            {' '}Detecting "HELLO" & More
                        </h3>

                        <div className="video-container" style={{ aspectRatio: '16/9', maxHeight: '70vh' }}>
                            <img
                                src={`${API_URL}/enhanced_feed`}
                                alt="Enhanced Sign Language Feed"
                                className="video-feed"
                                onError={() => setIsOffline(true)}
                            />

                            <div className="video-overlay">
                                <span className="overlay-badge recording">Live Analysis</span>
                            </div>

                            {/* Enhanced Prediction Overlay */}
                            <div className="prediction-overlay">
                                <div className="prediction-content">
                                    <span className="prediction-label">Detected Sign</span>
                                    <h2 className="prediction-text">{predictionText}</h2>
                                </div>
                            </div>
                        </div>

                        <div className="control-panel" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                                Perform the "HELLO" sign by moving your index finger diagonally near your nose.
                                <br />
                                Other supported signs: "me", "yes", "no", "thankyou".
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default EnhancedPage
