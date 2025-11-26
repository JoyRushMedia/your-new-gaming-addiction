/**
 * LEVEL SYSTEM
 * Implements Zeigarnik Effect through discrete goals and progression
 * Each uncompleted level creates "cognitive tension" that intrudes on thoughts
 */

// ============================================
// GOAL TYPES
// ============================================

export const GOAL_TYPES = {
  CLEAR_TILES: 'clear_tiles',      // Clear X tiles total
  REACH_SCORE: 'reach_score',      // Reach X score
  CHAIN_COMBO: 'chain_combo',      // Create X-chain cascade
  MAX_COMBO: 'max_combo',          // Reach combo multiplier of X
  CLEAR_FAST: 'clear_fast',        // Clear X tiles within Y seconds
  SURVIVE_TIME: 'survive_time',    // Survive for X seconds
  LOW_ENTROPY: 'low_entropy',      // Get entropy below X%
};

// ============================================
// LEVEL DEFINITIONS
// ============================================

/**
 * Level structure:
 * - id: Unique identifier
 * - name: Display name
 * - description: Brief goal description
 * - goalType: Type of goal from GOAL_TYPES
 * - goalValue: Target value for goal
 * - secondaryValue: Optional (e.g., time limit for CLEAR_FAST)
 * - starThresholds: [1-star, 2-star, 3-star] performance thresholds
 * - spawnDelay: Base spawn delay (lower = harder)
 * - initialTiles: Starting tile count
 * - maxTime: Optional time limit in seconds (null = unlimited)
 */

