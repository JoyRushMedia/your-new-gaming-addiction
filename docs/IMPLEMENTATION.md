# Implementation Documentation
## Entropy-Reduction Core Loop — React + Tailwind

---

## Overview

This implementation translates the **Psychological Game Design Framework** into a functional React application with Tailwind CSS. Every component and function implements specific behavioral principles from the design spec.

---

## Architecture

### File Structure

```
/
├── src/
│   ├── components/
│   │   ├── GameBoard.jsx      # Main game loop + state management
│   │   └── Tile.jsx            # Individual entropy tile with juice
│   ├── lib/
│   │   └── gameLogic.js        # Pure functions for psychological mechanics
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # React entry point
│   └── index.css               # Design system + custom styles
├── docs/
│   ├── design/
│   │   └── PSYCHOLOGICAL_GAME_DESIGN_FRAMEWORK.md
│   └── IMPLEMENTATION.md       # This file
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Psychological Principles Implementation

### 1. Bushnell's Law (Easy to Learn, Hard to Master)

**Location**: `GameBoard.jsx:L186-195`, `Tile.jsx:L38-54`

**Implementation**:
- **Zero Tutorial Friction**: Game starts immediately with intuitive click-to-clear mechanics
- **Self-Evident Logic**: Clearable tiles pulse and glow—no explanation needed
- **Mastery Ceiling**: Combo system + entropy management creates optimization challenge

```jsx
// Simple interaction: Click tile → Clear
onClick={handleClick}

// Visual affordance: Clearable tiles are obvious
{isClearable && (
  <div className="opacity-20 animate-pulse" />
)}
```

**Cognitive Load**:
- ✓ **Extraneous Load**: Minimized (no complex controls)
- ✓ **Germane Load**: Maximized (strategy optimization)

---

### 2. Reward Prediction Error (RPE) & Variable Ratio Rewards

**Location**: `gameLogic.js:L30-76`

**Implementation**:
- **Baseline Expectation**: Standard +10 points per clear
- **Positive Prediction Error**: 10% chance of 3.5x "Critical Clear" bonus
- **Unpredictability**: RNG-based—prevents reward extinction

```javascript
export function rollForCriticalClear() {
  return Math.random() < GAME_CONFIG.CRITICAL_CLEAR_CHANCE; // 10%
}

export function calculateReward(basePoints, comboCount, isCritical) {
  // ...
  if (isCritical) {
    points *= GAME_CONFIG.CRITICAL_MULTIPLIER; // 3.5x spike
    return {
      points: Math.floor(points),
      isCritical: true,
      message: 'CRITICAL CLEAR!', // Visual feedback
    };
  }
}
```

**Neurochemical Effect**:
- Variable Ratio Schedule → Sustained dopamine seeking behavior
- Critical Clear → Massive dopamine spike (exceeds expectation)

**Visual Feedback** (`GameBoard.jsx:L147-153`):
```jsx
{criticalMessage && (
  <div className="text-impact text-6xl text-neon-violet animate-glitch">
    {criticalMessage}
  </div>
)}
```

---

### 3. Near-Miss Effect (Striatal Activation)

**Location**: `gameLogic.js:L80-104`, `GameBoard.jsx:L121-128`

**Implementation**:
- **Detection Threshold**: 85%+ completion without success = Near Miss
- **Visual Feedback**: "SO CLOSE! 85% COMPLETE" message
- **Purpose**: Reframe failure as "almost success" to sustain motivation

```javascript
export function detectNearMiss(completionPercentage) {
  return completionPercentage >= GAME_CONFIG.NEAR_MISS_THRESHOLD && // 0.85
         completionPercentage < 1.0;
}
```

```jsx
// Display near-miss feedback (GameBoard.jsx)
{isNearMiss && (
  <div className="text-neon-magenta">
    SO CLOSE! 85% COMPLETE
  </div>
)}
```

**Psychological Effect**:
- Near-misses activate striatum similar to wins (cite: 173, 176)
- Player perceives failure as "learning opportunity"
- Motivation persists despite setback

---

### 4. Zeigarnik Effect (Open Loops / Never-Ending Task)

**Location**: `GameBoard.jsx:L74-96`, `gameLogic.js:L108-134`

**Implementation**:
- **Continuous Entropy Spawning**: New tiles spawn every 1.5 seconds
- **Minimum Tiles**: Board NEVER goes below 2 tiles
- **Overlapping Loops**: Score + Combo + Entropy = 3 simultaneous progressions

```jsx
useEffect(() => {
  // Spawn new entropy after delay (Zeigarnik Effect)
  const spawnTimer = setTimeout(() => {
    const spawnCount = calculateEntropySpawn(tiles.length, GRID_SIZE);
    // Spawn 1-2 new tiles to maintain pressure
    // ...
  }, GAME_CONFIG.ENTROPY_SPAWN_DELAY); // 1500ms

  return () => clearTimeout(spawnTimer);
}, [tiles]);
```

```javascript
export function calculateEntropySpawn(currentTileCount, gridSize) {
  // NEVER allow board to be fully clear
  if (currentTileCount < GAME_CONFIG.MIN_ENTROPY_TILES) {
    return Math.min(3, emptySlots); // Force spawn
  }
  // Normal spawn rate
  return Math.random() > 0.5 ? 2 : 1;
}
```

**Psychological Effect**:
- Player can NEVER "finish" the game
- Creates cognitive itch → compulsion to return
- "Just one more clear" loop is infinite

---

### 5. Entropy Reduction (Cleaning Instinct)

**Location**: `gameLogic.js:L180-191`, `GameBoard.jsx:L63-69`, `index.css:L108-122`

**Implementation**:
- **High Entropy State**: Many tiles → Visual chaos → Cortisol elevation
- **Low Entropy State**: Few tiles → Order → Cortisol reduction
- **Entropy Meter**: Real-time visualization of disorder level

```javascript
export function calculateEntropyLevel(tileCount, maxTiles) {
  const percentage = (tileCount / maxTiles) * 100;
  return Math.min(GAME_CONFIG.MAX_ENTROPY_LEVEL, Math.floor(percentage));
}
```

```jsx
{/* Entropy Level Display */}
<div className="border-chaos">
  <div className="text-header text-chaos">ENTROPY</div>
  <div className="text-score">{entropyLevel}%</div>
  <div className="h-2 bg-void-deep">
    <div
      className="bg-gradient-to-r from-order to-chaos"
      style={{ width: `${entropyLevel}%` }}
    />
  </div>
