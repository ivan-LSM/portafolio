/**
 * Todas las constantes de balance del minijuego en un solo lugar.
 * Los valores iniciales vienen de docs/game-design.md; los cambios hechos con el
 * simulador (scripts/simulate.ts) se anotan con "TUNED".
 */

export type ProjectId = 'yolo' | 'reservas' | 'gymubb' | 'sigespu' | 'pedidos';
export type UpgradeId = 'udemy' | 'copilot' | 'bootcamp' | 'teclado';
export type PremiumId = 'linkedin' | 'whiteboard' | 'portafolio' | 'referido';
export type EventId = 'junior5' | 'exposicion' | 'recruiter' | 'hackathon' | 'prodfail' | 'cafederramado' | 'joseph' | 'barril';
export type ShopId = ProjectId | UpgradeId | PremiumId | 'cafe';

export interface ProjectDef {
  id: ProjectId;
  base: number;
  cps: number;
  slug: string;
}

/** Proyectos reales, en orden de desbloqueo. */
export const PROJECTS: readonly ProjectDef[] = [
  { id: 'yolo', base: 15, cps: 0.5, slug: 'minecraft-yolo' },
  { id: 'reservas', base: 100, cps: 3, slug: 'reservas-transporte' },
  { id: 'gymubb', base: 600, cps: 12, slug: 'gymubb' },
  { id: 'sigespu', base: 3000, cps: 50, slug: 'sigespu' },
  { id: 'pedidos', base: 15000, cps: 200, slug: 'gestion-pedidos' },
];
export const PROJECT_IDS = PROJECTS.map((p) => p.id);

export const COST_GROWTH = 1.15;
/** Fracción del costo base del proyecto anterior para que aparezca el siguiente. */
export const UNLOCK_FRACTION = 0.5;

export const CLICK_BASE = 1;
export const UDEMY_COST = 50;
export const UDEMY_CLICK_MULT = 2;
export const COPILOT_BASE_COST = 500;
export const COPILOT_COST_GROWTH = 4;
export const COPILOT_MAX_LEVEL = 5;
export const COPILOT_CPS_PER_LEVEL = 2;
export const BOOTCAMP_COST = 2000;
export const BOOTCAMP_PROD_MULT = 2;
export const TECLADO_COST = 8000;
export const TECLADO_CLICK_MULT = 3;

export const CAFE_BASE_COST = 30;
export const CAFE_COST_GROWTH = 1.5;
export const CAFE_MAX_COST = 2000;
export const CAFE_MULT = 3;
export const CAFE_DURATION_MS = 20_000;
export const CAFE_COOLDOWN_MS = 60_000;

// CVs
/** Costo de un CV: max(CV_MIN_COST, CV_COST_SECONDS * commits/s); no depende de cuántos CVs se enviaron. */
export const CV_MIN_COST = 25;
export const CV_COST_SECONDS = 2.5; // TUNED (simulador)
/** Bandeja de salida: máximo de CVs «en revisión» a la vez. */
export const OUTBOX_BASE = 10;
export const OUTBOX_LINKEDIN = 5;
export const OUTBOX_REFERIDO = 5;
export const OUTBOX_PER_PRESTIGE = 5;
export const CV_RESOLVE_MIN_MS = 3000;
export const CV_RESOLVE_MAX_MS = 8000;
export const P_INTERVIEW_BASE = 0.12;
export const P_INTERVIEW_CAP = 0.6;
/** Del resto (1 - pEntrevista), esta fracción es rechazo y el resto ghosting. */
export const REJECT_SHARE = 0.4;

// Premium
export const PREMIUM_COST: Record<PremiumId, number> = {
  linkedin: 2,
  whiteboard: 3,
  portafolio: 4,
  referido: 6,
};
export const LINKEDIN_P_INTERVIEW = 0.08;
export const PORTAFOLIO_P_INTERVIEW = 0.12;
export const WHITEBOARD_P_FINAL = 0.2;
export const PORTAFOLIO_P_FINAL = 0.1;
export const REFERIDO_DIRECT_CHANCE = 0.25;

// Proceso final
export const FINAL_COST = 5;
export const FINAL_P_BASE = 0.3;
export const FINAL_P_PER_FAIL = 0.05;
export const FINAL_P_CAP = 0.95;
export const FINAL_STAGES = 3;
export const FINAL_STAGE_MS = 2500;

// Eventos
export const EVENT_MIN_MS = 45_000;
export const EVENT_MAX_MS = 90_000;
export const EVENT_DEFS: Record<EventId, { durationMs: number; weight: number }> = {
  junior5: { durationMs: 15_000, weight: 1 },
  exposicion: { durationMs: 0, weight: 1 },
  recruiter: { durationMs: 10_000, weight: 1 },
  hackathon: { durationMs: 20_000, weight: 1 },
  prodfail: { durationMs: 15_000, weight: 1 },
  cafederramado: { durationMs: 0, weight: 1 },
  // Easter eggs (docs/game-design.md, sección 13): menos frecuentes que el resto
  joseph: { durationMs: 0, weight: 0.4 },
  barril: { durationMs: 8_000, weight: 0.4 },
};
export const EXPOSICION_SECONDS = 60;
export const HACKATHON_MULT = 2;
export const PRODFAIL_MULT = 0.5;

// Easter eggs
/** CVs gratis al hacer explotar el barril del evento «Barril explosivo». */
export const BARRIL_FREE_CVS = 10;
/** Tras tantos cafés (acumulados) la taza del escritorio se convierte en barril. */
export const BARREL_AFTER_CAFES = 10;
/** Dempsey Roll: clicks/s sostenidos durante DEMPSEY_WINDOW_S segundos activan el combo. */
export const DEMPSEY_MIN_CPS = 8;
export const DEMPSEY_WINDOW_S = 3;
export const DEMPSEY_MS = 10_000;
export const DEMPSEY_MULT = 2;
/** Fallos del proceso final para «Hardstuck en Master». */
export const HARDSTUCK_FAILS = 3;
/** Índice de la etapa del proceso final que es la prueba técnica (0-based). */
export const TECH_TEST_STAGE = 1;

// Prestigio
export const SENIORITY = ['junior', 'semi', 'senior', 'lead', 'cto'] as const;
export type Seniority = (typeof SENIORITY)[number];
export const PRESTIGE_PROD_BONUS = 0.25;
export const PRESTIGE_P_INTERVIEW = 0.03;

// Persistencia
export const SAVE_KEY = 'busca-pega:v1';
export const SAVE_VERSION = 3;
/** La flecha del click se muestra hasta este número de clicks. */
export const ARROW_CLICKS = 15;
export const TUTORIAL_STEPS = 3;
export const OFFLINE_RATE = 0.5;
export const OFFLINE_MAX_MS = 2 * 60 * 60 * 1000;
export const SPEEDRUN_MS = 6 * 60 * 1000;

export const TICK_MS = 100;
