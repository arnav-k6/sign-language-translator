import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Mock login logic
        navigate('/product');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="page-container"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '4rem'
            }}
        >
            <div style={{
                width: '100%',
                maxWidth: '430px',
                padding: '4rem 3.5rem',
                textAlign: 'center',
                border: '0.5px solid #f0f0f0',
                boxShadow: '0 20px 60px rgba(0,0,0,0.02)',
                backgroundColor: '#fff',
                borderRadius: '24px'
            }}>
                <div style={{ marginBottom: '3.5rem' }}>
                    <Activity size={32} strokeWidth={1} style={{ marginBottom: '1.5rem', color: '#000' }} />
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '200', letterSpacing: '-0.06em' }}>Welcome.</h1>
                    <p style={{ color: '#888', marginTop: '0.75rem', fontSize: '1.1rem', fontWeight: '300', letterSpacing: '-0.02em' }}>Enter your details to continue</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '400', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4 }}>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            required
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: '0.5px solid #f0f0f0',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                outline: 'none',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: '300',
                                backgroundColor: '#fafafa'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '400', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4 }}>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: '0.5px solid #f0f0f0',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                outline: 'none',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: '300',
                                backgroundColor: '#fafafa'
                            }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{
                        borderRadius: '100px',
                        justifyContent: 'center',
                        padding: '1.1rem',
                        marginTop: '1.5rem',
                        fontSize: '1rem',
                        fontWeight: '400',
                        cursor: 'pointer'
                    }}>
                        Continue to SignMate. <ArrowRight size={18} strokeWidth={1} />
                    </button>
                </form>

                <div style={{ marginTop: '3rem', fontSize: '0.9375rem', color: '#a1a1a1' }}>
                    Don't have an account? <Link to="/signup" style={{ color: '#000', fontWeight: '400', textDecoration: 'none', marginLeft: '4px', borderBottom: '0.5px solid #000' }}>Sign up</Link>
                </div>
            </div>
        </motion.div>
    );
};

export default Login;
