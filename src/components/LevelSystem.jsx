import { useState, useEffect } from "react";
import { useLanguage } from "../utils/LanguageContext";

export default function LevelSystem({
  levels,
  currentLevel,
  completedLevels,
  onSelectLevel,
  onComplete,
  justCompleted,
  onNext,
}) {
  const { t } = useLanguage();
  const level = levels[currentLevel - 1];
  if (!level) return null;

  return (
    <div className="bg-workshop-surface rounded-xl border border-workshop-border overflow-hidden">
      <div className="p-3 border-b border-workshop-border bg-workshop-bg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-workshop-accent tracking-wider uppercase">
            {t("levels.title")}
          </h3>
          <div className="flex items-center gap-0.5">
            {levels.map((l, i) => {
              const num = i + 1;
              const done = completedLevels.has(num);
              const isCurrent = currentLevel === num;
              const locked = !done && num > 1 && !completedLevels.has(num - 1);
              return (
                <button
                  key={num}
                  onClick={() => !locked && onSelectLevel(num)}
                  disabled={locked}
                  className={`w-7 h-7 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    isCurrent
                      ? "bg-workshop-accent text-white shadow-sm shadow-workshop-accent/40"
                      : done
                        ? "bg-workshop-accent3/20 text-workshop-accent3 border border-workshop-accent3/20"
                        : locked
                          ? "bg-workshop-border/50 text-workshop-muted/40 cursor-not-allowed"
                          : "bg-workshop-border text-workshop-muted hover:bg-workshop-border/70"
                  }`}
                >
                  {done ? "★" : isCurrent ? "▶" : num}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-sm font-bold text-workshop-text">
              {level.title}
            </div>
            <div className="text-[11px] text-workshop-muted leading-tight mt-0.5">
              {level.objective}
            </div>
          </div>
        </div>
      </div>

      {justCompleted && (
        <div className="p-3 bg-workshop-accent3/10 border-t border-workshop-accent3/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-workshop-accent3">
                {t("levels.complete")}
              </div>
              <div className="text-[11px] text-workshop-muted mt-0.5">
                {currentLevel < levels.length
                  ? t("levels.ready", levels[currentLevel].title)
                  : t("levels.mastered")}
              </div>
            </div>
            {currentLevel < levels.length && (
              <button
                onClick={onNext}
                className="px-3 py-1.5 bg-workshop-accent3 text-workshop-bg rounded-lg text-xs font-semibold cursor-pointer hover:bg-workshop-accent3/90 transition-colors"
              >
                {t("levels.next")}
              </button>
            )}
          </div>
        </div>
      )}

      {level.hint && !justCompleted && (
        <div className="px-3 py-2 bg-workshop-accent4/5 border-t border-workshop-accent4/10">
          <p className="text-[11px] text-workshop-muted leading-relaxed">
            <span className="text-workshop-accent4">💡</span> {level.hint}
          </p>
        </div>
      )}
    </div>
  );
}

export function useLevelSystem(totalLevels = 5) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState(() => new Set());
  const [justCompleted, setJustCompleted] = useState(0);

  const completeLevel = () => {
    if (completedLevels.has(currentLevel)) return;
    const next = new Set(completedLevels);
    next.add(currentLevel);
    setCompletedLevels(next);
    setJustCompleted(currentLevel);
  };

  const goNext = () => {
    if (currentLevel < totalLevels) {
      setCurrentLevel(currentLevel + 1);
      setJustCompleted(false);
    }
  };

  const selectLevel = (num) => {
    if (num === currentLevel) return;
    if (num <= totalLevels && (num === 1 || completedLevels.has(num - 1))) {
      setCurrentLevel(num);
      setJustCompleted(false);
    }
  };

  const reset = () => {
    setCurrentLevel(1);
    setCompletedLevels(new Set());
    setJustCompleted(false);
  };

  return {
    currentLevel,
    completedLevels,
    justCompleted,
    completeLevel,
    goNext,
    selectLevel,
    reset,
    isLevelUnlocked: (num) => num === 1 || completedLevels.has(num - 1),
  };
}
