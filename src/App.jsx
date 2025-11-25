import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameBoard from './components/GameBoard';

/**
 * Main App Component
 * Manages game states: home, playing, help
 */

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

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-neon-cyan opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-neon-cyan opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-neon-cyan opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-neon-cyan opacity-20 pointer-events-none" />

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
      className="w-full h-full flex flex-col items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Title */}
      <motion.div
        className="text-center mb-12"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <h1
          className="text-impact text-5xl md:text-7xl text-neon-cyan mb-4"
          style={{ textShadow: '0 0 30px #00f0ff, 0 0 60px #00f0ff' }}
        >
          ENTROPY REDUCTION
        </h1>
        <p className="text-header text-text-muted text-lg tracking-aggressive">
          High-Velocity Cognitive Arcade
        </p>
        <div
          className="mx-auto mt-6 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
          style={{ width: '80%', maxWidth: '500px' }}
        />
      </motion.div>

      {/* Quick Overview */}
      <motion.div
        className="chamfer-lg bg-void-surface/50 border border-void-border p-6 mb-8 max-w-md text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-text-primary font-exo mb-4">
          Match <span className="text-neon-cyan font-bold">3 or more</span> tiles of the same color to clear them.
          Build combos and fight the rising entropy!
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#00f0ff]" />
            <span className="text-text-muted">Cyan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#ff00ff]" />
            <span className="text-text-muted">Magenta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#ffb000]" />
            <span className="text-text-muted">Amber</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#a855f7]" />
            <span className="text-text-muted">Violet</span>
          </div>
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div
        className="flex flex-col gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          className="chamfer-sm bg-neon-cyan text-void-black px-12 py-4 font-rajdhani font-bold text-2xl tracking-wider"
          style={{ boxShadow: '0 0 30px #00f0ff' }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 50px #00f0ff' }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
        >
          START GAME
        </motion.button>

        <motion.button
          className="chamfer-sm bg-void-surface border-2 border-neon-violet text-neon-violet px-12 py-3 font-rajdhani font-bold text-lg tracking-wider"
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #a855f7' }}
          whileTap={{ scale: 0.95 }}
          onClick={onHelp}
        >
          HOW TO PLAY
        </motion.button>
      </motion.div>

      {/* Keyboard hint */}
      <motion.p
        className="mt-8 text-text-muted text-sm font-exo"
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
  return (
    <motion.div
      className="fixed inset-0 bg-void-black/95 flex items-center justify-center z-[200] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="chamfer-lg bg-void-surface border-2 border-neon-cyan p-6 md:p-8 max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 0 60px #00f0ff' }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-impact text-3xl text-neon-cyan mb-6 text-center"
          style={{ textShadow: '0 0 20px #00f0ff' }}
        >
          HOW TO PLAY
        </h2>

        {/* Game Objective */}
        <Section title="OBJECTIVE" color="cyan">
          <p>Clear tiles by matching <strong>3 or more</strong> of the same color in a row or column.
          Keep the board clear while entropy continuously spawns new tiles!</p>
        </Section>

        {/* Tile Colors */}
        <Section title="TILE COLORS" color="amber">
          <div className="grid grid-cols-2 gap-3">
            <ColorItem color="#00f0ff" name="CYAN" letter="C" />
            <ColorItem color="#ff00ff" name="MAGENTA" letter="M" />
            <ColorItem color="#ffb000" name="AMBER" letter="A" />
            <ColorItem color="#a855f7" name="VIOLET" letter="V" />
          </div>
          <p className="mt-3 text-sm">Glowing tiles can be cleared. Dim tiles are not part of a match yet.</p>
        </Section>

        {/* UI Elements */}
        <Section title="GAME STATS" color="magenta">
          <div className="space-y-2 text-sm">
            <div><strong className="text-neon-cyan">SCORE</strong> — Your current points. Try to beat your high score!</div>
            <div><strong className="text-neon-amber">COMBO</strong> — Chain clears within 3 seconds to multiply points. The bar shows time remaining.</div>
            <div><strong className="text-chaos">ENTROPY</strong> — How full the board is. High entropy = danger! Keep it low.</div>
          </div>
        </Section>

        {/* Scoring */}
        <Section title="SCORING" color="violet">
          <div className="space-y-1 text-sm">
            <div>• Base: <strong>10 points</strong> per tile cleared</div>
            <div>• Match-4: <strong>+50%</strong> bonus</div>
            <div>• Match-5+: <strong>+50%</strong> per extra tile</div>
            <div>• Combo x2+: <strong>1.5x</strong> multiplier per combo level</div>
            <div>• <span className="text-neon-violet">CRITICAL CLEAR</span>: <strong>3.5x</strong> bonus (10% chance!)</div>
          </div>
        </Section>

        {/* Controls */}
        <Section title="CONTROLS" color="cyan">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-neon-cyan">[CLICK]</span> Clear matching tiles</div>
            <div><span className="text-neon-cyan">[SPACE]</span> Pause/Resume</div>
            <div><span className="text-neon-cyan">[ESC]</span> Pause/Resume</div>
            <div><span className="text-neon-cyan">[R]</span> Restart game</div>
            <div><span className="text-neon-cyan">[H]</span> Show this help</div>
          </div>
        </Section>

        {/* Tips */}
        <Section title="TIPS" color="order">
          <ul className="space-y-1 text-sm list-disc list-inside">
            <li>Look for intersections where horizontal and vertical matches meet for big clears</li>
            <li>Keep combo going by clearing quickly - watch the timer bar!</li>
            <li>Prioritize clearing when entropy is high (board filling up)</li>
            <li>Critical clears are random - every clear has a 10% chance!</li>
          </ul>
        </Section>

        {/* Close button */}
        <div className="mt-6 text-center">
          <motion.button
            className="chamfer-sm bg-neon-cyan text-void-black px-8 py-3 font-rajdhani font-bold text-lg tracking-wider"
            style={{ boxShadow: '0 0 20px #00f0ff' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
          >
            GOT IT!
          </motion.button>
          <p className="text-xs text-text-muted mt-2">Press ESC or click outside to close</p>
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

/**
 * Color item for help modal
 */
function ColorItem({ color, name, letter }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded flex items-center justify-center font-bold text-void-black"
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      >
        {letter}
      </div>
      <span className="text-sm">{name}</span>
    </div>
  );
}