</div>
```

**Visual Design**:
- Chaos → Red/Magenta color scheme
- Order → Green/Cyan color scheme
- Clearing tiles triggers `animate-success-flash` (red → white → green)

**Psychological Effect**:
- Game becomes "anxiety externalization tool"
- Players compulsively reduce entropy to restore order
- Satisfying visceral feedback reinforces behavior

---

## Visual Design System Implementation

### Typography

**Google Fonts Loaded** (`index.html:L11-13`):
```html
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;600&family=Orbitron:wght@900&display=swap" rel="stylesheet">
```

**Usage** (`index.css:L137-156`):
```css
.text-header {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.15em; /* Aggressive spacing */
}

.text-impact {
  font-family: 'Orbitron', sans-serif;
  font-weight: 900;
  letter-spacing: 0.2em; /* Maximum aggression */
}
```

---

### Color Palette

**CSS Variables** (`index.css:L12-33`):
```css
:root {
  --void-black: #0a0a0f;
  --neon-cyan: #00f0ff;
  --neon-magenta: #ff00ff;
  --neon-amber: #ffb000;
  --chaos-red: #ff3366;
  --order-green: #00ff88;
  /* ... */
}
```

**Tailwind Extension** (`tailwind.config.js:L7-18`):
```javascript
colors: {
  'void': { 'black': '#0a0a0f', /* ... */ },
  'neon': { 'cyan': '#00f0ff', /* ... */ },
  'chaos': '#ff3366',
  'order': '#00ff88',
}
```

---

### Chamfered Corners (Clip-Path)

**Implementation** (`index.css:L51-81`):
```css
.chamfer-sm {
  clip-path: polygon(
    8px 0%, 100% 0%,
    100% calc(100% - 8px),
    calc(100% - 8px) 100%,
    0% 100%, 0% 8px
  );
}
```

**Usage** (`GameBoard.jsx:L160`):
```jsx
<div className="chamfer-sm bg-void-surface border-2 border-neon-cyan">
  {/* Score display */}
</div>
```

---

### Scanlines Overlay

**Implementation** (`index.css:L84-106`):
```css
.scanlines::before {
  content: '';
  position: absolute;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 240, 255, 0.03) 2px,
    rgba(0, 240, 255, 0.03) 4px
  );
  animation: scanline-drift 8s linear infinite;
}
```

**Usage** (`GameBoard.jsx:L199`):
```jsx
<div className="scanlines">
  {/* Game board */}
</div>
```

---

### Juice Strategy

#### Hover Physics

**Implementation** (`Tile.jsx:L40-50`, `index.css:L158-174`):
```jsx
<div className={`
  transition-all duration-75
  ${isHovered && isClearable ? 'scale-105' : 'scale-100'}
  ${isClearable && isHovered ? colors.glow : ''}
`}>
```

```css
.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 0 var(--glow-intense) var(--neon-cyan);
  background: var(--neon-cyan);
  color: var(--void-black);
}
```

#### Click Feedback

**Immediate Response** (`index.css:L176-184`):
```css
.btn-primary:active {
  transform: scale(0.95); /* Button "presses" */
  box-shadow: 0 0 4px var(--neon-cyan);
  background: var(--void-deep);
  transition: none; /* INSTANT */
}
```

#### Screen Shake (Critical Moments)

**Implementation** (`GameBoard.jsx:L148-152`, `tailwind.config.js:L31-35`):
```jsx
const [shake, setShake] = useState(false);

