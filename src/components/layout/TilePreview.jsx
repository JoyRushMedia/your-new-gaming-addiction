import { motion } from 'framer-motion';
import { designTokens, defaultMotionConfig } from '../../lib/designTokens';

const tileIcons = {
  cyan: (
    <path
      d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
      fill="#001a1f"
      stroke="#001a1f"
      strokeWidth="1.5"
    />
  ),
  magenta: (
    <>
      <path
        d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z"
        fill="#1f001f"
        stroke="#1f001f"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="11" r="3" fill="rgba(255,255,255,0.3)" />
    </>
  ),
  amber: (
    <>
      <path
        d="M12 2l10 10-10 10L2 12 12 2z"
        fill="#1f1000"
        stroke="#1f1000"
        strokeWidth="1.5"
      />
      <path d="M12 6l6 6-6 6-6-6 6-6z" fill="rgba(255,255,255,0.2)" />
    </>
  ),
  violet: (
    <path
      d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4L12 17l-6.3 4.4 2.3-7.4-6-4.6h7.6L12 2z"
      fill="#0f0520"
      stroke="#0f0520"
      strokeWidth="1.5"
    />
  ),
};

export default function TilePreview({
  type,
  size = 40,
  showLabel = true,
  motionConfig = defaultMotionConfig,
}) {
  const config = designTokens.tiles[type];

  if (!config) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className="rounded-lg flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: config.gradient,
          border: `2px solid ${config.border}`,
          boxShadow: `0 0 15px ${config.border}, inset 0 2px 4px rgba(255,255,255,0.3)`,
        }}
        whileHover={motionConfig.enabled ? motionConfig.hover : undefined}
        whileTap={motionConfig.enabled ? motionConfig.tap : undefined}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
          {tileIcons[type]}
        </svg>
      </motion.div>
      {showLabel && <span className="text-text-muted text-xs">{config.name}</span>}
    </div>
  );
}
