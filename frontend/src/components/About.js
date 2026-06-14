import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 48 }}>
        <img src="/logo.svg" alt="Ledgerly" style={{ width: 72, height: 72, marginBottom: 20, opacity: 0.8 }} />
        <h2 style={{ fontSize: 32, letterSpacing: 2, marginBottom: 12 }}>LEDGERLY</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
          Premium expense management for those who demand more from their finances.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 18 }}>Our Mission</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          Ledgerly was built with a singular vision: to give people complete clarity and control over their shared finances. We believe managing money with others should be effortless, transparent, and even enjoyable. No more awkward conversations about who owes what. No more losing track of group expenses. Ledgerly handles it all with precision and elegance.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 18 }}>What We Offer</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { title: 'Smart Splitting', desc: 'Split expenses equally, by percentage, or exact amounts. Our algorithm minimizes the number of settlements needed.' },
            { title: 'Group Management', desc: 'Create unlimited groups for roommates, trips, events, or any shared expense scenario.' },
            { title: 'Real-time Chat', desc: 'Discuss expenses within your groups without leaving the app. Stay in sync with your circle.' },
            { title: 'AI Insights', desc: 'Understand your spending patterns with intelligent analytics and monthly reports delivered to your inbox.' },
            { title: 'Settlement Engine', desc: 'Our simplified settlement algorithm reduces complex webs of debts into the fewest possible transactions.' },
            { title: 'Email Reports', desc: 'Receive beautifully formatted expense summaries and payment reminders directly in your email.' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 18 }}>Our Story</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14, marginBottom: 16 }}>
          Ledgerly was born from a simple frustration: splitting bills with friends and colleagues was always more complicated than it needed to be. We watched people struggle with spreadsheets, forgotten debts, and uncomfortable reminders. We knew there had to be a better way.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14, marginBottom: 16 }}>
          So we built Ledgerly — a platform that handles the mathematics of shared living so you can focus on living. From splitting a dinner bill to managing household expenses among five roommates, from tracking group travel costs to settling office pool contributions, Ledgerly does it all with a level of polish that matches the importance of your financial relationships.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          Every detail of Ledgerly has been crafted with intention. The interface is clean and distraction-free. The calculations are precise to the cent. The experience is designed to make you feel confident that your finances are in order. Because when it comes to money, clarity isn't a luxury — it's a necessity.
        </p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 12, fontSize: 18 }}>Ready to Take Control?</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>Join Ledgerly and experience expense management the way it should be.</p>
        <Link to="/" className="btn btn-primary" style={{ padding: '12px 32px' }}>Get Started</Link>
      </div>
    </div>
  );
}
