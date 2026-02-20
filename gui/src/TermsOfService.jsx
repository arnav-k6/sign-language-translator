import React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function TermsOfService() {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <header className="header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        ← Back to Home
                    </button>
                    <h1>Terms of Service</h1>
                </div>
            </header>

            <div className="legal-content">
                <div className="legal-section">
                    <h2>1. Agreement to Terms</h2>
                    <p>By accessing or using SignMate (the "Service"), provided by SignMate Inc. ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.</p>
                </div>

                <div className="legal-section">
                    <h2>2. Description of Service</h2>
                    <p>SignMate is an AI-powered sign language translation and educational platform. It utilizes your device's camera to capture gestures and uses proprietary computer vision algorithms to track, identify, and transcribe sign language in real time.</p>
                </div>

                <div className="legal-section">
                    <h2>3. License and Acceptable Use</h2>
                    <p>We grant you a personal, non-exclusive, non-transferable, and revocable license to use our Service for personal, educational, and non-commercial purposes. You agree not to:</p>
                    <ul>
                        <li>Use the Service in any way that violates any applicable national or international law or regulation.</li>
                        <li>Attempt to reverse engineer, decompile, hack, or compromise any part of the Service or its underlying AI models.</li>
                        <li>Use the Service to transmit any material that is defamatory, offensive, or otherwise objectionable.</li>
                        <li>Interfere with or disrupt the integrity or performance of the Service.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>4. Intellectual Property Rights</h2>
                    <p>The Service and its original content, features, functionality, and AI models are and will remain the exclusive property of SignMate and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.</p>
                </div>

                <div className="legal-section">
                    <h2>5. User-Generated Content and Data</h2>
                    <p>Any settings, translation histories, or custom phrases you save remain your property. By using our Service, you grant us a license to process the necessary visual inputs (camera feed) to deliver the translation. As detailed in our Privacy Policy, we do not claim ownership over your likeness or permanent raw footage.</p>
                </div>

                <div className="legal-section">
                    <h2>6. Warranties and Disclaimers</h2>
                    <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The translations provided by our AI models are experimental and are not guaranteed to be 100% accurate. SignMate expressly disclaims all warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.</p>
                </div>

                <div className="legal-section">
                    <h2>7. Limitation of Liability</h2>
                    <p>In no event shall SignMate, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any errors or inaccuracies in the AI translation outputs.</p>
                </div>

                <div className="legal-section">
                    <h2>8. Termination</h2>
                    <p>We may terminate or suspend your access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
                </div>

                <div className="legal-section">
                    <h2>9. Governing Law</h2>
                    <p>These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>
                </div>

                <div className="legal-footer">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}

export default TermsOfService;