export const LEVELS = [
  // ============================================
  // WORLD 1: BASICS (Levels 1-10)
  // Tutorial-style, introduce mechanics
  // ============================================
  {
    id: 1,
    name: "First Contact",
    description: "Clear 10 tiles to begin",
    goalType: GOAL_TYPES.CLEAR_TILES,
    goalValue: 10,
    starThresholds: { score: [50, 100, 200] },
    spawnDelay: 2000,
    initialTiles: 18,
    maxTime: null,
  },
  {
    id: 2,
    name: "Getting Warmer",
    description: "Clear 15 tiles",
    goalType: GOAL_TYPES.CLEAR_TILES,
    goalValue: 15,
    starThresholds: { score: [100, 200, 350] },
    spawnDelay: 1800,
    initialTiles: 18,
    maxTime: null,
  },
  {
    id: 3,
    name: "Chain Reaction",
    description: "Create a 2-chain cascade",
    goalType: GOAL_TYPES.CHAIN_COMBO,
    goalValue: 2,
    starThresholds: { score: [150, 300, 500] },
    spawnDelay: 1800,
    initialTiles: 20,
    maxTime: null,
  },
  {
    id: 4,
    name: "Score Hunter",
    description: "Reach 300 points",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 300,
    starThresholds: { time: [120, 60, 30] }, // Faster = more stars
    spawnDelay: 1600,
    initialTiles: 20,
    maxTime: null,
  },
  {
    id: 5,
    name: "Quick Fingers",
    description: "Clear 12 tiles in 30 seconds",
    goalType: GOAL_TYPES.CLEAR_FAST,
    goalValue: 12,
    secondaryValue: 30,
    starThresholds: { score: [100, 200, 350] },
    spawnDelay: 1400,
    initialTiles: 22,
    maxTime: 30,
  },
  {
    id: 6,
    name: "Combo Master",
    description: "Reach x3 combo",
    goalType: GOAL_TYPES.MAX_COMBO,
    goalValue: 3,
    starThresholds: { score: [200, 400, 600] },
    spawnDelay: 1500,
    initialTiles: 20,
    maxTime: null,
  },
  {
    id: 7,
    name: "Order Restored",
    description: "Get entropy below 20%",
    goalType: GOAL_TYPES.LOW_ENTROPY,
    goalValue: 20,
    starThresholds: { time: [90, 45, 20] },
    spawnDelay: 1600,
    initialTiles: 24,
    maxTime: null,
  },
  {
    id: 8,
    name: "Endurance",
    description: "Survive for 60 seconds",
    goalType: GOAL_TYPES.SURVIVE_TIME,
    goalValue: 60,
    starThresholds: { score: [300, 600, 1000] },
    spawnDelay: 1200,
    initialTiles: 20,
    maxTime: null,
  },
  {
    id: 9,
    name: "Rising Tide",
    description: "Clear 25 tiles",
    goalType: GOAL_TYPES.CLEAR_TILES,
    goalValue: 25,
    starThresholds: { score: [250, 500, 800] },
    spawnDelay: 1400,
    initialTiles: 22,
    maxTime: null,
  },
  {
    id: 10,
    name: "World 1 Boss",
    description: "Reach 750 points",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 750,
    starThresholds: { time: [180, 90, 45] },
    spawnDelay: 1200,
    initialTiles: 24,
    maxTime: null,
  },

  // ============================================
  // WORLD 2: PRESSURE (Levels 11-20)
  // Introduce time pressure
  // ============================================
  {
    id: 11,
    name: "Against Time",
    description: "Clear 15 tiles in 25 seconds",
    goalType: GOAL_TYPES.CLEAR_FAST,
    goalValue: 15,
    secondaryValue: 25,
    starThresholds: { score: [150, 300, 500] },
    spawnDelay: 1200,
    initialTiles: 24,
    maxTime: 25,
  },
  {
    id: 12,
    name: "Chain Lightning",
    description: "Create a 3-chain cascade",
    goalType: GOAL_TYPES.CHAIN_COMBO,
    goalValue: 3,
    starThresholds: { score: [300, 600, 1000] },
    spawnDelay: 1300,
    initialTiles: 22,
    maxTime: null,
  },
  {
    id: 13,
    name: "Point Rush",
    description: "Reach 500 points in 45 seconds",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 500,
    starThresholds: { tiles: [15, 25, 40] },
    spawnDelay: 1100,
    initialTiles: 24,
    maxTime: 45,
  },
  {
    id: 14,
    name: "Combo Frenzy",
    description: "Reach x5 combo",
    goalType: GOAL_TYPES.MAX_COMBO,
    goalValue: 5,
    starThresholds: { score: [400, 800, 1200] },
    spawnDelay: 1200,
    initialTiles: 22,
    maxTime: null,
  },
  {
    id: 15,
    name: "Entropy Control",
    description: "Get entropy below 15%",
    goalType: GOAL_TYPES.LOW_ENTROPY,
    goalValue: 15,
    starThresholds: { time: [120, 60, 30] },
    spawnDelay: 1400,
    initialTiles: 26,
    maxTime: null,
  },
  {
    id: 16,
    name: "Speed Demon",
    description: "Clear 20 tiles in 20 seconds",
    goalType: GOAL_TYPES.CLEAR_FAST,
    goalValue: 20,
    secondaryValue: 20,
    starThresholds: { score: [200, 400, 700] },
    spawnDelay: 1000,
    initialTiles: 26,
    maxTime: 20,
  },
  {
    id: 17,
    name: "Survivor",
    description: "Survive 90 seconds",
    goalType: GOAL_TYPES.SURVIVE_TIME,
    goalValue: 90,
    starThresholds: { score: [600, 1200, 2000] },
    spawnDelay: 1000,
    initialTiles: 22,
    maxTime: null,
  },
  {
    id: 18,
    name: "Mass Clear",
    description: "Clear 40 tiles",
    goalType: GOAL_TYPES.CLEAR_TILES,
    goalValue: 40,
    starThresholds: { time: [120, 60, 35] },
    spawnDelay: 1100,
    initialTiles: 24,
    maxTime: null,
  },
  {
    id: 19,
    name: "High Score",
    description: "Reach 1000 points",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 1000,
    starThresholds: { time: [150, 75, 40] },
    spawnDelay: 1000,
    initialTiles: 24,
    maxTime: null,
  },
  {
    id: 20,
    name: "World 2 Boss",
    description: "Create a 4-chain cascade",
    goalType: GOAL_TYPES.CHAIN_COMBO,
    goalValue: 4,
    starThresholds: { score: [500, 1000, 1800] },
    spawnDelay: 1000,
    initialTiles: 24,
    maxTime: null,
  },

  // ============================================
  // WORLD 3: INTENSITY (Levels 21-30)
  // Higher difficulty, faster spawns
  // ============================================
  {
    id: 21,
    name: "No Rest",
    description: "Clear 25 tiles in 20 seconds",
    goalType: GOAL_TYPES.CLEAR_FAST,
    goalValue: 25,
    secondaryValue: 20,
    starThresholds: { score: [300, 600, 1000] },
    spawnDelay: 800,
    initialTiles: 28,
    maxTime: 20,
  },
  {
    id: 22,
    name: "Combo Legend",
    description: "Reach x7 combo",
    goalType: GOAL_TYPES.MAX_COMBO,
    goalValue: 7,
    starThresholds: { score: [700, 1400, 2200] },
    spawnDelay: 900,
    initialTiles: 24,
    maxTime: null,
  },
  {
    id: 23,
    name: "Deep Clean",
    description: "Get entropy below 10%",
    goalType: GOAL_TYPES.LOW_ENTROPY,
    goalValue: 10,
    starThresholds: { time: [150, 75, 40] },
    spawnDelay: 1000,
    initialTiles: 28,
    maxTime: null,
  },
  {
    id: 24,
    name: "Point Blitz",
    description: "Reach 800 points in 30 seconds",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 800,
    starThresholds: { tiles: [25, 40, 60] },
    spawnDelay: 700,
    initialTiles: 26,
    maxTime: 30,
  },
  {
    id: 25,
    name: "Cascade King",
    description: "Create a 5-chain cascade",
    goalType: GOAL_TYPES.CHAIN_COMBO,
    goalValue: 5,
    starThresholds: { score: [800, 1600, 2500] },
    spawnDelay: 900,
    initialTiles: 26,
    maxTime: null,
  },
  {
    id: 26,
    name: "Ironman",
    description: "Survive 120 seconds",
    goalType: GOAL_TYPES.SURVIVE_TIME,
    goalValue: 120,
    starThresholds: { score: [1000, 2000, 3500] },
    spawnDelay: 800,
    initialTiles: 24,
    maxTime: null,
  },
  {
    id: 27,
    name: "Tile Tornado",
    description: "Clear 60 tiles",
    goalType: GOAL_TYPES.CLEAR_TILES,
    goalValue: 60,
    starThresholds: { time: [150, 80, 45] },
    spawnDelay: 900,
    initialTiles: 26,
    maxTime: null,
  },
  {
    id: 28,
    name: "Lightning Round",
    description: "Clear 30 tiles in 15 seconds",
    goalType: GOAL_TYPES.CLEAR_FAST,
    goalValue: 30,
    secondaryValue: 15,
    starThresholds: { score: [400, 800, 1400] },
    spawnDelay: 600,
    initialTiles: 30,
    maxTime: 15,
  },
  {
    id: 29,
    name: "Score Legend",
    description: "Reach 1500 points",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 1500,
    starThresholds: { time: [180, 90, 50] },
    spawnDelay: 800,
    initialTiles: 26,
    maxTime: null,
  },
  {
    id: 30,
    name: "World 3 Boss",
    description: "Reach x10 combo",
    goalType: GOAL_TYPES.MAX_COMBO,
    goalValue: 10,
    starThresholds: { score: [1200, 2400, 4000] },
    spawnDelay: 700,
    initialTiles: 26,
    maxTime: null,
  },

  // ============================================
  // WORLD 4: MASTERY (Levels 31-40)
  // Expert-level challenges
  // ============================================
  {
    id: 31,
    name: "Perfection",
    description: "Get entropy below 5%",
    goalType: GOAL_TYPES.LOW_ENTROPY,
    goalValue: 5,
    starThresholds: { time: [180, 90, 45] },
    spawnDelay: 900,
    initialTiles: 30,
    maxTime: null,
  },
  {
    id: 32,
    name: "Blitz Master",
    description: "Reach 1000 points in 25 seconds",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 1000,
    starThresholds: { tiles: [35, 55, 80] },
    spawnDelay: 600,
    initialTiles: 28,
    maxTime: 25,
  },
  {
    id: 33,
    name: "Chain God",
    description: "Create a 6-chain cascade",
    goalType: GOAL_TYPES.CHAIN_COMBO,
    goalValue: 6,
    starThresholds: { score: [1000, 2000, 3500] },
    spawnDelay: 800,
    initialTiles: 28,
    maxTime: null,
  },
  {
    id: 34,
    name: "Endurance Pro",
    description: "Survive 180 seconds",
    goalType: GOAL_TYPES.SURVIVE_TIME,
    goalValue: 180,
    starThresholds: { score: [2000, 4000, 7000] },
    spawnDelay: 700,
    initialTiles: 24,
    maxTime: null,
  },
  {
    id: 35,
    name: "Tile Annihilator",
    description: "Clear 80 tiles",
    goalType: GOAL_TYPES.CLEAR_TILES,
    goalValue: 80,
    starThresholds: { time: [180, 100, 60] },
    spawnDelay: 800,
    initialTiles: 26,
    maxTime: null,
  },
  {
    id: 36,
    name: "Speed Legend",
    description: "Clear 40 tiles in 15 seconds",
    goalType: GOAL_TYPES.CLEAR_FAST,
    goalValue: 40,
    secondaryValue: 15,
    starThresholds: { score: [600, 1200, 2000] },
    spawnDelay: 500,
    initialTiles: 32,
    maxTime: 15,
  },
  {
    id: 37,
    name: "Combo Deity",
    description: "Reach x12 combo",
    goalType: GOAL_TYPES.MAX_COMBO,
    goalValue: 12,
    starThresholds: { score: [1500, 3000, 5000] },
    spawnDelay: 600,
    initialTiles: 28,
    maxTime: null,
  },
  {
    id: 38,
    name: "Point God",
    description: "Reach 2500 points",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 2500,
    starThresholds: { time: [240, 120, 70] },
    spawnDelay: 700,
    initialTiles: 26,
    maxTime: null,
  },
  {
    id: 39,
    name: "Ultimate Clear",
    description: "Clear 100 tiles",
    goalType: GOAL_TYPES.CLEAR_TILES,
    goalValue: 100,
    starThresholds: { time: [240, 130, 80] },
    spawnDelay: 700,
    initialTiles: 28,
    maxTime: null,
  },
  {
    id: 40,
    name: "World 4 Boss",
    description: "Create a 7-chain cascade",
    goalType: GOAL_TYPES.CHAIN_COMBO,
    goalValue: 7,
    starThresholds: { score: [1500, 3000, 5500] },
    spawnDelay: 600,
    initialTiles: 28,
    maxTime: null,
  },

  // ============================================
  // WORLD 5: LEGENDARY (Levels 41-50)
  // Ultimate challenges for completionists
  // ============================================
  {
    id: 41,
    name: "Impossible Clean",
    description: "Get entropy to 0%",
    goalType: GOAL_TYPES.LOW_ENTROPY,
    goalValue: 0,
    starThresholds: { time: [300, 150, 80] },
    spawnDelay: 800,
    initialTiles: 32,
    maxTime: null,
  },
  {
    id: 42,
    name: "Lightning God",
    description: "Clear 50 tiles in 15 seconds",
    goalType: GOAL_TYPES.CLEAR_FAST,
    goalValue: 50,
    secondaryValue: 15,
    starThresholds: { score: [800, 1600, 2800] },
    spawnDelay: 400,
    initialTiles: 34,
    maxTime: 15,
  },
  {
    id: 43,
    name: "Marathon",
    description: "Survive 300 seconds",
    goalType: GOAL_TYPES.SURVIVE_TIME,
    goalValue: 300,
    starThresholds: { score: [5000, 10000, 18000] },
    spawnDelay: 600,
    initialTiles: 24,
    maxTime: null,
  },
  {
    id: 44,
    name: "Combo Overlord",
    description: "Reach x15 combo",
    goalType: GOAL_TYPES.MAX_COMBO,
    goalValue: 15,
    starThresholds: { score: [2000, 4000, 7000] },
    spawnDelay: 500,
    initialTiles: 28,
    maxTime: null,
  },
  {
    id: 45,
    name: "Score Emperor",
    description: "Reach 4000 points",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 4000,
    starThresholds: { time: [360, 180, 100] },
    spawnDelay: 600,
    initialTiles: 28,
    maxTime: null,
  },
  {
    id: 46,
    name: "Cascade Master",
    description: "Create an 8-chain cascade",
    goalType: GOAL_TYPES.CHAIN_COMBO,
    goalValue: 8,
    starThresholds: { score: [2000, 4000, 7000] },
    spawnDelay: 600,
    initialTiles: 30,
    maxTime: null,
  },
  {
    id: 47,
    name: "Tile Destroyer",
    description: "Clear 150 tiles",
    goalType: GOAL_TYPES.CLEAR_TILES,
    goalValue: 150,
    starThresholds: { time: [360, 200, 120] },
    spawnDelay: 600,
    initialTiles: 28,
    maxTime: null,
  },
  {
    id: 48,
    name: "Ultimate Blitz",
    description: "Reach 2000 points in 30 seconds",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 2000,
    starThresholds: { tiles: [60, 90, 130] },
    spawnDelay: 400,
    initialTiles: 32,
    maxTime: 30,
  },
  {
    id: 49,
    name: "Combo God",
    description: "Reach x20 combo",
    goalType: GOAL_TYPES.MAX_COMBO,
    goalValue: 20,
    starThresholds: { score: [3000, 6000, 10000] },
    spawnDelay: 500,
    initialTiles: 30,
    maxTime: null,
  },
  {
    id: 50,
    name: "THE FINAL BOSS",
    description: "Reach 6000 points",
    goalType: GOAL_TYPES.REACH_SCORE,
    goalValue: 6000,
    starThresholds: { time: [480, 240, 140] },
    spawnDelay: 500,
    initialTiles: 28,
    maxTime: null,
  },
];

