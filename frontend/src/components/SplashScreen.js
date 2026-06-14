import React, { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExit(true);
      setTimeout(onComplete, 500);
    }, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${exit ? 'splash-exit' : ''}`}>
      <div className="splash-logo-wrap">
        <img src="/logo-full.svg" alt="Ledgerly" />
      </div>
    </div>
  );
}
