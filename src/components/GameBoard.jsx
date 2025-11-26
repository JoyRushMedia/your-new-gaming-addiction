import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  calculateSpawnDelay,
  getDifficultyLevel,
  getStreakData,
  recordPlay,
  applyGravity,
  findAllMatches,
  GAME_CONFIG,
} from '../lib/gameLogic';
import { soundManager } from '../lib/sounds';

/**
 * GameBoard Component - ENHANCED WITH GRAVITY & CASCADE
 * Features: Gravity system, chain reactions, touch/swipe support, enhanced visuals
 */

const GRID_SIZE = 6;
let tileIdCounter = 0;

// Spring physics for stat displays
const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
};

// Game phases for cascade animation
const GAME_PHASE = {
  IDLE: 'idle',
  CLEARING: 'clearing',
  FALLING: 'falling',
  CASCADE_CHECK: 'cascade_check',
};

export default function GameBoard({ onHome, onHelp }) {
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
    try {
      const saved = localStorage.getItem('entropyReduction_highScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [comboTimeLeft, setComboTimeLeft] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('entropyReduction_soundEnabled');
      return saved !== 'false'; // Default to true
    } catch {
      return true;
    }
  });

  // Game Over & Progression State
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  const [gameTime, setGameTime] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [maxCombo, setMaxCombo] = useState(0);
  const [tilesCleared, setTilesCleared] = useState(0);
  const [streak, setStreak] = useState(() => {
    const data = getStreakData();
    return data.streak;
  });
  const [showShareCopied, setShowShareCopied] = useState(false);

  // Cascade & Animation State
  const [gamePhase, setGamePhase] = useState(GAME_PHASE.IDLE);
  const cascadeLevelRef = useRef(0); // Track cascade level for scoring
  const [fallingTiles, setFallingTiles] = useState(new Set());

  const gameBoardRef = useRef(null);
  const comboTimerRef = useRef(null);
  const soundInitialized = useRef(false);
  const lastDifficultyLevel = useRef(1);
  const spawnTimerRef = useRef(null);

  // ============================================
  // MEMOIZED COMPUTATIONS
  // ============================================

  const clearableTileIds = useMemo(() => {
    if (gamePhase !== GAME_PHASE.IDLE) return [];
    return findClearableTiles(tiles, GRID_SIZE);
  }, [tiles, gamePhase]);

  // ============================================
  // GAME TIMER & DIFFICULTY PROGRESSION
  // ============================================

  useEffect(() => {
    if (isPaused || isGameOver) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - gameStartTime;
      setGameTime(elapsed);

      const newDifficulty = getDifficultyLevel(elapsed);
      if (newDifficulty > lastDifficultyLevel.current) {
        lastDifficultyLevel.current = newDifficulty;
        setDifficultyLevel(newDifficulty);
        soundManager.playDifficultyUp();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [gameStartTime, isPaused, isGameOver]);

  // ============================================
  // GAME OVER CHECK
  // ============================================

  useEffect(() => {
    if (entropyLevel >= 100 && !isGameOver) {
      setIsGameOver(true);
      soundManager.playGameOver();

      // Record play session for streak
      const { streak: newStreak } = recordPlay();
      setStreak(newStreak);
    }
  }, [entropyLevel, isGameOver]);

  // ============================================
  // COMBO TIMER
  // ============================================

  useEffect(() => {
    if (combo > 0 && !isPaused && !isGameOver) {
      const COMBO_TIMEOUT = 3000;
      const updateInterval = 50;

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
  }, [combo, lastClearTime, isPaused, isGameOver]);

  // ============================================
  // HIGH SCORE PERSISTENCE
  // ============================================

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('entropyReduction_highScore', score.toString());
      } catch {
        // Ignore localStorage errors
      }
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
    try {
      localStorage.setItem('entropyReduction_soundEnabled', newEnabled.toString());
    } catch {
      // Ignore localStorage errors
    }
  }, [soundEnabled]);

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // ============================================
  // RESTART GAME
  // ============================================

  const restartGame = useCallback(() => {
    tileIdCounter = 0;

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
    setIsGameOver(false);
    setGameStartTime(Date.now());
    setGameTime(0);
    setDifficultyLevel(1);
    setMaxCombo(0);
    setTilesCleared(0);
    setGamePhase(GAME_PHASE.IDLE);
    cascadeLevelRef.current = 0;
    setFallingTiles(new Set());
    lastDifficultyLevel.current = 1;
  }, []);

  // ============================================
  // SHARE RESULTS
  // ============================================

  const generateShareText = useCallback(() => {
    const minutes = Math.floor(gameTime / 60000);
    const seconds = Math.floor((gameTime % 60000) / 1000);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const scoreBlocks = Math.min(10, Math.floor(score / 500));
    const scoreBar = '█'.repeat(scoreBlocks) + '░'.repeat(10 - scoreBlocks);

    return `⚡ ENTROPY REDUCTION ⚡
🎯 Score: ${score.toLocaleString()}
⏱️ Time: ${timeStr}
🔥 Max Combo: x${maxCombo}
💀 Difficulty: ${difficultyLevel}/10
📊 [${scoreBar}]
${streak > 1 ? `🔥 ${streak} Day Streak!` : ''}`;
  }, [score, gameTime, maxCombo, difficultyLevel, streak]);

  const shareResults = useCallback(async () => {
    const text = generateShareText();

    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setShowShareCopied(true);
        setTimeout(() => setShowShareCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setShowShareCopied(true);
        setTimeout(() => setShowShareCopied(false), 2000);
      } catch {
        // Silent fail
      }
    }
  }, [generateShareText]);

  // ============================================
  // PAUSE TOGGLE
  // ============================================

  const togglePause = useCallback(() => {
    if (!isGameOver) {
      setIsPaused(prev => !prev);
    }
  }, [isGameOver]);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
        case 'Escape':
          e.preventDefault();
          if (!isGameOver) togglePause();
          break;
        case 'KeyR':
          e.preventDefault();
          restartGame();
          break;
        case 'KeyH':
          e.preventDefault();
          if (onHelp) onHelp();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause, restartGame, onHelp, isGameOver]);

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
  // ENTROPY SPAWNING
  // ============================================

  useEffect(() => {
    if (spawnTimerRef.current) {
      clearTimeout(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }

    if (isPaused || isGameOver || gamePhase !== GAME_PHASE.IDLE) return;
    if (tiles.length >= GRID_SIZE * GRID_SIZE - 2) return;

    const currentGameTime = Date.now() - gameStartTime;
    const spawnDelay = calculateSpawnDelay(currentGameTime);

    spawnTimerRef.current = setTimeout(() => {
      setTiles(prevTiles => {
        if (prevTiles.length >= GRID_SIZE * GRID_SIZE - 2) {
          return prevTiles;
        }

        const spawnCount = calculateEntropySpawn(prevTiles.length, GRID_SIZE);
        if (spawnCount === 0) return prevTiles;

        const newTiles = [];
        const allTiles = [...prevTiles];

        for (let i = 0; i < spawnCount; i++) {
          const position = generateRandomPosition(GRID_SIZE, [...allTiles, ...newTiles]);
          if (position) {
            const newTile = {
              id: tileIdCounter++,
              x: position.x,
              y: position.y,
              type: generateRandomTileType(),
            };
            newTiles.push(newTile);
          }
        }

        if (newTiles.length > 0) {
          soundManager.playSpawn();
        }

        if (newTiles.length === 0) return prevTiles;
        return [...prevTiles, ...newTiles];
      });
    }, spawnDelay);

    return () => {
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
    };
  }, [tiles.length, isPaused, isGameOver, gameStartTime, gamePhase]);

  // ============================================
  // CASCADE PROCESSING
  // ============================================

  const processCascadeStep = useCallback((tilesToClear, currentCascadeLevel) => {
    if (tilesToClear.length === 0) {
      setGamePhase(GAME_PHASE.IDLE);
      cascadeLevelRef.current = 0;
      return;
    }

    // Phase 1: Clear tiles
    setGamePhase(GAME_PHASE.CLEARING);

    // Calculate points for this cascade step
    const basePoints = GAME_CONFIG.BASE_POINTS_PER_CLEAR * tilesToClear.length;
    const matchBonus = tilesToClear.length > 3 ? 1 + (tilesToClear.length - 3) * 0.5 : 1;
    const reward = calculateReward(
      Math.floor(basePoints * matchBonus),
      combo,
      currentCascadeLevel
    );

    setScore(prev => prev + reward.points);
    setTilesCleared(prev => prev + tilesToClear.length);

    // Show cascade message
    if (reward.message) {
      setCriticalMessage(reward.message);
      if (reward.isCritical) {
        setShake(true);
        soundManager.playCritical();
      } else if (currentCascadeLevel > 0) {
        soundManager.playBigClear();
      }
      setTimeout(() => {
        setCriticalMessage(null);
        setShake(false);
      }, 800);
    } else {
      soundManager.playClear(1 + (tilesToClear.length - 3) * 0.2);
    }

    // Remove cleared tiles after animation
    setTimeout(() => {
      setTiles(prevTiles => {
        const remainingTiles = prevTiles.filter(t => !tilesToClear.includes(t.id));

        // Phase 2: Apply gravity
        setGamePhase(GAME_PHASE.FALLING);
        const { newTiles, fallAnimations } = applyGravity(remainingTiles, GRID_SIZE);

        // Track falling tiles
        setFallingTiles(new Set(fallAnimations.map(f => f.tileId)));

        // After fall animation, check for cascades
        setTimeout(() => {
          setFallingTiles(new Set());
          setTiles(newTiles);

          // Phase 3: Check for new matches
          setGamePhase(GAME_PHASE.CASCADE_CHECK);
          const newMatches = findAllMatches(newTiles, GRID_SIZE);

          if (newMatches.length > 0) {
            // Continue cascade
            cascadeLevelRef.current = currentCascadeLevel + 1;
            setTimeout(() => {
              processCascadeStep(newMatches, currentCascadeLevel + 1);
            }, GAME_CONFIG.CASCADE_DELAY_MS);
          } else {
            // Cascade complete
            setGamePhase(GAME_PHASE.IDLE);
            cascadeLevelRef.current = 0;
          }
        }, GAME_CONFIG.FALL_ANIMATION_MS);

        return newTiles;
      });
    }, GAME_CONFIG.CLEAR_ANIMATION_MS);
  }, [combo]);

  // ============================================
  // TILE CLEAR HANDLER
  // ============================================

  const handleTileClear = useCallback((tileId) => {
    if (isGameOver || gamePhase !== GAME_PHASE.IDLE) return;

    initSound();

    const now = Date.now();
    const timeSinceLastClear = now - lastClearTime;

    const matchingTileIds = findMatchingGroup(tiles, tileId, GRID_SIZE);

    if (matchingTileIds.length === 0) return;

    // Get clicked tile for particle burst
    const clearedTile = tiles.find(t => t.id === tileId);
    const tileElement = gameBoardRef.current?.querySelector(`[data-tile-id="${tileId}"]`);

    // Check for near-miss after this clear
    const remainingTilesAfterClear = tiles.filter(t => !matchingTileIds.includes(t.id));
    const { newTiles: tilesAfterGravity } = applyGravity(remainingTilesAfterClear, GRID_SIZE);
    const remainingClearableAfterClear = findClearableTiles(tilesAfterGravity, GRID_SIZE);

    const isLastClearable = remainingClearableAfterClear.length === 0;
    const hasSignificantEntropy = tilesAfterGravity.length >= (GRID_SIZE * GRID_SIZE) * 0.15;
    const entropyPercentage = Math.round((tilesAfterGravity.length / (GRID_SIZE * GRID_SIZE)) * 100);

    if (isLastClearable && hasSignificantEntropy) {
      setIsNearMiss(true);
      setNearMissPercent(entropyPercentage);
      soundManager.playNearMiss();
      setTimeout(() => {
        setIsNearMiss(false);
      }, 800);
    }

    // Update combo
    const newCombo = updateCombo(combo, true, timeSinceLastClear);
    setCombo(newCombo);

    if (newCombo > maxCombo) {
      setMaxCombo(newCombo);
    }

    if (newCombo > 1) {
      soundManager.playCombo(newCombo);
    }

    setLastClearTime(now);

    // Trigger particle burst for critical or big clears
    if (tileElement && clearedTile && matchingTileIds.length >= 4) {
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
          color: clearedTile.type === 'cyan' ? '#00f0ff' :
                 clearedTile.type === 'magenta' ? '#ff00ff' :
                 clearedTile.type === 'amber' ? '#ffb000' : '#a855f7',
        },
      ]);

      setTimeout(() => {
        setParticleBursts(prev => prev.filter(b => b.id !== burstId));
      }, 1200);
    }

    // Start cascade processing
    processCascadeStep(matchingTileIds, 0);
  }, [combo, lastClearTime, tiles, initSound, isGameOver, maxCombo, gamePhase, processCascadeStep]);

  // ============================================
  // TOUCH HANDLERS FOR SWIPE
  // ============================================

  const touchStartRef = useRef(null);

  const handleBoardTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleBoardTouchEnd = useCallback(() => {
    // Touch end cleanup - actual tap handling is done in Tile component
    // Swipe gestures could be added here for future features
    touchStartRef.current = null;
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      ref={gameBoardRef}
      className="w-full h-full flex flex-col p-4 md:p-8 touch-none"
      onTouchStart={handleBoardTouchStart}
      onTouchEnd={handleBoardTouchEnd}
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
        <div className="flex flex-wrap justify-between items-start mb-4 md:mb-8 gap-2 md:gap-4">
          {/* Score + High Score */}
          <motion.div
            className="chamfer-sm bg-void-surface border-2 border-neon-cyan p-2 md:p-4 min-w-[140px] md:min-w-[200px] relative"
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
              <div className="text-header text-neon-cyan text-xs md:text-sm">SCORE</div>
              <div className="text-header text-text-muted text-[10px] md:text-xs">
                BEST: {highScore.toLocaleString()}
              </div>
            </div>
            <motion.div
              className="text-score text-2xl md:text-4xl text-white"
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
            className="chamfer-sm bg-void-surface border-2 p-2 md:p-4 min-w-[100px] md:min-w-[150px]"
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
            <div className="text-header text-neon-amber text-xs md:text-sm mb-1">COMBO</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={combo}
                className="text-score text-xl md:text-3xl text-white"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={SPRING_CONFIG}
              >
                {combo > 0 ? `x${combo}` : '--'}
              </motion.div>
            </AnimatePresence>
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
            className="chamfer-sm bg-void-surface border-2 p-2 md:p-4 min-w-[120px] md:min-w-[180px]"
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
            <div className="text-header text-chaos text-xs md:text-sm mb-1">ENTROPY</div>
            <div className="flex items-center gap-2">
              <motion.div
                className="text-score text-xl md:text-3xl text-white"
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

          {/* Difficulty & Controls */}
          <div className="flex flex-col items-end gap-2">
            {/* Difficulty Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-muted font-rajdhani tracking-wider">LVL</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 md:w-2 h-2 md:h-3 rounded-sm"
                    style={{
                      backgroundColor: i < difficultyLevel ? '#a855f7' : '#1a1a28',
                      boxShadow: i < difficultyLevel ? '0 0 4px #a855f7' : 'none',
                    }}
                    animate={{
                      scale: i === difficultyLevel - 1 ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
              {streak > 0 && (
                <span className="text-order ml-2" title={`${streak} day streak`}>
                  {streak}d
                </span>
              )}
            </div>
            {/* Control Buttons */}
            <div className="flex flex-wrap gap-1 md:gap-2">
              <motion.button
                className={`chamfer-sm px-2 md:px-3 py-1 md:py-2 border-2 font-rajdhani font-bold tracking-wider text-[10px] md:text-xs
                  ${isPaused
                    ? 'bg-neon-amber border-neon-amber text-void-black'
                    : 'bg-void-surface border-void-border text-text-muted hover:border-neon-cyan hover:text-neon-cyan'
                  }`}
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
                className="chamfer-sm bg-void-surface border-2 border-void-border px-2 md:px-3 py-1 md:py-2 text-text-muted font-rajdhani font-bold tracking-wider text-[10px] md:text-xs hover:border-chaos hover:text-chaos"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={restartGame}
              >
                RESTART
              </motion.button>
              <motion.button
                className={`chamfer-sm px-2 md:px-3 py-1 md:py-2 border-2 font-rajdhani font-bold tracking-wider text-[10px] md:text-xs
                  ${soundEnabled
                    ? 'bg-void-surface border-order text-order'
                    : 'bg-void-surface border-void-border text-text-muted'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  initSound();
                  toggleSound();
                }}
              >
                {soundEnabled ? '♪' : '♪̸'}
              </motion.button>
              <motion.button
                className="chamfer-sm bg-void-surface border-2 border-void-border px-2 md:px-3 py-1 md:py-2 text-text-muted font-rajdhani font-bold tracking-wider text-[10px] md:text-xs hover:border-neon-violet hover:text-neon-violet"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onHelp}
              >
                ?
              </motion.button>
              <motion.button
                className="chamfer-sm bg-void-surface border-2 border-void-border px-2 md:px-3 py-1 md:py-2 text-text-muted font-rajdhani font-bold tracking-wider text-[10px] md:text-xs hover:border-neon-magenta hover:text-neon-magenta"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onHome}
              >
                ✕
              </motion.button>
            </div>
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
                className="text-impact text-4xl md:text-6xl text-neon-violet px-4 text-center"
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
              animate={{ x: '-50%', y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.5 }}
              transition={SPRING_CONFIG}
            >
              <div
                className="text-header text-lg md:text-2xl text-neon-magenta px-4 md:px-8 py-2 md:py-4 chamfer-sm border-2 border-neon-magenta bg-void-deep whitespace-nowrap"
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
          {isPaused && !isGameOver && (
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
                  className="text-impact text-4xl md:text-6xl text-neon-cyan mb-4"
                  style={{ textShadow: '0 0 40px #00f0ff' }}
                >
                  PAUSED
                </div>
                <div className="text-header text-text-muted text-sm md:text-lg mb-8">
                  ENTROPY GENERATION HALTED
                </div>
                <motion.button
                  className="chamfer-sm bg-neon-cyan text-void-black px-6 md:px-8 py-3 md:py-4 font-rajdhani font-bold text-lg md:text-xl tracking-wider"
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

        {/* Game Over Overlay */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div
              className="fixed inset-0 bg-void-black/95 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="text-center max-w-md w-full"
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <motion.div
                  className="text-impact text-3xl md:text-5xl text-chaos mb-2"
                  style={{ textShadow: '0 0 40px #ff3366, 0 0 80px #ff3366' }}
                  animate={{
                    textShadow: [
                      '0 0 40px #ff3366, 0 0 80px #ff3366',
                      '0 0 60px #ff3366, 0 0 120px #ff3366',
                      '0 0 40px #ff3366, 0 0 80px #ff3366',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ENTROPY OVERFLOW
                </motion.div>
                <div className="text-text-muted text-sm md:text-lg mb-6">System collapse imminent...</div>

                <motion.div
                  className="chamfer-lg bg-void-surface border-2 border-neon-cyan p-4 md:p-6 mb-6"
                  style={{ boxShadow: '0 0 30px #00f0ff' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="grid grid-cols-2 gap-3 md:gap-4 text-left">
                    <div>
                      <div className="text-[10px] md:text-xs text-text-muted font-rajdhani tracking-wider">FINAL SCORE</div>
                      <div className="text-xl md:text-2xl font-bold text-white">{score.toLocaleString()}</div>
                      {score >= highScore && score > 0 && (
                        <div className="text-[10px] md:text-xs text-neon-amber">NEW HIGH SCORE!</div>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] md:text-xs text-text-muted font-rajdhani tracking-wider">SURVIVAL TIME</div>
                      <div className="text-xl md:text-2xl font-bold text-white">
                        {Math.floor(gameTime / 60000)}:{((gameTime % 60000) / 1000).toFixed(0).padStart(2, '0')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] md:text-xs text-text-muted font-rajdhani tracking-wider">MAX COMBO</div>
                      <div className="text-xl md:text-2xl font-bold text-neon-amber">x{maxCombo}</div>
                    </div>
                    <div>
                      <div className="text-[10px] md:text-xs text-text-muted font-rajdhani tracking-wider">TILES CLEARED</div>
                      <div className="text-xl md:text-2xl font-bold text-neon-cyan">{tilesCleared}</div>
                    </div>
                    <div>
                      <div className="text-[10px] md:text-xs text-text-muted font-rajdhani tracking-wider">DIFFICULTY</div>
                      <div className="text-xl md:text-2xl font-bold text-neon-violet">{difficultyLevel}/10</div>
                    </div>
                    <div>
                      <div className="text-[10px] md:text-xs text-text-muted font-rajdhani tracking-wider">DAILY STREAK</div>
                      <div className="text-xl md:text-2xl font-bold text-order">
                        {streak > 0 ? `${streak} days` : '--'}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="flex flex-col gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button
                    className="chamfer-sm bg-neon-cyan text-void-black px-6 md:px-8 py-3 md:py-4 font-rajdhani font-bold text-lg md:text-xl tracking-wider w-full"
                    style={{ boxShadow: '0 0 30px #00f0ff' }}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 50px #00f0ff' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={restartGame}
                  >
                    PLAY AGAIN
                  </motion.button>

                  <motion.button
                    className="chamfer-sm bg-void-surface border-2 border-neon-violet text-neon-violet px-6 md:px-8 py-2 md:py-3 font-rajdhani font-bold text-base md:text-lg tracking-wider w-full"
                    whileHover={{ scale: 1.02, boxShadow: '0 0 20px #a855f7' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={shareResults}
                  >
                    {showShareCopied ? 'COPIED!' : 'SHARE RESULTS'}
                  </motion.button>

                  <motion.button
                    className="chamfer-sm bg-void-surface border-2 border-void-border text-text-muted px-6 md:px-8 py-2 md:py-3 font-rajdhani font-bold text-base md:text-lg tracking-wider w-full hover:border-neon-magenta hover:text-neon-magenta"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onHome}
                  >
                    HOME
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Board */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="relative bg-void-deep border-2 p-2 md:p-4 rounded-lg"
            style={{
              borderColor: isNearMiss ? '#ff3366' : '#00f0ff',
              boxShadow: isNearMiss
                ? '0 0 60px #ff3366, inset 0 0 30px rgba(255, 51, 102, 0.2)'
                : '0 0 40px #00f0ff, inset 0 0 20px rgba(0, 240, 255, 0.1)',
            }}
            animate={{
              borderColor: isNearMiss
                ? ['#ff3366', '#ffb000', '#ff3366']
                : '#00f0ff',
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Grid background pattern */}
            <div
              className="absolute inset-2 md:inset-4 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #00f0ff 1px, transparent 1px),
                  linear-gradient(to bottom, #00f0ff 1px, transparent 1px)
                `,
                backgroundSize: `${GAME_CONFIG.CELL_SIZE}px ${GAME_CONFIG.CELL_SIZE}px`,
              }}
            />

            <div
              className="grid gap-1 md:gap-2 relative"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                width: `${GRID_SIZE * 56}px`,
                height: `${GRID_SIZE * 56}px`,
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
                    className="relative bg-void-surface/50 rounded"
                    style={{
                      width: '52px',
                      height: '52px',
                    }}
                    data-tile-id={tile?.id}
                  >
                    <AnimatePresence mode="popLayout">
                      {tile && (
                        <Tile
                          key={tile.id}
                          tile={tile}
                          onClear={handleTileClear}
                          isClearable={clearableTileIds.includes(tile.id)}
                          isFalling={fallingTiles.has(tile.id)}
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
          className="mt-4 md:mt-6 text-center text-text-muted text-xs md:text-sm font-exo"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="tracking-moderate mb-2">
            TAP MATCHING TILES TO CLEAR • CHAIN REACTIONS FOR BONUS POINTS
          </p>
          <p className="text-[10px] md:text-xs opacity-60 hidden md:block">
            <span className="text-neon-cyan">[SPACE]</span> Pause
            <span className="mx-2">•</span>
            <span className="text-neon-cyan">[R]</span> Restart
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