// ============================================
// WORLD DEFINITIONS
// ============================================

export const WORLDS = [
  { id: 1, name: "Basics", levels: [1, 10], color: '#00f0ff' },
  { id: 2, name: "Pressure", levels: [11, 20], color: '#ff00ff' },
  { id: 3, name: "Intensity", levels: [21, 30], color: '#ffb000' },
  { id: 4, name: "Mastery", levels: [31, 40], color: '#a855f7' },
  { id: 5, name: "Legendary", levels: [41, 50], color: '#ff3366' },
];

// ============================================
// PROGRESS MANAGEMENT
// ============================================

const PROGRESS_KEY = 'entropyReduction_levelProgress';

/**
 * Get level progress from localStorage
 * @returns {Object} - { unlockedLevels: number[], stars: { levelId: stars }, highScores: { levelId: score } }
 */
export function getLevelProgress() {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore
  }

  // Default: only level 1 unlocked
  return {
    unlockedLevels: [1],
    stars: {},
    highScores: {},
    bestTimes: {},
  };
}

/**
 * Save level progress
 * @param {Object} progress - Progress object
 */
export function saveLevelProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore
  }
}

/**
 * Complete a level and update progress
 * @param {number} levelId - Completed level ID
 * @param {number} score - Final score
 * @param {number} time - Completion time in seconds
 * @param {number} tilesCleared - Tiles cleared
 * @returns {Object} - { newStars, isNewRecord, unlockedLevel }
 */
