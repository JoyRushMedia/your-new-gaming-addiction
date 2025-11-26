import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevel, getWorldForLevel, LEVELS } from '../lib/levels';
import { soundManager } from '../lib/sounds';

/**
 * LevelComplete Component
 * Celebration modal with star rating and Zeigarnik "Next Level" button
 */
export default function LevelComplete({
  levelId,
  score,
  time,
  tilesCleared,
  maxCombo,
  earnedStars,
  isNewRecord,
  unlockedLevel,
  onNextLevel,
  onRetry,
  onLevelSelect,
}) {
  const [showStars, setShowStars] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const level = getLevel(levelId);
  const world = getWorldForLevel(levelId);
  const nextLevel = LEVELS.find(l => l.id === levelId + 1);

  // Animate stars appearing one by one
  useEffect(() => {
    const timer1 = setTimeout(() => setShowStars(1), 400);
    const timer2 = setTimeout(() => {
      if (earnedStars >= 2) setShowStars(2);
    }, 700);
    const timer3 = setTimeout(() => {
      if (earnedStars >= 3) setShowStars(3);
    }, 1000);
    const timer4 = setTimeout(() => setShowContent(true), 1200);

    // Play celebration sound
    soundManager.playStreakMilestone();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [earnedStars]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="fixed inset-0 bg-void-black/95 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-center max-w-md w-full"
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Level Complete Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className="text-impact text-4xl md:text-5xl mb-2"
            style={{
              color: world?.color || '#00f0ff',
              textShadow: `0 0 40px ${world?.color || '#00f0ff'}`,
            }}
          >
            LEVEL {levelId}
          </div>
          <div className="text-2xl font-rajdhani text-white mb-1">
            {level?.name}
          </div>
          <div className="text-lg font-impact text-order mb-4">
            COMPLETE!
          </div>
        </motion.div>

        {/* Star Rating Animation */}
        <div className="flex justify-center gap-4 mb-6">
          {[1, 2, 3].map(starNum => (
            <motion.div
              key={starNum}
              initial={{ scale: 0, rotate: -180 }}
              animate={
                showStars >= starNum
                  ? { scale: 1, rotate: 0 }
                  : { scale: 0.5, rotate: 0 }
              }
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 15,
              }}
            >
              <span
                className={`text-5xl ${
                  showStars >= starNum ? 'text-neon-amber' : 'text-void-border'
                }`}
                style={{
                  textShadow: showStars >= starNum ? '0 0 20px #ffb000' : undefined,
                  filter: showStars >= starNum ? 'drop-shadow(0 0 10px #ffb000)' : undefined,
                }}
              >
                ★
              </span>
            </motion.div>
          ))}
        </div>

        {/* New Record Badge */}
        <AnimatePresence>
          {isNewRecord && showContent && (
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring' }}
            >
              <span
                className="inline-block bg-neon-amber/20 border-2 border-neon-amber text-neon-amber px-4 py-1 rounded-full font-rajdhani font-bold"
                style={{ boxShadow: '0 0 20px #ffb00060' }}
              >
                NEW RECORD!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="bg-void-surface border-2 rounded-xl p-4 mb-6"
              style={{
                borderColor: world?.color || '#00f0ff',
                boxShadow: `0 0 20px ${world?.color || '#00f0ff'}30`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <div className="text-[10px] text-text-muted font-rajdhani tracking-wider">SCORE</div>
                  <div className="text-xl font-bold text-white">{score.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted font-rajdhani tracking-wider">TIME</div>
                  <div className="text-xl font-bold text-white">{formatTime(time)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted font-rajdhani tracking-wider">TILES CLEARED</div>
                  <div className="text-xl font-bold text-neon-cyan">{tilesCleared}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted font-rajdhani tracking-wider">MAX COMBO</div>
                  <div className="text-xl font-bold text-neon-amber">x{maxCombo}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unlocked Level Notification */}
        <AnimatePresence>
          {unlockedLevel && showContent && (
            <motion.div
              className="mb-4 text-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-sm text-text-muted font-rajdhani">UNLOCKED</div>
              <div className="text-lg font-impact text-neon-violet" style={{ textShadow: '0 0 15px #a855f7' }}>
                Level {unlockedLevel}: {LEVELS.find(l => l.id === unlockedLevel)?.name}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Next Level Button - Primary CTA for Zeigarnik effect */}
              {nextLevel && (
                <motion.button
                  className="w-full py-4 rounded-xl font-rajdhani font-bold text-xl text-void-black relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${world?.color || '#00f0ff'} 0%, ${world?.color || '#00f0ff'}cc 100%)`,
                    boxShadow: `0 0 30px ${world?.color || '#00f0ff'}80`,
                  }}
                  whileHover={{ scale: 1.02, boxShadow: `0 0 40px ${world?.color || '#00f0ff'}` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNextLevel(nextLevel.id)}
                >
                  {/* Pulsing effect */}
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span className="relative z-10">
                    NEXT LEVEL →
                  </span>
                  <div className="text-xs opacity-80 relative z-10">
                    {nextLevel.name}
                  </div>
                </motion.button>
              )}

              {/* Retry Button */}
              <motion.button
                className="w-full bg-void-surface border-2 border-neon-cyan text-neon-cyan py-3 rounded-xl font-rajdhani font-bold"
                style={{ boxShadow: '0 0 15px #00f0ff30' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRetry}
              >
                {earnedStars < 3 ? 'TRY FOR MORE STARS' : 'PLAY AGAIN'}
              </motion.button>

              {/* Level Select Button */}
              <motion.button
                className="w-full bg-void-surface border border-void-border text-text-muted py-2 rounded-xl font-rajdhani hover:border-neon-magenta hover:text-neon-magenta"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLevelSelect}
              >
                LEVEL SELECT
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
