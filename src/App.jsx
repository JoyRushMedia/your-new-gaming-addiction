import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameBoard from './components/GameBoard';

/**
 * Main App Component
 * Manages game states: home, playing, help
 */

// Tile icon SVGs for display
const TilePreview = ({ type, size = 40 }) => {
  const configs = {
    cyan: {
      gradient: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 50%, #00f0ff 100%)',
      border: '#00f0ff',
      icon: (
        <path
          d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
          fill="#001a1f"
          stroke="#001a1f"
          strokeWidth="1.5"
        />
      ),
      name: 'Energy',
    },
    magenta: {
      gradient: 'linear-gradient(135deg, #ff00ff 0%, #ff0080 50%, #ff00ff 100%)',
      border: '#ff00ff',
      icon: (
        <>
          <path
            d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z"
            fill="#1f001f"
            stroke="#1f001f"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="11" r="3" fill="rgba(255,255,255,0.3)" />
        </>
      ),
      name: 'Plasma',
    },
    amber: {
      gradient: 'linear-gradient(135deg, #ffb000 0%, #ff6600 50%, #ffb000 100%)',
      border: '#ffb000',
      icon: (
        <>
          <path
            d="M12 2l10 10-10 10L2 12 12 2z"
            fill="#1f1000"
            stroke="#1f1000"
            strokeWidth="1.5"
          />
          <path d="M12 6l6 6-6 6-6-6 6-6z" fill="rgba(255,255,255,0.2)" />
        </>
      ),
      name: 'Core',
    },
    violet: {
      gradient: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 50%, #a855f7 100%)',
      border: '#a855f7',
      icon: (
        <path
          d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4L12 17l-6.3 4.4 2.3-7.4-6-4.6h7.6L12 2z"
          fill="#0f0520"
          stroke="#0f0520"
          strokeWidth="1.5"
        />
      ),
      name: 'Void',
    },
  };

  const config = configs[type];

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className="rounded-lg flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: config.gradient,
          border: `2px solid ${config.border}`,
          boxShadow: `0 0 15px ${config.border}, inset 0 2px 4px rgba(255,255,255,0.3)`,
        }}
        whileHover={{ scale: 1.1 }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
          {config.icon}
        </svg>
      </motion.div>
      <span className="text-text-muted text-xs">{config.name}</span>
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState('home'); // 'home', 'playing'
  const [showHelp, setShowHelp] = useState(false);

  const startGame = () => {
    setGameState('playing');
  };

  const goHome = () => {
    setGameState('home');
  };

  return (
    <div className="w-screen h-screen bg-void-black overflow-hidden relative">
      {/* Ambient scanline overlay */}
      <div className="scanlines absolute inset-0 pointer-events-none z-[100] opacity-30" />

      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00f0ff 1px, transparent 1px),
            linear-gradient(to bottom, #00f0ff 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-24 md:w-32 h-24 md:h-32 border-l-2 border-t-2 border-neon-cyan opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 border-r-2 border-t-2 border-neon-cyan opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 md:w-32 h-24 md:h-32 border-l-2 border-b-2 border-neon-cyan opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 md:w-32 h-24 md:h-32 border-r-2 border-b-2 border-neon-cyan opacity-20 pointer-events-none" />

      <AnimatePresence mode="wait">
        {gameState === 'home' ? (
          <HomeScreen key="home" onStart={startGame} onHelp={() => setShowHelp(true)} />
        ) : (
          <motion.div
            key="game"
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameBoard onHome={goHome} onHelp={() => setShowHelp(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal - accessible from anywhere */}
      <AnimatePresence>
        {showHelp && (
          <HelpModal onClose={() => setShowHelp(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Home Screen Component
 */
function HomeScreen({ onStart, onHelp }) {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Title */}
      <motion.div
        className="text-center mb-8 md:mb-12"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <motion.h1
          className="text-impact text-4xl md:text-7xl text-neon-cyan mb-4"
          style={{ textShadow: '0 0 30px #00f0ff, 0 0 60px #00f0ff' }}
          animate={{
            textShadow: [
              '0 0 30px #00f0ff, 0 0 60px #00f0ff',
              '0 0 50px #00f0ff, 0 0 100px #00f0ff',
              '0 0 30px #00f0ff, 0 0 60px #00f0ff',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ENTROPY
        </motion.h1>
        <h2 className="text-impact text-2xl md:text-4xl text-neon-violet mb-2"
          style={{ textShadow: '0 0 20px #a855f7' }}>
          REDUCTION
        </h2>
        <p className="text-header text-text-muted text-sm md:text-lg tracking-aggressive">
          High-Velocity Cognitive Arcade
        </p>
        <div
          className="mx-auto mt-4 md:mt-6 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
          style={{ width: '80%', maxWidth: '500px' }}
        />
      </motion.div>

      {/* Quick Overview */}
      <motion.div
        className="chamfer-lg bg-void-surface/50 border border-void-border p-4 md:p-6 mb-6 md:mb-8 max-w-lg text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-text-primary font-exo mb-4 text-sm md:text-base">
          Match <span className="text-neon-cyan font-bold">3 or more</span> tiles to clear them.
          Tiles fall and create <span className="text-neon-amber font-bold">chain reactions</span>!
        </p>
        <div className="flex justify-center gap-3 md:gap-6">
          <TilePreview type="cyan" size={44} />
          <TilePreview type="magenta" size={44} />
          <TilePreview type="amber" size={44} />
          <TilePreview type="violet" size={44} />
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex flex-col gap-3 md:gap-4 w-full max-w-xs"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          className="chamfer-sm bg-neon-cyan text-void-black px-8 md:px-12 py-3 md:py-4 font-rajdhani font-bold text-xl md:text-2xl tracking-wider"
          style={{ boxShadow: '0 0 30px #00f0ff' }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 50px #00f0ff' }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
        >
          START GAME
        </motion.button>

        <motion.button
          className="chamfer-sm bg-void-surface border-2 border-neon-violet text-neon-violet px-8 md:px-12 py-2 md:py-3 font-rajdhani font-bold text-base md:text-lg tracking-wider"
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #a855f7' }}
          whileTap={{ scale: 0.95 }}
          onClick={onHelp}
        >
          HOW TO PLAY
        </motion.button>
      </motion.div>

      {/* Keyboard hint */}
      <motion.p
        className="mt-6 md:mt-8 text-text-muted text-xs md:text-sm font-exo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Press <span className="text-neon-cyan">[SPACE]</span> or <span className="text-neon-cyan">[ENTER]</span> to start
      </motion.p>

      {/* Keyboard listener for home screen */}
      <HomeKeyboardListener onStart={onStart} />
    </motion.div>
  );
}

/**
 * Keyboard listener for home screen
 */
function HomeKeyboardListener({ onStart }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return null;
}

/**
 * Help Modal Component
 */
function HelpModal({ onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 bg-void-black/95 flex items-center justify-center z-[200] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="chamfer-lg bg-void-surface border-2 border-neon-cyan p-4 md:p-8 max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 0 60px #00f0ff' }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-impact text-2xl md:text-3xl text-neon-cyan mb-6 text-center"
          style={{ textShadow: '0 0 20px #00f0ff' }}
        >
          HOW TO PLAY
        </h2>

        {/* Game Objective */}
        <Section title="OBJECTIVE" color="cyan">
          <p>Clear tiles by tapping <strong>3 or more</strong> matching tiles in a row or column.
          Tiles fall down after clearing, creating <strong className="text-neon-amber">chain reactions</strong> for bonus points!</p>
        </Section>

        {/* Tile Types */}
        <Section title="TILE TYPES" color="amber">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center">
            <TilePreview type="cyan" size={48} />
            <TilePreview type="magenta" size={48} />
            <TilePreview type="amber" size={48} />
            <TilePreview type="violet" size={48} />
          </div>
          <p className="mt-3 text-sm text-center">Glowing tiles can be cleared. Dim tiles need more matches.</p>
        </Section>

        {/* New Feature: Gravity */}
        <Section title="GRAVITY & CHAINS" color="violet">
          <div className="space-y-2 text-sm">
            <div>• When tiles clear, tiles above <strong>fall down</strong> to fill gaps</div>
            <div>• Falling tiles can create <strong className="text-neon-amber">new matches</strong></div>
            <div>• Chain reactions give <strong className="text-neon-violet">bonus points</strong> (+25% per chain)</div>
            <div>• Look for setups that trigger multiple cascades!</div>
          </div>
        </Section>

        {/* Scoring */}
        <Section title="SCORING" color="amber">
          <div className="space-y-1 text-sm">
            <div>• Base: <strong>10 points</strong> per tile cleared</div>
            <div>• Match-4+: <strong>+50%</strong> bonus per extra tile</div>
            <div>• Combo: <strong>1.5x</strong> multiplier per combo level</div>
            <div>• Chains: <strong>1.25x</strong> bonus per cascade</div>
            <div>• <span className="text-neon-violet">CRITICAL</span>: <strong>3.5x</strong> (10% chance)</div>
          </div>
        </Section>

        {/* Controls */}
        <Section title="CONTROLS" color="cyan">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-neon-cyan">[TAP/CLICK]</span> Clear matching tiles</div>
            <div><span className="text-neon-cyan">[SPACE]</span> Pause/Resume</div>
            <div><span className="text-neon-cyan">[ESC]</span> Pause/Resume</div>
            <div><span className="text-neon-cyan">[R]</span> Restart game</div>
          </div>
        </Section>

        {/* Tips */}
        <Section title="PRO TIPS" color="order">
          <ul className="space-y-1 text-sm list-disc list-inside">
            <li>Plan cascades by clearing tiles at the bottom first</li>
            <li>Keep combo going by clearing quickly - watch the timer!</li>
            <li>Clear when entropy is high (board filling up)</li>
            <li>Every clear has a 10% chance for critical bonus!</li>
          </ul>
        </Section>

        {/* Close button */}
        <div className="mt-6 text-center">
          <motion.button
            className="chamfer-sm bg-neon-cyan text-void-black px-6 md:px-8 py-2 md:py-3 font-rajdhani font-bold text-base md:text-lg tracking-wider"
            style={{ boxShadow: '0 0 20px #00f0ff' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
          >
            GOT IT!
          </motion.button>
          <p className="text-xs text-text-muted mt-2">Press ESC or tap outside to close</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Section component for help modal
 */
function Section({ title, color, children }) {
  const colorClasses = {
    cyan: 'text-neon-cyan border-neon-cyan',
    amber: 'text-neon-amber border-neon-amber',
    magenta: 'text-neon-magenta border-neon-magenta',
    violet: 'text-neon-violet border-neon-violet',
    order: 'text-order border-order',
  };

  return (
    <div className="mb-5">
      <h3 className={`font-rajdhani font-bold text-sm tracking-wider mb-2 pb-1 border-b ${colorClasses[color]}`}>
        {title}
      </h3>
      <div className="text-text-primary font-exo">
        {children}
      </div>
    </div>
  );
}
