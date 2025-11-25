# Entropy Reduction

A high-velocity arcade puzzle game with a cyberpunk aesthetic. Clear matching tiles to reduce entropy before chaos overtakes the board.

![Game Preview](https://img.shields.io/badge/Status-In%20Development-cyan)
![React](https://img.shields.io/badge/React-18.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.3-purple)

## How to Play

1. **Match 3+**: Click any tile that's part of a horizontal or vertical line of 3 or more matching colors
2. **Clear Groups**: All matching tiles in the line are cleared at once
3. **Build Combos**: Clear tiles quickly (within 3 seconds) to build combo multipliers
4. **Fight Entropy**: New tiles spawn continuously - keep clearing to stay ahead
5. **Chase High Scores**: Bigger matches and combos mean bigger points

## Features

- **Match-3 Mechanics**: Click to clear entire matching groups
- **Combo System**: Chain clears within 3 seconds for multiplier bonuses
- **Critical Clears**: 10% chance for 3.5x bonus points on any clear
- **Entropy System**: Board continuously spawns new tiles to challenge you
- **High Score Tracking**: Persisted locally to track your best runs
- **Pause/Resume**: Take a break without losing progress
- **Visual Feedback**: Screen shake, particle bursts, glow effects

## Controls

| Action | Control |
|--------|---------|
| Clear Tiles | Click on highlighted (clearable) tiles |
| Pause | Click PAUSE button |
| Restart | Click RESTART button |

## Scoring

| Action | Points |
|--------|--------|
| Base clear | 10 points per tile |
| Match-4 | +50% bonus |
| Match-5+ | +50% per extra tile |
| Combo x2+ | 1.5x multiplier per combo level |
| Critical Clear | 3.5x multiplier (10% chance) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

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

### Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **localStorage** - High score persistence

## Project Structure

```
src/
├── components/
│   ├── GameBoard.jsx    # Main game logic and state
│   ├── Tile.jsx         # Individual tile with effects
│   └── ParticleBurst.jsx # Particle effect system
├── lib/
│   └── gameLogic.js     # Pure game mechanics
├── App.jsx              # Root component
├── main.jsx             # Entry point
└── index.css            # Design system
```

## Roadmap

### Completed
- [x] Core match-3 mechanics
- [x] Combo system with visual timer
- [x] Critical clear random bonus
- [x] High score persistence
- [x] Pause/Resume functionality
- [x] Restart game

### Planned
- [ ] Sound effects and music
- [ ] Mobile touch support
- [ ] Difficulty levels
- [ ] Power-ups and special tiles
- [ ] Leaderboard system
- [ ] Achievements
- [ ] Tutorial/onboarding

## Development

```bash
# Run development server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build
```

## License

MIT

## Acknowledgments

- Design inspired by cyberpunk aesthetics
- Built with React and Framer Motion
