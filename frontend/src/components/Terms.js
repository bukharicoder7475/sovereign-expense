import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 40 }}>
        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          ← Back to Dashboard
        </Link>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>Terms of Service</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Last updated: June 2026</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>1. Acceptance of Terms</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          By accessing or using Sovereign, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service. These terms apply to all users of the service, including browsers, contributors, and users of content or features.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>2. Description of Service</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          Sovereign is a platform for managing shared expenses. It allows users to create groups, track expenses, split costs, calculate balances, communicate through group chat, and generate financial reports. The service is provided as-is and may be updated, modified, or improved over time at our discretion.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>3. User Responsibilities</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14, marginBottom: 12 }}>
          You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activities that occur under your account. You agree to:
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 2, fontSize: 14, paddingLeft: 24 }}>
          <li>Provide accurate and truthful information when creating your account</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
          <li>Not use the service for any unlawful or fraudulent purpose</li>
          <li>Not attempt to gain unauthorized access to other users' accounts</li>
          <li>Not interfere with or disrupt the service or servers</li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>4. Financial Responsibility</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          Sovereign tracks and calculates expense splits for informational purposes. The application does not process payments or move money between users. All actual financial transactions and settlements between users are conducted outside of the platform. Sovereign is not responsible for any disputes arising from shared expenses or settlements between users. You and your group members are solely responsible for resolving any disagreements about expenses.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>5. Intellectual Property</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          The service and its original content, features, and functionality are owned by Sovereign and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our service or included software without our express written permission.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>6. Limitation of Liability</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          To the maximum extent permitted by applicable law, Sovereign shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the service. The service is provided without warranties of any kind, either express or implied.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>7. Termination</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including breach of these terms. Upon termination, your right to use the service will cease immediately. You may terminate your account at any time by contacting us or through the account settings.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--silver-light)', marginBottom: 14, fontSize: 16 }}>8. Changes to Terms</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page and updating the "Last updated" date. Your continued use of the service after any such changes constitutes your acceptance of the new terms.
        </p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          For questions about these terms, contact us at{' '}
          <span style={{ color: 'var(--silver)' }}>legal@sovereign.app</span>
        </p>
      </div>
    </div>
  );
}
