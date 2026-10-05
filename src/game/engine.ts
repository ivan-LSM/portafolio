import {
  BOOTCAMP_PROD_MULT,
  BOOTCAMP_COST,
  CAFE_BASE_COST,
  CAFE_COOLDOWN_MS,
  CAFE_COST_GROWTH,
  CAFE_DURATION_MS,
  CAFE_MAX_COST,
  BARREL_AFTER_CAFES,
  CAFE_MULT,
  CLICK_BASE,
  CLICK_PROD_SHARE,
  COPILOT_BASE_COST,
  COPILOT_COST_GROWTH,
  COPILOT_CPS_PER_LEVEL,
  COPILOT_MAX_LEVEL,
  COST_GROWTH,
  CV_COST_SECONDS,
  CV_MIN_COST,
  CV_RESOLVE_MAX_MS,
  CV_RESOLVE_MIN_MS,
  DEMPSEY_MIN_CPS,
  DEMPSEY_MS,
  DEMPSEY_MULT,
  DEMPSEY_WINDOW_S,
  FINAL_COST,
  FINAL_P_BASE,
  FINAL_P_CAP,
  FINAL_P_PER_FAIL,
  FINAL_STAGES,
  FINAL_STAGE_MS,
  LINKEDIN_P_INTERVIEW,
  OUTBOX_BASE,
  OUTBOX_LINKEDIN,
  OUTBOX_PER_PRESTIGE,
  OUTBOX_REFERIDO,
  OFFLINE_MAX_MS,
  OFFLINE_RATE,
  P_INTERVIEW_BASE,
  P_INTERVIEW_CAP,
  PORTAFOLIO_P_FINAL,
  PORTAFOLIO_P_INTERVIEW,
  PREMIUM_COST,
  PRESTIGE_PROD_BONUS,
  PRESTIGE_P_INTERVIEW,
  PROJECTS,
  REFERIDO_DIRECT_CHANCE,
  REJECT_SHARE,
  SAVE_VERSION,
  SENIORITY,
  TECH_TEST_STAGE,
  TECLADO_CLICK_MULT,
  TECLADO_COST,
  UDEMY_CLICK_MULT,
  UDEMY_COST,
  UNLOCK_FRACTION,
  WHITEBOARD_P_FINAL,
  type EventId,
  type PremiumId,
  type ProjectId,
  type ShopId,
  type UpgradeId,
} from './balance';
import { checkAchievements } from './achievements';
import { cvsBlocked, eventProdMult, pickEvent, rollEventDelay, startEvent } from './events';
import type { GameState, PendingCV, Rng } from './types';

export { acceptRecruiter, popBarril } from './events';

const PREMIUM_IDS: PremiumId[] = ['linkedin', 'whiteboard', 'portafolio', 'referido'];
export const isPremium = (id: ShopId): id is PremiumId => (PREMIUM_IDS as string[]).includes(id);
export const isProject = (id: ShopId): id is ProjectId => PROJECTS.some((p) => p.id === id);

export function createState(): GameState {
  return {
    version: SAVE_VERSION,
    elapsedMs: 0,
    commits: 0,
    totalCommits: 0,
    clicks: 0,
    clicksTotal: 0,
    tutorialStep: 0,
    owned: { yolo: 0, reservas: 0, gymubb: 0, sigespu: 0, pedidos: 0 },
    revealed: [PROJECTS[0].id],
    unlockedProjects: [],
    upgrades: {
      udemy: false,
      copilot: false,
      bootcamp: false,
      teclado: false,
      linkedin: false,
      whiteboard: false,
      portafolio: false,
      referido: false,
    },
    copilotLevel: 0,
    cafeUses: 0,
    cafeUsesTotal: 0,
    cafeActive: 0,
    cafeCooldown: 0,
    cvsSent: 0,
    pending: [],
    rejections: 0,
    ghostings: 0,
    interviews: 0,
    interviewsTotal: 0,
    finalFails: 0,
    final: null,
    finished: false,
    endless: false,
    offers: 0,
    activeEvent: null,
    eventTimer: -1,
    prestige: 0,
    achievements: [],
    autoAcc: 0,
    josephPending: false,
    dempseyLeft: 0,
    dempseyCount: 0,
    nigerundayo: false,
    clickLog: [],
    outbox: [],
  };
}

// ---------- Fórmulas ----------

