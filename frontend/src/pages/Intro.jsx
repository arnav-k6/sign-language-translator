import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Intro = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="page-container"
        >
            {/* Hero Section */}
            <section className="hero" style={{ padding: '0rem 11% 6rem', textAlign: 'left' }}>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, ease: [0.165, 0.84, 0.44, 1] }}
                    className="hero-content"
                    style={{ maxWidth: '900px' }}
                >
                    <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '400', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.4 }}>
                        <span style={{ width: '4px', height: '4px', backgroundColor: '#000', borderRadius: '50%' }}></span>
                        The Future of Gesture Intelligence
                    </div>
                    <h1 style={{ fontSize: 'max(7vw, 72px)', lineHeight: '1.0', fontWeight: '200', marginBottom: '2.5rem', letterSpacing: '-0.06em' }}>
                        Beyond <br />
                        Sign Language.
                    </h1>
                    <p style={{ fontSize: '1.5rem', color: '#666', marginBottom: '4rem', maxWidth: '600px', lineHeight: '1.5', fontWeight: '300', letterSpacing: '-0.02em' }}>
                        SignMate. is the world's most elegant translation interface.
                        Real-time gestural intelligence designed for absolute clarity.
                    </p>
                    <div className="hero-cta" style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link to="/login">
                            <button className="btn btn-primary" style={{ padding: '0.8rem 2.8rem' }}>
                                Try SignMate. Now <ArrowRight size={16} strokeWidth={1} />
                            </button>
                        </Link>
                        <button className="btn btn-glass" style={{ padding: '0.8rem 2.8rem', border: '0.5px solid #f0f0f0' }}>
                            Documentation
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* Minimalism Section */}
            <section style={{ padding: '12rem 5%', borderTop: '0.5px solid #f0f0f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8rem', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: 'max(4vw, 48px)', fontWeight: '200', marginBottom: '2rem', letterSpacing: '-0.05em', lineHeight: '1.1' }}>Elegance in <br />Translation.</h2>
                        <p style={{ color: '#888', fontSize: '1.25rem', lineHeight: '1.6', fontWeight: '300', letterSpacing: '-0.01em' }}>
                            We've stripped away the noise. No complex dashboards. No unnecessary analytics.
                            Just pure, instantaneous communication from gesture to text.
                        </p>
                    </div>
                    <div style={{ border: '0.5px solid #f0f0f0', height: '520px', backgroundColor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px' }}>
                        <Activity size={200} strokeWidth={0.25} opacity={0.2} />
                    </div>
                </div>
            </section>

            {/* Final Line */}
            <section style={{ padding: '12rem 5%', textAlign: 'center', borderTop: '0.5px solid #f0f0f0' }}>
                <h2 style={{ fontSize: 'max(5vw, 56px)', fontWeight: '200', marginBottom: '3rem', letterSpacing: '-0.05em' }}>Minimal. Precise. Human.</h2>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                    <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', fontWeight: '300', cursor: 'pointer', borderBottom: '1px solid #000', paddingBottom: '2px', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', color: '#000' }}>
                        Join the movement
                    </button>
                </Link>
            </section>
        </motion.div>
    );
};

export default Intro;
