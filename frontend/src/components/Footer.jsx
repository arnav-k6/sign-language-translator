import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            padding: '12rem 5% 4rem',
            backgroundColor: '#fff',
            borderTop: '0.5px solid #f0f0f0',
            color: '#000',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8rem'
            }}>
                {/* Massive Logo Section */}
                <div style={{ textAlign: 'left', position: 'relative' }}>
                    <h2 style={{
                        fontSize: 'max(20vw, 160px)',
                        lineHeight: '0.75',
                        fontWeight: '200',
                        letterSpacing: '-0.07em',
                        margin: '0',
                        marginLeft: '-0.07em',
                        color: '#000',
                        opacity: 0.9
                    }}>
                        SignMate.
                    </h2>
                </div>

                {/* Links Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr',
                    gap: '2rem',
                    alignItems: 'start'
                }}>
                    <div style={{ maxWidth: '380px' }}>
                        <p style={{ fontSize: '1.25rem', lineHeight: '1.4', fontWeight: '300', letterSpacing: '-0.02em', color: '#666' }}>
                            Redefining human connection through gestural intelligence.
                            Designed for absolute clarity.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '400', opacity: 0.3, marginBottom: '0.5rem' }}>Platform</h4>
                        <a href="#" style={{ color: '#000', textDecoration: 'none', fontWeight: '300', fontSize: '0.9375rem', opacity: 0.7 }}>Documentation</a>
                        <a href="#" style={{ color: '#000', textDecoration: 'none', fontWeight: '300', fontSize: '0.9375rem', opacity: 0.7 }}>Technology</a>
                        <a href="#" style={{ color: '#000', textDecoration: 'none', fontWeight: '300', fontSize: '0.9375rem', opacity: 0.7 }}>Open Source</a>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '400', opacity: 0.3, marginBottom: '0.5rem' }}>Connect</h4>
                        <a href="#" style={{ color: '#000', textDecoration: 'none', fontWeight: '300', fontSize: '0.9375rem', opacity: 0.7 }}>Twitter</a>
                        <a href="#" style={{ color: '#000', textDecoration: 'none', fontWeight: '300', fontSize: '0.9375rem', opacity: 0.7 }}>GitHub</a>
                        <a href="#" style={{ color: '#000', textDecoration: 'none', fontWeight: '300', fontSize: '0.9375rem', opacity: 0.7 }}>Discord</a>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '400', opacity: 0.3, marginBottom: '0.5rem' }}>Legal</h4>
                        <a href="#" style={{ color: '#000', textDecoration: 'none', fontWeight: '300', fontSize: '0.9375rem', opacity: 0.7 }}>Privacy Policy</a>
                        <a href="#" style={{ color: '#000', textDecoration: 'none', fontWeight: '300', fontSize: '0.9375rem', opacity: 0.7 }}>Terms of Service</a>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '3rem',
                    borderTop: '0.5px solid #f0f0f0',
                    fontSize: '0.75rem',
                    fontWeight: '300',
                    color: '#a1a1a1',
                    letterSpacing: '0.01em'
                }}>
                    <p>&copy; 2026 SignMate Foundation.</p>
                    <div style={{ display: 'flex', gap: '2.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '4px', height: '4px', backgroundColor: '#16a34a', borderRadius: '50%', opacity: 0.5 }}></span>
                            Status: Operational
                        </span>
                        <span>v1.0.5-S</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
