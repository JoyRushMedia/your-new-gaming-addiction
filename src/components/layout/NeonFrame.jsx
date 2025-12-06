import { designTokens } from '../../lib/designTokens';

export default function NeonFrame({
  children,
  showCorners = true,
  showGrid = true,
  showScanlines = true,
  backgroundColor = designTokens.colors.voidBlack,
}) {
  const gridStyle = {
    backgroundImage: `
      linear-gradient(to right, ${designTokens.overlays.grid.color} 1px, transparent 1px),
      linear-gradient(to bottom, ${designTokens.overlays.grid.color} 1px, transparent 1px)
    `,
    backgroundSize: `${designTokens.overlays.grid.size}px ${designTokens.overlays.grid.size}px`,
    opacity: designTokens.overlays.grid.opacity,
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor }}>
      {showScanlines && (
        <div className="scanlines absolute inset-0 pointer-events-none z-[1]" style={{ opacity: designTokens.overlays.scanlines.opacity }} />
      )}

      {showGrid && (
        <div className="absolute inset-0 pointer-events-none z-[0]" style={gridStyle} />
      )}

      {showCorners && (
        <>
          <div
            className="absolute top-0 left-0 border-l-2 border-t-2 pointer-events-none z-[1]"
            style={{
              width: designTokens.overlays.corners.size.base,
              height: designTokens.overlays.corners.size.base,
              borderColor: designTokens.overlays.corners.color,
              opacity: designTokens.overlays.corners.opacity,
            }}
          />
          <div
            className="absolute top-0 right-0 border-r-2 border-t-2 pointer-events-none z-[1]"
            style={{
              width: designTokens.overlays.corners.size.base,
              height: designTokens.overlays.corners.size.base,
              borderColor: designTokens.overlays.corners.color,
              opacity: designTokens.overlays.corners.opacity,
            }}
          />
          <div
            className="absolute bottom-0 left-0 border-l-2 border-b-2 pointer-events-none z-[1]"
            style={{
              width: designTokens.overlays.corners.size.base,
              height: designTokens.overlays.corners.size.base,
              borderColor: designTokens.overlays.corners.color,
              opacity: designTokens.overlays.corners.opacity,
            }}
          />
          <div
            className="absolute bottom-0 right-0 border-r-2 border-b-2 pointer-events-none z-[1]"
            style={{
              width: designTokens.overlays.corners.size.base,
              height: designTokens.overlays.corners.size.base,
              borderColor: designTokens.overlays.corners.color,
              opacity: designTokens.overlays.corners.opacity,
            }}
          />
        </>
      )}

      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
