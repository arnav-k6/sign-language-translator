import React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <header className="header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        ← Back to Home
                    </button>
                    <h1>Privacy Policy</h1>
                </div>
            </header>

            <div className="legal-content">
                <div className="legal-section">
                    <h2>1. Introduction</h2>
                    <p>Welcome to SignMate ("Company," "we," "us," or "our"). We are committed to protecting your personal data and respecting your privacy. This Privacy Policy explains our practices regarding the collection, use, processing, and disclosure of information when you use our web application and its AI-powered camera functionalities (the "Service"). By accessing or using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.</p>
                </div>

                <div className="legal-section">
                    <h2>2. Information We Collect</h2>
                    <p>We collect different types of data to provide and enhance our Service. Due to the nature of our application, this strongly features visual and interaction data.</p>
                    <ul>
                        <li><strong>Personal Data You Provide:</strong> When you create an account, we may collect your name, email address, password, and communication preferences.</li>
                        <li><strong>Camera Access and Visual Data:</strong> With your explicit permission, our Service accesses your device's camera. This video feed is processed instantly by our AI models to track hand landmarks and recognize sign language gestures. <em>Note: Our core processing happens locally on your device whenever possible. We do not stealthily record or store raw video feeds on our servers without explicit opt-in for data collection features.</em></li>
                        <li><strong>Derived AI Data:</strong> We collect mathematical coordinates derived from your camera feed (such as hand landmarks). This derived data is not personally identifiable on its own and is used solely to form the sign translations.</li>
                        <li><strong>Usage and Device Data:</strong> We automatically collect diagnostic data such as your IP address, browser type, operating system, and information on how you interact with the Service (e.g., features used, session duration).</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>3. How We Use Your Information</h2>
                    <p>We use the collected information for various purposes:</p>
                    <ul>
                        <li><strong>To Provide and Maintain the Service:</strong> Operating the core real-time tracking, transcriber, and sentence builder functionalities.</li>
                        <li><strong>To Improve AI Models:</strong> Aggregated, anonymized mathematical landmark data may be used to refine and train our baseline computer vision models to improve accuracy for all users. We never use raw identifiable user videos for training without explicit consent.</li>
                        <li><strong>For Security:</strong> Detecting, preventing, and addressing technical issues or fraudulent activities.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>4. How We Share Your Information</h2>
                    <p>We do not sell your personal data. We may share your information only in the following specific situations:</p>
                    <ul>
                        <li><strong>With Service Providers:</strong> Third-party companies that host our infrastructure, provide analytics, or assist in customer support. These providers are bound by strict confidentiality agreements.</li>
                        <li><strong>For Legal Reasons:</strong> If required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).</li>
                        <li><strong>Business Transfers:</strong> In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>5. Data Retention and Security</h2>
                    <p>We retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We implement robust technical and organizational security measures—including encryption and secure protocols (HTTPS)—to protect your data from unauthorized access, alteration, or disclosure. However, please remember that no method of transmission over the Internet is 100% secure.</p>
                </div>

                <div className="legal-section">
                    <h2>6. Your Data Protection Rights</h2>
                    <p>Depending on your location (such as under the GDPR or CCPA), you may have the following rights regarding your Personal Data:</p>
                    <ul>
                        <li>The right to access, update, or delete the information we have on you.</li>
                        <li>The right of rectification if your information is inaccurate or incomplete.</li>
                        <li>The right to object to or restrict our processing of your Personal Data.</li>
                        <li>The right to withdraw consent at any time where we relied on your consent to process your personal information.</li>
                    </ul>
                    <p>To exercise any of these rights, please contact our support team.</p>
                </div>

                <div className="legal-section">
                    <h2>7. Children's Privacy</h2>
                    <p>Our Service is not intended for use by anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and become aware that your child has provided us with Personal Data, please contact us immediately so we can remove that information from our servers.</p>
                </div>

                <div className="legal-section">
                    <h2>8. Changes to This Policy</h2>
                    <p>We may update our Privacy Policy periodically to reflect technological advancements, legal changes, or updates to our business operations. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
                </div>

                <div className="legal-footer">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
