import { create } from "zustand";

const STORAGE_KEY = "play-learn-ml-progress";

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

export const useScoreStore = create((set, get) => ({
  progress: loadProgress(),

  recordAttempt(moduleId, { score, stars, moves, time }) {
    const prev = get().progress[moduleId];
    const best =
      prev && prev.stars >= stars ? prev : { score, stars, moves, time };
    const newProgress = { ...get().progress, [moduleId]: best };
    set({ progress: newProgress });
    saveProgress(newProgress);
  },

  getStars(moduleId) {
    return get().progress[moduleId]?.stars || 0;
  },

  isUnlocked(moduleId, dependencies = []) {
    return dependencies.every((d) => (get().progress[d]?.stars || 0) >= 1);
  },

  reset() {
    set({ progress: {} });
    localStorage.removeItem(STORAGE_KEY);
  },
}));

export function calculateStars({ moves, optimalMoves, time, optimalTime }) {
  let stars = 1;
  if (moves <= optimalMoves * 1.5 && time <= optimalTime * 1.5) stars = 2;
  if (moves <= optimalMoves && time <= optimalTime) stars = 3;
  return stars;
}
