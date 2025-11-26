# Entropy Reduction
## High-Velocity Cognitive Arcade

A neurochemically-optimized match-3 game designed using behavioral psychology principles to maximize player engagement and retention.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.0-ff0055?logo=framer)](https://www.framer.com/motion/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

---

## 🎮 Overview

**Entropy Reduction** is not just a game—it's a **psychological experiment** in game design. Every mechanic, animation, and visual element is engineered to trigger specific neurochemical responses based on behavioral research.

### Core Concept

Clear tiles to reduce entropy (chaos) on the board. The more you clear, the more satisfaction you feel—but the game **never lets you finish**. New entropy constantly spawns, creating an infinite compulsion loop.

---

## 🧠 Psychological Framework

This game implements **5 core behavioral principles** from academic research:

### 1. **Bushnell's Law** — "Easy to Learn, Difficult to Master"
- **Zero tutorial friction**: Click to clear, match 3+ tiles
- **Mastery ceiling**: Combo optimization, entropy management
- **Cite**: [8, 24] Minimize extraneous cognitive load

### 2. **Reward Prediction Error (RPE)** — Dopamine-Driven Engagement
- **Variable Ratio Schedule**: 10% chance for "Critical Clear" (3.5× points)
- **Positive Prediction Error**: Exceeding expectations triggers dopamine spike
- **Cite**: [29, 37, 38, 45] Prevents reward extinction

### 3. **Near-Miss Effect** — "Almost Won" Motivation
- **Striatal Activation**: Failure states that resemble success sustain play
- **Implementation**: Clearing last match when board has 15%+ entropy
- **Cite**: [173, 176] Near-misses activate brain's reward system like wins

### 4. **Zeigarnik Effect** — Never-Ending Task
- **Open Loops**: New tiles spawn every 800ms
- **Adaptive Spawn**: Board adjusts difficulty based on skill
- **Cite**: [107, 110] Incomplete tasks create cognitive tension

### 5. **Entropy Reduction** — The "Cleaning Instinct"
- **Cortisol Management**: High chaos → stress, clearing → relief
- **Visual Feedback**: Red (chaos) → Green (order) color transitions
- **Cite**: [96, 99, 100] Game becomes anxiety externalization tool

---

## ✨ Features

### 🎨 Visual Design
- **Neon-on-Void Aesthetic**: Sci-fi color palette with high contrast
- **Chamfered Corners**: Geometric clip-path shapes (no standard border-radius)
- **CRT Scanlines**: Retro-futuristic overlay effects
- **Dynamic Glow**: Box-shadows that intensify based on state

### ⚡ Juice (Visual Feedback)
- **Spring Physics**: Framer Motion animations with high stiffness (400-500)
- **Glitch Effects**: Position jitter + hue-rotate on hover
- **Particle Bursts**: 20 radial particles on critical clears
- **Screen Shake**: X/Y axis jitter on high-impact moments
- **Color Invert**: Mix-blend-difference flash on tile hover

### 🎯 Game Mechanics
- **Match-3 Core**: Clear 3+ tiles of the same color
- **Combo System**: Consecutive clears multiply score
- **Entropy Meter**: Real-time visualization of disorder (0-100%)
- **Critical Clears**: Random 3.5× score bonuses with full-screen celebration
- **Near-Miss Feedback**: "SO CLOSE!" message when clearing last match

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/JoyRushMedia/your-new-gaming-addiction.git
cd your-new-gaming-addiction

# Install dependencies
npm install

# Start development server
npm run dev
```

Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🛠 Technology Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework with hooks |
| **Vite** | Fast build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Spring physics animations |
| **PostCSS** | CSS processing |

---

## 📂 Project Structure

```
/
├── docs/
│   ├── design/
│   │   └── PSYCHOLOGICAL_GAME_DESIGN_FRAMEWORK.md  # Core design principles
│   ├── IMPLEMENTATION.md                            # Technical implementation guide
│   ├── JUICE_IMPLEMENTATION.md                      # Animation & feedback details
│   └── RETENTION_AUDIT.md                           # Psychological compliance audit
├── src/
│   ├── components/
│   │   ├── GameBoard.jsx         # Main game loop + state management
│   │   ├── Tile.jsx              # Individual tile with animations
│   │   └── ParticleBurst.jsx     # Particle effect system
│   ├── lib/
│   │   └── gameLogic.js          # Pure functions (RPE, near-miss, entropy)
│   ├── App.jsx                   # Root component
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Design system + custom styles
├── index.html
├── tailwind.config.js            # Extended theme (neon colors, animations)
├── vite.config.js
└── package.json
```

---

## 📖 Documentation

### Core Documents

1. **[Psychological Game Design Framework](docs/design/PSYCHOLOGICAL_GAME_DESIGN_FRAMEWORK.md)**
   - Complete aesthetic engine rules
   - 5-pillar psychological matrix with academic citations
   - Design protocol and forbidden patterns

2. **[Implementation Guide](docs/IMPLEMENTATION.md)**
   - Architecture overview
   - Psychology → Code mapping
   - State flow diagrams
   - Tuning parameters

3. **[Juice Implementation](docs/JUICE_IMPLEMENTATION.md)**
   - Framer Motion integration
   - Component-by-component animation breakdown
   - Performance optimizations

4. **[Retention Audit](docs/RETENTION_AUDIT.md)**
   - Before/After analysis of fixes
   - Flow compliance verification
   - Predicted retention metrics

---

## 🎯 Tunable Parameters

All psychological mechanics are controlled by constants in `src/lib/gameLogic.js`:

```javascript
export const GAME_CONFIG = {
  // Variable Ratio Schedule (cite: 37, 38)
  CRITICAL_CLEAR_CHANCE: 0.10,    // 10% chance for dopamine spike
  CRITICAL_MULTIPLIER: 3.5,       // 3.5× reward on critical

  // Near-Miss Detection (cite: 173, 176)
  NEAR_MISS_THRESHOLD: 0.85,      // 85%+ completion = near miss

  // Zeigarnik Effect (cite: 107, 110)
  MIN_ENTROPY_TILES: 2,            // Never allow full closure
  ENTROPY_SPAWN_DELAY: 800,        // 800ms spawn interval

  // Scoring
  BASE_POINTS_PER_CLEAR: 10,
  COMBO_MULTIPLIER: 1.5,
};
```

**To Adjust Retention**:
- ↑ `CRITICAL_CLEAR_CHANCE` → More frequent dopamine spikes
- ↓ `ENTROPY_SPAWN_DELAY` → More pressure (higher stress)
- ↑ `CRITICAL_MULTIPLIER` → Stronger RPE (higher highs)

---

## 🧪 Testing Checklist

### Critical Behaviors to Verify

- [ ] Tiles spin in on spawn (scale: 0 → 1, rotate: -180° → 0°)
- [ ] Hover triggers glitch + scale + glow + color invert
- [ ] Click compresses tile (whileTap scale: 0.9)
- [ ] Critical clear shows particle burst + shake + message (~10% rate)
- [ ] Near-miss triggers when clearing last match with 15%+ entropy
- [ ] Screen shakes on critical + near-miss
- [ ] Score pops and color-flashes on update
- [ ] Combo slides up/down on change
- [ ] Entropy meter glows red at 70%+
- [ ] Entropy meter pulses at 80%+
- [ ] All animations <300ms response time
- [ ] No perceptible lag during rapid clearing

---

## 📊 Predicted Metrics

### Session Metrics
- **Session Length**: 15-25 minutes (flow-maintained gameplay)
- **Actions Per Minute**: 30-60 (high-velocity cognitive arcade)
- **Critical Clears Per Session**: ~5-10 (10% variable ratio)
- **Near-Miss Triggers**: 2-3 per session

### Retention Forecasts
- **Day-1 Retention**: >60% (strong first impression)
- **Day-7 Retention**: >45% (psychological hooks active)
- **Average Session Count**: 3-5 per day (Zeigarnik effect)

*Note: These are theoretical predictions based on psychological principles. A/B testing required for validation.*

---

## 🎨 Design System

### Color Palette

```css
/* Void (Backgrounds) */
--void-black: #0a0a0f
--void-deep: #050508
--void-surface: #12121a

/* Neon (Accents) */
--neon-cyan: #00f0ff      /* Primary actions */
--neon-magenta: #ff00ff   /* Danger/urgency */
--neon-amber: #ffb000     /* Success/rewards */
--neon-violet: #a855f7    /* Rare/critical */

/* Semantic */
--chaos-red: #ff3366      /* High entropy */
--order-green: #00ff88    /* Low entropy */
```

### Typography

- **Primary**: Rajdhani (data, scores, headers)
- **Secondary**: Exo 2 (body, instructions)
- **Impact**: Orbitron (critical moments only)

### Animation Timing

- **Instant**: 50ms (click feedback)
- **Snap**: 80ms (state changes)
- **Smooth**: 200ms (transitions)
- **Spring**: Stiffness 400-500, Damping 25

---

## 🚧 Roadmap

### Phase 4 (Complete)
- [x] React + Tailwind skeleton
- [x] Framer Motion juice injection
- [x] Psychological audit + fixes

### Phase 5 (Planned)
- [ ] **Sound Design**: SFX for clear, critical, near-miss
- [ ] **Meta-Progression**: Daily streaks, unlockable themes
- [ ] **Mobile Optimization**: Touch controls, haptic feedback
- [ ] **Analytics Integration**: Track actual retention metrics
- [ ] **A/B Testing**: Validate tunable parameters

---

## 🤝 Contributing

This project is an experimental exploration of psychology in game design. Contributions that enhance psychological engagement are welcome!

### Areas of Interest
- Sound design (multi-sensory engagement)
- Additional psychological mechanics
- Performance optimizations
- Mobile UX improvements

---

## 📚 References

This game synthesizes principles from:

- **Cognitive Load Theory** [10, 69] — Sweller et al.
- **Bushnell's Law** [8, 24] — Nolan Bushnell
- **Dopaminergic Reward Systems** [29, 45] — Schultz et al.
- **Operant Conditioning** [37, 38] — Skinner
- **Thermodynamic Psychology** [96, 99, 100] — Friston (Free Energy Principle)
- **Zeigarnik Effect** [107, 110] — Bluma Zeigarnik
- **Loss Aversion & Prospect Theory** [186] — Kahneman & Tversky
- **Near-Miss Gambling Research** [173, 176] — Clark et al.

Full bibliography available in `docs/design/PSYCHOLOGICAL_GAME_DESIGN_FRAMEWORK.md`

---

## ⚖️ License

MIT License - See [LICENSE](LICENSE) for details

---

## 🎮 Play Responsibly

This game is designed to be **neurochemically engaging**. If you find yourself unable to stop playing:

1. That's the psychological framework working as designed
2. Set time limits before playing
3. Remember: The game **never ends** by design (Zeigarnik Effect)

**Intentional addictiveness is the point of this experiment.**

---

## 📧 Contact

**Project**: Your New Gaming Addiction
**Organization**: JoyRushMedia
**Repository**: [https://github.com/JoyRushMedia/your-new-gaming-addiction](https://github.com/JoyRushMedia/your-new-gaming-addiction)

---

**Built with behavioral psychology. Optimized for retention. Designed to be your new addiction.** 🎯
