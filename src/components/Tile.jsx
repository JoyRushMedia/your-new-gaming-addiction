import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Tile Component - ENHANCED VISUAL DESIGN
 * Features: Geometric icons, gradients, depth, glow effects, touch support
 */

// Enhanced tile configurations with icons and gradients
const TILE_CONFIG = {
  cyan: {
    name: 'Energy',
    bgGradient: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 50%, #00f0ff 100%)',
    borderColor: '#00f0ff',
    glowColor: '#00f0ff',
    iconColor: '#001a1f',
    shadowInner: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
    icon: 'bolt', // Lightning bolt
  },
  magenta: {
    name: 'Plasma',
    bgGradient: 'linear-gradient(135deg, #ff00ff 0%, #ff0080 50%, #ff00ff 100%)',
    borderColor: '#ff00ff',
    glowColor: '#ff00ff',
    iconColor: '#1f001f',
    shadowInner: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
    icon: 'hexagon', // Hexagon
  },
  amber: {
    name: 'Core',
    bgGradient: 'linear-gradient(135deg, #ffb000 0%, #ff6600 50%, #ffb000 100%)',
    borderColor: '#ffb000',
    glowColor: '#ffb000',
    iconColor: '#1f1000',
    shadowInner: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
    icon: 'diamond', // Diamond
  },
  violet: {
    name: 'Void',
    bgGradient: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 50%, #a855f7 100%)',
    borderColor: '#a855f7',
    glowColor: '#a855f7',
    iconColor: '#0f0520',
    shadowInner: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
    icon: 'star', // Star
  },
};

// SVG Icons for each tile type
const TileIcon = ({ type, color, size = 28 }) => {
  const icons = {
    bolt: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
          fill={color}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    hexagon: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z"
          fill={color}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="11" r="3" fill="rgba(255,255,255,0.3)" />
      </svg>
    ),
    diamond: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l10 10-10 10L2 12 12 2z"
          fill={color}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 6l6 6-6 6-6-6 6-6z"
          fill="rgba(255,255,255,0.2)"
        />
      </svg>
    ),
    star: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4L12 17l-6.3 4.4 2.3-7.4-6-4.6h7.6L12 2z"
          fill={color}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };
  return icons[type] || icons.bolt;
};

// Spring physics configuration
const SPRING_CONFIG = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

// Falling animation config
const FALL_SPRING = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
};

export default function Tile({
  tile,
  onClear,
  isClearable,
  isFalling = false,
  fallDistance = 0,
  onTouchStart,
  onTouchEnd,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  const config = TILE_CONFIG[tile.type] || TILE_CONFIG.cyan;

  const handleClick = () => {
    if (isClearable) {
      onClear(tile.id);
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsPressed(true);
    if (onTouchStart) onTouchStart(tile, touch);
  };

  const handleTouchEnd = (e) => {
    setIsPressed(false);
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // If it's a tap (not a swipe), trigger clear
    if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20 && deltaTime < 300) {
      if (isClearable) {
        onClear(tile.id);
      }
    }

    if (onTouchEnd) onTouchEnd(tile, touch, { deltaX, deltaY, deltaTime });
  };

  const handleTouchMove = (e) => {
    // Prevent scrolling when interacting with tiles
    e.preventDefault();
  };

  return (
    <motion.div
      className="relative w-full h-full cursor-pointer select-none"
      style={{
        perspective: '200px',
      }}
      // Entry animation (spawn)
      initial={{
        scale: 0,
        rotateX: -180,
        rotateY: 90,
        opacity: 0,
      }}
      animate={{
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        opacity: 1,
        y: isFalling ? fallDistance * 70 : 0, // 70px per cell
      }}
      exit={{
        scale: 0,
        rotateX: 180,
        rotateY: -90,
        opacity: 0,
      }}
      transition={isFalling ? FALL_SPRING : SPRING_CONFIG}
      whileHover={{
        scale: isClearable ? 1.08 : 1.02,
        rotateX: isClearable ? 5 : 0,
        rotateY: isClearable ? -5 : 0,
        transition: { ...SPRING_CONFIG, stiffness: 500 },
      }}
      whileTap={{
        scale: 0.92,
        transition: { duration: 0.05 },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* Main tile body */}
      <motion.div
        className="w-full h-full relative overflow-hidden"
        style={{
          background: config.bgGradient,
          borderRadius: '8px',
          border: `2px solid ${config.borderColor}`,
          boxShadow: isClearable
            ? `0 0 ${isHovered ? '25px' : '15px'} ${config.glowColor},
               ${config.shadowInner},
               0 4px 8px rgba(0,0,0,0.4)`
            : `${config.shadowInner}, 0 2px 4px rgba(0,0,0,0.3)`,
          opacity: isClearable ? 1 : 0.5,
          filter: isClearable ? 'none' : 'grayscale(30%)',
          transformStyle: 'preserve-3d',
        }}
        animate={{
          boxShadow: isClearable
            ? `0 0 ${isHovered ? '30px' : '15px'} ${config.glowColor},
               ${config.shadowInner},
               0 4px 8px rgba(0,0,0,0.4)`
            : `${config.shadowInner}, 0 2px 4px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Top shine effect */}
        <div
          className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '6px 6px 0 0',
          }}
        />

        {/* Animated background pattern for clearable tiles */}
        {isClearable && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Icon container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: isHovered && isClearable ? 1.1 : 1,
              rotate: isHovered && isClearable ? [0, -5, 5, 0] : 0,
            }}
            transition={{
              rotate: { duration: 0.3 },
              scale: { duration: 0.2 },
            }}
          >
            <TileIcon
              type={config.icon}
              color={config.iconColor}
              size={32}
            />
          </motion.div>
        </div>

        {/* Corner accents */}
        <div
          className="absolute top-1 left-1 w-2 h-2 pointer-events-none"
          style={{
            borderTop: `2px solid rgba(255,255,255,0.5)`,
            borderLeft: `2px solid rgba(255,255,255,0.5)`,
            borderRadius: '2px 0 0 0',
          }}
        />
        <div
          className="absolute bottom-1 right-1 w-2 h-2 pointer-events-none"
          style={{
            borderBottom: `2px solid rgba(0,0,0,0.3)`,
            borderRight: `2px solid rgba(0,0,0,0.3)`,
            borderRadius: '0 0 2px 0',
          }}
        />

        {/* Hover glow overlay */}
        {isHovered && isClearable && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${config.glowColor}40 0%, transparent 70%)`,
              borderRadius: '6px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}

        {/* Press feedback */}
        {isPressed && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '6px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}

        {/* Clearable pulse ring */}
        {isClearable && (
          <motion.div
            className="absolute inset-[-4px] pointer-events-none"
            style={{
              border: `2px solid ${config.glowColor}`,
              borderRadius: '12px',
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      {/* Shadow underneath */}
      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-2 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)',
          filter: 'blur(2px)',
        }}
      />
    </motion.div>
  );
}
