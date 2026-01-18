import { useState } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = "http://localhost:5000"

export default function Transcriber() {
    const navigate = useNavigate()

    const [videoFile, setVideoFile] = useState(null)
    const [videoURL, setVideoURL] = useState(null)
    const [transcript, setTranscript] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setVideoFile(file)
        setVideoURL(URL.createObjectURL(file))
        setTranscript("")
        setError("")
    }

    const handleTranscribe = async () => {
        if (!videoFile) {
            setError("Please upload a video first.")
            return
        }

        setLoading(true)
        setError("")

        const formData = new FormData()
        formData.append("video", videoFile)

        try {
            const res = await fetch(`${API_URL}/api/transcribe`, {
                method: "POST",
                body: formData
            })
            const data = await res.json()
            setTranscript(data.text)
        } catch {
            setError("Transcription failed.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="tracker-page">
            {/* Header */}
            <header className="header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate("/")}>
                        ← Back
                    </button>
                    <h1>🎥 Sign Language Video Transcriber</h1>
                </div>
            </header>

            {/* Main Content */}
            <div className="main-content">
                {/* Left Column */}
                <div className="video-section">
                    <div className="card">
                        <h3>Upload Sign Language Video</h3>

                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                        />

                        {videoURL && (
                            <video
                                src={videoURL}
                                controls
                                className="video-preview"
                            />
                        )}

                        <button
                            className="btn btn-capture"
                            onClick={handleTranscribe}
                            disabled={loading}
                        >
                            {loading ? "⏳ Transcribing..." : "📝 Transcribe Video"}
                        </button>

                        {error && <p className="error-text">{error}</p>}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="sidebar">
                    <div className="card prediction-card">
                        <div className="card-header">
                            <span className="card-title">English Translation</span>
                        </div>

                        {transcript ? (
                            <div className="transcript-box">
                                {transcript}
                            </div>
                        ) : (
                            <div className="no-prediction">
                                Upload a video to begin
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
