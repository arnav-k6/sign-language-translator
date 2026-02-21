import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    return (
        <nav className="navbar-capsule">
            <Link to="/" className="capsule-logo">
                <Activity size={16} strokeWidth={1.5} />
                <span>SignMate.</span>
            </Link>

            <div className="capsule-divider"></div>

            {location.pathname !== '/product' ? (
                <Link
                    to="/login"
                    className="capsule-link"
                >
                    Login
                </Link>
            ) : (
                <span className="capsule-link" style={{ cursor: 'default', opacity: 0.3 }}>
                    Workspace
                </span>
            )}
        </nav>
    );
};

export default Navbar;
