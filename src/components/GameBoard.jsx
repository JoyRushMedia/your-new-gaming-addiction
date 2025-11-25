import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tile from './Tile';
import ParticleBurst from './ParticleBurst';
import {
  calculateReward,
  calculateEntropySpawn,
  generateRandomPosition,
  generateRandomTileType,
  calculateEntropyLevel,
  updateCombo,
  findClearableTiles,
  findMatchingGroup,
  GAME_CONFIG,
} from '../lib/gameLogic';
import { soundManager } from '../lib/sounds';

/**
 * GameBoard Component (JUICE-INJECTED)
 * Implements the Entropy-Reduction Core Loop with AGGRESSIVE visual feedback
 * Features: AnimatePresence, particle bursts, screen shake, border flash
 */

const GRID_SIZE = 6;
let tileIdCounter = 0;

// Spring physics for stat displays
const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
};

export default function GameBoard() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [tiles, setTiles] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [entropyLevel, setEntropyLevel] = useState(0);
  const [lastClearTime, setLastClearTime] = useState(Date.now());
  const [isNearMiss, setIsNearMiss] = useState(false);
  const [nearMissPercent, setNearMissPercent] = useState(0);
  const [criticalMessage, setCriticalMessage] = useState(null);
  const [shake, setShake] = useState(false);
  const [particleBursts, setParticleBursts] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('entropyReduction_highScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [comboTimeLeft, setComboTimeLeft] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('entropyReduction_soundEnabled');
    return saved !== 'false'; // Default to true
  });
  const [showTutorial, setShowTutorial] = useState(() => {
    const seen = localStorage.getItem('entropyReduction_tutorialSeen');
    return !seen; // Show if not seen
  });
  const gameBoardRef = useRef(null);
  const comboTimerRef = useRef(null);
  const soundInitialized = useRef(false);

  // ============================================
  // COMBO TIMER
  // ============================================

  useEffect(() => {
    if (combo > 0 && !isPaused) {
      const COMBO_TIMEOUT = 3000;
      const updateInterval = 50; // Update every 50ms for smooth animation

      // Clear any existing timer
      if (comboTimerRef.current) {
        clearInterval(comboTimerRef.current);
      }

      const startTime = lastClearTime;
      setComboTimeLeft(100);

      comboTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, ((COMBO_TIMEOUT - elapsed) / COMBO_TIMEOUT) * 100);
        setComboTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(comboTimerRef.current);
          setCombo(0);
        }
      }, updateInterval);

      return () => {
        if (comboTimerRef.current) {
          clearInterval(comboTimerRef.current);
        }
      };
    } else {
      setComboTimeLeft(0);
    }
  }, [combo, lastClearTime, isPaused]);

  // ============================================
  // HIGH SCORE PERSISTENCE
  // ============================================

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('entropyReduction_highScore', score.toString());
    }
  }, [score, highScore]);

  // ============================================
  // SOUND MANAGEMENT
  // ============================================

  const initSound = useCallback(() => {
    if (!soundInitialized.current) {
      soundManager.init();
      soundManager.setEnabled(soundEnabled);
      soundInitialized.current = true;
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    soundManager.setEnabled(newEnabled);
    localStorage.setItem('entropyReduction_soundEnabled', newEnabled.toString());
  }, [soundEnabled]);

  // Sync sound enabled state
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // ============================================
  // TUTORIAL
  // ============================================

  const dismissTutorial = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem('entropyReduction_tutorialSeen', 'true');
    initSound();
  }, [initSound]);

  // ============================================
  // RESTART GAME
  // ============================================

  const restartGame = useCallback(() => {
    // Reset tile ID counter
    tileIdCounter = 0;

    // Generate new initial tiles
    const initialTiles = [];
    for (let i = 0; i < 12; i++) {
      const position = generateRandomPosition(GRID_SIZE, initialTiles);
      if (position) {
        initialTiles.push({
          id: tileIdCounter++,
          x: position.x,
          y: position.y,
          type: generateRandomTileType(),
        });
      }
    }

    // Reset all state
    setTiles(initialTiles);
    setScore(0);
    setCombo(0);
    setEntropyLevel(0);
    setLastClearTime(Date.now());
    setIsNearMiss(false);
    setCriticalMessage(null);
    setShake(false);
    setParticleBursts([]);
    setIsPaused(false);
    setComboTimeLeft(0);
  }, []);

  // ============================================
  // PAUSE TOGGLE
  // ============================================

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // If tutorial is showing, any key dismisses it
      if (showTutorial) {
        e.preventDefault();
        dismissTutorial();
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'Escape':
          e.preventDefault();
          togglePause();
          break;
        case 'KeyR':
          e.preventDefault();
          restartGame();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause, restartGame, showTutorial, dismissTutorial]);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    const initialTiles = [];
    for (let i = 0; i < 12; i++) {
      const position = generateRandomPosition(GRID_SIZE, initialTiles);
      if (position) {
        initialTiles.push({
          id: tileIdCounter++,
          x: position.x,
          y: position.y,
          type: generateRandomTileType(),
        });
      }
    }
    setTiles(initialTiles);
  }, []);

  // ============================================
  // ENTROPY LEVEL TRACKING
  // ============================================

  useEffect(() => {
    const maxTiles = GRID_SIZE * GRID_SIZE;
    const newEntropyLevel = calculateEntropyLevel(tiles.length, maxTiles);
    setEntropyLevel(newEntropyLevel);
  }, [tiles]);

  // ============================================
  // ZEIGARNIK EFFECT: CONTINUOUS ENTROPY GENERATION
  // ============================================

  useEffect(() => {
    // Don't spawn when paused or board is nearly full
    if (isPaused || tiles.length >= GRID_SIZE * GRID_SIZE - 4) return;

    const spawnTimer = setTimeout(() => {
      const spawnCount = calculateEntropySpawn(tiles.length, GRID_SIZE);

      if (spawnCount > 0) {
        const newTiles = [];
        for (let i = 0; i < spawnCount; i++) {
          const position = generateRandomPosition(GRID_SIZE, [...tiles, ...newTiles]);
          if (position) {
            newTiles.push({
              id: tileIdCounter++,
              x: position.x,
              y: position.y,
              type: generateRandomTileType(),
            });
          }
        }

        if (newTiles.length > 0) {
          setTiles(prev => [...prev, ...newTiles]);
        }
      }
    }, GAME_CONFIG.ENTROPY_SPAWN_DELAY);

    return () => clearTimeout(spawnTimer);
  }, [tiles, isPaused]);

  // ============================================
  // CLEAR MECHANICS
  // ============================================

  const handleTileClear = useCallback((tileId) => {
    // Initialize sound on first user interaction
    initSound();

    const now = Date.now();
    const timeSinceLastClear = now - lastClearTime;

    // Find ALL tiles in the matching group (not just the clicked one)
    const matchingTileIds = findMatchingGroup(tiles, tileId, GRID_SIZE);

    if (matchingTileIds.length === 0) return;

    // Get clicked tile position for particle burst
    const clearedTile = tiles.find(t => t.id === tileId);
    const tileElement = document.querySelector(`[data-tile-id="${tileId}"]`);

    // Calculate remaining tiles for near-miss detection
    const remainingTilesAfterClear = tiles.filter(t => !matchingTileIds.includes(t.id));
    const remainingClearableAfterClear = findClearableTiles(remainingTilesAfterClear, GRID_SIZE);

    // Near-miss = No more clearable tiles after this, but board still has 15%+ entropy
    const isLastClearable = remainingClearableAfterClear.length === 0;
    const hasSignificantEntropy = remainingTilesAfterClear.length >= (GRID_SIZE * GRID_SIZE) * 0.15;
    const entropyPercentage = Math.round((remainingTilesAfterClear.length / (GRID_SIZE * GRID_SIZE)) * 100);

    if (isLastClearable && hasSignificantEntropy) {
      setIsNearMiss(true);
      setNearMissPercent(entropyPercentage);
      setShake(true);
      soundManager.playNearMiss();
      setTimeout(() => {
        setIsNearMiss(false);
        setShake(false);
      }, 800);
    }

    // Clear ALL matching tiles at once
    setTiles(prev => prev.filter(t => !matchingTileIds.includes(t.id)));

    // Update combo
    const newCombo = updateCombo(combo, true, timeSinceLastClear);
    setCombo(newCombo);

    // Play combo sound if combo increased
    if (newCombo > 1) {
      soundManager.playCombo(newCombo);
    }

    // Calculate reward - bonus points for clearing more tiles!
    const tilesCleared = matchingTileIds.length;
    const basePoints = GAME_CONFIG.BASE_POINTS_PER_CLEAR * tilesCleared;
    // Bonus multiplier for clearing 4+ tiles (match-4, match-5, etc.)
    const matchBonus = tilesCleared > 3 ? 1 + (tilesCleared - 3) * 0.5 : 1;

    const reward = calculateReward(
      Math.floor(basePoints * matchBonus),
      newCombo
    );

    setScore(prev => prev + reward.points);
    setLastClearTime(now);

    // Play appropriate sound based on clear type
    if (reward.isCritical) {
      soundManager.playCritical();
    } else if (tilesCleared >= 4) {
      soundManager.playBigClear();
    } else {
      // Normal clear with pitch based on tiles cleared
      soundManager.playClear(1 + (tilesCleared - 3) * 0.2);
    }

    // Show clear message for big clears
    if (tilesCleared >= 4 && !reward.isCritical) {
      setCriticalMessage(tilesCleared >= 5 ? 'MASSIVE CLEAR!' : 'GREAT CLEAR!');
      setTimeout(() => setCriticalMessage(null), 800);
    }

    // CRITICAL CLEAR FEEDBACK
    if (reward.isCritical) {
      setCriticalMessage(reward.message);
      setShake(true);

      // Trigger particle burst at tile position
      if (tileElement && clearedTile) {
        const rect = tileElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const burstId = Date.now();
        setParticleBursts(prev => [
          ...prev,
          {
            id: burstId,
            x: centerX,
            y: centerY,
            color: '#a855f7', // Violet for critical
          },
        ]);

        // Remove burst after animation completes
        setTimeout(() => {
          setParticleBursts(prev => prev.filter(b => b.id !== burstId));
        }, 1200);
      }

      setTimeout(() => {
        setCriticalMessage(null);
        setShake(false);
      }, 1000);
    }
  }, [combo, lastClearTime, tiles, initSound]);

  // ============================================
  // AUTO-CLEAR DETECTION
  // ============================================

  const clearableTileIds = findClearableTiles(tiles, GRID_SIZE);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      ref={gameBoardRef}
      className={`
        w-full h-full
        flex flex-col
        p-8
      `}
    >
      {/* SCREEN SHAKE CONTAINER */}
      <motion.div
        className="w-full h-full flex flex-col"
        animate={{
          x: shake ? [0, -4, 4, -4, 4, 0] : 0,
          y: shake ? [0, 4, -4, 4, -4, 0] : 0,
        }}
        transition={{ duration: 0.4 }}
      >
        {/* Header Stats */}
        <div className="flex justify-between items-start mb-8 gap-4">
          {/* Score + High Score */}
          <motion.div
            className="chamfer-sm bg-void-surface border-2 border-neon-cyan p-4 min-w-[200px] relative"
            style={{
              boxShadow: '0 0 20px #00f0ff, inset 0 0 20px rgba(0, 240, 255, 0.2)',
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 0 40px #00f0ff, inset 0 0 30px rgba(0, 240, 255, 0.3)',
            }}
            transition={SPRING_CONFIG}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="text-header text-neon-cyan text-sm">SCORE</div>
              <div className="text-header text-text-muted text-xs">
                BEST: {highScore.toLocaleString()}
              </div>
            </div>
            <motion.div
              className="text-score text-4xl text-white"
              key={score}
              initial={{ scale: 1.3, color: '#00f0ff' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ duration: 0.3 }}
            >
              {score.toLocaleString()}
            </motion.div>
          </motion.div>

          {/* Combo with Timer */}
          <motion.div
            className={`
              chamfer-sm bg-void-surface border-2 p-4 min-w-[150px]
            `}
            style={{
              borderColor: combo > 0 ? '#ffb000' : '#1a1a28',
              boxShadow: combo > 0
                ? '0 0 30px #ffb000, inset 0 0 20px rgba(255, 176, 0, 0.2)'
                : 'none',
            }}
            animate={{
              scale: combo > 1 ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-header text-neon-amber text-sm mb-1">COMBO</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={combo}
                className="text-score text-3xl text-white"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={SPRING_CONFIG}
              >
                {combo > 0 ? `x${combo}` : '--'}
              </motion.div>
            </AnimatePresence>
            {/* Combo Timer Bar */}
            <div className="mt-2 h-1 bg-void-deep rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{
                  backgroundColor: comboTimeLeft > 30 ? '#ffb000' : '#ff3366',
                }}
                animate={{ width: `${comboTimeLeft}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </motion.div>

          {/* Entropy Level */}
          <motion.div
            className={`
              chamfer-sm bg-void-surface border-2 p-4 min-w-[180px]
            `}
            style={{
              borderColor: entropyLevel > 70 ? '#ff3366' : '#1a1a28',
              boxShadow: entropyLevel > 70
                ? '0 0 30px #ff3366, inset 0 0 20px rgba(255, 51, 102, 0.2)'
                : 'none',
            }}
            animate={{
              scale: entropyLevel > 80 ? [1, 1.02, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: entropyLevel > 80 ? Infinity : 0,
            }}
          >
            <div className="text-header text-chaos text-sm mb-1">ENTROPY</div>
            <div className="flex items-center gap-2">
              <motion.div
                className="text-score text-3xl text-white"
                animate={{
                  color: entropyLevel > 70 ? '#ff3366' : '#ffffff',
                }}
              >
                {entropyLevel}%
              </motion.div>
              <div className="flex-1 h-2 bg-void-deep rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-order to-chaos"
                  initial={{ width: 0 }}
                  animate={{ width: `${entropyLevel}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <motion.button
              className={`
                chamfer-sm p-4 border-2 font-rajdhani font-bold tracking-wider text-sm
                ${isPaused
                  ? 'bg-neon-amber border-neon-amber text-void-black'
                  : 'bg-void-surface border-void-border text-text-muted hover:border-neon-cyan hover:text-neon-cyan'
                }
              `}
              style={{
                boxShadow: isPaused ? '0 0 20px #ffb000' : 'none',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePause}
            >
              {isPaused ? 'RESUME' : 'PAUSE'}
            </motion.button>
            <motion.button
              className="chamfer-sm bg-void-surface border-2 border-void-border p-4 text-text-muted font-rajdhani font-bold tracking-wider text-sm hover:border-chaos hover:text-chaos"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restartGame}
            >
              RESTART
            </motion.button>
            <motion.button
              className={`
                chamfer-sm p-4 border-2 font-rajdhani font-bold tracking-wider text-sm
                ${soundEnabled
                  ? 'bg-void-surface border-order text-order'
                  : 'bg-void-surface border-void-border text-text-muted'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                initSound();
                toggleSound();
              }}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              {soundEnabled ? 'SOUND ON' : 'SOUND OFF'}
            </motion.button>
          </div>
        </div>

        {/* Critical Message Overlay */}
        <AnimatePresence>
          {criticalMessage && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 20,
              }}
            >
              <motion.div
                className="text-impact text-6xl text-neon-violet"
                style={{
                  textShadow: '0 0 40px #a855f7, 0 0 80px #a855f7',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  filter: [
                    'hue-rotate(0deg)',
                    'hue-rotate(180deg)',
                    'hue-rotate(0deg)',
                  ],
                }}
                transition={{
                  duration: 0.5,
                  repeat: 1,
                }}
              >
                {criticalMessage}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Near Miss Feedback */}
        <AnimatePresence>
          {isNearMiss && (
            <motion.div
              className="fixed top-1/3 left-1/2 pointer-events-none z-40"
              initial={{ x: '-50%', y: -50, opacity: 0, scale: 0.5 }}
              animate={{
                x: '-50%',
                y: 0,
                opacity: 1,
                scale: 1,
              }}
              exit={{ y: 50, opacity: 0, scale: 0.5 }}
              transition={SPRING_CONFIG}
            >
              <div
                className="text-header text-2xl text-neon-magenta px-8 py-4 chamfer-sm border-2 border-neon-magenta bg-void-deep"
                style={{
                  boxShadow: '0 0 40px #ff00ff, inset 0 0 20px rgba(255, 0, 255, 0.3)',
                }}
              >
                SO CLOSE! {nearMissPercent}% ENTROPY REMAINS
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause Overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              className="fixed inset-0 bg-void-black/80 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="text-center"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
              >
                <div
                  className="text-impact text-6xl text-neon-cyan mb-4"
                  style={{ textShadow: '0 0 40px #00f0ff' }}
                >
                  PAUSED
                </div>
                <div className="text-header text-text-muted text-lg mb-8">
                  ENTROPY GENERATION HALTED
                </div>
                <motion.button
                  className="chamfer-sm bg-neon-cyan text-void-black px-8 py-4 font-rajdhani font-bold text-xl tracking-wider"
                  style={{ boxShadow: '0 0 30px #00f0ff' }}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 50px #00f0ff' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePause}
                >
                  RESUME
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tutorial Overlay */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              className="fixed inset-0 bg-void-black/90 flex items-center justify-center z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={dismissTutorial}
            >
              <motion.div
                className="chamfer-lg bg-void-surface border-2 border-neon-cyan p-8 max-w-lg mx-4"
                style={{ boxShadow: '0 0 60px #00f0ff' }}
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2
                  className="text-impact text-3xl text-neon-cyan mb-6 text-center"
                  style={{ textShadow: '0 0 20px #00f0ff' }}
                >
                  HOW TO PLAY
                </h2>

                <div className="space-y-4 text-text-primary font-exo">
                  <div className="flex items-start gap-3">
                    <div className="text-neon-cyan font-bold text-xl">1</div>
                    <div>
                      <div className="font-rajdhani font-bold text-neon-amber">MATCH 3+</div>
                      <div className="text-sm text-text-muted">
                        Click glowing tiles that form a line of 3 or more matching colors
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-neon-cyan font-bold text-xl">2</div>
                    <div>
                      <div className="font-rajdhani font-bold text-neon-amber">BUILD COMBOS</div>
                      <div className="text-sm text-text-muted">
                        Clear tiles quickly (within 3 seconds) to multiply your score
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-neon-cyan font-bold text-xl">3</div>
                    <div>
                      <div className="font-rajdhani font-bold text-neon-amber">FIGHT ENTROPY</div>
                      <div className="text-sm text-text-muted">
                        New tiles spawn constantly - keep clearing to stay ahead!
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-neon-violet font-bold text-xl">★</div>
                    <div>
                      <div className="font-rajdhani font-bold text-neon-violet">CRITICAL CLEARS</div>
                      <div className="text-sm text-text-muted">
                        10% chance for 3.5x bonus points on any clear!
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-void-border text-center">
                  <motion.button
                    className="chamfer-sm bg-neon-cyan text-void-black px-8 py-3 font-rajdhani font-bold text-lg tracking-wider"
                    style={{ boxShadow: '0 0 20px #00f0ff' }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px #00f0ff' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={dismissTutorial}
                  >
                    START PLAYING
                  </motion.button>
                  <div className="text-xs text-text-muted mt-3">
                    Press any key or click anywhere to dismiss
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Board */}
        <div className="flex-1 flex items-center justify-center scanlines">
          <motion.div
            className="chamfer-tech bg-void-deep border-2 p-6"
            style={{
              borderColor: isNearMiss ? '#ff3366' : '#00f0ff',
              boxShadow: isNearMiss
                ? '0 0 60px #ff3366'
                : '0 0 40px #00f0ff',
            }}
            animate={{
              borderColor: isNearMiss
                ? ['#ff3366', '#ffb000', '#ff3366']
                : '#00f0ff',
            }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                width: `${GRID_SIZE * 70}px`,
                height: `${GRID_SIZE * 70}px`,
              }}
            >
              {/* Render grid cells */}
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const x = index % GRID_SIZE;
                const y = Math.floor(index / GRID_SIZE);
                const tile = tiles.find(t => t.x === x && t.y === y);

                return (
                  <div
                    key={`cell-${x}-${y}`}
                    className="relative bg-void-surface border border-void-border"
                    data-tile-id={tile?.id}
                  >
                    <AnimatePresence mode="wait">
                      {tile && (
                        <Tile
                          key={tile.id}
                          tile={tile}
                          onClear={handleTileClear}
                          isClearable={clearableTileIds.includes(tile.id)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div
          className="mt-6 text-center text-text-muted text-sm font-exo"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="tracking-moderate mb-2">
            CLICK TILES TO CLEAR • MATCH 3+ TO REDUCE ENTROPY
          </p>
          <p className="text-xs opacity-60">
            <span className="text-neon-cyan">[SPACE]</span> Pause
            <span className="mx-2">•</span>
            <span className="text-neon-cyan">[R]</span> Restart
            <span className="mx-2">•</span>
            <span className="text-neon-cyan">[ESC]</span> Pause
          </p>
        </motion.div>
      </motion.div>

      {/* Particle Bursts */}
      <AnimatePresence>
        {particleBursts.map(burst => (
          <ParticleBurst
            key={burst.id}
            x={burst.x}
            y={burst.y}
            color={burst.color}
            onComplete={() => {
              setParticleBursts(prev => prev.filter(b => b.id !== burst.id));
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
