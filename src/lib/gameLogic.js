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

  // Scoring - Aggressive multipliers for satisfying feedback
  BASE_POINTS_PER_CLEAR: 15,
  COMBO_MULTIPLIER: 2.0,    // Combos now DOUBLE (x2, x4, x8, x16...)
  CASCADE_BONUS: 1.5,       // 50% bonus per cascade level (was 25%)

  // Timed Mode
  TIMED_MODE_DURATION: 60,  // 60 seconds per round

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
  let totalMultiplier = 1;

  // Apply combo multiplier - EXPONENTIAL growth feels powerful
  if (comboCount > 1) {
    const comboMult = Math.pow(GAME_CONFIG.COMBO_MULTIPLIER, comboCount - 1);
    points *= comboMult;
    totalMultiplier *= comboMult;
  }

  // Apply cascade bonus
  if (cascadeLevel > 0) {
    const cascadeMult = Math.pow(GAME_CONFIG.CASCADE_BONUS, cascadeLevel);
    points *= cascadeMult;
    totalMultiplier *= cascadeMult;
  }

  // Apply critical multiplier (POSITIVE PREDICTION ERROR)
  if (isCritical) {
    points *= GAME_CONFIG.CRITICAL_MULTIPLIER;
    totalMultiplier *= GAME_CONFIG.CRITICAL_MULTIPLIER;

    const megaPoints = Math.floor(points);
    return {
      points: megaPoints,
      isCritical: true,
      totalMultiplier: Math.floor(totalMultiplier * 10) / 10,
      message: cascadeLevel > 0 ? `MEGA CASCADE x${Math.floor(totalMultiplier)}!` : 'CRITICAL HIT!',
      screenShake: true,
    };
  }

  // Special messages for high combos
  if (comboCount >= 5) {
    return {
      points: Math.floor(points),
      isCritical: false,
      totalMultiplier: Math.floor(totalMultiplier * 10) / 10,
      message: comboCount >= 8 ? 'UNSTOPPABLE!' : comboCount >= 6 ? 'ON FIRE!' : 'COMBO FRENZY!',
      screenShake: comboCount >= 6,
    };
  }

  // Special messages for cascades
  if (cascadeLevel > 0) {
    const cascadeMessages = ['CHAIN!', 'DOUBLE!', 'TRIPLE!', 'MEGA!', 'ULTRA!', 'GODLIKE!'];
    return {
      points: Math.floor(points),
      isCritical: false,
      totalMultiplier: Math.floor(totalMultiplier * 10) / 10,
      message: cascadeMessages[Math.min(cascadeLevel - 1, cascadeMessages.length - 1)],
      screenShake: cascadeLevel >= 3,
    };
  }

  return {
    points: Math.floor(points),
    isCritical: false,
    totalMultiplier: 1,
    message: null,
    screenShake: false,
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
// TILE MATCHING LOGIC (3-in-a-row style)
// ============================================

const TILE_TYPES = ['cyan', 'magenta', 'amber', 'violet'];

// Special tile types - created by matching 4+ tiles
export const SPECIAL_TILES = {
  BOMB: 'bomb',       // Match 4 in L/T shape - clears 3x3 area
  LINE_H: 'line_h',   // Match 4 in row - clears entire row
  LINE_V: 'line_v',   // Match 4 in column - clears entire column
  RAINBOW: 'rainbow', // Match 5+ - matches any color, clears all of one type
};

// Spawn chances for special tiles during normal spawning (rare treats)
const SPECIAL_SPAWN_CHANCE = {
  [SPECIAL_TILES.BOMB]: 0.02,    // 2% chance
  [SPECIAL_TILES.LINE_H]: 0.015, // 1.5% chance
  [SPECIAL_TILES.LINE_V]: 0.015, // 1.5% chance
  [SPECIAL_TILES.RAINBOW]: 0.005, // 0.5% chance (very rare)
};

/**
 * Determines if a tile is a special tile
 */
export function isSpecialTile(tile) {
  return tile && Object.values(SPECIAL_TILES).includes(tile.special);
}

/**
 * Get tiles to clear when a special tile is activated
 */
export function getSpecialTileClearTargets(tile, allTiles, gridSize) {
  const targets = new Set();
  targets.add(tile.id);

  switch (tile.special) {
    case SPECIAL_TILES.BOMB:
      // Clear 3x3 area around the tile
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const targetX = tile.x + dx;
          const targetY = tile.y + dy;
          if (targetX >= 0 && targetX < gridSize && targetY >= 0 && targetY < gridSize) {
            const target = allTiles.find(t => t.x === targetX && t.y === targetY);
            if (target) targets.add(target.id);
          }
        }
      }
      break;

    case SPECIAL_TILES.LINE_H:
      // Clear entire row
      allTiles.forEach(t => {
        if (t.y === tile.y) targets.add(t.id);
      });
      break;

    case SPECIAL_TILES.LINE_V:
      // Clear entire column
      allTiles.forEach(t => {
        if (t.x === tile.x) targets.add(t.id);
      });
      break;

    case SPECIAL_TILES.RAINBOW: {
      // Clear all tiles of the same base color, or random color if no color
      const targetColor = tile.type || TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];
      allTiles.forEach(t => {
        if (t.type === targetColor) targets.add(t.id);
      });
      break;
    }
  }

  return Array.from(targets);
}

