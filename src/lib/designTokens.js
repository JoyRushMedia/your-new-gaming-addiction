export const designTokens = {
  colors: {
    neonCyan: '#00f0ff',
    neonMagenta: '#ff00ff',
    neonAmber: '#ffb000',
    neonViolet: '#a855f7',
    voidBlack: '#03040a',
    voidSurface: '#0d101c',
    voidSurfaceAlt: '#121425',
    voidBorder: '#1f2236',
  },
  overlays: {
    grid: {
      size: 50,
      color: '#00f0ff',
      opacity: 0.05,
    },
    scanlines: {
      opacity: 0.25,
    },
    corners: {
      size: {
        base: '6rem',
        md: '8rem',
      },
      opacity: 0.2,
      color: '#00f0ff',
    },
  },
  motion: {
    enabled: true,
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    transitions: {
      quick: { duration: 0.2 },
      default: { duration: 0.3 },
    },
  },
  tiles: {
    cyan: {
      gradient: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 50%, #00f0ff 100%)',
      border: '#00f0ff',
      name: 'Energy',
    },
    magenta: {
      gradient: 'linear-gradient(135deg, #ff00ff 0%, #ff0080 50%, #ff00ff 100%)',
      border: '#ff00ff',
      name: 'Plasma',
    },
    amber: {
      gradient: 'linear-gradient(135deg, #ffb000 0%, #ff6600 50%, #ffb000 100%)',
      border: '#ffb000',
      name: 'Core',
    },
    violet: {
      gradient: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 50%, #a855f7 100%)',
      border: '#a855f7',
      name: 'Void',
    },
  },
};

export const defaultMotionConfig = designTokens.motion;
