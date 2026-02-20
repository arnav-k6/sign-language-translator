import React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function CookiePolicy() {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <header className="header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        ← Back to Home
                    </button>
                    <h1>Cookie Policy</h1>
                </div>
            </header>

            <div className="legal-content">
                <div className="legal-section">
                    <h2>1. Introduction</h2>
                    <p>This Cookie Policy explains what cookies are, how SignMate uses them on our website, and your choices regarding their use. This policy is designed to comply with global privacy regulations, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).</p>
                </div>

                <div className="legal-section">
                    <h2>2. What Are Cookies?</h2>
                    <p>Cookies are small text files that are placed on your computer or mobile device by websites that you visit. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site. A cookie will typically contain the name of the domain from which the cookie has come, the "lifetime" of the cookie, and a randomly generated unique number.</p>
                    <p>For example, our application utilizes browser LocalStorage and SessionStorage—which serve a similar purpose to cookies—to remember that you have already seen the typing animation on the homepage, so you aren't forced to watch it every time.</p>
                </div>

                <div className="legal-section">
                    <h2>3. Types of Cookies and Storage We Use</h2>
                    <p>We use both session and persistent cookies (as well as LocalStorage) on our Service. Specifically, we use the following categories:</p>
                    <ul>
                        <li><strong>Essential / Strictly Necessary:</strong> These are absolutely required for the operation of our Service. They include, for example, storage tokens that keep you logged in or mechanisms that allow the core React application state to function between page loads.</li>
                        <li><strong>Preferences and Functionality:</strong> These cookies are used to recognize you when you return to our Service. This enables us to personalize our content for you and remember your preferences (e.g., your choice of dark or light theme, or your custom thresholds for the AI gesture prediction).</li>
                        <li><strong>Analytics and Performance:</strong> These allow us to recognize and count the number of visitors and to see how visitors move around our Service when they are using it. This helps us to improve the way our Service works.</li>
                    </ul>
                </div>

                <div className="legal-section">
                    <h2>4. Third-Party Cookies</h2>
                    <p>In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service and help improve our AI infrastructure. We do not use third-party targeting or advertising cookies, as user privacy is critical to our translation platform.</p>
                </div>

                <div className="legal-section">
                    <h2>5. Your Choices Regarding Cookies</h2>
                    <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in your web browser. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. However, please note that if you choose to reject cookies or clear your LocalStorage, you may not be able to use the full functionality of SignMate, such as saving your AI translation preferences or maintaining your dark mode settings.</p>
                </div>

                <div className="legal-section">
                    <h2>6. Contact Us</h2>
                    <p>If you have any questions about our use of cookies or other technologies, please contact our support team. We value your digital privacy and are highly transparent about the data we store on your device.</p>
                </div>

                <div className="legal-footer">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}

export default CookiePolicy;
