/**
 * PSYCHOLOGICAL GAME LOGIC
 * Implements behavioral principles from the design framework
 */

// ============================================
// CONSTANTS (Tunable Psychology Parameters)
// ============================================

export const GAME_CONFIG = {
  // Variable Ratio Schedule (cite: 37, 38)
  CRITICAL_CLEAR_CHANCE: 0.10, // 10% chance for dopamine spike
  CRITICAL_MULTIPLIER: 3.5,     // 3.5x reward on critical

  // Near-Miss Detection (cite: 173, 176)
  NEAR_MISS_THRESHOLD: 0.85,    // 85%+ completion = near miss

  // Zeigarnik Effect (cite: 107, 110)
  MIN_ENTROPY_TILES: 2,          // Never allow full closure
  ENTROPY_SPAWN_DELAY: 1500,     // ms before new chaos appears

  // Entropy Mechanics (cite: 96, 99, 100)
  MAX_ENTROPY_LEVEL: 100,
  CLEAR_ENTROPY_REDUCTION: 15,
  SPAWN_ENTROPY_INCREASE: 10,

  // Scoring
  BASE_POINTS_PER_CLEAR: 10,
  COMBO_MULTIPLIER: 1.5,
};

// ============================================
// VARIABLE RATIO REWARD SYSTEM
// ============================================

/**
 * Determines if this clear should be a "Critical Clear"
 * Uses Variable Ratio Schedule to prevent extinction (cite: 37, 38)
 *
 * @returns {boolean} - true if critical clear triggered
 */
export function rollForCriticalClear() {
  return Math.random() < GAME_CONFIG.CRITICAL_CLEAR_CHANCE;
}

/**
 * Calculates reward for a clear action
 * Implements Reward Prediction Error (RPE) mechanics (cite: 45)
 *
 * @param {number} basePoints - Base points for this action
 * @param {number} comboCount - Current combo multiplier
 * @param {boolean} isCritical - Whether this is a critical clear
 * @returns {object} - { points, isCritical, message }
 */
export function calculateReward(basePoints, comboCount, isCritical = null) {
  // Roll for critical if not explicitly set
  if (isCritical === null) {
    isCritical = rollForCriticalClear();
  }

  let points = basePoints;

  // Apply combo multiplier
  if (comboCount > 1) {
    points *= Math.pow(GAME_CONFIG.COMBO_MULTIPLIER, comboCount - 1);
  }

  // Apply critical multiplier (POSITIVE PREDICTION ERROR)
  if (isCritical) {
    points *= GAME_CONFIG.CRITICAL_MULTIPLIER;
    return {
      points: Math.floor(points),
      isCritical: true,
      message: 'CRITICAL CLEAR!',
    };
  }

  return {
    points: Math.floor(points),
    isCritical: false,
    message: null,
  };
}

// ============================================
// NEAR-MISS DETECTION
// ============================================

/**
 * Detects "near miss" scenarios to exploit striatal activation (cite: 173, 176)
 * A near miss occurs when player was very close to success but failed
 *
 * @param {number} completionPercentage - How close player was (0-1)
 * @returns {boolean} - true if this qualifies as a near miss
 */
export function detectNearMiss(completionPercentage) {
  return completionPercentage >= GAME_CONFIG.NEAR_MISS_THRESHOLD &&
         completionPercentage < 1.0;
}

/**
 * Calculates completion percentage for near-miss detection
 *
 * @param {Array} tiles - Current tile state
 * @param {number} targetClears - Number of clears needed for success
 * @returns {number} - Completion percentage (0-1)
 */
export function calculateCompletionPercentage(clearedCount, targetCount) {
  if (targetCount === 0) return 0;
  return clearedCount / targetCount;
}

// ============================================
// ENTROPY MANAGEMENT (Zeigarnik Effect)
// ============================================

/**
 * Generates new entropy tiles to prevent closure (cite: 107, 110)
 * NEVER allows the board to be fully clear - creates cognitive itch
 *
 * @param {number} currentTileCount - Current number of tiles on board
 * @param {number} gridSize - Size of the game grid
 * @returns {number} - Number of new tiles to spawn
 */
export function calculateEntropySpawn(currentTileCount, gridSize) {
  const maxTiles = gridSize * gridSize;
  const emptySlots = maxTiles - currentTileCount;

  // If board is too empty, spawn more entropy
  if (currentTileCount < GAME_CONFIG.MIN_ENTROPY_TILES) {
    return Math.min(3, emptySlots); // Spawn 3 tiles
  }

  // Normal spawn rate: 1-2 tiles to maintain pressure
  if (emptySlots > 2) {
    return Math.random() > 0.5 ? 2 : 1;
  }

  // If board is full, don't spawn
  return 0;
}

