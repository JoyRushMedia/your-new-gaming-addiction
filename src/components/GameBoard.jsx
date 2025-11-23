import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tile from './Tile';
import ParticleBurst from './ParticleBurst';
import {
  calculateReward,
  detectNearMiss,
  calculateCompletionPercentage,
  calculateEntropySpawn,
  generateRandomPosition,
  generateRandomTileType,
  calculateEntropyLevel,
  updateCombo,
  findClearableTiles,
  GAME_CONFIG,
} from '../lib/gameLogic';

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
  const [criticalMessage, setCriticalMessage] = useState(null);
  const [shake, setShake] = useState(false);
  const [particleBursts, setParticleBursts] = useState([]);
  const gameBoardRef = useRef(null);

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
    if (tiles.length >= GRID_SIZE * GRID_SIZE - 4) return;

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
  }, [tiles]);

  // ============================================
  // CLEAR MECHANICS
  // ============================================

  const handleTileClear = useCallback((tileId) => {
    const now = Date.now();
    const timeSinceLastClear = now - lastClearTime;

    // Get tile position for particle burst
    const clearedTile = tiles.find(t => t.id === tileId);
    const tileElement = document.querySelector(`[data-tile-id="${tileId}"]`);

    // FIXED: Near-miss detection - check if this was the LAST clearable tile
    // but there are still other tiles remaining (chaos persists)
    const remainingClearableAfterThis = clearableTileIds.filter(id => id !== tileId);
    const totalTilesAfterClear = tiles.length - 1;

    // Near-miss = Just cleared last clearable tile, but board still has 15%+ entropy
    const isLastClearable = remainingClearableAfterThis.length === 0;
    const hasSignificantEntropy = totalTilesAfterClear >= (GRID_SIZE * GRID_SIZE) * 0.15;

    if (isLastClearable && hasSignificantEntropy) {
      setIsNearMiss(true);
      setShake(true); // SHAKE on near-miss
      setTimeout(() => {
        setIsNearMiss(false);
        setShake(false);
      }, 800);
    }

    setTiles(prev => {
      const newTiles = prev.filter(t => t.id !== tileId);
      return newTiles;
    });

    // Update combo
    const newCombo = updateCombo(combo, true, timeSinceLastClear);
    setCombo(newCombo);

    // Calculate reward with Variable Ratio Schedule
    const reward = calculateReward(
      GAME_CONFIG.BASE_POINTS_PER_CLEAR,
      newCombo
    );

    setScore(prev => prev + reward.points);
    setLastClearTime(now);

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
  }, [combo, lastClearTime, tiles]);

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
        <div className="flex justify-between items-start mb-8 gap-6">
          {/* Score */}
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
            <div className="text-header text-neon-cyan text-sm mb-1">SCORE</div>
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

          {/* Combo */}
          <motion.div
            className={`
              chamfer-sm bg-void-surface border-2 p-4 min-w-[150px]
            `}
            style={{
              borderColor: combo > 1 ? '#ffb000' : '#1a1a28',
              boxShadow: combo > 1
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
          </motion.div>

          {/* Entropy Level */}
          <motion.div
            className={`
              chamfer-sm bg-void-surface border-2 p-4 min-w-[200px]
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
                SO CLOSE! 85% COMPLETE
              </div>
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
          <p className="tracking-moderate">
            CLICK TILES TO CLEAR • MATCH 3+ TO REDUCE ENTROPY
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
