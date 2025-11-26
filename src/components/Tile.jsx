import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Tile Component - ENHANCED VISUAL DESIGN
 * Features: Geometric icons, gradients, depth, glow effects, drag/swipe support
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
    icon: 'bolt',
  },
  magenta: {
    name: 'Plasma',
    bgGradient: 'linear-gradient(135deg, #ff00ff 0%, #ff0080 50%, #ff00ff 100%)',
    borderColor: '#ff00ff',
    glowColor: '#ff00ff',
    iconColor: '#1f001f',
    shadowInner: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
    icon: 'hexagon',
  },
  amber: {
    name: 'Core',
    bgGradient: 'linear-gradient(135deg, #ffb000 0%, #ff6600 50%, #ffb000 100%)',
    borderColor: '#ffb000',
    glowColor: '#ffb000',
    iconColor: '#1f1000',
    shadowInner: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
    icon: 'diamond',
  },
  violet: {
    name: 'Void',
    bgGradient: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 50%, #a855f7 100%)',
    borderColor: '#a855f7',
    glowColor: '#a855f7',
    iconColor: '#0f0520',
    shadowInner: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
    icon: 'star',
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

export default function Tile({
  tile,
  onClear,
  onSwap,
  isClearable,
  isSelected = false,
  cellSize = 60,
  isNew = false, // Flag for newly spawned tiles
  spawnDelay = 0, // Stagger spawn animations
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const tileRef = useRef(null);

  const config = TILE_CONFIG[tile.type] || TILE_CONFIG.cyan;
  const iconSize = Math.max(24, cellSize * 0.5);

  // Spawn animation: fall from above if new tile
  const spawnAnimation = isNew
    ? {
        initial: { y: -(cellSize * 2), scale: 0.8, opacity: 0 },
        animate: { y: 0, scale: 1, opacity: 1 },
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: spawnDelay,
        },
      }
    : {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: SPRING_CONFIG,
      };

  // Handle click/tap - clear if clearable
  const handleClick = () => {
    // Don't trigger click if we just finished dragging
    if (isDragging) return;

    if (isClearable) {
      onClear(tile.id);
    }
  };

  // Get swipe direction from delta
  const getSwipeDirection = (deltaX, deltaY) => {
    const threshold = cellSize * 0.3; // 30% of cell size
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < threshold && absY < threshold) return null;

    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  };

  // Mouse/Trackpad drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(false);
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;

      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        setIsDragging(true);
      }
    };

    const handleMouseUp = (upEvent) => {
      const deltaX = upEvent.clientX - dragStartRef.current.x;
      const deltaY = upEvent.clientY - dragStartRef.current.y;
      const direction = getSwipeDirection(deltaX, deltaY);

      if (direction && onSwap) {
        onSwap(tile, direction);
      }

      // Small delay before resetting drag state to prevent click
      setTimeout(() => setIsDragging(false), 50);

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch drag handlers
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(false);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;

    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    const direction = getSwipeDirection(deltaX, deltaY);

    if (direction && onSwap) {
      onSwap(tile, direction);
    } else if (!isDragging && isClearable) {
      // If it was a tap (not a swipe), clear the tile
      onClear(tile.id);
    }

    setTimeout(() => setIsDragging(false), 50);
  };

  return (
    <motion.div
      ref={tileRef}
      className="absolute inset-0 cursor-pointer select-none overflow-visible"
      style={{ perspective: '200px' }}
      initial={spawnAnimation.initial}
      animate={spawnAnimation.animate}
      exit={{
        scale: [1, 1.3, 0],
        opacity: [1, 1, 0],
        rotate: [0, Math.random() > 0.5 ? 15 : -15, 0],
        filter: ['brightness(1)', 'brightness(2)', 'brightness(0)'],
      }}
      transition={spawnAnimation.transition}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main tile body */}
      <motion.div
        className="w-full h-full relative overflow-hidden rounded-lg"
        style={{
          background: config.bgGradient,
          border: `2px solid ${config.borderColor}`,
          boxShadow: isSelected
            ? `0 0 30px ${config.glowColor}, 0 0 60px ${config.glowColor}, ${config.shadowInner}`
            : isClearable
              ? `0 0 ${isHovered ? '25px' : '15px'} ${config.glowColor}, ${config.shadowInner}, 0 4px 8px rgba(0,0,0,0.4)`
              : `0 0 8px ${config.glowColor}40, ${config.shadowInner}, 0 2px 4px rgba(0,0,0,0.3)`,
          transformStyle: 'preserve-3d',
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

        {/* Animated pulse for clearable tiles */}
        {isClearable && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${config.glowColor}30 0%, transparent 60%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Icon container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: isHovered ? 1.1 : 1,
              rotate: isHovered ? [0, -5, 5, 0] : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <TileIcon
              type={config.icon}
              color={config.iconColor}
              size={iconSize}
            />
          </motion.div>
        </div>

        {/* Corner accents */}
        <div
          className="absolute top-1 left-1 w-2 h-2 pointer-events-none"
          style={{
            borderTop: '2px solid rgba(255,255,255,0.5)',
            borderLeft: '2px solid rgba(255,255,255,0.5)',
            borderRadius: '2px 0 0 0',
          }}
        />
        <div
          className="absolute bottom-1 right-1 w-2 h-2 pointer-events-none"
          style={{
            borderBottom: '2px solid rgba(0,0,0,0.3)',
            borderRight: '2px solid rgba(0,0,0,0.3)',
            borderRadius: '0 0 2px 0',
          }}
        />

        {/* Selection ring */}
        {isSelected && (
          <motion.div
            className="absolute inset-[-4px] pointer-events-none rounded-xl"
            style={{
              border: `3px solid white`,
              boxShadow: '0 0 20px white',
            }}
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
          />
        )}

        {/* Clearable indicator ring */}
        {isClearable && !isSelected && (
          <motion.div
            className="absolute inset-[-2px] pointer-events-none rounded-xl"
            style={{
              border: `2px solid ${config.glowColor}`,
            }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
