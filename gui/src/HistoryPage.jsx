import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

export default function HistoryPage({ onSettingsOpen }) {
    const navigate = useNavigate()
    const [sessions, setSessions] = useState([])

    // Load sessions from localStorage
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('slt_sessions') || '[]')
        setSessions(stored)
    }, [])

    const deleteSession = (id) => {
        const updated = sessions.filter(s => s.id !== id)
        setSessions(updated)
        localStorage.setItem('slt_sessions', JSON.stringify(updated))
    }

    const clearAll = () => {
        if (!window.confirm('Delete all saved sessions?')) return
        setSessions([])
        localStorage.removeItem('slt_sessions')
    }

    const exportJSON = () => {
        if (sessions.length === 0) return
        const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `sign_language_sessions_${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    const importJSON = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,application/json'
        input.onchange = (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => {
                try {
                    const imported = JSON.parse(reader.result)
                    const arr = Array.isArray(imported) ? imported : [imported]
                    const valid = arr.filter(s => s && (s.id || s.sentence || s.timestamp))
                    if (valid.length === 0) {
                        alert('No valid sessions in file')
                        return
                    }
                    const existing = JSON.parse(localStorage.getItem('slt_sessions') || '[]')
                    const existingIds = new Set(existing.map(s => s.id))
                    let merged = [...existing]
                    for (const s of valid) {
                        if (!existingIds.has(s.id)) {
                            merged.push(s)
                            existingIds.add(s.id)
                        }
                    }
                    merged.sort((a, b) => (b.id || 0) - (a.id || 0))
                    localStorage.setItem('slt_sessions', JSON.stringify(merged))
                    setSessions(merged)
                    alert(`Imported ${valid.length} session(s)`)
                } catch (err) {
                    alert('Invalid JSON file')
                }
            }
            reader.readAsText(file)
        }
        input.click()
    }

    const exportCSV = () => {
        if (sessions.length === 0) return

        const headers = ['session_id', 'timestamp', 'sentence', 'letter_count', 'avg_confidence', 'letters_detail']
        const rows = sessions.map(s => {
            // Build letters detail: each letter with its confidence
            const lettersDetail = (s.predictionHistory || [])
                .map(p => `${p.letter}(${(p.confidence * 100).toFixed(0)}%)`)
                .join(' ')

            return [
                s.id,
                s.timestamp,
                `"${(s.sentence || '').replace(/"/g, '""')}"`, // escape quotes
                s.letterCount || 0,
                s.avgConfidence ? (s.avgConfidence * 100).toFixed(1) + '%' : '0%',
                `"${lettersDetail}"`
            ].join(',')
        })

        const csv = [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `sign_language_sessions_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const formatDate = (iso) => {
        const d = new Date(iso)
        return d.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div className="tracker-page">
            {/* Header */}
            <header className="header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        ← Back
                    </button>
                    <h1>💾 Session History</h1>
                </div>
                <div className="header-status">
                    <span className="card-badge">{sessions.length} sessions</span>
                    <button className="settings-btn" onClick={onSettingsOpen}>
                        ⚙️
                    </button>
                </div>
            </header>

            {/* Actions */}
            <div className="history-actions">
                <button
                    className="btn btn-capture"
                    onClick={exportCSV}
                    disabled={sessions.length === 0}
                    style={{ maxWidth: '220px' }}
                >
                    📥 Export CSV
                </button>
                <button
                    className="btn btn-capture"
                    onClick={exportJSON}
                    disabled={sessions.length === 0}
                    style={{ maxWidth: '220px' }}
                >
                    📥 Export JSON
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={importJSON}
                    style={{ maxWidth: '180px' }}
                >
                    📤 Import
                </button>
                <button
                    className="btn btn-quit"
                    onClick={clearAll}
                    disabled={sessions.length === 0}
                    style={{ maxWidth: '180px' }}
                >
                    🗑️ Clear All
                </button>
            </div>

            {/* Session Cards */}
            {sessions.length === 0 ? (
                <div className="no-data" style={{ marginTop: '60px' }}>
                    No saved sessions yet. Use the Translator and click 💾 Save to record sessions.
                </div>
            ) : (
                <div className="history-list">
                    {sessions.map(session => (
                        <div key={session.id} className="card history-card">
                            <div className="card-header">
                                <span className="card-title">{formatDate(session.timestamp)}</span>
                                <button
                                    className="history-delete-btn"
                                    onClick={() => deleteSession(session.id)}
                                    title="Delete session"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="history-sentence">
                                {session.sentence || <span className="placeholder">No text</span>}
                            </div>

                            <div className="history-stats">
                                <div className="history-stat">
                                    <span className="stat-value">{session.letterCount || 0}</span>
                                    <span className="stat-label">Letters</span>
                                </div>
                                <div className="history-stat">
                                    <span className="stat-value">
                                        {session.avgConfidence ? (session.avgConfidence * 100).toFixed(0) + '%' : '—'}
                                    </span>
                                    <span className="stat-label">Avg Confidence</span>
                                </div>
                                <div className="history-stat">
                                    <span className="stat-value">{(session.predictionHistory || []).length}</span>
                                    <span className="stat-label">Predictions</span>
                                </div>
                            </div>

                            {/* Mini letter frequency */}
                            {session.predictionHistory && session.predictionHistory.length > 0 && (
                                <div className="history-letters">
                                    {Object.entries(
                                        session.predictionHistory.reduce((acc, p) => {
                                            acc[p.letter] = (acc[p.letter] || 0) + 1
                                            return acc
                                        }, {})
                                    )
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 8)
                                        .map(([letter, count]) => (
                                            <span key={letter} className="history-letter-chip">
                                                {letter} <small>×{count}</small>
                                            </span>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
