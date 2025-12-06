import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameBoard from './components/GameBoard';
import LevelSelect from './components/LevelSelect';
import { getTotalStars, getMaxStars } from './lib/levels';
import NeonFrame from './components/layout/NeonFrame';
import AppShell from './components/layout/AppShell';
import TilePreview from './components/layout/TilePreview';
import { defaultMotionConfig } from './lib/designTokens';

/**
 * Main App Component
 * Manages game states: home, playing, help
 */
export default function App() {
  const [gameState, setGameState] = useState('home'); // 'home', 'playing', 'levelSelect', 'levelPlaying'
  const [showHelp, setShowHelp] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState(null);

  const startGame = () => {
    setGameState('playing');
  };

  const goHome = () => {
    setGameState('home');
    setCurrentLevelId(null);
  };

  const openLevelSelect = () => {
    setGameState('levelSelect');
  };

  const startLevel = (levelId) => {
    setCurrentLevelId(levelId);
    setGameState('levelPlaying');
  };

  const handleNextLevel = (nextLevelId) => {
    setCurrentLevelId(nextLevelId);
    // State stays as 'levelPlaying', GameBoard will re-initialize with new level
  };

  const renderPlayShell = (key, boardProps) => (
    <motion.div
      key={key}
      className="w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={defaultMotionConfig.transitions.default}
    >
      <AppShell
        header={(
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-text-muted font-rajdhani">Arcade Shell</div>
              <h2 className="text-impact text-2xl text-neon-cyan" style={{ textShadow: '0 0 20px #00f0ff' }}>
                Entropy Reduction
              </h2>
            </div>
            <div className="flex gap-2">
              <motion.button
                className="chamfer-sm bg-void-surface border border-neon-cyan/60 text-neon-cyan px-4 py-2 text-sm font-rajdhani"
                whileHover={defaultMotionConfig.hover}
                whileTap={defaultMotionConfig.tap}
                onClick={() => setShowHelp(true)}
              >
                HOW TO PLAY
              </motion.button>
              <motion.button
                className="chamfer-sm bg-void-surface border border-void-border text-text-muted px-4 py-2 text-sm font-rajdhani"
                whileHover={defaultMotionConfig.hover}
                whileTap={defaultMotionConfig.tap}
                onClick={goHome}
              >
                EXIT
              </motion.button>
            </div>
          </div>
        )}
        hud={(
          <div className="flex flex-wrap gap-3 text-xs md:text-sm">
            <span className="text-text-muted">Swipe to swap • Match 3+ • Build cascades for massive score.</span>
            <span className="text-neon-amber font-semibold">Motion ready — configurable via design tokens.</span>
          </div>
        )}
        sidebar={(
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-text-muted font-rajdhani">Tile Codex</span>
              <span className="text-[10px] text-text-muted">Match to clear</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TilePreview type="cyan" size={50} />
              <TilePreview type="magenta" size={50} />
              <TilePreview type="amber" size={50} />
              <TilePreview type="violet" size={50} />
            </div>
            <div className="text-xs text-text-muted">
              Build chains and keep entropy low. Animated UI responds to the shared motion theme.
            </div>
          </div>
        )}
        padding="md"
      >
        <div className="flex-1 min-h-0">
          <GameBoard
            onHome={goHome}
            onHelp={() => setShowHelp(true)}
            {...boardProps}
          />
        </div>
      </AppShell>
    </motion.div>
  );

  return (
    <NeonFrame>
      <AnimatePresence mode="wait">
        {gameState === 'home' && (
          <HomeScreen
            key="home"
            onStart={startGame}
            onChallengeMode={openLevelSelect}
            onHelp={() => setShowHelp(true)}
          />
        )}
        {gameState === 'playing' && renderPlayShell('game', {})}
        {gameState === 'levelSelect' && (
          <motion.div
            key="levelSelect"
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={defaultMotionConfig.transitions.default}
          >
            <LevelSelect
              onSelectLevel={startLevel}
              onBack={goHome}
            />
          </motion.div>
        )}
        {gameState === 'levelPlaying' && renderPlayShell(`level-${currentLevelId}`, {
          levelId: currentLevelId,
          onNextLevel: handleNextLevel,
          onLevelSelect: openLevelSelect,
        })}
      </AnimatePresence>

      {/* Help Modal - accessible from anywhere */}
      <AnimatePresence>
        {showHelp && (
          <HelpModal onClose={() => setShowHelp(false)} />
        )}
      </AnimatePresence>
    </NeonFrame>
  );
}

