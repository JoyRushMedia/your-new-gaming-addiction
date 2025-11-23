import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Tile Component (JUICE-INJECTED)
 * Represents a single entropy tile with AGGRESSIVE feedback
 * Implements: Glitch hover, color invert, spring physics, explosive clear
 */

const TILE_COLORS = {
  cyan: {
    bg: '#00f0ff',
    border: 'border-neon-cyan',
    glow: 'shadow-[0_0_20px_#00f0ff]',
    glowIntense: 'shadow-[0_0_40px_#00f0ff]',
    text: 'text-void-black',
  },
  magenta: {
    bg: '#ff00ff',
    border: 'border-neon-magenta',
    glow: 'shadow-[0_0_20px_#ff00ff]',
    glowIntense: 'shadow-[0_0_40px_#ff00ff]',
    text: 'text-void-black',
  },
  amber: {
    bg: '#ffb000',
    border: 'border-neon-amber',
    glow: 'shadow-[0_0_20px_#ffb000]',
    glowIntense: 'shadow-[0_0_40px_#ffb000]',
    text: 'text-void-black',
  },
  violet: {
    bg: '#a855f7',
    border: 'border-neon-violet',
    glow: 'shadow-[0_0_20px_#a855f7]',
    glowIntense: 'shadow-[0_0_40px_#a855f7]',
    text: 'text-void-black',
  },
};

// Spring physics configuration (high stiffness = snappy)
const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

// Glitch animation variants
const glitchVariants = {
  idle: {
    x: 0,
    y: 0,
    filter: 'hue-rotate(0deg)',
  },
  glitch: {
    x: [-2, 2, -1, 1, 0],
    y: [1, -1, 2, -2, 0],
    filter: ['hue-rotate(0deg)', 'hue-rotate(180deg)', 'hue-rotate(0deg)'],
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export default function Tile({ tile, onClear, isClearable }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const colors = TILE_COLORS[tile.type] || TILE_COLORS.cyan;

  const handleClick = () => {
    if (!isClearable) return;

    setIsClearing(true);

    // OPTIMIZED: Immediate callback for flow, visual cleanup happens async
    onClear(tile.id);
  };

  return (
    <motion.div
      className={`
        relative
        w-full h-full
        cursor-pointer
        chamfer-sm
        ${colors.border}
        border-2
        ${isClearable ? '' : 'bg-void-surface opacity-60 cursor-not-allowed'}
        ${!isClearable ? 'pointer-events-none' : ''}
      `}
      style={{
        backgroundColor: isClearable ? colors.bg : undefined,
      }}
      // Entry animation (spawn)
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{
        scale: isClearing ? 0 : 1,
        rotate: isClearing ? 180 : 0,
        opacity: isClearing ? 0 : 1,
      }}
      transition={SPRING_CONFIG}
      // Hover scale + glow
      whileHover={
        isClearable
          ? {
              scale: 1.1,
              transition: { ...SPRING_CONFIG, stiffness: 500 },
            }
          : {}
      }
      // Click feedback (press down)
      whileTap={
        isClearable
          ? {
              scale: 0.9,
              transition: { duration: 0.05 },
            }
          : {}
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Glitch effect container */}
      <motion.div
        className="w-full h-full relative"
        variants={glitchVariants}
        animate={isHovered && isClearable ? 'glitch' : 'idle'}
      >
        {/* Tile content */}
        <div
          className={`
          w-full h-full
          flex items-center justify-center
          font-rajdhani font-bold text-2xl
          ${colors.text}
          tracking-aggressive
          uppercase
          relative z-10
        `}
        >
          {tile.type[0]}
        </div>

        {/* Glow layer (intensifies on hover) */}
        {isClearable && (
          <motion.div
            className={`
              absolute inset-0
              chamfer-sm
              pointer-events-none
            `}
            style={{
              backgroundColor: colors.bg,
              boxShadow: `0 0 ${isHovered ? '40px' : '20px'} ${colors.bg}`,
            }}
            animate={{
              opacity: isHovered ? 0.4 : 0.2,
            }}
            transition={{ duration: 0.1 }}
          />
        )}

        {/* Pulse indicator for clearable tiles */}
        {isClearable && (
          <motion.div
            className="absolute inset-0 chamfer-sm pointer-events-none"
            style={{
              backgroundColor: colors.bg,
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Color invert flash on hover */}
        {isHovered && isClearable && (
          <motion.div
            className="absolute inset-0 chamfer-sm bg-white pointer-events-none mix-blend-difference"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      {/* Clearing animation overlay */}
      {isClearing && (
        <motion.div
          className="absolute inset-0 chamfer-sm"
          style={{
            backgroundColor: colors.bg,
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
}
