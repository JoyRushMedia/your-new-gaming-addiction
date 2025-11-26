import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tile from './Tile';
import ParticleBurst from './ParticleBurst';
import ScorePopup from './ScorePopup';
import LevelComplete from './LevelComplete';
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
import {
  getLevel,
  getWorldForLevel,
  getGoalDescription,
  calculateGoalProgress,
  isGoalComplete,
  completeLevel,
} from '../lib/levels';
import { soundManager } from '../lib/sounds';

/**
 * GameBoard Component - ENHANCED WITH GRAVITY, CASCADE & SWAP MECHANICS
 * Features: Responsive grid, gravity, chain reactions, swipe/drag to swap
 */

const GRID_SIZE = 6;
let tileIdCounter = 0;

const GAME_PHASE = {
  IDLE: 'idle',
  SWAPPING: 'swapping',
  CLEARING: 'clearing',
  FALLING: 'falling',
  CASCADE_CHECK: 'cascade_check',
};

export default function GameBoard({
  onHome,
  onHelp,
  levelId = null, // null = endless mode, number = level mode
  onNextLevel = null,
  onLevelSelect = null,
}) {
  // ============================================
  // LEVEL MODE DATA
  // ============================================

  const level = levelId ? getLevel(levelId) : null;
  const world = level ? getWorldForLevel(levelId) : null;
  const isLevelMode = !!level;

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
  const [scorePopups, setScorePopups] = useState([]);
  const [screenFlash, setScreenFlash] = useState(null);
  const [newTileIds, setNewTileIds] = useState(new Set()); // Track newly spawned tiles
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
      return saved !== 'false';
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
  const cascadeLevelRef = useRef(0);
  const [selectedTile, setSelectedTile] = useState(null);
  const [swappingTileIds, setSwappingTileIds] = useState(new Set()); // Track tiles being swapped

  // Level Mode State
  const [maxChain, setMaxChain] = useState(0); // Track max cascade chain
  const [levelComplete, setLevelComplete] = useState(false);
  const [levelCompleteData, setLevelCompleteData] = useState(null);
  const [levelTimeRemaining, setLevelTimeRemaining] = useState(null);

  // Responsive grid sizing
  const [cellSize, setCellSize] = useState(70);
  const containerRef = useRef(null);

  const gameBoardRef = useRef(null);
  const comboTimerRef = useRef(null);
  const soundInitialized = useRef(false);
  const lastDifficultyLevel = useRef(1);
  const spawnTimerRef = useRef(null);

  // ============================================
  // RESPONSIVE GRID SIZING
  // ============================================

  useEffect(() => {
    const updateGridSize = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate max cell size that fits
      const maxCellWidth = Math.floor((containerWidth - 40) / GRID_SIZE);
      const maxCellHeight = Math.floor((containerHeight - 40) / GRID_SIZE);
      const newCellSize = Math.min(maxCellWidth, maxCellHeight, 90); // Max 90px

      setCellSize(Math.max(50, newCellSize)); // Min 50px
    };

    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);

  // ============================================
  // MEMOIZED COMPUTATIONS
  // ============================================

  const clearableTileIds = useMemo(() => {
    if (gamePhase !== GAME_PHASE.IDLE) return [];
    return findClearableTiles(tiles, GRID_SIZE);
  }, [tiles, gamePhase]);

  const gridPixelSize = cellSize * GRID_SIZE + (GRID_SIZE - 1) * 4; // cells + gaps

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
        // Ignore
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
      // Ignore
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
    // Use level-specific initial tiles or default to 24 for endless
    const initialCount = level?.initialTiles || 24;

    for (let i = 0; i < initialCount; i++) {
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
    setScorePopups([]);
    setScreenFlash(null);
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
    setSelectedTile(null);
    lastDifficultyLevel.current = 1;
    // Reset level-specific state
    setMaxChain(0);
    setLevelComplete(false);
    setLevelCompleteData(null);
    if (level?.maxTime) {
      setLevelTimeRemaining(level.maxTime);
    } else {
      setLevelTimeRemaining(null);
    }
    // Mark initial tiles as new for animation
    setNewTileIds(new Set(initialTiles.map(t => t.id)));
    setTimeout(() => setNewTileIds(new Set()), 1500);
  }, [level]);

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
    // Use level-specific initial tiles or default to 24 for endless
    const initialCount = level?.initialTiles || 24;

    for (let i = 0; i < initialCount; i++) {
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
    // Mark initial tiles as new for staggered fall-in animation
    setNewTileIds(new Set(initialTiles.map(t => t.id)));
    // Clear new tile flags after animation completes
    setTimeout(() => setNewTileIds(new Set()), 1500);

    // Initialize level time limit if applicable
    if (level?.maxTime) {
      setLevelTimeRemaining(level.maxTime);
    }
  }, [level]);

  // ============================================
  // ENTROPY LEVEL TRACKING
  // ============================================

  useEffect(() => {
    const maxTiles = GRID_SIZE * GRID_SIZE;
    const newEntropyLevel = calculateEntropyLevel(tiles.length, maxTiles);
    setEntropyLevel(newEntropyLevel);
  }, [tiles]);

  // ============================================
  // LEVEL GOAL CHECKING (callback defined first for use in timer)
  // ============================================

  const handleLevelComplete = useCallback(() => {
    if (levelComplete) return;

    const timeElapsedSeconds = Math.floor(gameTime / 1000);
    const result = completeLevel(levelId, score, timeElapsedSeconds, tilesCleared);

    setLevelComplete(true);
    setLevelCompleteData({
      ...result,
      score,
      time: timeElapsedSeconds,
      tilesCleared,
      maxCombo,
    });

    soundManager.playStreakMilestone();
  }, [levelComplete, gameTime, levelId, score, tilesCleared, maxCombo]);

  // ============================================
  // LEVEL TIMER (for time-limited levels)
  // ============================================

  useEffect(() => {
    if (!isLevelMode || !level?.maxTime || isPaused || isGameOver || levelComplete) return;

    const timer = setInterval(() => {
      setLevelTimeRemaining(prev => {
        if (prev === null) return null;
        const newTime = prev - 0.1;
        if (newTime <= 0) {
          // Time's up - check if goal is complete
          const timeElapsedSeconds = Math.floor(gameTime / 1000);
          const gameState = {
            score,
            tilesCleared,
            maxCombo,
            maxChain,
            entropy: entropyLevel,
            timeElapsed: timeElapsedSeconds,
          };

          if (isGoalComplete(level, gameState)) {
            // Level complete!
            handleLevelComplete();
          } else {
            // Failed - ran out of time
            setIsGameOver(true);
            soundManager.playGameOver();
          }
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isLevelMode, level, isPaused, isGameOver, levelComplete, gameTime, score, tilesCleared, maxCombo, maxChain, entropyLevel, handleLevelComplete]);

  // Check goal completion on state changes
  useEffect(() => {
    if (!isLevelMode || isGameOver || levelComplete || isPaused) return;

    const timeElapsedSeconds = Math.floor(gameTime / 1000);
    const gameState = {
      score,
      tilesCleared,
      maxCombo,
      maxChain,
      entropy: entropyLevel,
      timeElapsed: timeElapsedSeconds,
    };

    if (isGoalComplete(level, gameState)) {
      handleLevelComplete();
    }
  }, [isLevelMode, level, score, tilesCleared, maxCombo, maxChain, entropyLevel, gameTime, isGameOver, levelComplete, isPaused, handleLevelComplete]);

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
    // Use level-specific spawn delay or calculate from game time
    const spawnDelay = level?.spawnDelay || calculateSpawnDelay(currentGameTime);

    spawnTimerRef.current = setTimeout(() => {
      setTiles(prevTiles => {
        if (prevTiles.length >= GRID_SIZE * GRID_SIZE - 2) {
          return prevTiles;
        }

        const spawnCount = calculateEntropySpawn(prevTiles.length, GRID_SIZE);
        if (spawnCount === 0) return prevTiles;

        const spawnedTiles = [];
        const allTiles = [...prevTiles];

        for (let i = 0; i < spawnCount; i++) {
          const position = generateRandomPosition(GRID_SIZE, [...allTiles, ...spawnedTiles]);
          if (position) {
            const newTile = {
              id: tileIdCounter++,
              x: position.x,
              y: position.y,
              type: generateRandomTileType(),
            };
            spawnedTiles.push(newTile);
          }
        }

        if (spawnedTiles.length > 0) {
          soundManager.playSpawn();
          // Mark spawned tiles as new for fall animation
          setNewTileIds(prev => {
            const updated = new Set(prev);
            spawnedTiles.forEach(t => updated.add(t.id));
            return updated;
          });
          // Clear new flag after animation
          setTimeout(() => {
            setNewTileIds(prev => {
              const updated = new Set(prev);
              spawnedTiles.forEach(t => updated.delete(t.id));
              return updated;
            });
          }, 800);
        }

        if (spawnedTiles.length === 0) return prevTiles;
        return [...prevTiles, ...spawnedTiles];
      });
    }, spawnDelay);

    return () => {
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
    };
  }, [tiles.length, isPaused, isGameOver, gameStartTime, gamePhase, level?.spawnDelay]);

  // ============================================
  // CASCADE PROCESSING
  // ============================================

  // Helper to create score popup at tile location
  const createScorePopup = useCallback((tileId, points, comboLevel, isChain, tileType) => {
    const gridElement = gameBoardRef.current?.querySelector(`[data-tile-id="${tileId}"]`);
    if (gridElement) {
      const rect = gridElement.getBoundingClientRect();
      const popupId = Date.now() + Math.random();
      const color = tileType === 'cyan' ? '#00f0ff' :
                    tileType === 'magenta' ? '#ff00ff' :
                    tileType === 'amber' ? '#ffb000' : '#a855f7';

      setScorePopups(prev => [...prev, {
        id: popupId,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        points,
        combo: comboLevel,
        isChain,
        color,
      }]);

      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== popupId));
      }, 1300);
    }
  }, []);

  const processCascadeStep = useCallback((tilesToClear, currentCascadeLevel) => {
    if (tilesToClear.length === 0) {
      setGamePhase(GAME_PHASE.IDLE);
      cascadeLevelRef.current = 0;
      return;
    }

    setGamePhase(GAME_PHASE.CLEARING);

    const basePoints = GAME_CONFIG.BASE_POINTS_PER_CLEAR * tilesToClear.length;
    const matchBonus = tilesToClear.length > 3 ? 1 + (tilesToClear.length - 3) * 0.5 : 1;
    const reward = calculateReward(
      Math.floor(basePoints * matchBonus),
      combo,
      currentCascadeLevel
    );

    setScore(prev => prev + reward.points);
    setTilesCleared(prev => prev + tilesToClear.length);

    // Create score popup at first cleared tile
    if (tilesToClear.length > 0) {
      const firstTileId = tilesToClear[0];
      const firstTile = tiles.find(t => t.id === firstTileId);
      if (firstTile) {
        createScorePopup(firstTileId, reward.points, combo, currentCascadeLevel > 0, firstTile.type);
      }
    }

    // Screen flash for big combos or cascades
    if (combo >= 3 || currentCascadeLevel >= 1 || tilesToClear.length >= 5) {
      const flashColor = combo >= 5 ? '#ffb000' :
                         currentCascadeLevel >= 2 ? '#a855f7' :
                         tilesToClear.length >= 5 ? '#00f0ff' : '#ffffff';
      setScreenFlash(flashColor);
      setTimeout(() => setScreenFlash(null), 150);
    }

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

    setTimeout(() => {
      setTiles(prevTiles => {
        const remainingTiles = prevTiles.filter(t => !tilesToClear.includes(t.id));
        setGamePhase(GAME_PHASE.FALLING);
        const { newTiles } = applyGravity(remainingTiles, GRID_SIZE);

        setTimeout(() => {
          setTiles(newTiles);
          setGamePhase(GAME_PHASE.CASCADE_CHECK);
          const newMatches = findAllMatches(newTiles, GRID_SIZE);

          if (newMatches.length > 0) {
            cascadeLevelRef.current = currentCascadeLevel + 1;
            // Track max chain for level goals
            setMaxChain(prev => Math.max(prev, currentCascadeLevel + 1));
            setTimeout(() => {
              processCascadeStep(newMatches, currentCascadeLevel + 1);
            }, GAME_CONFIG.CASCADE_DELAY_MS);
          } else {
            setGamePhase(GAME_PHASE.IDLE);
            cascadeLevelRef.current = 0;
          }
        }, GAME_CONFIG.FALL_ANIMATION_MS);

        return newTiles;
      });
    }, GAME_CONFIG.CLEAR_ANIMATION_MS);
  }, [combo, tiles, createScorePopup]);

  // ============================================
  // SWAP HANDLER
  // ============================================

  const handleSwap = useCallback((tile, direction) => {
    if (isGameOver || gamePhase !== GAME_PHASE.IDLE) return;

    initSound();

    // Find target position
    let targetX = tile.x;
    let targetY = tile.y;

    switch (direction) {
      case 'up': targetY--; break;
      case 'down': targetY++; break;
      case 'left': targetX--; break;
      case 'right': targetX++; break;
      default: return;
    }

    // Check bounds
    if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE) {
      return;
    }

    // Find target tile
    const targetTile = tiles.find(t => t.x === targetX && t.y === targetY);
    if (!targetTile) return;

    // Mark tiles as swapping for visual feedback
    setSwappingTileIds(new Set([tile.id, targetTile.id]));
    setGamePhase(GAME_PHASE.SWAPPING);

    const swappedTiles = tiles.map(t => {
      if (t.id === tile.id) {
        return { ...t, x: targetX, y: targetY };
      }
      if (t.id === targetTile.id) {
        return { ...t, x: tile.x, y: tile.y };
      }
      return t;
    });

    // Check if swap creates a match
    const matches = findClearableTiles(swappedTiles, GRID_SIZE);

    if (matches.length > 0) {
      // Valid swap - keep it and start clearing
      setTiles(swappedTiles);
      soundManager.playClear(1);

      const now = Date.now();
      const timeSinceLastClear = now - lastClearTime;
      const newCombo = updateCombo(combo, true, timeSinceLastClear);
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      if (newCombo > 1) soundManager.playCombo(newCombo);
      setLastClearTime(now);

      // Quick timing for responsive feel
      setTimeout(() => {
        setSwappingTileIds(new Set());
        processCascadeStep(matches, 0);
      }, 80);
    } else {
      // Invalid swap - animate back quickly
      setTiles(swappedTiles);
      soundManager.playNearMiss();

      setTimeout(() => {
        setTiles(tiles); // Revert
        setSwappingTileIds(new Set());
        setGamePhase(GAME_PHASE.IDLE);
      }, 120);
    }
  }, [tiles, isGameOver, gamePhase, initSound, lastClearTime, combo, maxCombo, processCascadeStep]);

  // ============================================
  // TILE CLEAR HANDLER (for click/tap on clearable)
  // ============================================

  const handleTileClear = useCallback((tileId) => {
    if (isGameOver || gamePhase !== GAME_PHASE.IDLE) return;

    initSound();

    const matchingTileIds = findMatchingGroup(tiles, tileId, GRID_SIZE);
    if (matchingTileIds.length === 0) return;

    const now = Date.now();
    const timeSinceLastClear = now - lastClearTime;

    // Check for near-miss
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
      setTimeout(() => setIsNearMiss(false), 800);
    }

    const newCombo = updateCombo(combo, true, timeSinceLastClear);
    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);
    if (newCombo > 1) soundManager.playCombo(newCombo);
    setLastClearTime(now);

    // Particle burst
    const clearedTile = tiles.find(t => t.id === tileId);
    if (clearedTile && matchingTileIds.length >= 4) {
      const burstId = Date.now();
      const gridElement = gameBoardRef.current?.querySelector(`[data-tile-id="${tileId}"]`);
      if (gridElement) {
        const rect = gridElement.getBoundingClientRect();
        setParticleBursts(prev => [...prev, {
          id: burstId,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          color: clearedTile.type === 'cyan' ? '#00f0ff' :
                 clearedTile.type === 'magenta' ? '#ff00ff' :
                 clearedTile.type === 'amber' ? '#ffb000' : '#a855f7',
        }]);
        setTimeout(() => {
          setParticleBursts(prev => prev.filter(b => b.id !== burstId));
        }, 1200);
      }
    }

    processCascadeStep(matchingTileIds, 0);
  }, [combo, lastClearTime, tiles, initSound, isGameOver, maxCombo, gamePhase, processCascadeStep]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      ref={gameBoardRef}
      className="w-full h-full flex flex-col p-2 md:p-4"
    >
      <motion.div
        className="w-full h-full flex flex-col"
        animate={{
          x: shake ? [0, -4, 4, -4, 4, 0] : 0,
          y: shake ? [0, 4, -4, 4, -4, 0] : 0,
        }}
        transition={{ duration: 0.4 }}
      >
        {/* Level Mode Header */}
        {isLevelMode && level && (
          <div className="mb-2 bg-void-surface/60 border rounded-lg p-2"
            style={{ borderColor: world?.color || '#00f0ff', boxShadow: `0 0 15px ${world?.color || '#00f0ff'}30` }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-impact" style={{ color: world?.color }}>
                  LEVEL {levelId}
                </span>
                <span className="text-sm font-rajdhani text-text-muted">
                  {level.name}
                </span>
              </div>
              <div className="text-sm font-rajdhani text-white">
                {getGoalDescription(level)}
              </div>
              {levelTimeRemaining !== null && (
                <div className={`text-lg font-bold font-rajdhani ${levelTimeRemaining <= 10 ? 'text-chaos' : 'text-white'}`}
                  style={{ textShadow: levelTimeRemaining <= 10 ? '0 0 10px #ff3366' : undefined }}>
                  {Math.ceil(levelTimeRemaining)}s
                </div>
              )}
            </div>
            {/* Goal Progress Bar */}
            <div className="mt-2 h-2 bg-void-deep rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${world?.color || '#00f0ff'}, ${world?.color || '#00f0ff'}cc)` }}
                animate={{
                  width: `${calculateGoalProgress(level, {
                    score,
                    tilesCleared,
                    maxCombo,
                    maxChain,
                    entropy: entropyLevel,
                    timeElapsed: Math.floor(gameTime / 1000),
                  })}%`
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Compact Header Stats */}
        <div className="flex flex-wrap justify-between items-center mb-2 md:mb-4 gap-2">
          {/* Score */}
          <div className="flex items-center gap-4">
            <motion.div
              className="bg-void-surface/80 border border-neon-cyan rounded-lg px-3 py-1.5"
              style={{ boxShadow: '0 0 15px #00f0ff40' }}
            >
              <div className="text-[10px] text-neon-cyan font-rajdhani tracking-wider">SCORE</div>
              <motion.div
                className="text-lg md:text-xl font-bold text-white"
                key={score}
                initial={{ scale: 1.2, color: '#00f0ff' }}
                animate={{ scale: 1, color: '#ffffff' }}
              >
                {score.toLocaleString()}
              </motion.div>
            </motion.div>

            {/* Combo */}
            <motion.div
              className="bg-void-surface/80 border rounded-lg px-3 py-1.5"
              style={{
                borderColor: combo > 0 ? '#ffb000' : '#1a1a28',
                boxShadow: combo > 0 ? '0 0 15px #ffb00040' : 'none',
              }}
            >
              <div className="text-[10px] text-neon-amber font-rajdhani tracking-wider">COMBO</div>
              <div className="text-lg md:text-xl font-bold text-white">
                {combo > 0 ? `x${combo}` : '--'}
              </div>
              {combo > 0 && (
                <div className="h-0.5 bg-void-deep rounded-full overflow-hidden mt-1">
                  <motion.div
                    className="h-full bg-neon-amber"
                    animate={{ width: `${comboTimeLeft}%` }}
                  />
                </div>
              )}
            </motion.div>

            {/* Entropy */}
            <motion.div
              className="bg-void-surface/80 border rounded-lg px-3 py-1.5"
              style={{
                borderColor: entropyLevel > 70 ? '#ff3366' : '#1a1a28',
                boxShadow: entropyLevel > 70 ? '0 0 15px #ff336640' : 'none',
              }}
              animate={{ scale: entropyLevel > 80 ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 0.5, repeat: entropyLevel > 80 ? Infinity : 0 }}
            >
              <div className="text-[10px] text-chaos font-rajdhani tracking-wider">ENTROPY</div>
              <div className="flex items-center gap-2">
                <span className="text-lg md:text-xl font-bold text-white">{entropyLevel}%</span>
                <div className="w-16 h-1.5 bg-void-deep rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-order to-chaos"
                    animate={{ width: `${entropyLevel}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5 mr-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-3 rounded-sm"
                  style={{
                    backgroundColor: i < difficultyLevel ? '#a855f7' : '#1a1a28',
                    boxShadow: i < difficultyLevel ? '0 0 4px #a855f7' : 'none',
                  }}
                />
              ))}
            </div>
            <motion.button
              className="bg-void-surface border border-void-border rounded px-2 py-1 text-text-muted text-xs font-rajdhani hover:border-neon-cyan hover:text-neon-cyan"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePause}
            >
              {isPaused ? '▶' : '⏸'}
            </motion.button>
            <motion.button
              className="bg-void-surface border border-void-border rounded px-2 py-1 text-text-muted text-xs font-rajdhani hover:border-chaos hover:text-chaos"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restartGame}
            >
              ↻
            </motion.button>
            <motion.button
              className={`bg-void-surface border rounded px-2 py-1 text-xs font-rajdhani ${soundEnabled ? 'border-order text-order' : 'border-void-border text-text-muted'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { initSound(); toggleSound(); }}
            >
              {soundEnabled ? '♪' : '♪̸'}
            </motion.button>
            <motion.button
              className="bg-void-surface border border-void-border rounded px-2 py-1 text-text-muted text-xs font-rajdhani hover:border-neon-violet hover:text-neon-violet"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onHelp}
            >
              ?
            </motion.button>
            <motion.button
              className="bg-void-surface border border-void-border rounded px-2 py-1 text-text-muted text-xs font-rajdhani hover:border-neon-magenta hover:text-neon-magenta"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onHome}
            >
              ✕
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
            >
              <motion.div
                className="text-impact text-3xl md:text-5xl text-neon-violet text-center px-4"
                style={{ textShadow: '0 0 40px #a855f7' }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3, repeat: 1 }}
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
              className="fixed top-1/4 left-1/2 -translate-x-1/2 pointer-events-none z-40"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
            >
              <div
                className="text-lg md:text-xl font-rajdhani font-bold text-neon-magenta px-4 py-2 bg-void-deep border-2 border-neon-magenta rounded-lg"
                style={{ boxShadow: '0 0 30px #ff00ff' }}
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
            >
              <motion.div className="text-center" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                <div className="text-impact text-4xl md:text-6xl text-neon-cyan mb-4" style={{ textShadow: '0 0 40px #00f0ff' }}>
                  PAUSED
                </div>
                <motion.button
                  className="bg-neon-cyan text-void-black px-6 py-3 rounded-lg font-rajdhani font-bold text-lg"
                  style={{ boxShadow: '0 0 30px #00f0ff' }}
                  whileHover={{ scale: 1.05 }}
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
            >
              <motion.div
                className="text-center max-w-sm w-full"
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
              >
                <div className="text-impact text-3xl md:text-4xl text-chaos mb-2" style={{ textShadow: '0 0 40px #ff3366' }}>
                  ENTROPY OVERFLOW
                </div>
                <div className="text-text-muted text-sm mb-4">System collapse...</div>

                <div className="bg-void-surface border-2 border-neon-cyan rounded-lg p-4 mb-4" style={{ boxShadow: '0 0 20px #00f0ff' }}>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div><div className="text-[10px] text-text-muted">SCORE</div><div className="text-xl font-bold">{score.toLocaleString()}</div></div>
                    <div><div className="text-[10px] text-text-muted">TIME</div><div className="text-xl font-bold">{Math.floor(gameTime / 60000)}:{((gameTime % 60000) / 1000).toFixed(0).padStart(2, '0')}</div></div>
                    <div><div className="text-[10px] text-text-muted">MAX COMBO</div><div className="text-xl font-bold text-neon-amber">x{maxCombo}</div></div>
                    <div><div className="text-[10px] text-text-muted">CLEARED</div><div className="text-xl font-bold text-neon-cyan">{tilesCleared}</div></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <motion.button
                    className="bg-neon-cyan text-void-black px-6 py-3 rounded-lg font-rajdhani font-bold text-lg w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={restartGame}
                  >
                    PLAY AGAIN
                  </motion.button>
                  <motion.button
                    className="bg-void-surface border-2 border-neon-violet text-neon-violet px-4 py-2 rounded-lg font-rajdhani font-bold w-full"
                    whileHover={{ scale: 1.02 }}
                    onClick={shareResults}
                  >
                    {showShareCopied ? 'COPIED!' : 'SHARE'}
                  </motion.button>
                  <motion.button
                    className="bg-void-surface border border-void-border text-text-muted px-4 py-2 rounded-lg font-rajdhani w-full hover:border-neon-magenta hover:text-neon-magenta"
                    whileHover={{ scale: 1.02 }}
                    onClick={onHome}
                  >
                    HOME
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Complete Modal */}
        {levelComplete && levelCompleteData && (
          <LevelComplete
            levelId={levelId}
            score={levelCompleteData.score}
            time={levelCompleteData.time}
            tilesCleared={levelCompleteData.tilesCleared}
            maxCombo={levelCompleteData.maxCombo}
            earnedStars={levelCompleteData.earnedStars}
            isNewRecord={levelCompleteData.isNewRecord}
            unlockedLevel={levelCompleteData.unlockedLevel}
            onNextLevel={(nextId) => onNextLevel && onNextLevel(nextId)}
            onRetry={restartGame}
            onLevelSelect={() => onLevelSelect && onLevelSelect()}
          />
        )}

        {/* Game Board - RESPONSIVE */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center min-h-0">
          <motion.div
            ref={gameBoardRef}
            className="relative bg-void-deep/90 border-2 border-neon-cyan rounded-xl p-2"
            style={{
              boxShadow: isNearMiss
                ? '0 0 50px #ff3366, inset 0 0 20px rgba(255, 51, 102, 0.2)'
                : '0 0 30px #00f0ff40, inset 0 0 15px rgba(0, 240, 255, 0.1)',
              width: gridPixelSize + 16,
              height: gridPixelSize + 16,
            }}
          >
            {/* Grid Background - Static cells for visual reference */}
            <div
              className="grid absolute inset-2"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
                gap: '4px',
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => (
                <div
                  key={`bg-cell-${index}`}
                  className="bg-void-surface/30 rounded-lg"
                  style={{ width: cellSize, height: cellSize }}
                />
              ))}
            </div>

            {/* Tiles - Absolutely positioned for smooth animation */}
            <div
              className="relative"
              style={{
                width: gridPixelSize,
                height: gridPixelSize,
              }}
            >
              <AnimatePresence mode="popLayout">
                {tiles.map(tile => (
                  <Tile
                    key={tile.id}
                    tile={tile}
                    onClear={handleTileClear}
                    onSwap={handleSwap}
                    isClearable={clearableTileIds.includes(tile.id)}
                    isSelected={selectedTile === tile.id}
                    cellSize={cellSize}
                    gridGap={4}
                    isNew={newTileIds.has(tile.id)}
                    isSwapping={swappingTileIds.has(tile.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="text-center text-text-muted text-xs py-2 font-exo">
          DRAG or TAP to match • Chains = Bonus
        </div>
      </motion.div>

      {/* Particle Bursts */}
      <AnimatePresence>
        {particleBursts.map(burst => (
          <ParticleBurst
            key={burst.id}
            x={burst.x}
            y={burst.y}
            color={burst.color}
            onComplete={() => setParticleBursts(prev => prev.filter(b => b.id !== burst.id))}
          />
        ))}
      </AnimatePresence>

      {/* Score Popups */}
      <AnimatePresence>
        {scorePopups.map(popup => (
          <ScorePopup
            key={popup.id}
            x={popup.x}
            y={popup.y}
            points={popup.points}
            combo={popup.combo}
            isChain={popup.isChain}
            color={popup.color}
          />
        ))}
      </AnimatePresence>

      {/* Screen Flash Effect */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-[90]"
            style={{ backgroundColor: screenFlash }}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
