# CLAUDE.md - AI Assistant Guide for Entropy Reduction

## Project Overview

**Entropy Reduction** is a neurochemically-optimized match-3 browser game designed using behavioral psychology principles to maximize player engagement. Every mechanic, animation, and visual element is engineered to trigger specific neurochemical responses.

- **Organization**: JoyRushMedia
- **Repository**: https://github.com/JoyRushMedia/your-new-gaming-addiction
- **License**: MIT

### Core Concept

Players clear tiles to reduce entropy (chaos) on the board. The game implements an infinite compulsion loop where new entropy constantly spawns, preventing completion (Zeigarnik Effect).

---

## Quick Reference Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Production build to /dist
npm run preview   # Preview production build
npm run lint      # ESLint with zero warnings tolerance
```

**Testing:**
```bash
node --test src/lib/__tests__/**/*.test.js   # Run match pattern tests
```

---

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework with hooks |
| Vite | 5.3.1 | Build tool and dev server |
| Tailwind CSS | 3.4.4 | Utility-first styling |
| Framer Motion | 11.0.8 | Spring physics animations |
| PostCSS | 8.4.38 | CSS processing |
| ESLint | 8.57.0 | Code linting |

---

## Directory Structure

```
/
├── src/
│   ├── components/
│   │   ├── GameBoard.jsx        # Main game loop & state (largest file ~1700 lines)
│   │   ├── Tile.jsx             # Individual tile with animations
│   │   ├── ParticleBurst.jsx    # Particle effects for critical clears
│   │   ├── ScorePopup.jsx       # Floating score feedback
│   │   ├── LevelComplete.jsx    # Level completion screen
│   │   ├── LevelSelect.jsx      # Level selection UI
│   │   └── layout/
│   │       ├── AppShell.jsx     # Main layout wrapper (HUD/sidebar)
│   │       ├── NeonFrame.jsx    # Grid/scanline/corner overlays
│   │       └── TilePreview.jsx  # Tile codex preview
│   ├── lib/
│   │   ├── gameLogic.js         # Pure functions for game mechanics
│   │   ├── designTokens.js      # Centralized design system variables
│   │   ├── sounds.js            # Web Audio API sound synthesis
│   │   ├── levels.js            # Level definitions & progression
│   │   └── __tests__/
│   │       └── matchPatterns.test.js  # Match detection tests
│   ├── App.jsx                  # Root component with state routing
│   ├── main.jsx                 # React DOM entry point
│   └── index.css                # Tailwind + custom design system
├── docs/
│   ├── design/
│   │   └── PSYCHOLOGICAL_GAME_DESIGN_FRAMEWORK.md
│   ├── IMPLEMENTATION.md
│   ├── JUICE_IMPLEMENTATION.md
│   └── RETENTION_AUDIT.md
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
└── index.html
```

---

## Architecture & Key Patterns

### Game State Machine

The game uses a phase-based state machine in `GameBoard.jsx`:

```javascript
const GAME_PHASE = {
  IDLE: 'idle',              // Ready for input
  SWAPPING: 'swapping',      // Swap animation running
  CLEARING: 'clearing',      // Match clear animation
  FALLING: 'falling',        // Gravity animation
  CASCADE_CHECK: 'cascade_check'  // Auto-detection for combos
};
```

### Game Modes

Two modes managed in `App.jsx`:
1. **Endless Mode** (`gameState: 'playing'`) - Infinite with difficulty ramping
2. **Level Mode** (`gameState: 'levelPlaying'`) - 40+ predefined levels with goals

### Psychological Constants (Tunable)

All behavioral mechanics are in `src/lib/gameLogic.js` under `GAME_CONFIG`:

```javascript
CRITICAL_CLEAR_CHANCE: 0.10    // 10% dopamine spike chance
CRITICAL_MULTIPLIER: 3.5       // Reward multiplier on critical
NEAR_MISS_THRESHOLD: 0.85      // 85%+ = near miss trigger
ENTROPY_SPAWN_DELAY_BASE: 1200 // Starting spawn interval (ms)
ENTROPY_SPAWN_DELAY_MIN: 400   // Minimum spawn interval
COMBO_MULTIPLIER: 2.0          // Score doubling per combo
CASCADE_BONUS: 1.5             // 50% bonus per cascade
```

### Smart Tile Generation

The `generateSmartTileType()` function prevents immediate matches on spawn while maintaining variety. Always use this instead of random generation.

### Memoization Pattern

Performance-critical calculations use `useMemo`:
```javascript
const clearableTileIds = useMemo(() => findClearableTiles(tiles), [tiles, gamePhase]);
const validMoves = useMemo(() => findValidMoves(tiles), [tiles, gamePhase]);
```

---

## Code Conventions

### File Organization

- `.jsx` - React components
- `.js` - Pure logic and utilities
- Single component per file
- Pure functions in `src/lib/`, UI in `src/components/`

### Naming

- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `GAME_CONFIG`, `GRID_SIZE`)
- **Functions**: `camelCase` (e.g., `calculateReward`, `findAllMatches`)
- **Components**: `PascalCase` (e.g., `GameBoard`, `ParticleBurst`)
- **Event handlers**: `handleXxx` pattern (e.g., `handleClick`, `handleClear`)

### React Patterns

- Functional components with hooks only (no class components)
- Prop destructuring instead of prop-types (prop-types disabled in ESLint)
- `React.memo()` for expensive renders (see `Tile.jsx`)
- `AnimatePresence` for enter/exit animations

### Animation Standards

- All interactive animations use Framer Motion (not CSS)
- Spring physics: `stiffness: 400-500, damping: 25`
- Response times under 300ms
- Use chamfered clip-paths instead of border-radius

---

## Design System

### Colors (from tailwind.config.js)

```
Void (backgrounds):
  void-black: #0a0a0f    void-deep: #050508    void-surface: #12121a