/**
 * Generates random tile position
 *
 * @param {number} gridSize - Size of grid (e.g., 6 for 6x6)
 * @param {Array} occupiedPositions - Array of occupied {x, y} positions
 * @returns {object|null} - {x, y} position or null if no space
 */
export function generateRandomPosition(gridSize, occupiedPositions) {
  const allPositions = [];

  // Generate all possible positions
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      allPositions.push({ x, y });
    }
  }

  // Filter out occupied positions
  const availablePositions = allPositions.filter(pos =>
    !occupiedPositions.some(occ => occ.x === pos.x && occ.y === pos.y)
  );

  if (availablePositions.length === 0) return null;

  // Return random available position
  const randomIndex = Math.floor(Math.random() * availablePositions.length);
  return availablePositions[randomIndex];
}

/**
 * Generates a random tile type (color/shape)
 *
 * @returns {string} - Tile type identifier
 */
export function generateRandomTileType() {
  const types = ['cyan', 'magenta', 'amber', 'violet'];
  return types[Math.floor(Math.random() * types.length)];
}

// ============================================
// ENTROPY LEVEL CALCULATION
// ============================================

/**
 * Calculates current entropy level (disorder metric)
 * High entropy = stress; Low entropy = satisfaction (cite: 96, 99, 100)
 *
 * @param {number} tileCount - Number of tiles on board
 * @param {number} maxTiles - Maximum possible tiles
 * @returns {number} - Entropy level (0-100)
 */
export function calculateEntropyLevel(tileCount, maxTiles) {
  const percentage = (tileCount / maxTiles) * 100;
  return Math.min(GAME_CONFIG.MAX_ENTROPY_LEVEL, Math.floor(percentage));
}

// ============================================
// COMBO SYSTEM
// ============================================

/**
 * Manages combo state
 * Consecutive clears increase dopamine through escalation
 *
 * @param {number} currentCombo - Current combo count
 * @param {boolean} successful - Whether last action was successful
 * @param {number} timeSinceLastClear - ms since last clear
 * @returns {number} - New combo count
 */
export function updateCombo(currentCombo, successful, timeSinceLastClear = 0) {
  const COMBO_TIMEOUT = 3000; // 3 seconds to maintain combo

  if (!successful) {
    return 0; // Reset on failure
  }

  if (timeSinceLastClear > COMBO_TIMEOUT) {
    return 1; // Timeout, start new combo
  }

  return currentCombo + 1;
}

// ============================================
// TILE MATCHING LOGIC
// ============================================

/**
 * Checks if tiles can be cleared (matched)
 * Simple match-3 style logic for demonstration
 *
 * @param {Array} tiles - Array of tile objects with {x, y, type}
 * @param {number} gridSize - Size of grid
 * @returns {Array} - Array of clearable tile IDs
 */
export function findClearableTiles(tiles, gridSize) {
  const clearable = new Set();

  // Create grid map for quick lookup
  const grid = {};
  tiles.forEach(tile => {
    const key = `${tile.x},${tile.y}`;
    grid[key] = tile;
  });

  // Check horizontal matches
  for (let y = 0; y < gridSize; y++) {
    let matchCount = 1;
    let matchType = null;

    for (let x = 0; x < gridSize; x++) {
      const key = `${x},${y}`;
      const tile = grid[key];

      if (tile && tile.type === matchType) {
        matchCount++;
      } else {
        if (matchCount >= 3) {
          // Mark previous tiles as clearable
          for (let i = x - matchCount; i < x; i++) {
            const matchKey = `${i},${y}`;
            if (grid[matchKey]) {
              clearable.add(grid[matchKey].id);
            }
          }
        }
        matchCount = 1;
        matchType = tile ? tile.type : null;
      }
    }

    // Check end of row
    if (matchCount >= 3) {
      for (let i = gridSize - matchCount; i < gridSize; i++) {
        const matchKey = `${i},${y}`;
        if (grid[matchKey]) {
          clearable.add(grid[matchKey].id);
        }
      }
    }
  }

  // Check vertical matches
  for (let x = 0; x < gridSize; x++) {
    let matchCount = 1;
    let matchType = null;

    for (let y = 0; y < gridSize; y++) {
      const key = `${x},${y}`;
      const tile = grid[key];

      if (tile && tile.type === matchType) {
        matchCount++;
      } else {
        if (matchCount >= 3) {
          for (let i = y - matchCount; i < y; i++) {
            const matchKey = `${x},${i}`;
            if (grid[matchKey]) {
              clearable.add(grid[matchKey].id);
            }
          }
        }
        matchCount = 1;
        matchType = tile ? tile.type : null;
      }
    }

    if (matchCount >= 3) {
      for (let i = gridSize - matchCount; i < gridSize; i++) {
        const matchKey = `${x},${i}`;
        if (grid[matchKey]) {
          clearable.add(grid[matchKey].id);
        }
      }
    }
  }

  return Array.from(clearable);
}
