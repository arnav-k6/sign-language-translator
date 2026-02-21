import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Zap,
    Video,
    Hand,
    LogOut,
    User
} from 'lucide-react';

const Sidebar = ({ activeFeature, setActiveFeature }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = (e) => {
        e.preventDefault();
        navigate('/');
    };

    const navItems = [
        { id: 'realtime', label: 'Real-time Recognition', icon: Zap },
        { id: 'video', label: 'Video Analysis', icon: Video },
        { id: 'twohands', label: 'Two-Hands Translation', icon: Hand },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-nav">
                <div style={{ marginBottom: '2rem', padding: '0 1rem' }}>
                    <h2 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '400', opacity: 0.3 }}>Features</h2>
                </div>

                {navItems.map((item) => (
                    <div
                        key={item.id}
                        className={`sidebar-item ${activeFeature === item.id ? 'active' : ''}`}
                        onClick={() => setActiveFeature(item.id)}
                    >
                        <item.icon size={18} strokeWidth={1.5} />
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="user-avatar">
                        <User size={16} strokeWidth={1.5} />
                    </div>
                    <div className="user-info">
                        <span className="user-email">user@signmate.ai</span>
                    </div>
                </div>

                <a href="#" className="logout-link" onClick={handleLogout}>
                    <LogOut size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                    Sign Out
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;
