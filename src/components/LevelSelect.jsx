import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from './layout/AppShell';
import TilePreview from './layout/TilePreview';
import { defaultMotionConfig } from '../lib/designTokens';
import {
  LEVELS,
  WORLDS,
  getLevelProgress,
  getWorldForLevel,
  getTotalStars,
  getMaxStars,
  getGoalDescription,
} from '../lib/levels';

/**
 * LevelSelect Component
 * Implements Zeigarnik Effect through visible locked levels creating "cognitive tension"
 */
export default function LevelSelect({ onSelectLevel, onBack }) {
  const [selectedWorld, setSelectedWorld] = useState(1);
  const progress = useMemo(() => getLevelProgress(), []);
  const totalStars = useMemo(() => getTotalStars(), []);
  const maxStars = useMemo(() => getMaxStars(), []);

  // Get levels for selected world
  const worldLevels = useMemo(() => {
    const world = WORLDS.find(w => w.id === selectedWorld);
    if (!world) return [];
    return LEVELS.filter(l => l.id >= world.levels[0] && l.id <= world.levels[1]);
  }, [selectedWorld]);

  const currentWorld = WORLDS.find(w => w.id === selectedWorld);

  // Find the next unlocked level (for highlighting)
  const nextPlayableLevel = useMemo(() => {
    for (const level of LEVELS) {
      if (progress.unlockedLevels.includes(level.id) && !progress.stars[level.id]) {
        return level.id;
      }
    }
    // If all unlocked are completed, return highest unlocked
    return Math.max(...progress.unlockedLevels);
  }, [progress]);

  const header = (
    <div className="flex items-center justify-between gap-4">
      <motion.button
        className="bg-void-surface border border-void-border rounded-lg px-4 py-2 text-text-muted font-rajdhani hover:border-neon-cyan hover:text-neon-cyan"
        whileHover={defaultMotionConfig.hover}
        whileTap={defaultMotionConfig.tap}
        onClick={onBack}
      >
        BACK
      </motion.button>

      <div className="text-center flex-1">
        <h1 className="text-2xl md:text-3xl font-impact text-neon-cyan" style={{ textShadow: '0 0 20px #00f0ff' }}>
          CHALLENGE MODE
        </h1>
        <div className="text-sm text-text-muted font-rajdhani">
          {totalStars} / {maxStars} Stars
        </div>
      </div>

      <div className="flex items-center gap-1 bg-void-surface border border-neon-amber rounded-lg px-3 py-2"
        style={{ boxShadow: '0 0 15px #ffb00040' }}>
        <span className="text-neon-amber text-xl">★</span>
        <span className="text-white font-bold font-rajdhani">{totalStars}</span>
      </div>
    </div>
  );

  const hud = (
    <div className="flex flex-wrap gap-3 text-xs md:text-sm font-exo">
      <span className="text-text-muted">Select a world to push streaks and earn stars.</span>
      <span className="text-neon-cyan">Unlocked Levels: {progress.unlockedLevels.length}</span>
    </div>
  );

  const sidebar = (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted font-rajdhani">Tile Glossary</div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <TilePreview type="cyan" size={46} />
          <TilePreview type="magenta" size={46} />
          <TilePreview type="amber" size={46} />
          <TilePreview type="violet" size={46} />
        </div>
      </div>
      <div className="text-xs text-text-muted">
        Earn stars to unlock higher tiers. Motion and styling now flow from shared layout primitives.
      </div>
    </div>
  );

  return (
    <AppShell header={header} hud={hud} sidebar={sidebar} padding="md">
      <div className="flex flex-col h-full gap-4 min-h-0">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {WORLDS.map(world => {
            const worldLevelsRange = LEVELS.filter(l => l.id >= world.levels[0] && l.id <= world.levels[1]);
            const worldStars = worldLevelsRange.reduce((sum, l) => sum + (progress.stars[l.id] || 0), 0);
            const maxWorldStars = worldLevelsRange.length * 3;
            const isUnlocked = progress.unlockedLevels.some(id => id >= world.levels[0] && id <= world.levels[1]);

            return (
              <motion.button
                key={world.id}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-rajdhani font-bold transition-all ${
                  selectedWorld === world.id
                    ? 'bg-void-surface border-2'
                    : isUnlocked
                      ? 'bg-void-surface/50 border border-void-border hover:border-opacity-100'
                      : 'bg-void-surface/30 border border-void-border opacity-50 cursor-not-allowed'
                }`}
                style={{
                  borderColor: selectedWorld === world.id ? world.color : undefined,
                  boxShadow: selectedWorld === world.id ? `0 0 20px ${world.color}40` : undefined,
                  color: selectedWorld === world.id ? world.color : isUnlocked ? '#ffffff' : '#666',
                }}
                whileHover={isUnlocked ? { scale: 1.02 } : {}}
                whileTap={isUnlocked ? { scale: 0.98 } : {}}
                onClick={() => isUnlocked && setSelectedWorld(world.id)}
                disabled={!isUnlocked}
              >
                <div className="text-sm">{world.name}</div>
                <div className="text-xs opacity-70">
                  {worldStars}/{maxWorldStars} ★
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {worldLevels.map((level, index) => {
              const isUnlocked = progress.unlockedLevels.includes(level.id);
              const stars = progress.stars[level.id] || 0;
              const isNext = level.id === nextPlayableLevel;
              const highScore = progress.highScores[level.id];

              return (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <motion.button
                    className={`w-full aspect-square rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden ${
                      isUnlocked
                        ? 'bg-void-surface border-2 cursor-pointer'
                        : 'bg-void-surface/30 border border-void-border cursor-not-allowed'
                    }`}
                    style={{
                      borderColor: isUnlocked
                        ? isNext
                          ? currentWorld?.color
                          : stars > 0
                            ? '#00f0ff40'
                            : '#333'
                        : '#222',
                      boxShadow: isNext ? `0 0 30px ${currentWorld?.color}60` : undefined,
                    }}
                    whileHover={isUnlocked ? { scale: 1.05, y: -2 } : {}}
                    whileTap={isUnlocked ? { scale: 0.95 } : {}}
                    onClick={() => isUnlocked && onSelectLevel(level.id)}
                    disabled={!isUnlocked}
                  >
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-void-black/60 z-10">
                        <span className="text-3xl opacity-50">🔒</span>
                      </div>
                    )}

                    {isNext && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${currentWorld?.color}20 0%, transparent 70%)`,
                        }}
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}

                    <div
                      className={`text-2xl font-impact ${isUnlocked ? 'text-white' : 'text-text-muted opacity-30'}`}
                      style={{
                        color: isUnlocked && stars === 3 ? '#ffb000' : undefined,
                        textShadow: isUnlocked && stars === 3 ? '0 0 10px #ffb000' : undefined,
                      }}
                    >
                      {level.id}
                    </div>

                    <div className={`text-[10px] font-rajdhani text-center mt-1 ${isUnlocked ? 'text-text-muted' : 'text-text-muted/30'}`}>
                      {level.name}
                    </div>

                    {isUnlocked && (
                      <div className="flex gap-0.5 mt-2">
                        {[1, 2, 3].map(s => (
                          <span
                            key={s}
                            className={`text-sm ${s <= stars ? 'text-neon-amber' : 'text-void-border'}`}
                            style={{
                              textShadow: s <= stars ? '0 0 8px #ffb000' : undefined,
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}

                    {highScore && (
                      <div className="absolute top-1 right-1 text-[8px] bg-void-deep px-1 rounded text-neon-cyan font-rajdhani">
                        {highScore.toLocaleString()}
                      </div>
                    )}

                    {isNext && (
                      <motion.div
                        className="absolute bottom-1 text-[10px] font-rajdhani font-bold"
                        style={{ color: currentWorld?.color }}
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        PLAY
                      </motion.div>
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {nextPlayableLevel && (
            <motion.div
              className="bg-void-surface border border-neon-cyan rounded-xl p-4"
              style={{ boxShadow: '0 0 20px #00f0ff30' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {(() => {
                const level = LEVELS.find(l => l.id === nextPlayableLevel);
                if (!level) return null;
                const world = getWorldForLevel(level.id);

                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xl font-impact"
                          style={{ color: world?.color }}
                        >
                          Level {level.id}
                        </span>
                        <span className="text-white font-rajdhani">{level.name}</span>
                      </div>
                      <div className="text-sm text-text-muted font-exo">
                        {getGoalDescription(level)}
                      </div>
                      {level.maxTime && (
                        <div className="text-xs text-chaos font-rajdhani mt-1">
                          Time Limit: {level.maxTime}s
                        </div>
                      )}
                    </div>
                    <motion.button
                      className="bg-neon-cyan text-void-black px-6 py-3 rounded-lg font-rajdhani font-bold text-lg"
                      style={{ boxShadow: '0 0 30px #00f0ff60' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSelectLevel(nextPlayableLevel)}
                    >
                      START
                    </motion.button>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
