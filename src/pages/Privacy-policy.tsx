import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Privacy Policy</h1>
      <p><strong>Effective Date:</strong> May 28, 2025</p>

      <p>
        <strong>Daily Love Notes</strong> ("we", "our", or "us") operates the website{" "}
        <a href="https://daily-love-notes-sent.vercel.app" style={styles.link}>
          daily-love-notes-sent.vercel.app
        </a>{" "}
        (the "Service").
      </p>

      <p>
        This page informs you of our policies regarding the collection, use, and disclosure of
        personal data when you use our Service.
      </p>

      <h2 style={styles.subtitle}>Information We Collect</h2>
      <ul>
        <li>Phone Number</li>
        <li>Email Address</li>
      </ul>
      <p>This information is used solely for sending personalized daily love notes and related notifications.</p>

      <h2 style={styles.subtitle}>How We Use Your Data</h2>
      <ul>
        <li>Send daily inspirational or romantic messages</li>
        <li>Provide updates or service-related communication</li>
      </ul>
      <p>We do <strong>not</strong> sell or share your personal data with third parties.</p>

      <h2 style={styles.subtitle}>Data Storage</h2>
      <p>
        Your data is securely stored and processed using third-party tools such as{" "}
        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={styles.link}>
          Supabase
        </a>{" "}
        and{" "}
        <a href="https://www.whatsapp.com/legal/business-terms/" target="_blank" rel="noopener noreferrer" style={styles.link}>
          Meta (WhatsApp)
        </a>.
      </p>

      <h2 style={styles.subtitle}>Your Rights</h2>
      <ul>
        <li>Request access to your data</li>
        <li>Request deletion of your data</li>
        <li>Opt out of receiving messages at any time</li>
      </ul>
      <p>To do so, contact us at <strong>stanleydaniel994@gmail.com</strong>.</p>

      <h2 style={styles.subtitle}>Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page.</p>

      <h2 style={styles.subtitle}>Contact Us</h2>
      <p>If you have any questions, contact us at <strong>stanleydaniel994@gmail.com</strong>.</p>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fff5f5",
    color: "#333",
  },
  title: {
    color: "#d6336c",
  },
  subtitle: {
    color: "#b02a37",
    marginTop: "1.5rem",
  },
  link: {
    color: "#d6336c",
    textDecoration: "none",
  },
};

export default PrivacyPolicy;
