/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Atmosphere tokens – overridden per genre via CSS vars
        atmo: {
          bg:      'var(--atmo-bg)',
          surface: 'var(--atmo-surface)',
          accent:  'var(--atmo-accent)',
          text:    'var(--atmo-text)',
          muted:   'var(--atmo-muted)',
          border:  'var(--atmo-border)',
          glow:    'var(--atmo-glow)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
      animation: {
        'fog-drift':    'fogDrift 20s linear infinite',
        'particle-rise':'particleRise 8s ease-in infinite',
        'pulse-glow':   'pulseGlow 3s ease-in-out infinite',
        'fade-in':      'fadeIn 0.8s ease-out forwards',
        'slide-up':     'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fogDrift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        particleRise: {
          '0%':   { transform: 'translateY(0) scale(1)', opacity: '0.7' },
          '100%': { transform: 'translateY(-120px) scale(0)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px var(--atmo-glow)' },
          '50%':      { boxShadow: '0 0 24px var(--atmo-glow)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
