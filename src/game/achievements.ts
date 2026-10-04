import { HARDSTUCK_FAILS, PROJECTS, SPEEDRUN_MS } from './balance';
import type { GameState } from './types';

export interface AchievementDef {
  id: string;
  test: (s: GameState) => boolean;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'firstCommit', test: (s) => s.totalCommits >= 1 },
  { id: 'commits1000', test: (s) => s.totalCommits >= 1000 },
  { id: 'firstReject', test: (s) => s.rejections >= 1 },
  { id: 'reject10', test: (s) => s.rejections >= 10 },
  { id: 'reject50', test: (s) => s.rejections >= 50 },
  { id: 'reject100', test: (s) => s.rejections >= 100 },
  { id: 'ghost25', test: (s) => s.ghostings >= 25 },
  { id: 'firstProject', test: (s) => s.unlockedProjects.length >= 1 },
  { id: 'allProjects', test: (s) => s.unlockedProjects.length >= PROJECTS.length },
  { id: 'coffee10', test: (s) => s.cafeUsesTotal >= 10 },
  { id: 'failFinal', test: (s) => s.finalFails >= 1 },
  { id: 'speedrun', test: (s) => s.finished && s.elapsedMs < SPEEDRUN_MS },
  { id: 'cto', test: (s) => s.prestige >= 4 },
  // Easter eggs
  { id: 'dempsey', test: (s) => s.dempseyCount >= 1 },
  { id: 'cliff', test: (s) => s.prestige >= 1 },
  { id: 'hardstuck', test: (s) => s.finalFails >= HARDSTUCK_FAILS },
  { id: 'nigerundayo', test: (s) => s.nigerundayo },
];

/** Desbloquea los logros nuevos y devuelve sus ids. */
export function checkAchievements(state: GameState): string[] {
  const fresh: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.test(state)) {
      state.achievements.push(a.id);
      state.outbox.push({ t: 'achv', id: a.id });
      fresh.push(a.id);
    }
  }
  return fresh;
}