/**
 * Determine what special tile to create based on match pattern
 */
export function determineSpecialTileFromMatch(matchedTiles) {
  if (matchedTiles.length >= 5) {
    return SPECIAL_TILES.RAINBOW;
  }

  if (matchedTiles.length === 4) {
    // Check if it's a horizontal or vertical line
    const xs = matchedTiles.map(t => t.x);
    const ys = matchedTiles.map(t => t.y);
    const uniqueXs = new Set(xs).size;
    const uniqueYs = new Set(ys).size;

    if (uniqueYs === 1) return SPECIAL_TILES.LINE_H; // Horizontal line
    if (uniqueXs === 1) return SPECIAL_TILES.LINE_V; // Vertical line
    return SPECIAL_TILES.BOMB; // L or T shape
  }

  return null; // Normal match, no special tile
}

/**
 * Maybe spawn a special tile (for random spawning)
 */
export function maybeGetSpecialType() {
  const roll = Math.random();
  let cumulative = 0;

  for (const [special, chance] of Object.entries(SPECIAL_SPAWN_CHANCE)) {
    cumulative += chance;
    if (roll < cumulative) {
      return special;
    }
  }

  return null; // No special tile
}

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
 * Find all 3+ in-a-row matches (horizontal and vertical)
 * Returns array of tile IDs that are part of matches
 */
export function findAllMatches(tiles, gridSize) {
  const grid = createGridMap(tiles);
  const matchedIds = new Set();

  // Check horizontal matches
  for (let y = 0; y < gridSize; y++) {
    let runType = null;
    let runTiles = [];

    for (let x = 0; x <= gridSize; x++) {
      const tile = grid[`${x},${y}`];
      const tileType = tile ? tile.type : null;

      if (tileType && tileType === runType) {
        runTiles.push(tile);
      } else {
        // End of run - check if it's a match (3+)
        if (runTiles.length >= 3) {
          runTiles.forEach(t => matchedIds.add(t.id));
        }
        // Start new run
        runType = tileType;
        runTiles = tile ? [tile] : [];
      }
    }
  }

  // Check vertical matches
  for (let x = 0; x < gridSize; x++) {
    let runType = null;
    let runTiles = [];

    for (let y = 0; y <= gridSize; y++) {
      const tile = grid[`${x},${y}`];
      const tileType = tile ? tile.type : null;

      if (tileType && tileType === runType) {
        runTiles.push(tile);
      } else {
        // End of run - check if it's a match (3+)
        if (runTiles.length >= 3) {
          runTiles.forEach(t => matchedIds.add(t.id));
        }
        // Start new run
        runType = tileType;
        runTiles = tile ? [tile] : [];
      }
    }
  }

  return Array.from(matchedIds);
}

/**
 * Find tiles that are part of a match containing the given tile
 * Used when a swap is made to find what matches were created
 */
