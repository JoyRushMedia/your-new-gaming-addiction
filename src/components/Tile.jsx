import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Tile Component - POLISHED FOR SMOOTH GAMEPLAY
 * Features: Spring-animated positions, responsive interactions, snappy feedback
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

// Snappy spring physics for responsive feel
const POSITION_SPRING = {
  type: 'spring',
  stiffness: 700,
  damping: 35,
  mass: 0.8,
};

const SCALE_SPRING = {
  type: 'spring',
  stiffness: 500,
  damping: 25,
};

export default function Tile({
  tile,
  onClear,
  onSwap,
  isClearable,
  isSelected = false,
  cellSize = 60,
  gridGap = 4,
  isNew = false,
  isSwapping = false,
  isHinted = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const tileRef = useRef(null);

  const config = TILE_CONFIG[tile.type] || TILE_CONFIG.cyan;
  const iconSize = Math.max(24, cellSize * 0.5);

  // Calculate pixel position from grid coordinates
  const pixelX = tile.x * (cellSize + gridGap);
  const pixelY = tile.y * (cellSize + gridGap);

  // Handle click/tap - clear if clearable
  const handleClick = () => {
    if (isDragging) return;
    if (isClearable) {
      onClear(tile.id);
    }
  };

  // Get swipe direction from delta
  const getSwipeDirection = (deltaX, deltaY) => {
    const threshold = cellSize * 0.25; // Reduced threshold for quicker response
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

      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
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

      setTimeout(() => setIsDragging(false), 30);

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
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;

    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
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
      onClear(tile.id);
    }

    setTimeout(() => setIsDragging(false), 30);
  };

  return (
    <motion.div
      ref={tileRef}
      className="absolute cursor-pointer select-none"
      style={{
        width: cellSize,
        height: cellSize,
        zIndex: isSwapping ? 10 : 1,
      }}
      // Animate position changes smoothly
      initial={isNew ? { x: pixelX, y: pixelY, scale: 0, opacity: 0 } : { x: pixelX, y: pixelY }}
      animate={{
        x: pixelX,
        y: pixelY,
        scale: 1,
        opacity: 1,
      }}
      exit={{
        scale: 0,
        opacity: 0,
        transition: { duration: 0.15 },
      }}
      transition={POSITION_SPRING}
      whileHover={{ scale: 1.08, transition: { duration: 0.1 } }}
      whileTap={{ scale: 0.92, transition: { duration: 0.05 } }}
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
        }}
        animate={{
          scale: isSwapping ? 1.05 : 1,
        }}
        transition={SCALE_SPRING}
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
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 1,
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
            }}
            transition={{ duration: 0.15 }}
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
              duration: 0.4,
              repeat: Infinity,
            }}
          />
        )}

        {/* Clearable indicator ring */}
        {isClearable && !isSelected && !isHinted && (
          <motion.div
            className="absolute inset-[-2px] pointer-events-none rounded-xl"
            style={{
              border: `2px solid ${config.glowColor}`,
            }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Hint indicator - pulsing gold ring */}
        {isHinted && (
          <motion.div
            className="absolute inset-[-4px] pointer-events-none rounded-xl"
            style={{
              border: '3px solid #ffd700',
              boxShadow: '0 0 20px #ffd700, inset 0 0 10px #ffd70050',
            }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
