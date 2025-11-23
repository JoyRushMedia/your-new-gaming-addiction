import { useState } from 'react';

/**
 * Tile Component
 * Represents a single entropy tile on the game board
 * Implements aggressive "juice" feedback (cite: aesthetic_engine)
 */

const TILE_COLORS = {
  cyan: {
    bg: 'bg-neon-cyan',
    border: 'border-neon-cyan',
    glow: 'shadow-[0_0_20px_#00f0ff]',
    text: 'text-void-black',
  },
  magenta: {
    bg: 'bg-neon-magenta',
    border: 'border-neon-magenta',
    glow: 'shadow-[0_0_20px_#ff00ff]',
    text: 'text-void-black',
  },
  amber: {
    bg: 'bg-neon-amber',
    border: 'border-neon-amber',
    glow: 'shadow-[0_0_20px_#ffb000]',
    text: 'text-void-black',
  },
  violet: {
    bg: 'bg-neon-violet',
    border: 'border-neon-violet',
    glow: 'shadow-[0_0_20px_#a855f7]',
    text: 'text-void-black',
  },
};

export default function Tile({ tile, onClear, isClearable }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const colors = TILE_COLORS[tile.type] || TILE_COLORS.cyan;

  const handleClick = () => {
    if (!isClearable) return;

    // Trigger clearing animation
    setIsClearing(true);

    // Call parent clear handler after brief delay
    setTimeout(() => {
      onClear(tile.id);
    }, 150);
  };

  return (
    <div
      className={`
        relative
        w-full h-full
        cursor-pointer
        transition-all duration-75
        chamfer-sm
        ${colors.border}
        border-2
        ${isClearable ? colors.bg : 'bg-void-surface'}
        ${isClearable && isHovered ? colors.glow : ''}
        ${isClearing ? 'animate-success-flash' : ''}
        ${isHovered && isClearable ? 'scale-105' : 'scale-100'}
        ${!isClearable ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Tile content - could be symbol, number, etc. */}
      <div className={`
        w-full h-full
        flex items-center justify-center
        font-rajdhani font-bold text-2xl
        ${colors.text}
        tracking-aggressive
        uppercase
      `}>
        {/* Display tile type initial */}
        {tile.type[0]}
      </div>

      {/* Clearable indicator (pulsing glow) */}
      {isClearable && (
        <div className={`
          absolute inset-0
          ${colors.bg}
          opacity-20
          animate-pulse
          chamfer-sm
        `} />
      )}
    </div>
  );
}
