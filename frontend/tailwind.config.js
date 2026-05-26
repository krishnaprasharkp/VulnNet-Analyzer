/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:       '#030712',
          surface:  '#0f172a',
          surface2: '#1e293b',
          border:   '#1e293b',
          cyan:     '#06b6d4',
          purple:   '#8b5cf6',
          green:    '#10b981',
          red:      '#ef4444',
          blue:     '#3b82f6',
          yellow:   '#f59e0b',
          pink:     '#ec4899',
          muted:    '#64748b',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.25s ease-out forwards',
        'slide-in':   'slideIn 0.3s ease-out forwards',
        'slide-up':   'slideUp 0.4s ease-out forwards',
        'spin-slow':  'spin 12s linear infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'blink':      'blink 0.8s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.7' },
          '50%':      { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
      boxShadow: {
        'cyber':       '0 0 20px rgba(6,182,212,0.15)',
        'cyber-md':    '0 0 40px rgba(6,182,212,0.25)',
        'red-glow':    '0 0 20px rgba(239,68,68,0.3)',
        'green-glow':  '0 0 20px rgba(16,185,129,0.25)',
        'blue-glow':   '0 0 20px rgba(59,130,246,0.25)',
        'yellow-glow': '0 0 20px rgba(245,158,11,0.25)',
      },
    },
  },
  plugins: [],
}