export function prestigeMult(s: GameState): number {
  return 1 + PRESTIGE_PROD_BONUS * s.prestige;
}

/** Producción permanente por segundo: proyectos y bootcamp, sin café, eventos ni prestigio. */
export function baseProduction(s: GameState): number {
  let base = 0;
  for (const p of PROJECTS) base += s.owned[p.id] * p.cps;
  if (s.upgrades.bootcamp) base *= BOOTCAMP_PROD_MULT;
  return base;
}

/** Valor «de base» de un click: base x mejoras + parte de la producción permanente. Sin café, dempsey ni prestigio. */
export function baseClick(s: GameState): number {
  let v = CLICK_BASE;
  if (s.upgrades.udemy) v *= UDEMY_CLICK_MULT;
  if (s.upgrades.teclado) v *= TECLADO_CLICK_MULT;
  return v + CLICK_PROD_SHARE * baseProduction(s);
}

export function clickValue(s: GameState): number {
  let v = baseClick(s);
  if (s.cafeActive > 0) v *= CAFE_MULT;
  if (s.dempseyLeft > 0) v *= DEMPSEY_MULT;
  return v * prestigeMult(s);
}

/** Clicks automáticos por segundo (Copilot). */
export function autoClicksPerSec(s: GameState): number {
  return s.copilotLevel * COPILOT_CPS_PER_LEVEL;
}

export function productionPerSec(s: GameState): number {
  let base = baseProduction(s);
  if (s.cafeActive > 0) base *= CAFE_MULT;
  return base * prestigeMult(s) * eventProdMult(s);
}

/** Commits/s totales mostrados en la HUD (producción + autoclick). */
export function totalPerSec(s: GameState): number {
  return productionPerSec(s) + autoClicksPerSec(s) * clickValue(s);
}

export function pInterview(s: GameState): number {
  let p = P_INTERVIEW_BASE + PRESTIGE_P_INTERVIEW * s.prestige;
  if (s.upgrades.linkedin) p += LINKEDIN_P_INTERVIEW;
  if (s.upgrades.portafolio) p += PORTAFOLIO_P_INTERVIEW;
  return Math.min(P_INTERVIEW_CAP, p);
}

export function pFinal(s: GameState): number {
  let p = FINAL_P_BASE + FINAL_P_PER_FAIL * s.finalFails;
  if (s.upgrades.whiteboard) p += WHITEBOARD_P_FINAL;
  if (s.upgrades.portafolio) p += PORTAFOLIO_P_FINAL;
  return Math.min(FINAL_P_CAP, p);
}

export function projectCost(s: GameState, id: ProjectId): number {
  const def = PROJECTS.find((p) => p.id === id)!;
  return def.base * COST_GROWTH ** s.owned[id];
}

export function cafeCost(s: GameState): number {
  return Math.min(CAFE_MAX_COST, CAFE_BASE_COST * CAFE_COST_GROWTH ** s.cafeUses);
}

/**
 * Commits/s «de base» con los que se fija el precio de un CV: producción y autoclick permanentes,
 * sin café ni eventos (así beber café no encarece los CVs).
 */
export function cvRate(s: GameState): number {
  return (baseProduction(s) + autoClicksPerSec(s) * baseClick(s)) * prestigeMult(s);
}

/** Costo de un CV: max(mínimo, segundos * commits/s). No depende de cuántos CVs se enviaron. */
export function cvCost(s: GameState): number {
  return Math.max(CV_MIN_COST, Math.ceil(CV_COST_SECONDS * cvRate(s)));
}

/** Costo total de enviar n CVs. */
export function cvCostFor(s: GameState, n: number): number {
  return n <= 0 ? 0 : n * cvCost(s);
}

/** Máximo de CVs «en revisión» a la vez. */
export function outboxCap(s: GameState): number {
  let cap = OUTBOX_BASE + OUTBOX_PER_PRESTIGE * s.prestige;
  if (s.upgrades.linkedin) cap += OUTBOX_LINKEDIN;
  if (s.upgrades.referido) cap += OUTBOX_REFERIDO;
  return cap;
}

export function freeSlots(s: GameState): number {
  return Math.max(0, outboxCap(s) - s.pending.length);
}

