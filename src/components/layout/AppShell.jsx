import { motion } from 'framer-motion';
import { defaultMotionConfig, designTokens } from '../../lib/designTokens';

export default function AppShell({
  header,
  hud,
  sidebar,
  footer,
  children,
  padding = 'md',
  motionConfig = defaultMotionConfig,
  className = '',
}) {
  const paddingClass = padding === 'lg' ? 'p-6 md:p-10' : 'p-4 md:p-8';
  const containerClasses = `relative w-full h-full ${paddingClass} ${className}`;

  return (
    <div className={containerClasses}>
      <div className="flex flex-col gap-4 h-full" style={{ color: 'white' }}>
        {header && (
          <div className="flex flex-col gap-2">
            {header}
            {hud && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-text-muted text-sm font-exo">
                {hud}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 grid gap-4 md:grid-cols-[minmax(240px,280px)_1fr] min-h-0">
          {sidebar && (
            <motion.div
              className="order-2 md:order-1 h-full"
              initial={{ opacity: 0, y: 10 }}
              animate={motionConfig.enabled ? { opacity: 1, y: 0 } : { opacity: 1 }}
              transition={motionConfig.transitions.default}
            >
              <div
                className="chamfer-lg bg-void-surface/70 border border-void-border h-full p-4"
                style={{ boxShadow: `0 0 25px ${designTokens.colors.neonCyan}10` }}
              >
                {sidebar}
              </div>
            </motion.div>
          )}

          <div className="order-1 md:order-2 flex flex-col gap-4 min-h-0">
            {children}
          </div>
        </div>

        {footer && (
          <div className="pt-2 border-t border-void-border/60 text-text-muted text-xs font-exo">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
