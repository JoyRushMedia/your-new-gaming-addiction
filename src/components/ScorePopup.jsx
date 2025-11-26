import { motion } from 'framer-motion';

/**
 * ScorePopup Component - Floating score indicator at match location
 * Shows points earned with satisfying animation
 */
export default function ScorePopup({ x, y, points, combo, isChain, color = '#00f0ff' }) {
  const displayText = combo > 1
    ? `+${points} x${combo}!`
    : isChain
      ? `+${points} CHAIN!`
      : `+${points}`;

  return (
    <motion.div
      className="fixed pointer-events-none z-[100] font-rajdhani font-bold"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{
        opacity: 0,
        scale: 0.5,
        y: 0,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.3, 1.1, 0.8],
        y: -80,
      }}
      transition={{
        duration: 1.2,
        times: [0, 0.2, 0.5, 1],
        ease: 'easeOut',
      }}
    >
      {/* Main score text */}
      <div
        className="text-2xl md:text-3xl whitespace-nowrap"
        style={{
          color: color,
          textShadow: `0 0 20px ${color}, 0 0 40px ${color}, 0 2px 4px rgba(0,0,0,0.8)`,
        }}
      >
        {displayText}
      </div>

      {/* Combo sparkle effect */}
      {combo > 2 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: [0, 1.5, 0], rotate: 180 }}
          transition={{ duration: 0.6 }}
        >
          <svg width="60" height="60" viewBox="0 0 60 60">
            <motion.path
              d="M30 0 L32 28 L60 30 L32 32 L30 60 L28 32 L0 30 L28 28 Z"
              fill={color}
              opacity={0.6}
            />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
