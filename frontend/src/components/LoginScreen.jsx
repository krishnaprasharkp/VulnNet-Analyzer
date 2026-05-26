import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, User, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const BOOT_LINES = [
  '> Initializing VulnNet Analyzer v1.0.0...',
  '> Loading threat intelligence modules...',
  '> Establishing TLS 1.3 encrypted channel...',
  '> Verifying kernel integrity hashes...',
  '> Mounting secure network filesystem...',
  '> IDS/IPS engine initialized — 47,291 rules loaded.',
  '> Authentication required to continue.',
];

export default function LoginScreen({ onLogin }) {
  const [typedLines, setTypedLines] = useState([]);
  const [lineIdx, setLineIdx]       = useState(0);
  const [charIdx, setCharIdx]       = useState(0);
  const [phase, setPhase]           = useState('typing');
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase !== 'typing') return;
    clearTimeout(timerRef.current);

    if (lineIdx >= BOOT_LINES.length) {
      timerRef.current = setTimeout(() => setPhase('form'), 350);
      return;
    }

    const line = BOOT_LINES[lineIdx];
    if (charIdx < line.length) {
      timerRef.current = setTimeout(() => setCharIdx(c => c + 1), 20);
    } else {
      timerRef.current = setTimeout(() => {
        setTypedLines(prev => [...prev, line]);
        setLineIdx(l => l + 1);
        setCharIdx(0);
      }, 90);
    }

    return () => clearTimeout(timerRef.current);
  }, [phase, lineIdx, charIdx]);

  const handleLogin = () => {
    if (!username.trim()) { setError('Username required.'); return; }
    setError('');
    setPhase('loading');
    setTimeout(() => setPhase('granted'), 1600);
    setTimeout(() => onLogin(), 2400);
  };

  const partialLine =
    phase === 'typing' && lineIdx < BOOT_LINES.length
      ? BOOT_LINES[lineIdx].slice(0, charIdx)
      : '';

  if (phase === 'granted') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
           style={{ background: '#030712' }}>
        <div className="text-center animate-fade-in">
          <div className="text-4xl font-bold font-mono tracking-[0.25em] granted-text mb-4"
               style={{ color: '#10b981' }}>
            ACCESS GRANTED
          </div>
          <div className="text-[11px] text-cyber-muted font-mono tracking-widest animate-pulse">
            LOADING SECURE DASHBOARD...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden"
         style={{ background: '#030712' }}>
      <div className="absolute inset-0 grid-bg opacity-50" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scan-line" />
      </div>

      {/* Corner labels */}
      <div className="absolute top-4 left-5 text-[9px] font-mono text-slate-800 tracking-widest select-none">
        SYS ▸ VULNNET-ANALYZER ▸ V1.0.0
      </div>
      <div className="absolute top-4 right-5 text-[9px] font-mono text-slate-800 tracking-widest select-none">
        CLASSIFICATION: RESTRICTED
      </div>
      <div className="absolute bottom-4 left-5 text-[9px] font-mono text-slate-800 tracking-widest select-none">
        CONN: ENCRYPTED ▸ TLS 1.3 ▸ AES-256-GCM
      </div>
      <div className="absolute bottom-4 right-5 flex items-center gap-1.5 select-none"
           style={{ color: '#10b981' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[9px] font-mono tracking-widest">SYSTEM ONLINE</span>
      </div>

      <div className="relative w-full max-w-[420px] px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                 style={{
                   background: 'rgba(6,182,212,0.07)',
                   border: '1px solid rgba(6,182,212,0.28)',
                   boxShadow: '0 0 40px rgba(6,182,212,0.12)',
                 }}>
              <Shield size={28} color="#06b6d4" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 bg-green-500 animate-pulse"
                 style={{ borderColor: '#030712' }} />
          </div>
          <div className="text-xl font-bold tracking-[0.2em] font-mono uppercase"
               style={{ color: '#06b6d4', textShadow: '0 0 25px rgba(6,182,212,0.35)' }}>
            VulnNet
          </div>
          <div className="text-[10px] text-slate-600 tracking-[0.4em] mt-1 uppercase font-mono">
            Cybersecurity Monitoring Platform
          </div>
        </div>

        {/* Boot terminal output */}
        <div className="mb-6 p-4 rounded-xl font-mono text-[11px] leading-[1.85]"
             style={{
               background: 'rgba(16,185,129,0.025)',
               border: '1px solid rgba(16,185,129,0.1)',
             }}>
          {typedLines.map((line, i) => (
            <div key={i} style={{ color: '#10b981' }}>{line}</div>
          ))}
          {phase === 'typing' && (
            <div style={{ color: '#10b981' }}>
              {partialLine}<span className="typing-cursor">█</span>
            </div>
          )}
        </div>

        {/* Auth form */}
        {(phase === 'form' || phase === 'loading') && (
          <div className="space-y-3 animate-slide-up">
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                   color="#334155" />
              <input
                type="text"
                placeholder="USERNAME"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full pl-9 pr-4 py-3 font-mono text-[12px] tracking-[0.12em] rounded-lg login-input"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(6,182,212,0.15)',
                  color: '#06b6d4',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                disabled={phase === 'loading'}
                autoFocus
              />
            </div>

            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                   color="#334155" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="PASSWORD"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full pl-9 pr-10 py-3 font-mono text-[12px] tracking-[0.12em] rounded-lg login-input"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(6,182,212,0.15)',
                  color: '#06b6d4',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                disabled={phase === 'loading'}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
              >
                {showPass
                  ? <EyeOff size={13} color="#64748b" />
                  : <Eye size={13} color="#64748b" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-400 font-mono">
                <AlertTriangle size={11} /> {error}
              </div>
            )}

            <button
              className="w-full py-3 font-mono text-[12px] font-bold tracking-[0.25em] rounded-lg mt-1 transition-all"
              style={{
                background: phase === 'loading'
                  ? 'rgba(6,182,212,0.06)'
                  : 'rgba(6,182,212,0.1)',
                border: `1px solid rgba(6,182,212,${phase === 'loading' ? '0.18' : '0.32'})`,
                color: phase === 'loading' ? 'rgba(6,182,212,0.5)' : '#06b6d4',
                boxShadow: phase === 'loading' ? 'none' : '0 0 18px rgba(6,182,212,0.08)',
              }}
              onClick={handleLogin}
              disabled={phase === 'loading'}
            >
              {phase === 'loading'
                ? <span className="animate-pulse">AUTHENTICATING...</span>
                : 'AUTHENTICATE'}
            </button>

            <div className="text-center text-[10px] text-slate-700 font-mono pt-1">
              DEMO MODE — any username · password optional
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
