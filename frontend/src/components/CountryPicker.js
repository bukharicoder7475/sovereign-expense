import React, { useState, useRef, useEffect } from 'react';
import COUNTRIES from '../utils/countries';

export default function CountryPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);
  const selected = COUNTRIES.find(c => c.code === value) || COUNTRIES[17];

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search) ||
    c.currency.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code) => {
    onChange(code);
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      <div onClick={() => setOpen(true)} style={{
        width: 130, flexShrink: 0, padding: '13px 10px', background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', fontSize: 14,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s', userSelect: 'none', WebkitTapHighlightColor: 'transparent',
        boxSizing: 'border-box', minHeight: 48
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{selected.flag}</span>
          <span style={{ fontWeight: 500 }}>{selected.code}</span>
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.4 }}>
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
            position: 'relative', width: '100%', maxWidth: 420, maxHeight: '70vh',
            background: '#111', borderRadius: '20px 20px 0 0', display: 'flex',
            flexDirection: 'column', overflow: 'hidden',
            animation: 'slideUp 0.25s ease'
          }}>
            <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#E0E0E0' }}>Select Country</span>
              <div onClick={() => setOpen(false)} style={{
                width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                style={{
                  width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff',
                  fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px', WebkitOverflowScrolling: 'touch' }}>
              {filtered.map(c => (
                <div
                  key={c.code + c.name}
                  onClick={() => handleSelect(c.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                    borderRadius: 12, cursor: 'pointer', transition: 'background 0.15s',
                    background: c.code === value ? 'rgba(192,192,192,0.1)' : 'transparent',
                    border: c.code === value ? '1px solid rgba(192,192,192,0.15)' : '1px solid transparent',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => { if (c.code !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { if (c.code !== value) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{c.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#E0E0E0' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{c.currency} ({c.symbol})</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{c.code}</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  No countries found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