export function completeLevel(levelId, score, time, tilesCleared) {
  const progress = getLevelProgress();
  const level = LEVELS.find(l => l.id === levelId);

  if (!level) return { newStars: 0, isNewRecord: false, unlockedLevel: null };

  // Calculate stars based on threshold type
  let newStars = 1; // Completing gives at least 1 star
  const thresholds = level.starThresholds;

  if (thresholds.score) {
    if (score >= thresholds.score[2]) newStars = 3;
    else if (score >= thresholds.score[1]) newStars = 2;
  } else if (thresholds.time) {
    if (time <= thresholds.time[2]) newStars = 3;
    else if (time <= thresholds.time[1]) newStars = 2;
  } else if (thresholds.tiles) {
    if (tilesCleared >= thresholds.tiles[2]) newStars = 3;
    else if (tilesCleared >= thresholds.tiles[1]) newStars = 2;
  }

  // Check if this is a new record
  const previousStars = progress.stars[levelId] || 0;
  const previousHighScore = progress.highScores[levelId] || 0;
  const isNewRecord = score > previousHighScore;

  // Update stars (keep best)
  if (newStars > previousStars) {
    progress.stars[levelId] = newStars;
  }

  // Update high score
  if (score > previousHighScore) {
    progress.highScores[levelId] = score;
  }

  // Update best time
  const previousBestTime = progress.bestTimes[levelId];
  if (!previousBestTime || time < previousBestTime) {
    progress.bestTimes[levelId] = time;
  }

  // Unlock next level
  let unlockedLevel = null;
  const nextLevelId = levelId + 1;
  if (nextLevelId <= LEVELS.length && !progress.unlockedLevels.includes(nextLevelId)) {
    progress.unlockedLevels.push(nextLevelId);
    unlockedLevel = nextLevelId;
  }

  saveLevelProgress(progress);

  return {
    newStars: Math.max(newStars, previousStars),
    earnedStars: newStars,
    isNewRecord,
    unlockedLevel,
  };
}