/**
 * Home Screen Component
 */
function HomeScreen({ onStart, onChallengeMode, onHelp, motionConfig = defaultMotionConfig }) {
  const totalStars = getTotalStars();
  const maxStars = getMaxStars();

  const header = (
    <motion.div
      className="text-center md:text-left"
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
    >
      <motion.h1
        className="text-impact text-4xl md:text-7xl text-neon-cyan mb-2"
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
      <h2
        className="text-impact text-2xl md:text-4xl text-neon-violet mb-2"
        style={{ textShadow: '0 0 20px #a855f7' }}
      >
        REDUCTION
      </h2>
      <p className="text-header text-text-muted text-sm md:text-lg tracking-aggressive">
        High-Velocity Cognitive Arcade
      </p>
      <div
        className="mx-auto md:mx-0 mt-4 md:mt-6 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
        style={{ width: '80%', maxWidth: '500px' }}
      />
    </motion.div>
  );

  const hud = (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2 bg-void-surface/70 border border-void-border rounded-lg px-3 py-1.5">
        <span className="text-neon-amber text-xl">★</span>
        <div className="text-sm font-rajdhani">
          <div className="text-text-muted uppercase tracking-widest">Stars</div>
          <div className="text-white font-semibold">{totalStars}/{maxStars}</div>
        </div>
      </div>
      <div className="text-xs text-text-muted font-exo">
        Built on new layout primitives for future modes and panels.
      </div>
    </div>
  );

  const sidebar = (
    <div className="flex flex-col gap-4 h-full justify-between">
      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted font-rajdhani">Tile Codex</div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <TilePreview type="cyan" size={52} />
          <TilePreview type="magenta" size={52} />
          <TilePreview type="amber" size={52} />
          <TilePreview type="violet" size={52} />
        </div>
      </div>
      <div className="text-xs text-text-muted">
        Glowing tiles are clearable. Dim variants need larger matches — plan cascades to trigger chain reactions.
      </div>
    </div>
  );

  const footer = (
    <motion.p
      className="text-text-muted text-xs md:text-sm font-exo"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      Press <span className="text-neon-cyan">[SPACE]</span> or <span className="text-neon-cyan">[ENTER]</span> to start
    </motion.p>
  );

  return (
    <AppShell header={header} hud={hud} sidebar={sidebar} footer={footer} padding="lg">
      <motion.div
        className="chamfer-lg bg-void-surface/50 border border-void-border p-4 md:p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-text-primary font-exo mb-4 text-sm md:text-base text-center md:text-left">
          Match <span className="text-neon-cyan font-bold">3 or more</span> tiles to clear them.
          Tiles fall and create <span className="text-neon-amber font-bold">chain reactions</span>!
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col gap-3 md:gap-4 w-full max-w-xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          className="chamfer-sm bg-neon-cyan text-void-black px-8 md:px-12 py-3 md:py-4 font-rajdhani font-bold text-xl md:text-2xl tracking-wider"
          style={{ boxShadow: '0 0 30px #00f0ff' }}
          whileHover={motionConfig.hover}
          whileTap={motionConfig.tap}
          onClick={onStart}
        >
          ENDLESS MODE
        </motion.button>

        <motion.button
          className="chamfer-sm bg-void-surface border-2 border-neon-amber text-neon-amber px-8 md:px-12 py-3 md:py-4 font-rajdhani font-bold text-lg md:text-xl tracking-wider relative overflow-hidden"
          style={{ boxShadow: '0 0 25px #ffb00060' }}
          whileHover={motionConfig.hover}
          whileTap={motionConfig.tap}
          onClick={onChallengeMode}
        >
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,176,0,0.4), transparent)' }}
            animate={motionConfig.enabled ? { x: ['-100%', '100%'] } : undefined}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">CHALLENGE MODE</span>
          {totalStars > 0 && (
            <div className="text-xs opacity-80 relative z-10 mt-0.5">
              {totalStars}/{maxStars} Stars
            </div>
          )}
        </motion.button>

        <motion.button
          className="chamfer-sm bg-void-surface border-2 border-neon-violet text-neon-violet px-8 md:px-12 py-2 md:py-3 font-rajdhani font-bold text-base md:text-lg tracking-wider"
          whileHover={motionConfig.hover}
          whileTap={motionConfig.tap}
          onClick={onHelp}
        >
          HOW TO PLAY
        </motion.button>
      </motion.div>

      <HomeKeyboardListener onStart={onStart} />
    </AppShell>
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
