import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

const TITLE_TEXT = 'SignMate'
const TYPING_SPEED = 60

function HomePage({ onSettingsOpen }) {
    const navigate = useNavigate()
    const API_URL = 'http://localhost:5001'

    const [displayedTitle, setDisplayedTitle] = useState(() =>
        typeof sessionStorage !== 'undefined' && sessionStorage.getItem('slt_typing_seen') ? TITLE_TEXT : ''
    )
    const [showCursor, setShowCursor] = useState(() =>
        typeof sessionStorage !== 'undefined' ? !sessionStorage.getItem('slt_typing_seen') : true
    )

    useEffect(() => {
        const seen = sessionStorage.getItem('slt_typing_seen')
        if (seen) return

        let i = 0
        const interval = setInterval(() => {
            if (i < TITLE_TEXT.length) {
                setDisplayedTitle(TITLE_TEXT.slice(0, i + 1))
                i++
            } else {
                clearInterval(interval)
                sessionStorage.setItem('slt_typing_seen', '1')
                const cursorInterval = setInterval(() => setShowCursor((c) => !c), 530)
                setTimeout(() => {
                    clearInterval(cursorInterval)
                    setShowCursor(false)
                }, 1500)
            }
        }, TYPING_SPEED)
        return () => clearInterval(interval)
    }, [])

    const launchEnhancedMode = async () => {
        try {
            const response = await fetch(`${API_URL}/launch_enhanced`, {
                method: 'POST',
            });
            const data = await response.json();
            if (data.success) {
                console.log("Launched enhanced mode");
            } else {
                console.error("Failed to launch", data.message);
            }
        } catch (err) {
            console.error("Error launching enhanced mode", err);
        }
    }

    return (
        <div className="homepage">
            {/* Header Bar */}
            <header className="home-header">
                <div className="home-header-inner">
                    <button className="home-logo" onClick={() => navigate('/')}>
                        <img src="/signmate_logo.png" alt="SignMate Logo" className="logo-icon" />
                        SignMate
                    </button>
                    <nav className="home-nav-links">
                        <button onClick={() => navigate('/tracker')}>Tracker</button>
                        <button onClick={() => navigate('/transcriber')}>Transcriber</button>
                        <button onClick={() => navigate('/guide')}>Guide</button>
                        <button onClick={() => navigate('/history')}>History</button>
                        <button onClick={() => navigate('/quiz')}>Quiz</button>
                        <button onClick={() => navigate('/practice')}>Practice</button>
                    </nav>
                    <button className="home-settings-btn" onClick={onSettingsOpen}>
                        ⚙️ Settings
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero hero-centered">
                <div className="hero-content">
                    <h1 className="hero-title hero-title-oneline">
                        <span className="hero-title-text">{displayedTitle}</span>
                        {showCursor && <span className="hero-title-cursor">|</span>}
                    </h1>
                    <p className="hero-description">
                        Transform hand gestures into meaningful data using advanced computer vision.
                        Our real-time tracking system captures and processes sign language movements
                        to help build better accessibility tools.
                    </p>

                    {/* Primary actions */}
                    <div className="hero-cta-grid">
                        <button className="hero-cta" onClick={() => navigate('/tracker')}>
                            Real-Time Translator
                            <span className="cta-arrow">→</span>
                        </button>
                        <button className="hero-cta hero-cta-outline" onClick={() => navigate('/transcriber')}>
                            Video Transcriber
                            <span className="cta-arrow">→</span>
                        </button>
                        <button className="hero-cta hero-cta-outline" onClick={() => navigate('/enhanced')}>
                            Enhanced Mode
                            <span className="cta-arrow">→</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <h2 className="features-title">How It Works</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📹</div>
                        <h3>Real-Time Tracking</h3>
                        <p>
                            MediaPipe-powered hand detection tracks 21 landmarks per hand
                            with sub-30ms latency for smooth, responsive tracking.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">✋</div>
                        <h3>Multi-Hand Support</h3>
                        <p>
                            Track up to 2 hands simultaneously, perfect for capturing
                            complex two-handed gestures and sign language phrases.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">💾</div>
                        <h3>Data Collection</h3>
                        <p>
                            Buffer and save gesture sequences to CSV for machine learning
                            training. Build your own sign language recognition models.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Live Visualization</h3>
                        <p>
                            Monitor fingertip movements in real-time with dynamic graphs
                            and visual feedback overlays on the video feed.
                        </p>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="tech-section">
                <h2 className="tech-title">Built With</h2>
                <div className="tech-grid">
                    <div className="tech-item">
                        <span className="tech-icon">🐍</span>
                        <span className="tech-name">Python</span>
                    </div>
                    <div className="tech-item">
                        <span className="tech-icon">🤖</span>
                        <span className="tech-name">MediaPipe</span>
                    </div>
                    <div className="tech-item">
                        <span className="tech-icon">⚛️</span>
                        <span className="tech-name">React</span>
                    </div>
                    <div className="tech-item">
                        <span className="tech-icon">🌐</span>
                        <span className="tech-name">Flask</span>
                    </div>
                    <div className="tech-item">
                        <span className="tech-icon">👁️</span>
                        <span className="tech-name">OpenCV</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="footer-logo">SignMate</span>
                        <p>AI-Powered Sign Language Translation</p>
                        <div className="footer-social">
                            <a href="#" aria-label="GitHub">GitHub</a>
                            <a href="#" aria-label="Twitter">Twitter</a>
                            <a href="#" aria-label="Discord">Discord</a>
                        </div>
                    </div>

                    <div className="footer-links-grid">
                        <div className="footer-column">
                            <h4>Tools</h4>
                            <button onClick={() => navigate('/tracker')}>Tracker</button>
                            <button onClick={() => navigate('/transcriber')}>Transcriber</button>
                            <button onClick={() => navigate('/enhanced')}>Enhanced Mode</button>
                        </div>
                        <div className="footer-column">
                            <h4>Resources</h4>
                            <button onClick={() => navigate('/guide')}>Guide</button>
                            <button onClick={() => navigate('/history')}>History</button>
                            <button onClick={() => navigate('/practice')}>Practice</button>
                            <button onClick={() => navigate('/quiz')}>Quiz</button>
                        </div>
                        <div className="footer-column">
                            <h4>Legal</h4>
                            <button onClick={() => navigate('/privacy')}>Privacy Policy</button>
                            <button onClick={() => navigate('/terms')}>Terms of Service</button>
                            <button onClick={() => navigate('/cookies')}>Cookie Policy</button>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} SignMate. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

export default HomePage