Neon (accents):
  neon-cyan: #00f0ff     neon-magenta: #ff00ff
  neon-amber: #ffb000    neon-violet: #a855f7

Semantic:
  chaos: #ff3366 (high entropy)    order: #00ff88 (low entropy)
```

### Typography

- **Rajdhani**: Headers, scores, data displays
- **Exo 2**: Body text, instructions
- **Orbitron**: Critical moments only (impact text)

### Custom CSS Classes (index.css)

- `.chamfer-sm`, `.chamfer-lg`, `.chamfer-tech` - Clip-path corners
- `.scanlines` - CRT overlay effect
- `.border-tech` - Double border system
- `.text-header`, `.text-score`, `.text-impact` - Typography styles
- `.btn-primary` - Juiced button with states

---

## Key Game Mechanics

### Match Detection

Located in `gameLogic.js`. Detects:
- Lines (horizontal/vertical, 3+ tiles)
- Squares (2x2 clusters)
- L-shapes (5+ tiles)
- T-shapes

Match metadata includes `shape`, `size`, and `orientation`.

### Combo System

- Multiplier: 2.0x per consecutive clear
- Timeout: Resets after 2 seconds without clear
- Cascade bonus: 1.5x per cascade level

### Entropy System

- Calculated as tile count ratio to board capacity
- Visual: 0-100% meter, red (chaos) to green (order)
- Glow pulses at 80%+

### Sound System (sounds.js)

Uses Web Audio API with synthetic sound generation:
- `playClear()`, `playCombo()`, `playCritical()`
- `playNearMiss()`, `playBigClear()`, `playGameOver()`
- No audio files needed

---

## Testing

Tests use Node's native test runner:

```bash
node --test src/lib/__tests__/matchPatterns.test.js
```

Tests cover match pattern detection:
- Square clusters (2x2)
- L-shaped clusters
- Long horizontal chains
- Pattern metadata validation

---

## Common Development Tasks

### Adding a New Tile Type

1. Update `TILE_TYPES` in `gameLogic.js`
2. Add color/styling in `Tile.jsx`
3. Update `generateSmartTileType()` if needed
4. Add match logic if special behavior required

### Modifying Game Difficulty

Adjust constants in `GAME_CONFIG` (`gameLogic.js`):
- `ENTROPY_SPAWN_DELAY_*` - Spawn rate
- `DIFFICULTY_RAMP_INTERVAL` - How fast difficulty increases
- `CRITICAL_CLEAR_CHANCE` - Reward frequency

### Adding Animations

1. Use Framer Motion `motion.div`
2. Follow spring physics standard: `stiffness: 400-500, damping: 25`
3. Keep response under 300ms
4. Add to `JUICE_IMPLEMENTATION.md` if significant

### Adding a New Level

Edit `src/lib/levels.js`:
```javascript
{
  id: 41,
  world: 6,
  level: 1,
  name: "Level Name",
  goalType: 'CLEAR_TILES', // or REACH_SCORE, CHAIN_COMBO, etc.
  goalTarget: 50,
  moves: 20,
  spawnDelay: 1000
}
```

---

## Important Warnings

### ESLint Zero Tolerance

The lint command uses `--max-warnings 0`. All warnings must be resolved before committing.

### AudioContext Browser Restrictions

Sound initialization is wrapped in a runtime guard for iOS/Safari compatibility. Always check `typeof window !== 'undefined'` before AudioContext operations.

### Performance Considerations

- GameBoard.jsx is large (~1700 lines) - be careful with changes
- Match detection runs frequently - keep pure and optimized
- Use memoization for derived state
- Tile component uses `React.memo()`

### Psychological Framework

This codebase implements specific psychological principles. Changes that affect:
- Reward timing/frequency
- Near-miss detection
- Spawn rates
- Visual feedback

...should be reviewed against the psychological framework in `docs/design/PSYCHOLOGICAL_GAME_DESIGN_FRAMEWORK.md`.

---

## Related Documentation

- `docs/design/PSYCHOLOGICAL_GAME_DESIGN_FRAMEWORK.md` - Core design principles with academic citations
- `docs/IMPLEMENTATION.md` - Architecture and psychology-to-code mapping
- `docs/JUICE_IMPLEMENTATION.md` - Animation framework details
- `docs/RETENTION_AUDIT.md` - Psychological compliance verification

---

## Git Workflow

- Main branch for stable releases
- Feature branches for development
- Run `npm run lint` before committing
- Keep commits focused and descriptive

---

## Environment Requirements

- Node.js 18+
- npm
- Modern browser (ES2020+, CSS Grid, Web Audio API)