/** CVs que se pueden enviar ahora: lo que alcanzan los commits y caben en la bandeja. */
export function maxCVs(s: GameState): number {
  return Math.max(0, Math.min(freeSlots(s), Math.floor(s.commits / cvCost(s) + 1e-9)));
}

export type CvBlock =
  | { reason: 'event'; id: EventId; left: number }
  | { reason: 'full'; free: number; cap: number; used: number }
  | { reason: 'commits'; missing: number };

/** Por qué no se pueden enviar n CVs ahora (null si se puede). Sirve para mostrar el motivo en los botones. */
export function cvSendBlock(s: GameState, n: number): CvBlock | null {
  if (cvsBlocked(s) && s.activeEvent) return { reason: 'event', id: s.activeEvent.id, left: s.activeEvent.left };
  const free = freeSlots(s);
  if (free < n) return { reason: 'full', free, cap: outboxCap(s), used: s.pending.length };
  const need = cvCostFor(s, n);
  if (s.commits + 1e-9 < need) return { reason: 'commits', missing: Math.ceil(need - s.commits) };
  return null;
}

/** Costo actual (en commits o entrevistas) de un artículo; Infinity si no está disponible. */
export function costOf(s: GameState, id: ShopId): number {
  if (isProject(id)) return projectCost(s, id);
  if (isPremium(id)) return s.upgrades[id] ? Infinity : PREMIUM_COST[id];
  switch (id) {
    case 'udemy':
      return s.upgrades.udemy ? Infinity : UDEMY_COST;
    case 'bootcamp':
      return s.upgrades.bootcamp ? Infinity : BOOTCAMP_COST;
    case 'teclado':
      return s.upgrades.teclado ? Infinity : TECLADO_COST;
    case 'copilot':
      return s.copilotLevel >= COPILOT_MAX_LEVEL ? Infinity : COPILOT_BASE_COST * COPILOT_COST_GROWTH ** s.copilotLevel;
    case 'cafe':
      return cafeCost(s);
  }
}

export function canBuy(s: GameState, id: ShopId): boolean {
  if (s.finished) return false;
  const cost = costOf(s, id);
  if (!Number.isFinite(cost)) return false;
  if (isPremium(id)) return s.interviews >= cost;
  if (isProject(id) && !s.revealed.includes(id)) return false;
  if (id === 'cafe' && (s.cafeActive > 0 || s.cafeCooldown > 0)) return false;
  return s.commits + 1e-9 >= cost;
}

// ---------- Acciones ----------

/**
 * Detecta el combo Dempsey Roll: DEMPSEY_MIN_CPS clicks en cada uno de los últimos DEMPSEY_WINDOW_S
 * segundos. Es puro: el tiempo entra por nowMs (cualquier reloj monótono, en ms).
 */
function trackDempsey(s: GameState, nowMs: number): void {
  const windowMs = DEMPSEY_WINDOW_S * 1000;
  const log = s.clickLog;
  if (log.length && nowMs < log[log.length - 1]) log.length = 0; // el reloj retrocedió
  log.push(nowMs);
  let drop = 0;
  while (drop < log.length && log[drop] <= nowMs - windowMs) drop++;
  if (drop) log.splice(0, drop);
  if (s.dempseyLeft > 0) return;
  const buckets = Array<number>(DEMPSEY_WINDOW_S).fill(0);
  for (const t of log) buckets[Math.min(DEMPSEY_WINDOW_S - 1, Math.floor((nowMs - t) / 1000))]++;
  if (buckets.every((n) => n >= DEMPSEY_MIN_CPS)) {
    s.dempseyLeft = DEMPSEY_MS;
    s.dempseyCount += 1;
    s.clickLog = [];
    s.outbox.push({ t: 'dempsey' });
  }
}

export function click(s: GameState, nowMs?: number): number {
  if (s.finished) return 0;
  const v = clickValue(s);
  s.commits += v;
  s.totalCommits += v;
  s.clicks += 1;
  s.clicksTotal += 1;
  if (nowMs !== undefined) trackDempsey(s, nowMs);
  return v;
}

/** Tras BARREL_AFTER_CAFES cafés (acumulados, sobreviven al prestigio) la taza se vuelve barril. */
export function cafeIsBarrel(s: GameState): boolean {
  return s.cafeUsesTotal >= BARREL_AFTER_CAFES;
}