if (reward.isCritical) {
  setShake(true);
  setTimeout(() => setShake(false), 1000);
}

<div className={shake ? 'animate-screen-shake' : ''}>
```

```javascript
// tailwind.config.js
keyframes: {
  'screen-shake': {
    '0%, 100%': { transform: 'translate(0, 0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translate(-4px, 4px)' },
    '20%, 40%, 60%, 80%': { transform: 'translate(4px, -4px)' },
  }
}
```

---

## Game State Management

### Core State Object

**Location**: `GameBoard.jsx:L21-28`

```jsx
const [tiles, setTiles] = useState([]);           // Tile positions/types
const [score, setScore] = useState(0);            // Total score
const [combo, setCombo] = useState(0);            // Consecutive clears
const [entropyLevel, setEntropyLevel] = useState(0); // Disorder metric
const [lastClearTime, setLastClearTime] = useState(Date.now()); // Combo timer
const [isNearMiss, setIsNearMiss] = useState(false);  // Near-miss flag
const [criticalMessage, setCriticalMessage] = useState(null); // RPE feedback
const [shake, setShake] = useState(false);        // Screen shake trigger
```

### State Flow

1. **User clicks tile** → `handleTileClear()` called
2. **Tile removed** → `setTiles()` updates
3. **Combo calculated** → `updateCombo()` checks timing
4. **Reward calculated** → `calculateReward()` rolls for critical
5. **Score updated** → `setScore()` adds points
6. **Visual feedback** → Critical message + screen shake if triggered
7. **Entropy spawns** → `useEffect` triggers after delay
8. **Entropy level updates** → `calculateEntropyLevel()` reflects new state

---

## Running the Application

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

---

## Tunable Parameters

All psychological mechanics are controlled by constants in `gameLogic.js:L8-26`:

```javascript
export const GAME_CONFIG = {
  CRITICAL_CLEAR_CHANCE: 0.10,    // 10% variable ratio
  CRITICAL_MULTIPLIER: 3.5,       // 3.5x reward spike
  NEAR_MISS_THRESHOLD: 0.85,      // 85% = near miss
  MIN_ENTROPY_TILES: 2,            // Never below 2 tiles
  ENTROPY_SPAWN_DELAY: 1500,      // 1.5s spawn interval
  MAX_ENTROPY_LEVEL: 100,
  CLEAR_ENTROPY_REDUCTION: 15,
  SPAWN_ENTROPY_INCREASE: 10,
  BASE_POINTS_PER_CLEAR: 10,
  COMBO_MULTIPLIER: 1.5,
};
```

**To Adjust Retention**:
- ↑ `CRITICAL_CLEAR_CHANCE` → More frequent dopamine spikes
- ↓ `ENTROPY_SPAWN_DELAY` → More pressure (higher stress)
- ↑ `CRITICAL_MULTIPLIER` → Stronger RPE (higher highs)

---

## Compliance Checklist

### Aesthetic Engine

✅ **Typography**: Rajdhani (primary), Exo 2 (secondary), Orbitron (impact)
✅ **Palette**: Neon-on-void (no white backgrounds)
✅ **Shapes**: Chamfered corners via clip-path
✅ **Scanlines**: Applied to game board
✅ **Juice**: Hover scale, click feedback, screen shake, glitch effects

### Psychological Matrix

✅ **Bushnell's Law**: Click-to-clear (easy) + combo optimization (hard)
✅ **RPE**: Variable ratio rewards (10% critical clears)
✅ **Near-Miss**: 85%+ completion triggers feedback
✅ **Zeigarnik**: Continuous entropy spawning (never complete)
✅ **Entropy Reduction**: Visual chaos → order satisfaction loop
✅ **Loss Aversion**: Combo system (lose streak on failure)

---

## Next Steps

### Phase 4: Polish + Advanced Mechanics

1. **Sound Design**: Add SFX for clear, critical, near-miss
2. **Particle Effects**: CSS-animated particles on critical clears
3. **Daily Streaks**: LocalStorage persistence for retention
4. **Meta-Progression**: Unlockable skins, themes, challenges
5. **Mobile Support**: Touch controls + responsive layout
6. **Analytics**: Track retention metrics (session length, day-7 return)

### Phase 5: Deployment

1. **Build optimization**: Vite production build
2. **Hosting**: Deploy to Vercel/Netlify
3. **A/B Testing**: Test different GAME_CONFIG values
4. **Retention Analysis**: Monitor actual vs. predicted metrics

---

**Implementation Status**: ✅ Core Loop Complete

**Ready For**: User testing, parameter tuning, visual polish

**Reference**: All design decisions trace back to `docs/design/PSYCHOLOGICAL_GAME_DESIGN_FRAMEWORK.md`
