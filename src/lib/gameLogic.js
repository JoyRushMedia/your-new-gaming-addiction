/**
 * PSYCHOLOGICAL GAME LOGIC
 * Implements behavioral principles from the design framework
 * Enhanced with gravity and cascade mechanics
 */

// ============================================
// CONSTANTS (Tunable Psychology Parameters)
// ============================================

export const GAME_CONFIG = {
  // Grid Configuration
  GRID_SIZE: 6,
  CELL_SIZE: 70, // pixels per cell for animations

  // Variable Ratio Schedule (cite: 37, 38)
  CRITICAL_CLEAR_CHANCE: 0.10, // 10% chance for dopamine spike
  CRITICAL_MULTIPLIER: 3.5,     // 3.5x reward on critical

  // Near-Miss Detection (cite: 173, 176)
  NEAR_MISS_THRESHOLD: 0.85,    // 85%+ completion = near miss

  // Zeigarnik Effect (cite: 107, 110)
  MIN_ENTROPY_TILES: 2,          // Never allow full closure
  ENTROPY_SPAWN_DELAY_BASE: 1200, // Base spawn delay in ms
  ENTROPY_SPAWN_DELAY_MIN: 400,   // Minimum spawn delay (difficulty cap)

  // Entropy Mechanics (cite: 96, 99, 100)
  MAX_ENTROPY_LEVEL: 100,
  CLEAR_ENTROPY_REDUCTION: 15,
  SPAWN_ENTROPY_INCREASE: 10,

  // Scoring
  BASE_POINTS_PER_CLEAR: 10,
  COMBO_MULTIPLIER: 1.5,
  CASCADE_BONUS: 1.25, // 25% bonus per cascade level

  // Flow/Difficulty Progression
  DIFFICULTY_RAMP_INTERVAL: 30000, // Increase difficulty every 30 seconds
  DIFFICULTY_RAMP_AMOUNT: 100,     // Reduce spawn delay by 100ms each interval

  // Animation Timing - Optimized for snappy feel
  CLEAR_ANIMATION_MS: 150,  // Faster clears
  FALL_ANIMATION_MS: 120,   // Quick gravity
  CASCADE_DELAY_MS: 50,     // Rapid cascade checks
};

// ============================================
// DIFFICULTY / FLOW MANAGEMENT
// ============================================

/**
 * Calculates spawn delay based on game time for flow maintenance
 * Implements dynamic difficulty adjustment to keep player in "Flow Channel"
 *
 * @param {number} gameTimeMs - Time since game started in milliseconds
 * @returns {number} - Spawn delay in milliseconds
 */
export function calculateSpawnDelay(gameTimeMs) {
  const intervals = Math.floor(gameTimeMs / GAME_CONFIG.DIFFICULTY_RAMP_INTERVAL);
  const reduction = intervals * GAME_CONFIG.DIFFICULTY_RAMP_AMOUNT;
  const delay = GAME_CONFIG.ENTROPY_SPAWN_DELAY_BASE - reduction;
  return Math.max(GAME_CONFIG.ENTROPY_SPAWN_DELAY_MIN, delay);
}

/**
 * Get difficulty level for display (1-10 scale)
 *
 * @param {number} gameTimeMs - Time since game started
 * @returns {number} - Difficulty level 1-10
 */
export function getDifficultyLevel(gameTimeMs) {
  const maxReduction = GAME_CONFIG.ENTROPY_SPAWN_DELAY_BASE - GAME_CONFIG.ENTROPY_SPAWN_DELAY_MIN;
  const intervals = Math.floor(gameTimeMs / GAME_CONFIG.DIFFICULTY_RAMP_INTERVAL);
  const currentReduction = Math.min(intervals * GAME_CONFIG.DIFFICULTY_RAMP_AMOUNT, maxReduction);
  return Math.min(10, Math.floor((currentReduction / maxReduction) * 9) + 1);
}

// ============================================
// STREAK SYSTEM (Loss Aversion)
// ============================================

const STREAK_KEY = 'entropyReduction_streak';
const LAST_PLAY_KEY = 'entropyReduction_lastPlay';

/**
 * Get current streak data from localStorage
 * Implements loss aversion through daily streak tracking
 *
 * @returns {object} - { streak: number, lastPlayDate: string|null, streakAlive: boolean }
 */