/**
 * Nigerundayo!: la pestaña se ocultó o cerró durante la prueba técnica del proceso final.
 * Devuelve true si se marcó; el logro se concede en el siguiente chequeo.
 */
export function markNigerundayo(s: GameState): boolean {
  if (!s.final || s.final.stage !== TECH_TEST_STAGE || s.nigerundayo) return false;
  s.nigerundayo = true;
  return true;
}

export function buy(s: GameState, id: ShopId): boolean {
  if (!canBuy(s, id)) return false;
  const cost = costOf(s, id);
  if (isPremium(id)) {
    s.interviews -= cost;
    s.upgrades[id] = true;
    return true;
  }
  s.commits -= cost;
  if (isProject(id)) {
    s.owned[id] += 1;
    if (!s.unlockedProjects.includes(id)) {
      s.unlockedProjects.push(id);
      s.outbox.push({ t: 'unlock', id });
    }
    return true;
  }
  switch (id as UpgradeId | 'cafe') {
    case 'udemy':
    case 'bootcamp':
    case 'teclado':
      s.upgrades[id as UpgradeId] = true;
      break;
    case 'copilot':
      s.copilotLevel += 1;
      s.upgrades.copilot = true;
      break;
    case 'cafe':
      s.cafeUses += 1;
      s.cafeUsesTotal += 1;
      s.cafeActive = CAFE_DURATION_MS;
      s.cafeCooldown = CAFE_COOLDOWN_MS;
      break;
  }
  return true;
}

/** Envía n CVs (o 'max'). Devuelve cuántos se enviaron. */
export function sendCVs(s: GameState, n: number | 'max', rng: Rng): number {
  if (s.finished || cvsBlocked(s)) return 0;
  const count = n === 'max' ? maxCVs(s) : Math.min(n, maxCVs(s));
  if (count <= 0) return 0;
  s.commits -= cvCostFor(s, count);
  if (s.commits < 0) s.commits = 0;
  for (let i = 0; i < count; i++) {
    const direct = s.upgrades.referido && rng() < REFERIDO_DIRECT_CHANCE;
    const left = CV_RESOLVE_MIN_MS + rng() * (CV_RESOLVE_MAX_MS - CV_RESOLVE_MIN_MS);
    s.pending.push({ left, direct });
  }
  s.cvsSent += count;
  return count;
}

export type CVResult = 'interview' | 'reject' | 'ghost';

/** Decide el resultado de un CV (exportada para tests estadísticos). */
export function rollCV(s: GameState, direct: boolean, rng: Rng): CVResult {
  if (direct) return 'interview';
  const p = pInterview(s);
  const r = rng();
  if (r < p) return 'interview';
  const rest = (r - p) / (1 - p);
  return rest < REJECT_SHARE ? 'reject' : 'ghost';
}

function resolveCV(s: GameState, cv: PendingCV, rng: Rng): void {
  const joseph = s.josephPending;
  s.josephPending = false;
  const result = joseph ? 'reject' : rollCV(s, cv.direct, rng);
  const msg = Math.floor(rng() * 1000);
  if (result === 'interview') {
    s.interviews += 1;
    s.interviewsTotal += 1;
  } else if (result === 'reject') s.rejections += 1;
  else s.ghostings += 1;
  s.outbox.push({ t: 'cv', result, msg, direct: cv.direct || undefined, joseph: joseph || undefined });
}

export function canStartFinal(s: GameState): boolean {
  return !s.finished && !s.final && s.interviews >= FINAL_COST;
}

export function startFinal(s: GameState, rng: Rng): boolean {
  if (!canStartFinal(s)) return false;
  s.interviews -= FINAL_COST;
  s.final = { elapsed: 0, success: rng() < pFinal(s), stage: 0 };
  s.outbox.push({ t: 'finalStage', stage: 0 });
  return true;
}

export function seniorityOf(s: GameState): (typeof SENIORITY)[number] {
  return SENIORITY[Math.min(s.prestige, SENIORITY.length - 1)];
}

export function canPrestige(s: GameState): boolean {
  return (s.finished || s.endless) && s.prestige < SENIORITY.length - 1;
}

/** «Seguir jugando»: cierra el fin de partida y deja el juego en modo libre (se puede volver a postular). */
export function continueEndless(s: GameState): boolean {
  if (!s.finished) return false;
  s.finished = false;
  s.endless = true;
  return true;
}

