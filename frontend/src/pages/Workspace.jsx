import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { Activity, Upload, Layers } from 'lucide-react';

const Workspace = () => {
    const [activeFeature, setActiveFeature] = useState('realtime');

    const renderContent = () => {
        switch (activeFeature) {
            case 'realtime':
                return (
                    <motion.div
                        key="realtime"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="feature-view"
                    >
                        <h2 style={{ fontSize: '2rem', fontWeight: '200', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>Real-time Recognition.</h2>
                        <p style={{ color: '#888', fontSize: '1.1rem', fontWeight: '300', marginBottom: '3rem' }}>Engage the gestural engine for instantaneous transcription.</p>
                        <div style={{
                            width: '100%',
                            height: '500px',
                            backgroundColor: '#fafafa',
                            border: '0.5px solid #f0f0f0',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <Activity size={120} strokeWidth={0.25} opacity={0.1} />
                            <div style={{ position: 'absolute', bottom: '2rem', textAlign: 'center' }}>
                                <p style={{ color: '#ccc', fontSize: '0.75rem', fontWeight: '400', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Camera Feed Standby</p>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'video':
                return (
                    <motion.div
                        key="video"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="feature-view"
                    >
                        <h2 style={{ fontSize: '2rem', fontWeight: '200', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>Video Analysis.</h2>
                        <p style={{ color: '#888', fontSize: '1.1rem', fontWeight: '300', marginBottom: '3rem' }}>Upload recorded sessions for asynchronous architectural processing.</p>
                        <div style={{
                            width: '100%',
                            height: '500px',
                            border: '0.5px dashed #e5e5e5',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1.5rem',
                            backgroundColor: '#fafafa'
                        }}>
                            <Upload size={48} strokeWidth={1} opacity={0.3} />
                            <button className="btn btn-glass" style={{ padding: '0.8rem 2rem', border: '0.5px solid #e5e5e5' }}>
                                Choose Video File
                            </button>
                        </div>
                    </motion.div>
                );
            case 'twohands':
                return (
                    <motion.div
                        key="twohands"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="feature-view"
                    >
                        <h2 style={{ fontSize: '2rem', fontWeight: '200', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>Two-Hands Translation.</h2>
                        <p style={{ color: '#888', fontSize: '1.1rem', fontWeight: '300', marginBottom: '3rem' }}>Advanced bilateral tracking for complex contextual translation.</p>
                        <div style={{
                            width: '100%',
                            height: '500px',
                            backgroundColor: '#fafafa',
                            border: '0.5px solid #f0f0f0',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Layers size={120} strokeWidth={0.25} opacity={0.1} />
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="workspace-layout"
        >
            <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} />

            <main className="workspace-content">
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </main>
        </motion.div>
    );
};

export default Workspace;