export function getStreakData() {
  try {
    const streak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
    const lastPlay = localStorage.getItem(LAST_PLAY_KEY);

    if (!lastPlay) {
      return { streak: 0, lastPlayDate: null, streakAlive: true };
    }

    const lastDate = new Date(lastPlay);
    const today = new Date();

    // Reset time to compare dates only
    lastDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already played today
      return { streak, lastPlayDate: lastPlay, streakAlive: true, playedToday: true };
    } else if (diffDays === 1) {
      // Streak can be extended
      return { streak, lastPlayDate: lastPlay, streakAlive: true, playedToday: false };
    } else {
      // Streak is broken
      return { streak: 0, lastPlayDate: lastPlay, streakAlive: false, playedToday: false };
    }
  } catch {
    return { streak: 0, lastPlayDate: null, streakAlive: true };
  }
}

/**
 * Record a play session and update streak
 *
 * @returns {object} - Updated streak data
 */
export function recordPlay() {
  try {
    const { streak, streakAlive, playedToday } = getStreakData();
    const today = new Date().toISOString();

    if (playedToday) {
      // Already played today, don't update streak
      return { streak, isNewDay: false };
    }

    const newStreak = streakAlive ? streak + 1 : 1;

    localStorage.setItem(STREAK_KEY, newStreak.toString());
    localStorage.setItem(LAST_PLAY_KEY, today);

    return { streak: newStreak, isNewDay: true };
  } catch {
    return { streak: 0, isNewDay: false };
  }
}

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
 * @param {number} cascadeLevel - Current cascade level (0 for first clear)
 * @param {boolean} isCritical - Whether this is a critical clear
 * @returns {object} - { points, isCritical, message }
 */
