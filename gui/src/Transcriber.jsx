import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = "http://localhost:5001"

export default function Transcriber({ onSettingsOpen }) {
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1)

    const [videoFile, setVideoFile] = useState(null)
    const [videoURL, setVideoURL] = useState(null)
    const [transcript, setTranscript] = useState("")
    const [words, setWords] = useState([])
    const [wordsText, setWordsText] = useState("")
    const [segments, setSegments] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setVideoFile(file)
        setVideoURL(URL.createObjectURL(file))
        setTranscript("")
        setWords([])
        setWordsText("")
        setSegments([])
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
            if (!res.ok || data.error) {
                setError(data.error || `Server error: ${res.status}`)
            } else {
                setTranscript(data.text || "(No text detected)")
                setWords(data.words || [])
                setWordsText(data.words_text || data.text || "")
                setSegments(data.segments || [])
            }
        } catch (err) {
            setError(`Transcription failed: ${err.message}`)
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
                <div className="header-right">
                    <button className="settings-btn" onClick={onSettingsOpen}>
                        ⚙️
                    </button>
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
                                ref={videoRef}
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
                            <>
                                {wordsText && words.length > 0 && (
                                    <div className="transcript-box transcript-words" style={{ marginBottom: "0.5rem" }}>
                                        <strong>Words:</strong> {wordsText}
                                    </div>
                                )}
                                <div className="transcript-box">
                                    {segments.length > 0 ? (
                                        <span className="transcript-letters">
                                            {segments.map((seg, i) => (
                                                <span
                                                    key={i}
                                                    className={`transcript-char ${currentSegmentIndex === i ? 'highlight' : ''}`}
                                                    onClick={() => seekToSegment(i)}
                                                    title={`${seg.start}s - ${seg.end}s`}
                                                >
                                                    {seg.char}
                                                </span>
                                            ))}
                                        </span>
                                    ) : (
                                        <><strong>Raw letters:</strong> {transcript}</>
                                    )}
                                </div>
                                {words.length > 0 && (
                                    <button
                                        className="btn btn-small"
                                        style={{ marginTop: "0.5rem" }}
                                        onClick={() => navigator.clipboard.writeText(wordsText)}
                                    >
                                        Copy as words
                                    </button>
                                )}
                            </>
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
