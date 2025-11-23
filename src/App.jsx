import GameBoard from './components/GameBoard';

/**
 * Main App Component
 * Entry point for the Entropy-Reduction Core Loop
 */

export default function App() {
  return (
    <div className="w-screen h-screen bg-void-black overflow-hidden">
      {/* Title Header */}
      <div className="absolute top-0 left-0 right-0 p-6 text-center z-10">
        <h1 className="text-impact text-neon-cyan text-4xl mb-2">
          ENTROPY REDUCTION
        </h1>
        <p className="text-header text-text-muted text-sm">
          High-Velocity Cognitive Arcade
        </p>
      </div>

      {/* Main Game */}
      <GameBoard />
    </div>
  );
}