export function calculateReward(basePoints, comboCount, cascadeLevel = 0, isCritical = null) {
  // Roll for critical if not explicitly set
  if (isCritical === null) {
    isCritical = rollForCriticalClear();
  }

  let points = basePoints;

  // Apply combo multiplier
  if (comboCount > 1) {
    points *= Math.pow(GAME_CONFIG.COMBO_MULTIPLIER, comboCount - 1);
  }

  // Apply cascade bonus
  if (cascadeLevel > 0) {
    points *= Math.pow(GAME_CONFIG.CASCADE_BONUS, cascadeLevel);
  }

  // Apply critical multiplier (POSITIVE PREDICTION ERROR)
  if (isCritical) {
    points *= GAME_CONFIG.CRITICAL_MULTIPLIER;
    return {
      points: Math.floor(points),
      isCritical: true,
      message: cascadeLevel > 0 ? `CASCADE CRITICAL x${cascadeLevel + 1}!` : 'CRITICAL CLEAR!',
    };
  }

  // Special messages for cascades
  if (cascadeLevel > 0) {
    const cascadeMessages = ['CHAIN!', 'DOUBLE CHAIN!', 'TRIPLE CHAIN!', 'MEGA CHAIN!', 'ULTRA CHAIN!'];
    return {
      points: Math.floor(points),
      isCritical: false,
      message: cascadeMessages[Math.min(cascadeLevel - 1, cascadeMessages.length - 1)],
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
 * @param {number} clearedCount - Number of clears
 * @param {number} targetCount - Number of clears needed for success
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
 * OPTIMIZED: Adaptive spawn rate based on player skill (flow maintenance)
 *
 * @param {number} currentTileCount - Current number of tiles on board
 * @param {number} gridSize - Size of the game grid
 * @returns {number} - Number of new tiles to spawn
 */
export function calculateEntropySpawn(currentTileCount, gridSize) {
  const maxTiles = gridSize * gridSize;
  const emptySlots = maxTiles - currentTileCount;
  const fillPercentage = currentTileCount / maxTiles;

  // If board is too empty, spawn more entropy (panic mode)
  if (currentTileCount < GAME_CONFIG.MIN_ENTROPY_TILES) {
    return Math.min(3, emptySlots); // Spawn 3 tiles
  }

  // OPTIMIZED: Adaptive spawn - fewer tiles when board is full (prevents deadlock)
  if (fillPercentage < 0.3) {
    // Board is <30% full - spawn 2-3 tiles to maintain pressure
    return Math.min(Math.random() > 0.5 ? 3 : 2, emptySlots);
  } else if (fillPercentage < 0.7) {
    // Board is 30-70% full - normal spawn rate (1-2 tiles)
    return Math.min(Math.random() > 0.5 ? 2 : 1, emptySlots);
  } else {
    // Board is >70% full - slow spawn to prevent overflow
    return emptySlots > 3 ? 1 : 0;
  }
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
 * Creates a grid map for quick tile lookup
 * @param {Array} tiles - Array of tile objects
 * @returns {Object} - Grid map with "x,y" keys
 */
export function createGridMap(tiles) {
  const grid = {};
  tiles.forEach(tile => {
    const key = `${tile.x},${tile.y}`;
    grid[key] = tile;
  });
  return grid;
}

/**
 * Finds all tiles that are part of the same match group as the clicked tile
 * Returns all connected tiles in horizontal and vertical matches
 *
 * @param {Array} tiles - Array of tile objects with {x, y, type, id}
 * @param {number} clickedTileId - ID of the tile that was clicked
 * @param {number} gridSize - Size of grid
 * @returns {Array} - Array of tile IDs to clear (including clicked tile)
 */
export function findMatchingGroup(tiles, clickedTileId, gridSize) {
  const clickedTile = tiles.find(t => t.id === clickedTileId);
  if (!clickedTile) return [];

  const matchingIds = new Set();
  const grid = createGridMap(tiles);

  // Find horizontal match containing clicked tile
  const horizontalMatch = [];
  // Scan left
  for (let x = clickedTile.x; x >= 0; x--) {
    const tile = grid[`${x},${clickedTile.y}`];
    if (tile && tile.type === clickedTile.type) {
      horizontalMatch.push(tile);
    } else {
      break;
    }
  }
  // Scan right (skip clicked tile position, already added)
  for (let x = clickedTile.x + 1; x < gridSize; x++) {
    const tile = grid[`${x},${clickedTile.y}`];
    if (tile && tile.type === clickedTile.type) {
      horizontalMatch.push(tile);
    } else {
      break;
    }
  }

  // Add horizontal match if 3+
  if (horizontalMatch.length >= 3) {
    horizontalMatch.forEach(t => matchingIds.add(t.id));
  }

  // Find vertical match containing clicked tile
  const verticalMatch = [];
  // Scan up
  for (let y = clickedTile.y; y >= 0; y--) {
    const tile = grid[`${clickedTile.x},${y}`];
    if (tile && tile.type === clickedTile.type) {
      verticalMatch.push(tile);
    } else {
      break;
    }
  }
  // Scan down (skip clicked tile position, already added)
  for (let y = clickedTile.y + 1; y < gridSize; y++) {
    const tile = grid[`${clickedTile.x},${y}`];
    if (tile && tile.type === clickedTile.type) {
      verticalMatch.push(tile);
    } else {
      break;
    }
  }

  // Add vertical match if 3+
  if (verticalMatch.length >= 3) {
    verticalMatch.forEach(t => matchingIds.add(t.id));
  }

  return Array.from(matchingIds);
}

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
  const grid = createGridMap(tiles);

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

// ============================================
// GRAVITY SYSTEM
// ============================================

/**
 * Applies gravity to tiles - makes tiles fall down to fill gaps
 * Returns the new tile positions and fall information
 *
 * @param {Array} tiles - Current tiles array
 * @param {number} gridSize - Size of the grid
 * @returns {Object} - { newTiles, fallAnimations }
 */
export function applyGravity(tiles, gridSize) {
  // Create a copy of tiles to modify
  const newTiles = tiles.map(t => ({ ...t }));
  const fallAnimations = []; // Track which tiles need fall animation

  // Process each column from bottom to top
  for (let x = 0; x < gridSize; x++) {
    // Get all tiles in this column, sorted by y position (bottom first)
    const columnTiles = newTiles
      .filter(t => t.x === x)
      .sort((a, b) => b.y - a.y); // Sort descending (bottom first)

    // Find empty positions in this column
    const occupiedY = new Set(columnTiles.map(t => t.y));
    const emptyPositions = [];
    for (let y = gridSize - 1; y >= 0; y--) {
      if (!occupiedY.has(y)) {
        emptyPositions.push(y);
      }
    }

    // Move tiles down to fill gaps
    if (emptyPositions.length > 0) {
      // Sort empty positions descending (fill from bottom)
      emptyPositions.sort((a, b) => b - a);

      // For each tile (from bottom to top), check if it needs to fall
      for (const tile of columnTiles) {
        // Count how many empty positions are below this tile
        const emptyBelow = emptyPositions.filter(y => y > tile.y).length;

        if (emptyBelow > 0) {
          const oldY = tile.y;
          const newY = tile.y + emptyBelow;

          // Record the fall animation
          fallAnimations.push({
            tileId: tile.id,
            fromY: oldY,
            toY: newY,
            distance: emptyBelow,
          });

          // Update tile position
          tile.y = newY;
        }
      }
    }
  }

  return { newTiles, fallAnimations };
}

/**
 * Checks if there are any matches after gravity is applied
 * Used for cascade detection
 *
 * @param {Array} tiles - Tiles after gravity
 * @param {number} gridSize - Size of grid
 * @returns {Array} - Array of all tile IDs that form matches
 */
export function findAllMatches(tiles, gridSize) {
  return findClearableTiles(tiles, gridSize);
}

/**
 * Processes a complete cascade sequence
 * Returns all the steps needed for animation
 *
 * @param {Array} initialTiles - Starting tiles
 * @param {Array} tilesToClear - Tiles to clear in first step
 * @param {number} gridSize - Size of grid
 * @returns {Array} - Array of cascade steps: [{ clearedIds, newTiles, fallAnimations, newMatches }]
 */
export function processCascade(initialTiles, tilesToClear, gridSize) {
  const cascadeSteps = [];
  let currentTiles = [...initialTiles];
  let currentClears = tilesToClear;

  while (currentClears.length > 0) {
    // Step 1: Remove cleared tiles
    const remainingTiles = currentTiles.filter(t => !currentClears.includes(t.id));

    // Step 2: Apply gravity
    const { newTiles, fallAnimations } = applyGravity(remainingTiles, gridSize);

    // Step 3: Find new matches (cascade)
    const newMatches = findAllMatches(newTiles, gridSize);

    // Record this cascade step
    cascadeSteps.push({
      clearedIds: currentClears,
      tilesAfterClear: remainingTiles,
      tilesAfterFall: newTiles,
      fallAnimations,
      newMatches,
    });

    // Prepare for next iteration
    currentTiles = newTiles;
    currentClears = newMatches;
  }

  return cascadeSteps;
}

// ============================================
// SWIPE DETECTION
// ============================================

/**
 * Determines swipe direction from touch delta
 *
 * @param {number} deltaX - Horizontal movement
 * @param {number} deltaY - Vertical movement
 * @param {number} threshold - Minimum distance to count as swipe
 * @returns {string|null} - 'up', 'down', 'left', 'right', or null
 */
export function getSwipeDirection(deltaX, deltaY, threshold = 30) {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  // Must exceed threshold
  if (absX < threshold && absY < threshold) {
    return null;
  }

  // Determine primary direction
  if (absX > absY) {
    return deltaX > 0 ? 'right' : 'left';
  } else {
    return deltaY > 0 ? 'down' : 'up';
  }
}

/**
 * Gets the adjacent tile in a given direction
 *
 * @param {Array} tiles - Current tiles
 * @param {Object} fromTile - Starting tile
 * @param {string} direction - 'up', 'down', 'left', 'right'
 * @param {number} gridSize - Size of grid
 * @returns {Object|null} - Adjacent tile or null
 */
export function getAdjacentTile(tiles, fromTile, direction, gridSize) {
  let targetX = fromTile.x;
  let targetY = fromTile.y;

  switch (direction) {
    case 'up': targetY--; break;
    case 'down': targetY++; break;
    case 'left': targetX--; break;
    case 'right': targetX++; break;
    default: return null;
  }

  // Check bounds
  if (targetX < 0 || targetX >= gridSize || targetY < 0 || targetY >= gridSize) {
    return null;
  }

  // Find tile at target position
  return tiles.find(t => t.x === targetX && t.y === targetY) || null;
}
