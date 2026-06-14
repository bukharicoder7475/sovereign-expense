import React, { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExit(true);
      setTimeout(onComplete, 500);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${exit ? 'splash-exit' : ''}`}>
      <div className="splash-logo-wrap">
        <img src="/logo.svg" alt="Lederly" />
      </div>
      <div className="splash-brand">LEDGERLY</div>
      <div className="splash-tagline">Smart Expense Management</div>
      <div className="splash-line"></div>
      <div className="splash-dots">
        <div className="splash-dot"></div>
        <div className="splash-dot"></div>
        <div className="splash-dot"></div>
      </div>
    </div>
  );
}
