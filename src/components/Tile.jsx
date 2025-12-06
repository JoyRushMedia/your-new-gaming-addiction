import { memo, useRef, useState, useEffect } from 'react';

/**
 * Tile Component - HIGH PERFORMANCE CSS VERSION
 * Uses CSS transforms instead of Framer Motion springs for 60fps animations
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

// Special tile icons
const SpecialIcon = ({ special, size = 28 }) => {
  const icons = {
    bomb: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="14" r="8" fill="#1a1a1a" stroke="#ff6600" strokeWidth="2" />
        <path d="M12 6V2M10 3h4" stroke="#ff6600" strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="12" r="2" fill="rgba(255,255,255,0.3)" />
        <path d="M14 4l2-2" stroke="#ffaa00" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="2" r="1" fill="#ffaa00" />
      </svg>
    ),
    line_h: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="10" width="20" height="4" rx="2" fill="#00f0ff" />
        <path d="M2 12h20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="4" cy="12" r="2" fill="#ffffff" />
        <circle cx="20" cy="12" r="2" fill="#ffffff" />
      </svg>
    ),
    line_v: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="10" y="2" width="4" height="20" rx="2" fill="#00f0ff" />
        <path d="M12 2v20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="4" r="2" fill="#ffffff" />
        <circle cx="12" cy="20" r="2" fill="#ffffff" />
      </svg>
    ),
    rainbow: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="url(#rainbowGrad)" />
        <defs>
          <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="25%" stopColor="#ffff00" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="75%" stopColor="#00ffff" />
            <stop offset="100%" stopColor="#ff00ff" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="5" fill="#ffffff" opacity="0.5" />
        <path d="M12 7l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 10.5l3.5-.5L12 7z" fill="#ffffff" />
      </svg>
    ),
  };
  return icons[special] || null;
};

// Special tile configurations
const SPECIAL_CONFIG = {
  bomb: {
    bgGradient: 'radial-gradient(circle, #ff6600 0%, #cc3300 50%, #1a0a00 100%)',
    borderColor: '#ff6600',
    glowColor: '#ff6600',
  },
  line_h: {
    bgGradient: 'linear-gradient(90deg, #00f0ff 0%, #ffffff 50%, #00f0ff 100%)',
    borderColor: '#00f0ff',
    glowColor: '#00f0ff',
  },
  line_v: {
    bgGradient: 'linear-gradient(0deg, #00f0ff 0%, #ffffff 50%, #00f0ff 100%)',
    borderColor: '#00f0ff',
    glowColor: '#00f0ff',
  },
  rainbow: {
    bgGradient: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
    borderColor: '#ffffff',
    glowColor: '#ffffff',
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

function Tile({
  tile,
  onClear,
  onSwap,
  onSelect,
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
  const [isPressed, setIsPressed] = useState(false);
  const [hasEntered, setHasEntered] = useState(!isNew);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Handle new tile entrance animation
  useEffect(() => {
    if (isNew && !hasEntered) {
      // Small delay for staggered effect based on position
      const delay = (tile.x + tile.y) * 15;
      const timer = setTimeout(() => setHasEntered(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isNew, hasEntered, tile.x, tile.y]);

  // Use special config if tile is special, otherwise use regular config
  const isSpecial = tile.special && SPECIAL_CONFIG[tile.special];
  const config = isSpecial ? SPECIAL_CONFIG[tile.special] : (TILE_CONFIG[tile.type] || TILE_CONFIG.cyan);
  const regularConfig = TILE_CONFIG[tile.type] || TILE_CONFIG.cyan;
  const iconSize = Math.max(24, cellSize * 0.5);

  // Calculate pixel position from grid coordinates
  const pixelX = tile.x * (cellSize + gridGap);
  const pixelY = tile.y * (cellSize + gridGap);

  // Handle click/tap - use onSelect for click-to-select swap, or clear if clearable
  const handleClick = () => {
    if (isDragging) return;
    // Prefer onSelect for unified click handling (supports click-to-swap)
    if (onSelect) {
      onSelect(tile);
    } else if (isClearable) {
      onClear(tile.id);
    }
  };

  // Get swipe direction from delta
  const getSwipeDirection = (deltaX, deltaY) => {
    const threshold = cellSize * 0.25;
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
    setIsPressed(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;

      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        setIsDragging(true);
      }
    };

    const handleMouseUp = (upEvent) => {
      setIsPressed(false);
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
    setIsPressed(true);
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
    setIsPressed(false);
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

  // Calculate scale based on state
  const getScale = () => {
    if (!hasEntered) return 0;
    if (isPressed) return 0.92;
    if (isHovered) return 1.08;
    if (isSwapping) return 1.05;
    return 1;
  };

  // Container styles - GPU accelerated
  const containerStyle = {
    position: 'absolute',
    width: cellSize,
    height: cellSize,
    // GPU acceleration: use translate3d and will-change
    transform: `translate3d(${pixelX}px, ${pixelY}px, 0) scale(${getScale()})`,
    opacity: hasEntered ? 1 : 0,
    // Fast CSS transitions instead of spring physics
    transition: hasEntered
      ? 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease-out'
      : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease-out',
    zIndex: isSwapping ? 10 : 1,
    cursor: 'pointer',
    userSelect: 'none',
    // GPU layer hints
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };

  // Inner tile body style
  const tileBodyStyle = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '8px',
    background: config.bgGradient,
    border: `2px solid ${config.borderColor}`,
    boxShadow: isClearable
      ? `0 0 ${isHovered ? '25px' : '15px'} ${config.glowColor}, ${config.shadowInner || ''}, 0 4px 8px rgba(0,0,0,0.4)`
      : `0 0 8px ${config.glowColor}40, ${config.shadowInner || ''}, 0 2px 4px rgba(0,0,0,0.3)`,
    // GPU acceleration for box-shadow changes
    transition: 'box-shadow 0.1s ease-out',
  };

  return (
    <div
      data-tile-id={tile.id}
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main tile body */}
      <div style={tileBodyStyle}>
        {/* Top shine effect */}
        <div
          style={{
            position: 'absolute',
            inset: '0',
            top: 0,
            height: '33%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '6px 6px 0 0',
            pointerEvents: 'none',
          }}
        />

        {/* Simple glow for clearable tiles */}
        {isClearable && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '8px',
              background: `radial-gradient(circle at 50% 50%, ${config.glowColor}40 0%, transparent 60%)`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Icon container */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.1s ease-out'
          }}>
            {isSpecial ? (
              <SpecialIcon special={tile.special} size={iconSize} />
            ) : (
              <TileIcon
                type={regularConfig.icon}
                color={regularConfig.iconColor}
                size={iconSize}
              />
            )}
          </div>
        </div>

        {/* Special tile indicator */}
        {isSpecial && (
          <div
            style={{
              position: 'absolute',
              inset: '-3px',
              borderRadius: '12px',
              border: `2px solid ${config.glowColor}`,
              boxShadow: `0 0 15px ${config.glowColor}`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Corner accents */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            width: '8px',
            height: '8px',
            borderTop: '2px solid rgba(255,255,255,0.5)',
            borderLeft: '2px solid rgba(255,255,255,0.5)',
            borderRadius: '2px 0 0 0',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            borderBottom: '2px solid rgba(0,0,0,0.3)',
            borderRight: '2px solid rgba(0,0,0,0.3)',
            borderRadius: '0 0 2px 0',
            pointerEvents: 'none',
          }}
        />

        {/* Clearable indicator ring */}
        {isClearable && !isHinted && (
          <div
            style={{
              position: 'absolute',
              inset: '-2px',
              borderRadius: '12px',
              border: `2px solid ${config.glowColor}`,
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Hint indicator - gold ring */}
        {isHinted && (
          <div
            style={{
              position: 'absolute',
              inset: '-3px',
              borderRadius: '12px',
              border: '3px solid #ffd700',
              boxShadow: '0 0 15px #ffd700',
              pointerEvents: 'none',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
        )}

        {/* Selection indicator - cyan pulsing ring */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '12px',
              border: '3px solid #00f0ff',
              boxShadow: '0 0 20px #00f0ff, inset 0 0 10px rgba(0, 240, 255, 0.3)',
              pointerEvents: 'none',
              animation: 'pulse 0.8s ease-in-out infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}

const propsAreEqual = (prev, next) => {
  if (prev.cellSize !== next.cellSize || prev.gridGap !== next.gridGap) return false;
  if (prev.isClearable !== next.isClearable) return false;
  if (prev.isNew !== next.isNew) return false;
  if (prev.isSwapping !== next.isSwapping) return false;
  if (prev.isHinted !== next.isHinted) return false;
  if (prev.isSelected !== next.isSelected) return false;

  const prevTile = prev.tile;
  const nextTile = next.tile;

  return (
    prevTile.id === nextTile.id &&
    prevTile.x === nextTile.x &&
    prevTile.y === nextTile.y &&
    prevTile.type === nextTile.type &&
    prevTile.special === nextTile.special
  );
};

export default memo(Tile, propsAreEqual);