/** Renunciar y buscar algo mejor: reinicia conservando el bono. */
export function prestige(s: GameState): boolean {
  if (!canPrestige(s)) return false;
  const fresh = createState();
  fresh.prestige = s.prestige + 1;
  fresh.achievements = s.achievements;
  fresh.cafeUsesTotal = s.cafeUsesTotal;
  fresh.clicksTotal = s.clicksTotal;
  fresh.tutorialStep = s.tutorialStep;
  fresh.outbox = s.outbox;
  Object.assign(s, fresh);
  checkAchievements(s);
  return true;
}

// ---------- Tick ----------

export function tick(s: GameState, dtMs: number, rng: Rng): void {
  if (s.finished) return;
  const dt = dtMs / 1000;
  s.elapsedMs += dtMs;

  const gain = productionPerSec(s) * dt;
  s.commits += gain;
  s.totalCommits += gain;

  if (s.copilotLevel > 0) {
    s.autoAcc += autoClicksPerSec(s) * dt;
    if (s.autoAcc >= 1) {
      const n = Math.floor(s.autoAcc);
      s.autoAcc -= n;
      const v = clickValue(s) * n;
      s.commits += v;
      s.totalCommits += v;
    }
  }

  if (s.cafeActive > 0) {
    s.cafeActive = Math.max(0, s.cafeActive - dtMs);
    if (s.cafeActive === 0) s.outbox.push({ t: 'cafeEnd' });
  }
  if (s.cafeCooldown > 0) s.cafeCooldown = Math.max(0, s.cafeCooldown - dtMs);
  if (s.dempseyLeft > 0) {
    s.dempseyLeft = Math.max(0, s.dempseyLeft - dtMs);
    if (s.dempseyLeft === 0) s.outbox.push({ t: 'dempseyEnd' });
  }

  if (s.pending.length) {
    let w = 0;
    for (let i = 0; i < s.pending.length; i++) {
      const cv = s.pending[i];
      cv.left -= dtMs;
      if (cv.left <= 0) resolveCV(s, cv, rng);
      else s.pending[w++] = cv;
    }
    s.pending.length = w;
  }

  if (s.final) {
    const f = s.final;
    f.elapsed += dtMs;
    const stage = Math.min(FINAL_STAGES - 1, Math.floor(f.elapsed / FINAL_STAGE_MS));
    if (stage !== f.stage) {
      f.stage = stage;
      s.outbox.push({ t: 'finalStage', stage });
    }
    if (f.elapsed >= FINAL_STAGES * FINAL_STAGE_MS) {
      const attempt = s.finalFails + 1;
      const extra = f.success && s.endless;
      if (f.success) {
        s.offers += 1;
        if (!s.endless) s.finished = true;
      } else {
        s.finalFails += 1;
      }
      s.final = null;
      s.outbox.push({ t: 'finalResult', success: f.success, attempt, extra: extra || undefined });
    }
  }

  if (s.activeEvent) {
    s.activeEvent.left -= dtMs;
    if (s.activeEvent.left <= 0) {
      s.outbox.push({ t: 'eventEnd', id: s.activeEvent.id });
      s.activeEvent = null;
    }
  } else if (s.eventTimer < 0) {
    s.eventTimer = rollEventDelay(rng);
  } else {
    s.eventTimer -= dtMs;
    if (s.eventTimer <= 0) {
      s.eventTimer = -1;
      startEvent(s, pickEvent(rng), cvRate(s)); // producción permanente: sin café ni eventos
    }
  }

  for (let i = 1; i < PROJECTS.length; i++) {
    const id = PROJECTS[i].id;
    if (!s.revealed.includes(id) && s.totalCommits >= PROJECTS[i - 1].base * UNLOCK_FRACTION) s.revealed.push(id);
  }

  checkAchievements(s);
}

/** Progreso offline: 50 % de la producción, máx. 2 h. Devuelve los commits acreditados. */
export function applyOffline(s: GameState, awayMs: number, rng: Rng): number {
  if (s.finished || awayMs <= 0) return 0;
  const ms = Math.min(awayMs, OFFLINE_MAX_MS);
  const gained = productionPerSec(s) * (ms / 1000) * OFFLINE_RATE;
  s.commits += gained;
  s.totalCommits += gained;
  for (const cv of s.pending) cv.left = 0;
  tick(s, 0, rng);
  return gained;
}