/**
 * Get level by ID
 * @param {number} levelId
 * @returns {Object|null}
 */
export function getLevel(levelId) {
  return LEVELS.find(l => l.id === levelId) || null;
}

/**
 * Get world for a level
 * @param {number} levelId
 * @returns {Object|null}
 */
export function getWorldForLevel(levelId) {
  return WORLDS.find(w => levelId >= w.levels[0] && levelId <= w.levels[1]) || null;
}

/**
 * Get total stars earned
 * @returns {number}
 */
export function getTotalStars() {
  const progress = getLevelProgress();
  return Object.values(progress.stars).reduce((sum, s) => sum + s, 0);
}

/**
 * Get maximum possible stars
 * @returns {number}
 */
export function getMaxStars() {
  return LEVELS.length * 3;
}

/**
 * Check if level is unlocked
 * @param {number} levelId
 * @returns {boolean}
 */
export function isLevelUnlocked(levelId) {
  const progress = getLevelProgress();
  return progress.unlockedLevels.includes(levelId);
}

/**
 * Get goal description text
 * @param {Object} level
 * @returns {string}
 */
export function getGoalDescription(level) {
  switch (level.goalType) {
    case GOAL_TYPES.CLEAR_TILES:
      return `Clear ${level.goalValue} tiles`;
    case GOAL_TYPES.REACH_SCORE:
      return `Reach ${level.goalValue.toLocaleString()} points`;
    case GOAL_TYPES.CHAIN_COMBO:
      return `Create a ${level.goalValue}-chain cascade`;
    case GOAL_TYPES.MAX_COMBO:
      return `Reach x${level.goalValue} combo`;
    case GOAL_TYPES.CLEAR_FAST:
      return `Clear ${level.goalValue} tiles in ${level.secondaryValue}s`;
    case GOAL_TYPES.SURVIVE_TIME:
      return `Survive for ${level.goalValue} seconds`;
    case GOAL_TYPES.LOW_ENTROPY:
      return `Reduce entropy to ${level.goalValue}%`;
    default:
      return level.description;
  }
}

