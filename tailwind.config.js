/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'void': {
          'black': '#0a0a0f',
          'deep': '#050508',
          'surface': '#12121a',
          'border': '#1a1a28',
        },
        'neon': {
          'cyan': '#00f0ff',
          'magenta': '#ff00ff',
          'amber': '#ffb000',
          'violet': '#a855f7',
        },
        'text': {
          'primary': '#e0e0ff',
          'muted': '#8888aa',
        },
        'chaos': '#ff3366',
        'order': '#00ff88',
      },
      fontFamily: {
        'rajdhani': ['Rajdhani', 'sans-serif'],
        'exo': ['Exo 2', 'sans-serif'],
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      letterSpacing: {
        'aggressive': '0.15em',
        'moderate': '0.08em',
        'maximum': '0.2em',
      },
      boxShadow: {
        'glow-subtle': '0 0 8px currentColor',
        'glow-base': '0 0 20px currentColor',
        'glow-intense': '0 0 40px currentColor',
      },
      animation: {
        'glitch': 'glitch 0.3s ease-in-out',
        'screen-shake': 'screen-shake 0.4s ease-in-out',
        'success-flash': 'success-flash 0.3s ease-out',
        'scanline-drift': 'scanline-drift 8s linear infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1.05)' },
          '20%': { transform: 'translate(-2px, 1px) scale(1.05)' },
          '40%': { transform: 'translate(2px, -1px) scale(1.05)' },
          '60%': { transform: 'translate(-1px, 2px) scale(1.05)' },
          '80%': { transform: 'translate(1px, -2px) scale(1.05)' },
        },
        'screen-shake': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate(-4px, 4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translate(4px, -4px)' },
        },
        'success-flash': {
          '0%': { background: '#ff3366' },
          '50%': { background: 'rgba(255, 255, 255, 0.8)' },
          '100%': { background: '#00ff88' },
        },
        'scanline-drift': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(4px)' },
        },
      },
    },
  },
  plugins: [],
}
