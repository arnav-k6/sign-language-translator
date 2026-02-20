import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

const ASL_SIGNS = [
    // Letters
    { char: 'A', type: 'letter', description: 'Fist with thumb resting on the side of the index finger', emoji: '✊' },
    { char: 'B', type: 'letter', description: 'Flat hand, fingers together pointing up, thumb tucked across palm', emoji: '🖐' },
    { char: 'C', type: 'letter', description: 'Curved hand forming a "C" shape, thumb and fingers apart', emoji: '🤏' },
    { char: 'D', type: 'letter', description: 'Index finger pointing up, other fingers curled to touch thumb tip', emoji: '☝️' },
    { char: 'E', type: 'letter', description: 'Fingers curled down to touch thumb, making a fist-like shape', emoji: '✊' },
    { char: 'F', type: 'letter', description: 'Index finger and thumb touching in a circle, other fingers extended up', emoji: '👌' },
    { char: 'G', type: 'letter', description: 'Index finger and thumb pointing sideways, parallel to each other', emoji: '👉' },
    { char: 'H', type: 'letter', description: 'Index and middle fingers extended sideways together, pointing left', emoji: '✌️' },
    { char: 'I', type: 'letter', description: 'Fist with pinky finger extended upward', emoji: '🤙' },
    { char: 'J', type: 'letter', description: 'Pinky extended, trace a "J" shape in the air (motion sign)', emoji: '🤙' },
    { char: 'K', type: 'letter', description: 'Index and middle fingers up in a V, thumb between them', emoji: '✌️' },
    { char: 'L', type: 'letter', description: 'Thumb and index finger form an "L" shape, other fingers curled', emoji: '🤟' },
    { char: 'M', type: 'letter', description: 'Three fingers (index, middle, ring) draped over thumb, fist down', emoji: '✊' },
    { char: 'N', type: 'letter', description: 'Two fingers (index, middle) draped over thumb, fist down', emoji: '✊' },
    { char: 'O', type: 'letter', description: 'All fingers curved to touch thumb tip forming an "O"', emoji: '👌' },
    { char: 'P', type: 'letter', description: 'Like "K" but pointed downward — index and middle out with thumb between', emoji: '👇' },
    { char: 'Q', type: 'letter', description: 'Like "G" but pointed downward — thumb and index pointing down', emoji: '👇' },
    { char: 'R', type: 'letter', description: 'Index and middle fingers crossed and extended upward', emoji: '🤞' },
    { char: 'S', type: 'letter', description: 'Fist with thumb wrapped over the front of the fingers', emoji: '✊' },
    { char: 'T', type: 'letter', description: 'Fist with thumb tucked between the index and middle fingers', emoji: '✊' },
    { char: 'U', type: 'letter', description: 'Index and middle fingers extended upward together, other fingers down', emoji: '✌️' },
    { char: 'V', type: 'letter', description: 'Index and middle fingers extended in a V shape', emoji: '✌️' },
    { char: 'W', type: 'letter', description: 'Index, middle, and ring fingers extended upward and spread apart', emoji: '🖖' },
    { char: 'X', type: 'letter', description: 'Index finger bent into a hook shape, other fingers in fist', emoji: '☝️' },
    { char: 'Y', type: 'letter', description: 'Thumb and pinky extended outward, other fingers curled (shaka)', emoji: '🤙' },
    { char: 'Z', type: 'letter', description: 'Index finger traces a "Z" shape in the air (motion sign)', emoji: '☝️' },
    // Numbers
    { char: '0', type: 'number', description: 'All fingers curved to touch thumb, forming an "O" shape (same as letter O)', emoji: '👌' },
    { char: '1', type: 'number', description: 'Index finger extended upward, all other fingers curled in fist', emoji: '☝️' },
    { char: '2', type: 'number', description: 'Index and middle fingers extended in a V shape (same as V)', emoji: '✌️' },
    { char: '3', type: 'number', description: 'Thumb, index, and middle fingers extended, ring and pinky curled', emoji: '🤟' },
    { char: '4', type: 'number', description: 'Four fingers extended and spread apart, thumb tucked into palm', emoji: '🖐' },
    { char: '5', type: 'number', description: 'All five fingers extended and spread apart, open hand', emoji: '🖐' },
    { char: '6', type: 'number', description: 'Pinky and thumb touching, other three fingers extended upward', emoji: '🤙' },
    { char: '7', type: 'number', description: 'Ring finger and thumb touching, other three fingers extended upward', emoji: '🖐' },
    { char: '8', type: 'number', description: 'Middle finger and thumb touching, other three fingers extended', emoji: '🖐' },
    { char: '9', type: 'number', description: 'Index finger and thumb touching (like "F"), other fingers extended', emoji: '👌' },
]

export default function GuidePage({ onSettingsOpen }) {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all') // 'all', 'letter', 'number'

    const filtered = ASL_SIGNS.filter(sign => {
        if (filter === 'letter' && sign.type !== 'letter') return false
        if (filter === 'number' && sign.type !== 'number') return false
        if (search && !sign.char.toLowerCase().includes(search.toLowerCase()) &&
            !sign.description.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    return (
        <div className="tracker-page">
            {/* Header */}
            <header className="header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        ← Back
                    </button>
                    <h1>📖 ASL Reference Guide</h1>
                </div>
                <div className="header-status">
                    <button className="settings-btn" onClick={onSettingsOpen}>
                        ⚙️
                    </button>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="guide-filter-bar">
                <input
                    type="text"
                    className="guide-search"
                    placeholder="Search signs..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="mode-buttons">
                    {['all', 'letter', 'number'].map(f => (
                        <button
                            key={f}
                            className={`mode-btn ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? 'All' : f === 'letter' ? 'A–Z' : '0–9'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="guide-grid">
                {filtered.map(sign => (
                    <div key={sign.char} className="guide-card">
                        <div className="guide-card-char">{sign.char}</div>
                        <div className="guide-card-emoji">{sign.emoji}</div>
                        <div className="guide-card-type">{sign.type}</div>
                        <p className="guide-card-desc">{sign.description}</p>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="no-data" style={{ marginTop: '40px' }}>
                    No signs match your search.
                </div>
            )}
        </div>
    )
}
