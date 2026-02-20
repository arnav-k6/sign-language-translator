import { useState, useEffect } from 'react'
import './App.css'

const API_URL = 'http://localhost:5001'

function Settings({ isOpen, onClose, theme, onThemeChange }) {
    const [settings, setSettings] = useState({
        min_tracking_confidence: 0.4,
        min_hand_detection_confidence: 0.4,
        min_hand_presence_confidence: 0.6,
        num_hands: 2,
        camera_index: 0
    })
    const [cameras, setCameras] = useState([])
    const [isSaving, setIsSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')
    const [soundOnAdd, setSoundOnAdd] = useState(() => localStorage.getItem('slt_sound_on_add') !== 'false')

    // Fetch current settings when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchSettings()
        }
    }, [isOpen])

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    const fetchSettings = async () => {
        try {
            const [settingsRes, camerasRes] = await Promise.all([
                fetch(`${API_URL}/settings`),
                fetch(`${API_URL}/cameras`)
            ])
            const data = await settingsRes.json()
            setSettings(prev => ({ ...prev, ...data }))
            const cams = await camerasRes.json()
            setCameras(Array.isArray(cams) ? cams : [])
        } catch (err) {
            console.error('Failed to fetch settings:', err)
        }
    }

    const handleCameraChange = async (index) => {
        try {
            const res = await fetch(`${API_URL}/camera`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ index })
            })
            const data = await res.json()
            if (data.success) {
                setSettings(prev => ({ ...prev, camera_index: index }))
                setSaveMessage('✅ Camera switched')
                setTimeout(() => setSaveMessage(''), 2000)
            } else {
                setSaveMessage('❌ ' + (data.message || 'Camera switch failed'))
            }
        } catch (err) {
            setSaveMessage('❌ Connection error')
        }
    }

    const handleSliderChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: parseFloat(value)
        }))
    }

    const handleNumHandsChange = (value) => {
        setSettings(prev => ({
            ...prev,
            num_hands: parseInt(value)
        }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setSaveMessage('')

        try {
            const res = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            })
            const data = await res.json()

            if (data.success) {
                setSaveMessage('✅ Settings saved! Restart may be required.')
                setTimeout(() => setSaveMessage(''), 3000)
            } else {
                setSaveMessage('❌ Failed to save settings')
            }
        } catch (err) {
            setSaveMessage('❌ Connection error')
            console.error('Failed to save settings:', err)
        }

        setIsSaving(false)
    }

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        onThemeChange(newTheme)
    }

    if (!isOpen) return null

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>⚙️ Settings</h2>
                    <button className="settings-close" onClick={onClose}>✕</button>
                </div>

                <div className="settings-content">
                    {/* Theme Toggle */}
                    <div className="settings-section">
                        <h3>Appearance</h3>
                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">Theme</span>
                                <span className="setting-description">Switch between light and dark mode</span>
                            </div>
                            <button
                                className={`theme-toggle ${theme}`}
                                onClick={handleThemeToggle}
                            >
                                <span className="theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
                                <span className="theme-text">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Camera Selection */}
                    {cameras.length > 1 && (
                        <div className="settings-section">
                            <h3>Camera</h3>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-label">Camera</span>
                                    <span className="setting-description">Select video input</span>
                                </div>
                                <select
                                    className="settings-select"
                                    value={settings.camera_index ?? 0}
                                    onChange={(e) => handleCameraChange(parseInt(e.target.value))}
                                >
                                    {cameras.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Hand Detection Settings */}
                    <div className="settings-section">
                        <h3>Hand Detection</h3>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">Number of Hands</span>
                                <span className="setting-description">Maximum hands to track</span>
                            </div>
                            <div className="num-hands-selector">
                                {[1, 2].map(num => (
                                    <button
                                        key={num}
                                        className={`num-hands-btn ${settings.num_hands === num ? 'active' : ''}`}
                                        onClick={() => handleNumHandsChange(num)}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="setting-row slider-row">
                            <div className="setting-info">
                                <span className="setting-label">Tracking Confidence</span>
                                <span className="setting-description">Min confidence for hand tracking between frames</span>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={settings.min_tracking_confidence}
                                    onChange={e => handleSliderChange('min_tracking_confidence', e.target.value)}
                                    className="settings-slider"
                                />
                                <span className="slider-value">{settings.min_tracking_confidence.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="setting-row slider-row">
                            <div className="setting-info">
                                <span className="setting-label">Detection Confidence</span>
                                <span className="setting-description">Min confidence for initial hand detection</span>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={settings.min_hand_detection_confidence}
                                    onChange={e => handleSliderChange('min_hand_detection_confidence', e.target.value)}
                                    className="settings-slider"
                                />
                                <span className="slider-value">{settings.min_hand_detection_confidence.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="setting-row slider-row">
                            <div className="setting-info">
                                <span className="setting-label">Presence Confidence</span>
                                <span className="setting-description">Min confidence that a hand is present</span>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={settings.min_hand_presence_confidence}
                                    onChange={e => handleSliderChange('min_hand_presence_confidence', e.target.value)}
                                    className="settings-slider"
                                />
                                <span className="slider-value">{settings.min_hand_presence_confidence.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>


                    {/* Video Transcription Settings */}
                    <div className="settings-section">
                        <h3>Video Transcription</h3>

                        <div className="setting-row slider-row">
                            <div className="setting-info">
                                <span className="setting-label">Stability Duration (s)</span>
                                <span className="setting-description">Time to hold sign (lower = faster)</span>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min="0.1"
                                    max="2.0"
                                    step="0.05"
                                    value={settings.min_stable_duration || 0.25}
                                    onChange={e => handleSliderChange('min_stable_duration', e.target.value)}
                                    className="settings-slider"
                                />
                                <span className="slider-value">{(settings.min_stable_duration || 0.25).toFixed(2)}s</span>
                            </div>
                        </div>

                        <div className="setting-row slider-row">
                            <div className="setting-info">
                                <span className="setting-label">Transcription Confidence</span>
                                <span className="setting-description">Min confidence to transcribe</span>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={settings.transcription_confidence || 0.75}
                                    onChange={e => handleSliderChange('transcription_confidence', e.target.value)}
                                    className="settings-slider"
                                />
                                <span className="slider-value">{(settings.transcription_confidence || 0.75).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Sentence Builder Sensitivity */}
                    <div className="settings-section">
                        <h3>Sentence Builder Sensitivity</h3>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">Sound on Letter Add</span>
                                <span className="setting-description">Play a brief beep when a letter is added</span>
                            </div>
                            <button
                                className={`theme-toggle ${soundOnAdd ? 'active' : ''}`}
                                onClick={() => {
                                    const next = !soundOnAdd
                                    setSoundOnAdd(next)
                                    localStorage.setItem('slt_sound_on_add', next ? 'true' : 'false')
                                    setSaveMessage('✅ Sound ' + (next ? 'enabled' : 'disabled'))
                                    setTimeout(() => setSaveMessage(''), 2000)
                                }}
                            >
                                <span className="theme-text">{soundOnAdd ? 'ON' : 'OFF'}</span>
                            </button>
                        </div>

                        <div className="setting-row slider-row">
                            <div className="setting-info">
                                <span className="setting-label">Auto-Add Threshold</span>
                                <span className="setting-description">Min confidence for auto-adding letters after hold (higher = fewer mistakes, slower)</span>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min="0.1"
                                    max="0.95"
                                    step="0.05"
                                    value={parseFloat(localStorage.getItem('slt_auto_add_threshold') || '0.5')}
                                    onChange={e => {
                                        localStorage.setItem('slt_auto_add_threshold', e.target.value)
                                        // Force re-render
                                        setSaveMessage('')
                                    }}
                                    className="settings-slider"
                                />
                                <span className="slider-value">{parseFloat(localStorage.getItem('slt_auto_add_threshold') || '0.5').toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="setting-row slider-row">
                            <div className="setting-info">
                                <span className="setting-label">Manual-Add Threshold</span>
                                <span className="setting-description">Min confidence when pressing Enter to add a letter (lower = more permissive)</span>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min="0.05"
                                    max="0.8"
                                    step="0.05"
                                    value={parseFloat(localStorage.getItem('slt_manual_add_threshold') || '0.3')}
                                    onChange={e => {
                                        localStorage.setItem('slt_manual_add_threshold', e.target.value)
                                        setSaveMessage('')
                                    }}
                                    className="settings-slider"
                                />
                                <span className="slider-value">{parseFloat(localStorage.getItem('slt_manual_add_threshold') || '0.3').toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="setting-row slider-row">
                            <div className="setting-info">
                                <span className="setting-label">Auto-Add Delay</span>
                                <span className="setting-description">Seconds to hold a sign before it auto-adds</span>
                            </div>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="5"
                                    step="0.25"
                                    value={parseFloat(localStorage.getItem('slt_auto_add_delay') || '2')}
                                    onChange={e => {
                                        localStorage.setItem('slt_auto_add_delay', e.target.value)
                                        setSaveMessage('')
                                    }}
                                    className="settings-slider"
                                />
                                <span className="slider-value">{parseFloat(localStorage.getItem('slt_auto_add_delay') || '2').toFixed(1)}s</span>
                            </div>
                        </div>
                    </div>

                    {/* Save Message */}
                    {saveMessage && (
                        <div className="save-message">{saveMessage}</div>
                    )}
                </div>

                <div className="settings-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Apply Settings'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Settings