export function findMatchingGroup(tiles, tileId, gridSize) {
  const tile = tiles.find(t => t.id === tileId);
  if (!tile) return [];

  const grid = createGridMap(tiles);
  const matchedIds = new Set();

  // Check horizontal match through this tile
  let horzTiles = [tile];
  // Look left
  for (let x = tile.x - 1; x >= 0; x--) {
    const t = grid[`${x},${tile.y}`];
    if (t && t.type === tile.type) horzTiles.unshift(t);
    else break;
  }
  // Look right
  for (let x = tile.x + 1; x < gridSize; x++) {
    const t = grid[`${x},${tile.y}`];
    if (t && t.type === tile.type) horzTiles.push(t);
    else break;
  }
  if (horzTiles.length >= 3) {
    horzTiles.forEach(t => matchedIds.add(t.id));
  }

  // Check vertical match through this tile
  let vertTiles = [tile];
  // Look up
  for (let y = tile.y - 1; y >= 0; y--) {
    const t = grid[`${tile.x},${y}`];
    if (t && t.type === tile.type) vertTiles.unshift(t);
    else break;
  }
  // Look down
  for (let y = tile.y + 1; y < gridSize; y++) {
    const t = grid[`${tile.x},${y}`];
    if (t && t.type === tile.type) vertTiles.push(t);
    else break;
  }
  if (vertTiles.length >= 3) {
    vertTiles.forEach(t => matchedIds.add(t.id));
  }

  return Array.from(matchedIds);
}

/**
 * Check if swapping two tiles would create a match
 */
export function wouldSwapCreateMatch(tiles, tile1, tile2, gridSize) {
  // Create a copy with swapped positions
  const swappedTiles = tiles.map(t => {
    if (t.id === tile1.id) return { ...t, x: tile2.x, y: tile2.y };
    if (t.id === tile2.id) return { ...t, x: tile1.x, y: tile1.y };
    return t;
  });

  // Check if either swapped tile creates a match
  const matches1 = findMatchingGroup(swappedTiles, tile1.id, gridSize);
  const matches2 = findMatchingGroup(swappedTiles, tile2.id, gridSize);

  return matches1.length > 0 || matches2.length > 0;
}

/**
 * Find all valid swap moves on the board
 * Returns array of {tile1, tile2, direction} objects
 */
export function findValidMoves(tiles, gridSize) {
  const validMoves = [];
  const grid = createGridMap(tiles);

  for (const tile of tiles) {
    // Check right neighbor
    const rightTile = grid[`${tile.x + 1},${tile.y}`];
    if (rightTile && wouldSwapCreateMatch(tiles, tile, rightTile, gridSize)) {
      validMoves.push({ tile1: tile, tile2: rightTile, direction: 'right' });
    }

    // Check down neighbor
    const downTile = grid[`${tile.x},${tile.y + 1}`];
    if (downTile && wouldSwapCreateMatch(tiles, tile, downTile, gridSize)) {
      validMoves.push({ tile1: tile, tile2: downTile, direction: 'down' });
    }
  }

  return validMoves;
}

/**
 * Find tiles that are currently clearable (part of 3+ match)
 * For highlighting purposes
 */
export function findClearableTiles(tiles, gridSize) {
  return findAllMatches(tiles, gridSize);
}

/**
 * Shuffle tiles to create new possibilities
 * Ensures at least one valid swap exists after shuffle
 */
export function shuffleTiles(tiles, gridSize) {
  let shuffled = tiles.map(t => ({
    ...t,
    type: TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)],
  }));

  // Keep shuffling until we have at least one valid move
  let attempts = 0;
  while (findValidMoves(shuffled, gridSize).length === 0 && attempts < 100) {
    shuffled = tiles.map(t => ({
      ...t,
      type: TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)],
    }));
    attempts++;
  }

  return shuffled;
}

// ============================================
// SMART SPAWNING (Proactive match creation)
// ============================================

/**
 * Generate a tile type that's likely to create match opportunities
 * Looks at adjacent tiles and biases toward colors that could form matches
 */
export function generateSmartTileType(x, y, existingTiles, gridSize) {
  const grid = createGridMap(existingTiles);

  // Count adjacent tiles by type
  const adjacentCounts = {};
  const neighbors = [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
    { x: x - 2, y }, // Check 2 away for potential matches
    { x: x + 2, y },
    { x, y: y - 2 },
    { x, y: y + 2 },
  ];

  for (const pos of neighbors) {
    if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) continue;
    const tile = grid[`${pos.x},${pos.y}`];
    if (tile) {
      adjacentCounts[tile.type] = (adjacentCounts[tile.type] || 0) + 1;
    }
  }

  // 60% chance to bias toward creating opportunities, 40% pure random
  if (Math.random() < 0.6 && Object.keys(adjacentCounts).length > 0) {
    // Weight toward colors that appear near this position
    const weights = [];
    for (const type of TILE_TYPES) {
      const count = adjacentCounts[type] || 0;
      // More adjacent = higher weight (but not guaranteed)
      weights.push({ type, weight: 1 + count * 2 });
    }

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { type, weight } of weights) {
      random -= weight;
      if (random <= 0) return type;
    }
  }

  // Fallback to random
  return TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];
}