/**
 * Calculate goal progress percentage
 * @param {Object} level
 * @param {Object} gameState - { score, tilesCleared, maxCombo, maxChain, entropy, timeElapsed }
 * @returns {number} - 0 to 100
 */
export function calculateGoalProgress(level, gameState) {
  switch (level.goalType) {
    case GOAL_TYPES.CLEAR_TILES:
      return Math.min(100, (gameState.tilesCleared / level.goalValue) * 100);
    case GOAL_TYPES.REACH_SCORE:
      return Math.min(100, (gameState.score / level.goalValue) * 100);
    case GOAL_TYPES.CHAIN_COMBO:
      return Math.min(100, (gameState.maxChain / level.goalValue) * 100);
    case GOAL_TYPES.MAX_COMBO:
      return Math.min(100, (gameState.maxCombo / level.goalValue) * 100);
    case GOAL_TYPES.CLEAR_FAST:
      return Math.min(100, (gameState.tilesCleared / level.goalValue) * 100);
    case GOAL_TYPES.SURVIVE_TIME:
      return Math.min(100, (gameState.timeElapsed / level.goalValue) * 100);
    case GOAL_TYPES.LOW_ENTROPY: {
      // Inverse - lower entropy = more progress
      const maxEntropy = 100;
      const targetReduction = maxEntropy - level.goalValue;
      const currentReduction = maxEntropy - gameState.entropy;
      return Math.min(100, (currentReduction / targetReduction) * 100);
    }
    default:
      return 0;
  }
}

/**
 * Check if goal is complete
 * @param {Object} level
 * @param {Object} gameState
 * @returns {boolean}
 */
export function isGoalComplete(level, gameState) {
  switch (level.goalType) {
    case GOAL_TYPES.CLEAR_TILES:
      return gameState.tilesCleared >= level.goalValue;
    case GOAL_TYPES.REACH_SCORE:
      return gameState.score >= level.goalValue;
    case GOAL_TYPES.CHAIN_COMBO:
      return gameState.maxChain >= level.goalValue;
    case GOAL_TYPES.MAX_COMBO:
      return gameState.maxCombo >= level.goalValue;
    case GOAL_TYPES.CLEAR_FAST:
      return gameState.tilesCleared >= level.goalValue && gameState.timeElapsed <= level.secondaryValue;
    case GOAL_TYPES.SURVIVE_TIME:
      return gameState.timeElapsed >= level.goalValue;
    case GOAL_TYPES.LOW_ENTROPY:
      return gameState.entropy <= level.goalValue;
    default:
      return false;
  }
}
