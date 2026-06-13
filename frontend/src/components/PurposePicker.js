import React, { useState } from 'react';

const PURPOSES = [
  'Personal finance tracking', 'Splitting bills with roommates', 'Group trips and travel',
  'Events and parties', 'Business and work expenses', 'Family shared expenses', 'Other'
];

const PURPOSE_ICONS = {
  'Personal finance tracking': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'Splitting bills with roommates': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  'Group trips and travel': 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'Events and parties': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  'Business and work expenses': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  'Family shared expenses': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  'Other': 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'
};

export default function PurposePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = value || '';

  const handleSelect = (purpose) => {
    onChange(purpose);
    setOpen(false);
  };

  return (
    <>
      <div onClick={() => setOpen(true)} style={{
        width: '100%', padding: '13px 14px', background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', fontSize: 14,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s', userSelect: 'none', WebkitTapHighlightColor: 'transparent',
        boxSizing: 'border-box', minHeight: 48, fontFamily: 'inherit'
      }}>
        <span style={{ color: selected ? '#E0E0E0' : 'rgba(255,255,255,0.3)' }}>
          {selected || 'Select a purpose'}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
          <path d="M1 1L5 5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
          alignItems: 'flex-end', justifyContent: 'center', padding: 0
        }}>
          <div onClick={() => setOpen(false)} style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
          }} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 420,
            background: '#111', borderRadius: '20px 20px 0 0', overflow: 'hidden',
            animation: 'slideUp 0.25s ease'
          }}>
            <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#E0E0E0' }}>Select Purpose</span>
              <div onClick={() => setOpen(false)} style={{
                width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div style={{ padding: '12px 16px 24px' }}>
              {PURPOSES.map(p => (
                <div
                  key={p}
                  onClick={() => handleSelect(p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 14px',
                    borderRadius: 12, cursor: 'pointer', transition: 'background 0.15s',
                    background: p === value ? 'rgba(192,192,192,0.1)' : 'transparent',
                    border: p === value ? '1px solid rgba(192,192,192,0.15)' : '1px solid transparent',
                    WebkitTapHighlightColor: 'transparent', marginBottom: 2
                  }}
                  onMouseEnter={(e) => { if (p !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { if (p !== value) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: 'rgba(192,192,192,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={PURPOSE_ICONS[p]} />
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#E0E0E0' }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