/**
 * Generate initial board ensuring no starting matches and valid moves exist
 */
export function generateInitialBoard(gridSize, tileCount) {
  const tiles = [];
  let idCounter = 0;

  // Generate positions
  const positions = [];
  for (let i = 0; i < tileCount; i++) {
    const pos = generateRandomPosition(gridSize, positions);
    if (pos) positions.push(pos);
  }

  // Assign types avoiding initial matches
  for (const pos of positions) {
    let type;
    let attempts = 0;

    do {
      type = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];
      attempts++;

      // Check if this would create a match
      const testTile = { id: idCounter, x: pos.x, y: pos.y, type };
      const testTiles = [...tiles, testTile];
      const matches = findMatchingGroup(testTiles, idCounter, gridSize);

      if (matches.length === 0 || attempts > 20) break;
    } while (attempts <= 20);

    tiles.push({ id: idCounter++, x: pos.x, y: pos.y, type });
  }

  // Ensure at least one valid move exists
  if (findValidMoves(tiles, gridSize).length === 0) {
    return shuffleTiles(tiles, gridSize);
  }

  return tiles;
}

// ============================================
// GRAVITY SYSTEM
// ============================================

/**
 * Applies gravity to tiles - makes tiles fall down to fill gaps
 * ALSO spawns new tiles from the TOP of each column (Candy Crush style)
 * Returns the new tile positions and fall information
 *
 * @param {Array} tiles - Current tiles array
 * @param {number} gridSize - Size of the grid
 * @param {function} getNextTileId - Function to get next tile ID (optional)
 * @returns {Object} - { newTiles, fallAnimations, spawnedTiles }
 */
export function applyGravity(tiles, gridSize, getNextTileId = null) {
  // Create a copy of tiles to modify
  const newTiles = tiles.map(t => ({ ...t }));
  const fallAnimations = []; // Track which tiles need fall animation
  const spawnedTiles = []; // Track newly spawned tiles

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

      // SPAWN NEW TILES FROM TOP to fill empty slots
      if (getNextTileId) {
        // After gravity, count how many empty slots are at top of column
        const tilesInColumn = columnTiles.length;
        const emptySlots = gridSize - tilesInColumn;

        for (let i = 0; i < emptySlots; i++) {
          const newY = i; // Fill from top (y=0, 1, 2, etc.)

          // Simple match avoidance - just check immediate neighbors
          // Much faster than full board scan
          let type;
          const allCurrentTiles = [...newTiles, ...spawnedTiles];
          const grid = createGridMap(allCurrentTiles);

          // Get neighbor colors to avoid
          const leftTile = grid[`${x - 1},${newY}`];
          const left2Tile = grid[`${x - 2},${newY}`];
          const upTile = grid[`${x},${newY - 1}`];
          const up2Tile = grid[`${x},${newY - 2}`];

          // Find types that would create a match
          const avoidTypes = new Set();
          if (leftTile && left2Tile && leftTile.type === left2Tile.type) {
            avoidTypes.add(leftTile.type);
          }
          if (upTile && up2Tile && upTile.type === up2Tile.type) {
            avoidTypes.add(upTile.type);
          }

          // Pick a type that doesn't create a match
          const safeTypes = TILE_TYPES.filter(t => !avoidTypes.has(t));
          type = safeTypes.length > 0
            ? safeTypes[Math.floor(Math.random() * safeTypes.length)]
            : TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];

          // Check if this should be a special tile (rare spawn)
          const specialType = maybeGetSpecialType();

          const newTile = {
            id: getNextTileId(),
            x: x,
            y: newY,
            type,
            isNew: true,
            special: specialType || undefined,
          };
          spawnedTiles.push(newTile);

          // Record fall animation for spawned tile
          fallAnimations.push({
            tileId: newTile.id,
            fromY: -1 - (emptySlots - 1 - i),
            toY: newY,
            distance: emptySlots - i,
            isSpawned: true,
          });
        }
      }
    }
  }

  // Combine existing tiles with spawned tiles
  const allTiles = [...newTiles, ...spawnedTiles];

  return { newTiles: allTiles, fallAnimations, spawnedTiles };
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
