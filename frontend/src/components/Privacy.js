import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 40 }}>
        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          ← Back to Dashboard
        </Link>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>Privacy Policy</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Last updated: June 2026</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>1. Information We Collect</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14, marginBottom: 12 }}>
          When you use Sovereign, we collect information that you provide directly and information generated through your use of the service.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          <strong style={{ color: 'var(--silver-light)' }}>Account Information:</strong> When you create an account, we collect your username, email address, and password. This information is necessary to provide you with access to the service and to identify you across sessions.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>2. How We Use Your Information</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          We use the information we collect to provide, maintain, and improve our services. Your data helps us process expense splits, calculate balances, send notifications, and deliver email reports. We do not sell your personal information to third parties. We do not use your data for advertising purposes. Your financial data is used solely to power the features of Sovereign that you choose to use.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>3. Data Storage and Security</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          Your data is stored on secure servers with industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All financial data is encrypted both in transit and at rest. We regularly review our security practices to ensure the ongoing protection of your information.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>4. Data Sharing</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          Sovereign is designed around shared expenses, which means some of your information is visible to other users within your groups. Specifically, your username and email are visible to group members so they can identify you in expense splits. Your expense amounts and descriptions are shared within the relevant groups. We never share your data with external parties beyond what is necessary to provide the service.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>5. Your Rights</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          You have the right to access, correct, or delete your personal information at any time. You can update your profile information through the settings page. You can request deletion of your account by contacting our support team. Upon account deletion, all your personal data will be permanently removed from our systems within 30 days. You may also export your data at any time.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>6. Cookies and Tracking</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          Sovereign uses essential cookies to maintain your session and keep you signed in. We do not use tracking cookies or third-party analytics that monitor your behavior across other websites. Our cookies are strictly necessary for the functionality of the service.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>7. Changes to This Policy</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          We may update this privacy policy from time to time. When we make material changes, we will notify you through the application or via email. Your continued use of Sovereign after any changes constitutes acceptance of the updated policy.
        </p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          If you have questions about this privacy policy, please contact us at{' '}
          <span style={{ color: 'var(--silver)' }}>privacy@sovereign.app</span>
        </p>
      </div>
    </div>
  );
}
