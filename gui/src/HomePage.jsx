import { useNavigate } from 'react-router-dom'
import './App.css'
function HomePage({ onSettingsOpen }) {

    const navigate = useNavigate()
    const API_URL = 'http://localhost:5001'

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
            {/* Header / Nav */}
            <nav className="home-nav">
                <button className="settings-btn glass-btn" onClick={onSettingsOpen}>
                    ⚙️
                </button>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">🚀 AI-Powered Hand Tracking</div>
                    <h1 className="hero-title">
                        Sign Language
                        <span className="hero-highlight"> Translator</span>
                    </h1>
                    <p className="hero-description">
                        Transform hand gestures into meaningful data using advanced computer vision.
                        Our real-time tracking system captures and processes sign language movements
                        to help build better accessibility tools.
                    </p>
                    <button className="hero-cta" onClick={() => navigate('/tracker')}>
                        Get Started with Real-Time Translator
                        <span className="cta-arrow">→</span>
                    </button>
                    <button className="hero-cta-2" onClick={() => navigate('/transcriber')}>
                        Get Started with Video Transcriber
                        <span className="cta-arrow">→</span>
                    </button>


                    <button className="hero-cta-3" onClick={() => navigate('/enhanced')}>
                        Get Started with Enhanced Sign Language
                        <span className="cta-arrow">→</span>
                    </button>
                </div>

                <div className="hero-visual">
                    <div className="floating-hand">🤟</div>
                    <div className="orbit orbit-1">
                        <div className="orbit-dot"></div>
                    </div>
                    <div className="orbit orbit-2">
                        <div className="orbit-dot"></div>
                    </div>
                    <div className="orbit orbit-3">
                        <div className="orbit-dot"></div>
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

            {/* Footer CTA */}
            <section className="footer-cta">
                <h2>Ready to Start Tracking?</h2>
                <p>Launch the tracker and begin capturing sign language gestures</p>
                <button className="hero-cta" onClick={() => navigate('/tracker')}>
                    Open Tracker
                    <span className="cta-arrow">→</span>
                </button>
            </section>
        </div>
    )
}

export default HomePage
