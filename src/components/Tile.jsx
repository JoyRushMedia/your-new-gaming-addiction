import { memo, useRef, useState, useEffect } from 'react';

/**
 * Tile Component - ULTRA HIGH PERFORMANCE VERSION
 * Minimal DOM elements, simplified shadows, CSS-only animations
 */

// Tile type colors - simplified for performance
const TILE_COLORS = {
  cyan: { bg: '#00b8cc', border: '#00f0ff', glow: '#00f0ff', icon: '#001a1f' },
  magenta: { bg: '#cc00cc', border: '#ff00ff', glow: '#ff00ff', icon: '#1f001f' },
  amber: { bg: '#cc8800', border: '#ffb000', glow: '#ffb000', icon: '#1f1000' },
  violet: { bg: '#8833cc', border: '#a855f7', glow: '#a855f7', icon: '#0f0520' },
};

// Special tile colors
const SPECIAL_COLORS = {
  bomb: { bg: '#cc3300', border: '#ff6600', glow: '#ff6600' },
  line_h: { bg: '#00cccc', border: '#00f0ff', glow: '#00f0ff' },
  line_v: { bg: '#00cccc', border: '#00f0ff', glow: '#00f0ff' },
  rainbow: { bg: '#888888', border: '#ffffff', glow: '#ffffff' },
};

// Lightweight SVG icons - inline paths only
const ICONS = {
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  hexagon: 'M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z',
  diamond: 'M12 2l10 10-10 10L2 12 12 2z',
  star: 'M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4L12 17l-6.3 4.4 2.3-7.4-6-4.6h7.6L12 2z',
};

const ICON_MAP = { cyan: 'bolt', magenta: 'hexagon', amber: 'diamond', violet: 'star' };

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

  // Staggered entrance for new tiles
  useEffect(() => {
    if (isNew && !hasEntered) {
      const delay = (tile.x + tile.y) * 12;
      const timer = setTimeout(() => setHasEntered(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isNew, hasEntered, tile.x, tile.y]);

  const isSpecial = tile.special && SPECIAL_COLORS[tile.special];
  const colors = isSpecial ? SPECIAL_COLORS[tile.special] : (TILE_COLORS[tile.type] || TILE_COLORS.cyan);
  const iconPath = ICONS[ICON_MAP[tile.type] || 'bolt'];
  const iconSize = Math.max(22, cellSize * 0.45);

  // Position
  const pixelX = tile.x * (cellSize + gridGap);
  const pixelY = tile.y * (cellSize + gridGap);

  // Click handler
  const handleClick = () => {
    if (isDragging) return;
    if (onSelect) onSelect(tile);
    else if (isClearable) onClear(tile.id);
  };

  // Swipe detection
  const getSwipeDirection = (deltaX, deltaY) => {
    const threshold = cellSize * 0.25;
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) return null;
    return Math.abs(deltaX) > Math.abs(deltaY)
      ? (deltaX > 0 ? 'right' : 'left')
      : (deltaY > 0 ? 'down' : 'up');
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setIsPressed(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) setIsDragging(true);
    };

    const handleMouseUp = (upEvent) => {
      setIsPressed(false);
      const deltaX = upEvent.clientX - dragStartRef.current.x;
      const deltaY = upEvent.clientY - dragStartRef.current.y;
      const direction = getSwipeDirection(deltaX, deltaY);
      if (direction && onSwap) onSwap(tile, direction);
      setTimeout(() => setIsDragging(false), 30);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

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
    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) setIsDragging(true);
  };

  const handleTouchEnd = (e) => {
    setIsPressed(false);
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    const direction = getSwipeDirection(deltaX, deltaY);
    if (direction && onSwap) onSwap(tile, direction);
    else if (!isDragging && isClearable) onClear(tile.id);
    setTimeout(() => setIsDragging(false), 30);
  };

  // Calculate scale
  const scale = !hasEntered ? 0 : isPressed ? 0.92 : isHovered ? 1.06 : isSwapping ? 1.04 : 1;

  // Build box-shadow - single string instead of multiple elements
  let shadow = `inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -2px 3px rgba(0,0,0,0.25)`;
  if (isClearable || isHovered) {
    shadow += `, 0 0 ${isHovered ? '18px' : '12px'} ${colors.glow}`;
  }
  if (isSelected) {
    shadow += `, 0 0 20px #00f0ff, 0 0 30px #00f0ff`;
  } else if (isHinted) {
    shadow += `, 0 0 18px #ffd700, 0 0 25px #ffd700`;
  }

  // Border color based on state
  const borderColor = isSelected ? '#00f0ff' : isHinted ? '#ffd700' : colors.border;
  const borderWidth = isSelected || isHinted ? 3 : 2;

  return (
    <div
      data-tile-id={tile.id}
      style={{
        position: 'absolute',
        width: cellSize,
        height: cellSize,
        transform: `translate3d(${pixelX}px, ${pixelY}px, 0) scale(${scale})`,
        opacity: hasEntered ? 1 : 0,
        transition: hasEntered
          ? 'transform 0.12s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.1s'
          : 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s',
        zIndex: isSwapping || isSelected ? 10 : 1,
        cursor: 'pointer',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        // Main tile styling - all in one element
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.border} 100%)`,
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: '8px',
        boxShadow: shadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Single SVG icon - no wrapper divs */}
      {!isSpecial && (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill={colors.icon}
          style={{ pointerEvents: 'none' }}
        >
          <path d={iconPath} />
        </svg>
      )}
      {isSpecial && tile.special === 'bomb' && (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ pointerEvents: 'none' }}>
          <circle cx="12" cy="14" r="7" fill="#1a1a1a" stroke="#ff6600" strokeWidth="2" />
          <path d="M12 7V3M14 4l2-2" stroke="#ff6600" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      {isSpecial && (tile.special === 'line_h' || tile.special === 'line_v') && (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ pointerEvents: 'none' }}>
          <path
            d={tile.special === 'line_h' ? 'M2 12h20' : 'M12 2v20'}
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
      {isSpecial && tile.special === 'rainbow' && (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ pointerEvents: 'none' }}>
          <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4L12 17l-6.3 4.4 2.3-7.4-6-4.6h7.6L12 2z" fill="#ffd700" />
        </svg>
      )}
    </div>
  );
}

const propsAreEqual = (prev, next) => {
  if (prev.cellSize !== next.cellSize) return false;
  if (prev.isClearable !== next.isClearable) return false;
  if (prev.isNew !== next.isNew) return false;
  if (prev.isSwapping !== next.isSwapping) return false;
  if (prev.isHinted !== next.isHinted) return false;
  if (prev.isSelected !== next.isSelected) return false;

  const p = prev.tile, n = next.tile;
  return p.id === n.id && p.x === n.x && p.y === n.y && p.type === n.type && p.special === n.special;
};

export default memo(Tile, propsAreEqual);
