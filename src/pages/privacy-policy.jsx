import React from 'react';
import './master.css';

const PrivacyPolicy = () => {
  return (
    <div className="p1">
        <div id='p1-intro'>
            <div className="r1-back-heading">
                <h1>Privacy Policy</h1>
                <p>Effective date: July 2025</p>
                <p>
                At REEBS Party Themes (“we”, “us”, or “our”), we are committed to
                protecting your privacy. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you visit our
                website or use our services.
                </p>
            </div>
        </div>
        <div id="p1-info">
            <h2>1. Information We Collect</h2>
            <ul>
                <li><strong>Personal Information:</strong> Name, email, phone number, event details — only when you fill out forms or contact us.</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent on site, browser type (via Google Analytics).</li>
                <li><strong>Device & Location:</strong> IP address and approximate location via Google Maps when viewing our store location.</li>
                <li><strong>Social Media Content:</strong> Public posts from TikTok, Facebook, and Instagram that you interact with via our embedded feeds.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <ul>
                <li>To respond to your inquiries and deliver event services</li>
                <li>To improve our website experience and performance</li>
                <li>To show location-based services (e.g., maps)</li>
                <li>To display curated social media content</li>
                <li>To send updates if you opt in (via WhatsApp or forms)</li>
            </ul>

            <h2>3. Third-Party Integrations</h2>
            <ul>
                <li><strong>Netlify:</strong> Our hosting provider may log basic metadata.</li>
                <li><strong>Zapier:</strong> Automates posts from TikTok, Facebook, and Instagram to keep content up to date.</li>
                <li><strong>Google Analytics:</strong> Tracks website usage anonymously.</li>
                <li><strong>Google Maps:</strong> Displays our store/event location. Uses location data only if you allow it in your browser.</li>
                <li><strong>WhatsApp:</strong> Used for direct messaging and quote inquiries.</li>
            </ul>

            <h2>4. Cookies and Tracking</h2>
            <p>
            We use cookies to personalize content and analyze traffic. You may accept or decline cookies through the banner displayed on first visit. We honor your preferences using your browser’s local storage.
            </p>

            <h2>5. Your Rights</h2>
            <p>As per Ghana’s Data Protection Act and international laws:</p>
            <ul>
                <li>Access the data we store about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Withdraw consent for certain uses (e.g. marketing)</li>
            </ul>

            <h2>6. Data Retention</h2>
            <p>
            We retain data only as long as needed for our event services, marketing efforts, or legal requirements. Contact data may be stored for 12 months.
            </p>

            <h2>7. Data Security</h2>
            <p>
            We take appropriate security measures to protect your data, including HTTPS, form validation, and minimal third-party access.
            </p>

            <h2>8. Contact Us</h2>
            <p>
            If you have questions about this policy or your data rights, please contact us at:
            <br />
            <strong>Email:</strong> info@reebspartythemes.com
            <br />
            <strong>WhatsApp:</strong> +233 XXX XXX XXX
            </p>

            <p>
            This policy may be updated periodically. Changes will be posted here with the effective date.
            </p>
        </div>
    </div>
  );
};

export default PrivacyPolicy;
