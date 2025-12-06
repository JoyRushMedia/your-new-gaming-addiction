import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tile from './Tile';
import ParticleBurst from './ParticleBurst';
import ScorePopup from './ScorePopup';
import LevelComplete from './LevelComplete';
import {
  calculateReward,
  generateSmartTileType,
  calculateEntropyLevel,
  updateCombo,
  findClearableTiles,
  findMatchingGroup,
  findValidMoves,
  getDifficultyLevel,
  getStreakData,
  applyGravity,
  findAllMatches,
  shuffleTiles,
  GAME_CONFIG,
  isSpecialTile,
  getSpecialTileClearTargets,
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
 * GameBoard Component - SWAP & MATCH-3 STYLE
 * Features: Swipe to swap, 3-in-a-row matching, smart spawning, cascades
 */

const GRID_SIZE = GAME_CONFIG.GRID_SIZE;
const BASE_CELL_SIZE = GAME_CONFIG.CELL_SIZE;
const MIN_CELL_SIZE = 50;
const MAX_CELL_SIZE = 90;
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
  const [streak] = useState(() => {
    const data = getStreakData();
    return data.streak;
  });
  const [showShareCopied, setShowShareCopied] = useState(false);

  // Timed Challenge Mode
  const [gameMode, setGameMode] = useState('endless'); // 'endless' | 'timed'
  const [timedModeSeconds, setTimedModeSeconds] = useState(GAME_CONFIG.TIMED_MODE_DURATION);
  const [showModeSelect, setShowModeSelect] = useState(true);
  const [timedHighScore, setTimedHighScore] = useState(() => {
    try {
      const saved = localStorage.getItem('entropyReduction_timedHighScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Enhanced feedback state
  const [comboFlash, setComboFlash] = useState(false);
  const [bigPlayMessage, setBigPlayMessage] = useState(null);

  // Cascade & Animation State
  const [gamePhase, setGamePhase] = useState(GAME_PHASE.IDLE);
  const cascadeLevelRef = useRef(0);
  const [swappingTileIds, setSwappingTileIds] = useState(new Set());

  // Level Mode State
  const [maxChain, setMaxChain] = useState(0); // Track max cascade chain
  const [levelComplete, setLevelComplete] = useState(false);
  const [levelCompleteData, setLevelCompleteData] = useState(null);
  const [levelTimeRemaining, setLevelTimeRemaining] = useState(null);

  // Responsive grid sizing
  const [cellSize, setCellSize] = useState(() =>
    Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, BASE_CELL_SIZE))
  );
  const containerRef = useRef(null);

  const gameBoardRef = useRef(null);
  const comboTimerRef = useRef(null);
  const soundInitialized = useRef(false);
  const lastDifficultyLevel = useRef(1);

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
      const responsiveTarget = Math.min(maxCellWidth, maxCellHeight);
      const newCellSize = Math.min(
        MAX_CELL_SIZE,
        Math.max(MIN_CELL_SIZE, Math.min(responsiveTarget, BASE_CELL_SIZE))
      );

      setCellSize(newCellSize);
    };

    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);

  // ============================================
  // MEMOIZED COMPUTATIONS
  // ============================================

  // Find existing matches (for auto-clear after cascades)
  const clearableTileIds = useMemo(() => {
    if (gamePhase !== GAME_PHASE.IDLE) return [];
    return findClearableTiles(tiles, GRID_SIZE);
  }, [tiles, gamePhase]);

  // Find valid swap moves
  const validMoves = useMemo(() => {
    if (gamePhase !== GAME_PHASE.IDLE) return [];
    return findValidMoves(tiles, GRID_SIZE);
  }, [tiles, gamePhase]);

  // Track "no moves" state and hint tiles
  const [showNoMoves, setShowNoMoves] = useState(false);
  const [hintTileIds, setHintTileIds] = useState(new Set());

  // Check for no valid moves (no swaps that create matches)
  const hasNoMoves = useMemo(() => {
    return (
      validMoves.length === 0 &&
      clearableTileIds.length === 0 &&
      tiles.length >= GRID_SIZE * GRID_SIZE
    );
  }, [validMoves.length, clearableTileIds.length, tiles.length]);

  // Show hint - highlight a random valid move
  const showHint = useCallback(() => {
    if (validMoves.length > 0) {
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      setHintTileIds(new Set([randomMove.tile1.id, randomMove.tile2.id]));
      setTimeout(() => setHintTileIds(new Set()), 2000);
    }
  }, [validMoves]);

  // Shuffle the board when no moves available
  const handleShuffle = useCallback(() => {
    if (gamePhase !== GAME_PHASE.IDLE) return;
    const shuffled = shuffleTiles(tiles, GRID_SIZE);
    setTiles(shuffled);
    setShowNoMoves(false);
    soundManager.playSpawn();
  }, [tiles, gamePhase]);

  // Show "No Moves" notification when stuck
  useEffect(() => {
    if (hasNoMoves && !isPaused && !isGameOver && gamePhase === GAME_PHASE.IDLE) {
      setShowNoMoves(true);
    } else {
      setShowNoMoves(false);
    }
  }, [hasNoMoves, isPaused, isGameOver, gamePhase]);

  const gridPixelSize = cellSize * GRID_SIZE + (GRID_SIZE - 1) * 4; // cells + gaps

  // ============================================
  // GAME TIMER & DIFFICULTY PROGRESSION
  // ============================================

  useEffect(() => {
    if (isPaused || isGameOver || showModeSelect) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - gameStartTime;
      setGameTime(elapsed);

      // Timed mode countdown
      if (gameMode === 'timed') {
        const remaining = GAME_CONFIG.TIMED_MODE_DURATION - Math.floor(elapsed / 1000);
        setTimedModeSeconds(Math.max(0, remaining));

        // Time's up!
        if (remaining <= 0) {
          setIsGameOver(true);
          soundManager.playGameOver();

          // Check for new high score in timed mode
          if (score > timedHighScore) {
            setTimedHighScore(score);
            try {
              localStorage.setItem('entropyReduction_timedHighScore', score.toString());
            } catch {
              // Ignore
            }
          }
        }

        // Warning sounds at 10, 5, 3, 2, 1 seconds
        if ([10, 5, 3, 2, 1].includes(remaining)) {
          soundManager.playNearMiss();
        }
      }

      const newDifficulty = getDifficultyLevel(elapsed);
      if (newDifficulty > lastDifficultyLevel.current) {
        lastDifficultyLevel.current = newDifficulty;
        setDifficultyLevel(newDifficulty);
        soundManager.playDifficultyUp();
      }
    }, 250);

    return () => clearInterval(timer);
  }, [gameStartTime, isPaused, isGameOver, gameMode, score, timedHighScore, showModeSelect]);

  // ============================================
  // GAME OVER CHECK - Only for level mode time-out or explicit conditions
  // Note: With a full-board match-3, entropy no longer triggers game over
  // The "no moves" scenario is handled by the shuffle button
  // ============================================

  // Entropy-based game over is disabled for Candy Crush style gameplay
  // useEffect(() => {
  //   if (entropyLevel >= 100 && !isGameOver) {
  //     setIsGameOver(true);
  //     soundManager.playGameOver();
  //     const { streak: newStreak } = recordPlay();
  //     setStreak(newStreak);
  //   }
  // }, [entropyLevel, isGameOver]);

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

  // Start game with specific mode
  const startGameWithMode = useCallback((mode) => {
    setGameMode(mode);
    setShowModeSelect(false);
    setTimedModeSeconds(GAME_CONFIG.TIMED_MODE_DURATION);
    setGameStartTime(Date.now());
    initSound();
  }, [initSound]);

  const restartGame = useCallback(() => {
    tileIdCounter = 0;

    const initialTiles = [];

    // Create a FULL board based on configured grid size
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Generate type that avoids creating initial matches
        let type;
        let attempts = 0;

          do {
            type = generateSmartTileType(x, y, initialTiles, GRID_SIZE);
            const testTile = { id: tileIdCounter, x, y, type };
            const testTiles = [...initialTiles, testTile];
            const matches = findMatchingGroup(testTiles, tileIdCounter, GRID_SIZE)?.ids ?? [];

            if (matches.length === 0 || attempts > 10) break;
            attempts++;
          } while (attempts <= 10);

        initialTiles.push({
          id: tileIdCounter++,
          x,
          y,
          type,
        });
      }
    }

    // Ensure valid moves exist, shuffle if not
    if (findValidMoves(initialTiles, GRID_SIZE).length === 0) {
      const shuffled = shuffleTiles(initialTiles, GRID_SIZE);
      shuffled.forEach((t, i) => initialTiles[i].type = t.type);
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
    lastDifficultyLevel.current = 1;
    // Reset timed mode
    setTimedModeSeconds(GAME_CONFIG.TIMED_MODE_DURATION);
    setComboFlash(false);
    setBigPlayMessage(null);
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

  // Go back to mode selection
  const goToModeSelect = useCallback(() => {
    setShowModeSelect(true);
    setIsGameOver(false);
    restartGame();
  }, [restartGame]);

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
  // INITIALIZATION - Full grid based on configuration (Candy Crush style)
  // ============================================

  useEffect(() => {
    const initialTiles = [];

    // Create a FULL board based on configured grid size
    // No more random partial boards - this is proper match-3
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Generate type that avoids creating initial matches
        let type;
        let attempts = 0;

          do {
            type = generateSmartTileType(x, y, initialTiles, GRID_SIZE);
            const testTile = { id: tileIdCounter, x, y, type };
            const testTiles = [...initialTiles, testTile];
            const matches = findMatchingGroup(testTiles, tileIdCounter, GRID_SIZE)?.ids ?? [];

            // If no match or too many attempts, accept this type
            if (matches.length === 0 || attempts > 10) break;
            attempts++;
          } while (attempts <= 10);

        initialTiles.push({
          id: tileIdCounter++,
          x,
          y,
          type,
        });
      }
    }

    // Ensure valid moves exist after filling board
    if (findValidMoves(initialTiles, GRID_SIZE).length === 0) {
      const shuffled = shuffleTiles(initialTiles, GRID_SIZE);
      shuffled.forEach((t, i) => initialTiles[i].type = t.type);
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
  // TILE ID COUNTER (for spawning new tiles from top)
  // ============================================

  const getNextTileId = useCallback(() => {
    return tileIdCounter++;
  }, []);

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

  const MAX_CASCADE_LEVEL = 10; // Safety limit to prevent infinite cascades

  const processCascadeStep = useCallback((tilesToClearInput, currentCascadeLevel) => {
    if (tilesToClearInput.length === 0 || currentCascadeLevel >= MAX_CASCADE_LEVEL) {
      setGamePhase(GAME_PHASE.IDLE);
      cascadeLevelRef.current = 0;
      return;
    }

    setGamePhase(GAME_PHASE.CLEARING);

    const basePoints = GAME_CONFIG.BASE_POINTS_PER_CLEAR * tilesToClearInput.length;
    const matchBonus = tilesToClearInput.length > 3 ? 1 + (tilesToClearInput.length - 3) * 0.5 : 1;
    const reward = calculateReward(
      Math.floor(basePoints * matchBonus),
      combo,
      currentCascadeLevel
    );

    setScore(prev => prev + reward.points);
    setTilesCleared(prev => prev + tilesToClearInput.length);

    // Create score popup at first cleared tile
    if (tilesToClearInput.length > 0) {
      const firstTileId = tilesToClearInput[0];
      const firstTile = tiles.find(t => t.id === firstTileId);
      if (firstTile) {
        createScorePopup(firstTileId, reward.points, combo, currentCascadeLevel > 0, firstTile.type);
      }
    }

    // Enhanced screen flash based on reward analysis
    const shouldFlash = combo >= 2 || currentCascadeLevel >= 1 || tilesToClearInput.length >= 4;
    if (shouldFlash) {
      const flashColor = reward.isCritical ? '#ffd700' :
                         combo >= 5 ? '#ff6600' :
                         combo >= 3 ? '#ffb000' :
                         currentCascadeLevel >= 2 ? '#a855f7' :
                         tilesToClearInput.length >= 5 ? '#00f0ff' : '#ffffff';
      setScreenFlash(flashColor);
      setTimeout(() => setScreenFlash(null), 120);
    }

    // Screen shake for powerful plays
    if (reward.screenShake || reward.isCritical || combo >= 4 || currentCascadeLevel >= 2) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }

    // Combo flash effect
    if (combo >= 3) {
      setComboFlash(true);
      setTimeout(() => setComboFlash(false), 200);
    }

    if (reward.message) {
      setCriticalMessage(reward.message);
      setBigPlayMessage(reward.totalMultiplier > 2 ? `x${reward.totalMultiplier}` : null);

      if (reward.isCritical) {
        soundManager.playCritical();
      } else if (currentCascadeLevel > 0 || combo >= 3) {
        soundManager.playBigClear();
      }
      setTimeout(() => {
        setCriticalMessage(null);
        setBigPlayMessage(null);
      }, 900);
    } else {
      soundManager.playClear(1 + (tilesToClearInput.length - 3) * 0.2);
    }

    // Simplified cascade - single setTiles, use refs for cascade continuation
    setTimeout(() => {
      setTiles(prevTiles => {
        // Expand clear to include special tile effects
        let tilesToClear = [...tilesToClearInput];
        let hasSpecial = false;

        prevTiles.forEach(t => {
          if (tilesToClearInput.includes(t.id) && isSpecialTile(t)) {
            hasSpecial = true;
            const extraTargets = getSpecialTileClearTargets(t, prevTiles, GRID_SIZE);
            extraTargets.forEach(id => {
              if (!tilesToClear.includes(id)) tilesToClear.push(id);
            });
          }
        });

        if (hasSpecial) soundManager.playBigClear();

        const remainingTiles = prevTiles.filter(t => !tilesToClear.includes(t.id));
        const { newTiles, spawnedTiles } = applyGravity(remainingTiles, GRID_SIZE, getNextTileId);

        // Mark spawned tiles for animation (simplified)
        if (spawnedTiles?.length > 0) {
          const ids = spawnedTiles.map(t => t.id);
          setNewTileIds(new Set(ids));
          setTimeout(() => setNewTileIds(new Set()), 250);
        }

        setGamePhase(GAME_PHASE.FALLING);

        // Schedule cascade check after gravity settles
        setTimeout(() => {
          const matches = findAllMatches(newTiles, GRID_SIZE);
          if (matches.length > 0 && currentCascadeLevel < MAX_CASCADE_LEVEL - 1) {
            cascadeLevelRef.current = currentCascadeLevel + 1;
            setMaxChain(prev => Math.max(prev, currentCascadeLevel + 1));
            processCascadeStep(matches, currentCascadeLevel + 1);
          } else {
            setGamePhase(GAME_PHASE.IDLE);
            cascadeLevelRef.current = 0;
          }
        }, GAME_CONFIG.FALL_ANIMATION_MS);

        return newTiles;
      });
    }, GAME_CONFIG.CLEAR_ANIMATION_MS);
  }, [combo, tiles, createScorePopup, getNextTileId]);

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
    setHintTileIds(new Set()); // Clear any hint

    // Create swapped state
    const swappedTiles = tiles.map(t => {
      if (t.id === tile.id) return { ...t, x: targetX, y: targetY };
      if (t.id === targetTile.id) return { ...t, x: tile.x, y: tile.y };
      return t;
    });

    // Check if swap creates matches (check both tiles)
    const matches1 = findMatchingGroup(swappedTiles, tile.id, GRID_SIZE)?.ids ?? [];
    const matches2 = findMatchingGroup(swappedTiles, targetTile.id, GRID_SIZE)?.ids ?? [];
    const allMatches = [...new Set([...matches1, ...matches2])];

    if (allMatches.length > 0) {
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
        processCascadeStep(allMatches, 0);
      }, 100);
    } else {
      // Invalid swap - animate back
      setTiles(swappedTiles);
      soundManager.playNearMiss();

      setTimeout(() => {
        setTiles(tiles); // Revert
        setSwappingTileIds(new Set());
        setGamePhase(GAME_PHASE.IDLE);
      }, 150);
    }
  }, [tiles, isGameOver, gamePhase, initSound, lastClearTime, combo, maxCombo, processCascadeStep]);

  // ============================================
  // TILE CLEAR HANDLER (for click/tap on clearable)
  // ============================================

  const handleTileClear = useCallback((tileId) => {
    if (isGameOver || gamePhase !== GAME_PHASE.IDLE) return;

    initSound();

    const matchingTileIds = findMatchingGroup(tiles, tileId, GRID_SIZE)?.ids ?? [];
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
          x: shake ? [0, -8, 8, -6, 6, -4, 4, 0] : 0,
          y: shake ? [0, 6, -6, 4, -4, 2, -2, 0] : 0,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
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

        {/* Timed Mode Timer - Prominent Display */}
        {gameMode === 'timed' && !showModeSelect && (
          <motion.div
            className="mb-3 bg-gradient-to-r from-orange-900/80 to-red-900/80 border-2 rounded-xl p-3 text-center"
            style={{
              borderColor: timedModeSeconds <= 10 ? '#ff3366' : timedModeSeconds <= 30 ? '#ff6600' : '#ffb000',
              boxShadow: timedModeSeconds <= 10 ? '0 0 30px #ff336680' : '0 0 20px #ff660040',
            }}
            animate={timedModeSeconds <= 10 ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.5, repeat: timedModeSeconds <= 10 ? Infinity : 0 }}
          >
            <div className="flex items-center justify-center gap-4">
              <div className="text-sm font-rajdhani text-orange-300 uppercase tracking-wider">Time Left</div>
              <motion.div
                className="text-4xl md:text-5xl font-impact"
                style={{
                  color: timedModeSeconds <= 10 ? '#ff3366' : timedModeSeconds <= 30 ? '#ff6600' : '#ffffff',
                  textShadow: timedModeSeconds <= 10 ? '0 0 20px #ff3366' : '0 0 10px #ff6600',
                }}
                key={timedModeSeconds}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {timedModeSeconds}s
              </motion.div>
              {timedHighScore > 0 && (
                <div className="text-sm font-rajdhani text-yellow-400">
                  Target: {timedHighScore.toLocaleString()}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Compact Header Stats */}
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
          {/* Left Side - Main Stats */}
          <div className="flex items-center gap-3">
            {/* Score Box */}
            <motion.div
              className="bg-void-surface/90 border-2 border-neon-cyan rounded-xl px-4 py-2 min-w-[120px]"
              style={{ boxShadow: '0 0 20px #00f0ff50' }}
            >
              <div className="text-xs text-neon-cyan font-rajdhani tracking-widest uppercase">Score</div>
              <motion.div
                className="text-2xl md:text-3xl font-impact text-white"
                key={score}
                initial={{ scale: 1.3, color: '#00f0ff' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.2 }}
              >
                {score.toLocaleString()}
              </motion.div>
              {gameMode === 'endless' && highScore > 0 && score < highScore && (
                <div className="text-[10px] text-text-muted font-rajdhani">
                  BEST: {highScore.toLocaleString()}
                </div>
              )}
              {gameMode === 'endless' && score > 0 && score >= highScore && (
                <div className="text-[10px] text-neon-amber font-rajdhani animate-pulse">
                  ★ NEW BEST
                </div>
              )}
              {gameMode === 'timed' && score > 0 && score >= timedHighScore && timedHighScore > 0 && (
                <div className="text-[10px] text-neon-amber font-rajdhani animate-pulse">
                  ★ NEW BEST
                </div>
              )}
            </motion.div>

            {/* Combo Box - Enhanced with flash effect */}
            <motion.div
              className="bg-void-surface/90 border-2 rounded-xl px-4 py-2 min-w-[90px]"
              style={{
                borderColor: combo >= 5 ? '#ff6600' : combo > 0 ? '#ffb000' : '#2a2a3a',
                boxShadow: combo >= 5 ? '0 0 35px #ff660080' : combo > 0 ? '0 0 25px #ffb00060' : 'none',
                background: comboFlash ? 'linear-gradient(135deg, #ff660040, #ffb00040)' : undefined,
              }}
              animate={{
                scale: combo >= 4 ? [1, 1.08, 1] : combo > 2 ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.3, repeat: combo > 2 ? Infinity : 0 }}
            >
              <div className="text-xs font-rajdhani tracking-widest uppercase"
                style={{ color: combo >= 5 ? '#ff6600' : combo > 0 ? '#ffb000' : '#666' }}>
                {combo >= 6 ? 'ON FIRE!' : combo >= 4 ? 'HOT!' : 'Combo'}
              </div>
              <div className="text-2xl md:text-3xl font-impact"
                style={{ color: combo >= 5 ? '#ff6600' : combo > 0 ? '#ffffff' : '#444' }}>
                {combo > 0 ? `×${combo}` : '—'}
              </div>
              {combo > 0 && (
                <div className="h-1.5 bg-void-deep rounded-full overflow-hidden mt-1">
                  <motion.div
                    className="h-full"
                    style={{
                      background: combo >= 5
                        ? 'linear-gradient(90deg, #ff6600, #ff3366)'
                        : 'linear-gradient(90deg, #ffb000, #ffd700)',
                    }}
                    animate={{ width: `${comboTimeLeft}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              )}
            </motion.div>

            {/* Tiles Cleared */}
            <motion.div
              className="bg-void-surface/90 border-2 border-neon-violet/50 rounded-xl px-4 py-2 min-w-[80px]"
              style={{ boxShadow: '0 0 15px #a855f720' }}
            >
              <div className="text-xs text-neon-violet font-rajdhani tracking-widest uppercase">Cleared</div>
              <motion.div
                className="text-2xl md:text-3xl font-impact text-white"
                key={tilesCleared}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {tilesCleared}
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side - Moves Counter + Controls */}
          <div className="flex items-center gap-3">
            {/* Available Moves Counter */}
            <motion.div
              className="bg-void-surface/90 border-2 rounded-xl px-4 py-2 min-w-[100px]"
              style={{
                borderColor: validMoves.length === 0 ? '#ff3366' : validMoves.length < 5 ? '#ffb000' : '#22c55e',
                boxShadow: validMoves.length === 0 ? '0 0 25px #ff336660' : '0 0 15px #00f0ff20',
              }}
              animate={{
                scale: validMoves.length === 0 ? [1, 1.02, 1] : 1,
              }}
              transition={{ duration: 0.4, repeat: validMoves.length === 0 ? Infinity : 0 }}
            >
              <div className="text-xs font-rajdhani tracking-widest uppercase text-center"
                style={{ color: validMoves.length === 0 ? '#ff3366' : validMoves.length < 5 ? '#ffb000' : '#22c55e' }}>
                Moves
              </div>
              <motion.div
                className="text-2xl font-impact text-white text-center"
                key={validMoves.length}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {validMoves.length}
              </motion.div>
            </motion.div>

            {/* Hint Button - show when valid moves exist */}
            {validMoves.length > 0 && (
              <motion.button
                className="bg-gradient-to-r from-yellow-600 to-amber-500 border-2 border-yellow-400 rounded-xl px-3 py-2 text-sm font-rajdhani font-bold text-white shadow-lg"
                style={{ boxShadow: '0 0 15px #ffd70060' }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 25px #ffd700' }}
                whileTap={{ scale: 0.95 }}
                onClick={showHint}
              >
                💡 HINT
              </motion.button>
            )}

            {/* Control Buttons */}
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                <motion.button
                  className="bg-void-surface border border-void-border rounded-lg w-8 h-8 flex items-center justify-center text-text-muted hover:border-neon-cyan hover:text-neon-cyan"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePause}
                >
                  {isPaused ? '▶' : '⏸'}
                </motion.button>
                <motion.button
                  className="bg-void-surface border border-void-border rounded-lg w-8 h-8 flex items-center justify-center text-text-muted hover:border-chaos hover:text-chaos"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={restartGame}
                >
                  ↻
                </motion.button>
              </div>
              <div className="flex gap-1">
                <motion.button
                  className={`bg-void-surface border rounded-lg w-8 h-8 flex items-center justify-center ${soundEnabled ? 'border-order text-order' : 'border-void-border text-text-muted'}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { initSound(); toggleSound(); }}
                >
                  {soundEnabled ? '♪' : '🔇'}
                </motion.button>
                <motion.button
                  className="bg-void-surface border border-void-border rounded-lg w-8 h-8 flex items-center justify-center text-text-muted hover:border-neon-magenta hover:text-neon-magenta"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onHome}
                >
                  ✕
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty/Progress Bar */}
        <div className="mb-3 flex items-center gap-3">
          <div className="text-xs text-text-muted font-rajdhani uppercase tracking-wider">Level</div>
          <div className="flex gap-1 flex-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 h-2 rounded-sm"
                style={{
                  backgroundColor: i < difficultyLevel ? '#a855f7' : '#1a1a28',
                  boxShadow: i < difficultyLevel ? '0 0 8px #a855f7' : 'none',
                }}
                animate={i === difficultyLevel - 1 ? { opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            ))}
          </div>
          <div className="text-sm font-rajdhani text-neon-violet font-bold">{difficultyLevel}</div>
        </div>

        {/* Critical Message Overlay - Enhanced with multiplier */}
        <AnimatePresence>
          {criticalMessage && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
            >
              <div className="text-center">
                <motion.div
                  className="text-impact text-4xl md:text-6xl text-center px-4"
                  style={{
                    color: combo >= 5 ? '#ff6600' : '#a855f7',
                    textShadow: combo >= 5 ? '0 0 50px #ff6600, 0 0 100px #ff3366' : '0 0 40px #a855f7',
                  }}
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  {criticalMessage}
                </motion.div>
                {bigPlayMessage && (
                  <motion.div
                    className="text-impact text-2xl md:text-3xl text-yellow-400 mt-2"
                    style={{ textShadow: '0 0 30px #ffd700' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {bigPlayMessage} MULTIPLIER
                  </motion.div>
                )}
              </div>
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

        {/* Mode Selection Overlay */}
        <AnimatePresence>
          {showModeSelect && !isLevelMode && (
            <motion.div
              className="fixed inset-0 bg-void-black/95 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-center max-w-md w-full p-4"
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
              >
                <div className="text-impact text-3xl md:text-4xl text-neon-cyan mb-2"
                  style={{ textShadow: '0 0 40px #00f0ff' }}>
                  ENTROPY REDUCTION
                </div>
                <div className="text-text-muted mb-6 font-rajdhani">Select your challenge</div>

                <div className="flex flex-col gap-4">
                  {/* Timed Mode - Featured */}
                  <motion.button
                    className="bg-gradient-to-r from-orange-600 to-red-600 border-2 border-orange-400 rounded-xl px-6 py-4 text-left w-full"
                    style={{ boxShadow: '0 0 30px #ff660080' }}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px #ff6600' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startGameWithMode('timed')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-impact text-white">60-SECOND BLITZ</div>
                        <div className="text-sm font-rajdhani text-orange-200">Race against time! Beat your high score.</div>
                      </div>
                      <div className="text-3xl">⏱️</div>
                    </div>
                    {timedHighScore > 0 && (
                      <div className="mt-2 text-sm font-rajdhani text-yellow-300">
                        Best: {timedHighScore.toLocaleString()} pts
                      </div>
                    )}
                  </motion.button>

                  {/* Endless Mode */}
                  <motion.button
                    className="bg-void-surface border-2 border-neon-cyan rounded-xl px-6 py-4 text-left w-full"
                    style={{ boxShadow: '0 0 20px #00f0ff40' }}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px #00f0ff60' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startGameWithMode('endless')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-impact text-neon-cyan">ENDLESS MODE</div>
                        <div className="text-sm font-rajdhani text-text-muted">Relax and play at your own pace.</div>
                      </div>
                      <div className="text-3xl">♾️</div>
                    </div>
                    {highScore > 0 && (
                      <div className="mt-2 text-sm font-rajdhani text-neon-cyan/70">
                        Best: {highScore.toLocaleString()} pts
                      </div>
                    )}
                  </motion.button>
                </div>

                <motion.button
                  className="mt-6 text-text-muted hover:text-neon-magenta font-rajdhani"
                  whileHover={{ scale: 1.05 }}
                  onClick={onHome}
                >
                  ← Back to Home
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause Overlay */}
        <AnimatePresence>
          {isPaused && !isGameOver && !showModeSelect && (
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
                {gameMode === 'timed' ? (
                  <>
                    <div className="text-impact text-3xl md:text-4xl text-neon-amber mb-2"
                      style={{ textShadow: '0 0 40px #ffb000' }}>
                      TIME'S UP!
                    </div>
                    {score > timedHighScore && timedHighScore > 0 ? (
                      <div className="text-lg text-yellow-400 mb-4 font-rajdhani animate-pulse">
                        ★ NEW HIGH SCORE! ★
                      </div>
                    ) : score === timedHighScore && score > 0 ? (
                      <div className="text-lg text-yellow-400 mb-4 font-rajdhani">
                        ★ MATCHED YOUR BEST! ★
                      </div>
                    ) : (
                      <div className="text-text-muted text-sm mb-4">
                        {timedHighScore > 0 ? `${timedHighScore - score} away from your best` : 'Great run!'}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-impact text-3xl md:text-4xl text-chaos mb-2"
                      style={{ textShadow: '0 0 40px #ff3366' }}>
                      GAME OVER
                    </div>
                    <div className="text-text-muted text-sm mb-4">
                      {score >= highScore && score > 0 ? '★ NEW HIGH SCORE! ★' : 'Keep practicing!'}
                    </div>
                  </>
                )}

                <div className="bg-void-surface border-2 rounded-lg p-4 mb-4"
                  style={{
                    borderColor: gameMode === 'timed' ? '#ff6600' : '#00f0ff',
                    boxShadow: `0 0 20px ${gameMode === 'timed' ? '#ff660040' : '#00f0ff40'}`,
                  }}>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div>
                      <div className="text-[10px] text-text-muted">FINAL SCORE</div>
                      <div className="text-2xl font-bold font-impact">{score.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted">
                        {gameMode === 'timed' ? 'BEST SCORE' : 'TIME'}
                      </div>
                      <div className="text-xl font-bold">
                        {gameMode === 'timed'
                          ? (Math.max(score, timedHighScore)).toLocaleString()
                          : `${Math.floor(gameTime / 60000)}:${((gameTime % 60000) / 1000).toFixed(0).padStart(2, '0')}`
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted">MAX COMBO</div>
                      <div className="text-xl font-bold text-neon-amber">x{maxCombo}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted">CLEARED</div>
                      <div className="text-xl font-bold text-neon-cyan">{tilesCleared}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <motion.button
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-rajdhani font-bold text-lg w-full"
                    style={{ boxShadow: '0 0 20px #ff660060' }}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px #ff6600' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={restartGame}
                  >
                    {gameMode === 'timed' ? 'TRY AGAIN' : 'PLAY AGAIN'}
                  </motion.button>
                  <div className="flex gap-2">
                    <motion.button
                      className="flex-1 bg-void-surface border-2 border-neon-violet text-neon-violet px-4 py-2 rounded-lg font-rajdhani font-bold"
                      whileHover={{ scale: 1.02 }}
                      onClick={shareResults}
                    >
                      {showShareCopied ? 'COPIED!' : 'SHARE'}
                    </motion.button>
                    <motion.button
                      className="flex-1 bg-void-surface border border-neon-cyan text-neon-cyan px-4 py-2 rounded-lg font-rajdhani"
                      whileHover={{ scale: 1.02 }}
                      onClick={goToModeSelect}
                    >
                      MODES
                    </motion.button>
                  </div>
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
                    cellSize={cellSize}
                    gridGap={4}
                    isNew={newTileIds.has(tile.id)}
                    isSwapping={swappingTileIds.has(tile.id)}
                    isHinted={hintTileIds.has(tile.id)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* No Moves Overlay */}
            <AnimatePresence>
              {showNoMoves && (
                <motion.div
                  className="absolute inset-0 bg-void-black/80 rounded-xl flex flex-col items-center justify-center z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="text-center"
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                  >
                    <div className="text-2xl font-impact text-neon-amber mb-2"
                      style={{ textShadow: '0 0 20px #ffb000' }}>
                      NO MOVES!
                    </div>
                    <div className="text-sm text-text-muted mb-4 font-rajdhani">
                      No valid swaps available
                    </div>
                    <motion.button
                      className="bg-gradient-to-r from-neon-violet to-purple-600 border-2 border-neon-violet rounded-xl px-6 py-3 text-lg font-rajdhani font-bold text-white"
                      style={{ boxShadow: '0 0 25px #a855f760' }}
                      whileHover={{ scale: 1.08, boxShadow: '0 0 35px #a855f7' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShuffle}
                    >
                      🔀 SHUFFLE
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer - Instructions */}
        <div className="text-center py-2">
          <span className="text-text-muted text-xs font-exo">
            {gameMode === 'timed'
              ? 'SWIPE fast! Match 3+ • Build combos for HUGE points!'
              : 'SWIPE to swap • Match 3+ in a row • Build cascades!'
            }
          </span>
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
