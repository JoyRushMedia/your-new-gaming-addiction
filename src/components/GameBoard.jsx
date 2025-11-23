import { useState, useEffect, useCallback } from 'react';
import Tile from './Tile';
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
 * GameBoard Component
 * Implements the Entropy-Reduction Core Loop with psychological principles
 */

const GRID_SIZE = 6; // 6x6 grid
let tileIdCounter = 0;

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

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    // Spawn initial tiles
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
  // cite: 107, 110 - Never allow full closure
  // ============================================

  useEffect(() => {
    // Don't spawn if board is too full
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

    setTiles(prev => {
      const newTiles = prev.filter(t => t.id !== tileId);

      // Check for near-miss (cite: 173, 176)
      const targetClears = Math.floor(prev.length * 0.3); // Target 30% reduction
      const actualClears = 1;
      const completion = calculateCompletionPercentage(actualClears, targetClears);

      if (detectNearMiss(completion)) {
        setIsNearMiss(true);
        setTimeout(() => setIsNearMiss(false), 2000);
      }

      return newTiles;
    });

    // Update combo (cite: 45 - Escalating dopamine)
    const newCombo = updateCombo(combo, true, timeSinceLastClear);
    setCombo(newCombo);

    // Calculate reward with Variable Ratio Schedule (cite: 37, 38)
    const reward = calculateReward(
      GAME_CONFIG.BASE_POINTS_PER_CLEAR,
      newCombo
    );

    setScore(prev => prev + reward.points);
    setLastClearTime(now);

    // Display critical message if triggered (cite: 45 - Positive Prediction Error)
    if (reward.isCritical) {
      setCriticalMessage(reward.message);
      setShake(true); // Screen shake for impact

      setTimeout(() => {
        setCriticalMessage(null);
        setShake(false);
      }, 1000);
    }
  }, [combo, lastClearTime]);

  // ============================================
  // AUTO-CLEAR DETECTION
  // ============================================

  const clearableTileIds = findClearableTiles(tiles, GRID_SIZE);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`
      w-full h-full
      flex flex-col
      p-8
      ${shake ? 'animate-screen-shake' : ''}
    `}>
      {/* Header Stats */}
      <div className="flex justify-between items-start mb-8">
        {/* Score */}
        <div className="chamfer-sm bg-void-surface border-2 border-neon-cyan p-4 min-w-[200px]">
          <div className="text-header text-neon-cyan text-sm mb-1">SCORE</div>
          <div className="text-score text-4xl text-white">{score}</div>
        </div>

        {/* Combo */}
        <div className={`
          chamfer-sm bg-void-surface border-2 p-4 min-w-[150px]
          ${combo > 1 ? 'border-neon-amber shadow-[0_0_20px_#ffb000]' : 'border-void-border'}
        `}>
          <div className="text-header text-neon-amber text-sm mb-1">COMBO</div>
          <div className="text-score text-3xl text-white">
            {combo > 0 ? `x${combo}` : '--'}
          </div>
        </div>

        {/* Entropy Level */}
        <div className="chamfer-sm bg-void-surface border-2 border-chaos p-4 min-w-[200px]">
          <div className="text-header text-chaos text-sm mb-1">ENTROPY</div>
          <div className="flex items-center gap-2">
            <div className="text-score text-3xl text-white">{entropyLevel}%</div>
            <div className="flex-1 h-2 bg-void-deep rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-order to-chaos transition-all duration-300"
                style={{ width: `${entropyLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Critical Message Overlay */}
      {criticalMessage && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-impact text-6xl text-neon-violet animate-glitch opacity-90">
            {criticalMessage}
          </div>
        </div>
      )}

      {/* Near Miss Feedback */}
      {isNearMiss && (
        <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
          <div className="text-header text-2xl text-neon-magenta opacity-80">
            SO CLOSE! 85% COMPLETE
          </div>
        </div>
      )}

      {/* Game Board */}
      <div className="flex-1 flex items-center justify-center scanlines">
        <div className="chamfer-tech bg-void-deep border-2 border-neon-cyan p-6 shadow-[0_0_40px_#00f0ff]">
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
                >
                  {tile && (
                    <Tile
                      tile={tile}
                      onClear={handleTileClear}
                      isClearable={clearableTileIds.includes(tile.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-text-muted text-sm font-exo">
        <p className="tracking-moderate">
          CLICK TILES TO CLEAR • MATCH 3+ TO REDUCE ENTROPY
        </p>
      </div>
    </div>
  );
}
