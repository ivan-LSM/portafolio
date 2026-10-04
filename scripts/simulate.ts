/**
 * Simulador del balance: un bot greedy juega N partidas con semillas distintas
 * y se imprime la distribución del tiempo hasta la oferta.
 *
 *   npx tsx scripts/simulate.ts [N]
 *
 * El bot: 5 clicks/s, acepta al recruiter, compra por mejor ROI (payback bajo el
 * umbral), usa café cuando es barato, y gasta el resto en CVs.
 *
 * Política del proceso final: el 50 % de las semillas (las pares) lo intenta apenas junta
 * 5 entrevistas, sin mejoras premium (falla seguido); después sigue la política normal.
 * El otro 50 % compra las 3 mejoras premium y recién entonces postula.
 *
 * Chequeo de soft-lock: tiempo en que no se puede enviar ningún CV teniendo espacio en la
 * bandeja, producción > 0, sin evento que lo bloquee y con más de SOFTLOCK_WAIT_S segundos
 * de espera para juntar el próximo CV.
 */
import { PROJECTS, TICK_MS, type ShopId } from '../src/game/balance';
import {
  acceptRecruiter,
  buy,
  canBuy,
  click,
  clickValue,
  autoClicksPerSec,
  cafeCost,
  cvCostFor,
  pInterview,
  costOf,
  cvCost,
  freeSlots,
  maxCVs,
  totalPerSec,
  createState,
  isProject,
  productionPerSec,
  sendCVs,
  startFinal,
  tick,
} from '../src/game/engine';
import { cvsBlocked } from '../src/game/events';
import { mulberry32 } from '../src/game/rng';
import type { GameState } from '../src/game/types';

const CLICKS_PER_SEC = 5;
/** Factor sobre el tiempo restante hasta poder pagar los CVs necesarios: se invierte si el payback es menor. */
const HORIZON = Number(process.env.HORIZON ?? 1);
const MAX_MS = 40 * 60 * 1000;
const SOFTLOCK_WAIT_S = 10;
/** SEED=1234 imprime la traza detallada (eventos, entrevistas, estado) de esa semilla. */
const TRACE_SEED = process.env.SEED ? Number(process.env.SEED) : null;

const SHOP_CANDIDATES: ShopId[] = [...PROJECTS.map((p) => p.id), 'udemy', 'copilot', 'bootcamp', 'teclado'];

/** Ingreso base (sin café ni eventos) con un artículo extra. */
function income(s: GameState, extra?: ShopId): number {
  const c: GameState = {
    ...s,
    owned: { ...s.owned },
    upgrades: { ...s.upgrades },
    cafeActive: 0,
    activeEvent: null,
  };
  if (extra) {
    if (isProject(extra)) c.owned[extra] += 1;
    else if (extra === 'copilot') c.copilotLevel += 1;
    else if (extra !== 'cafe') (c.upgrades as Record<string, boolean>)[extra] = true;
  }
  return productionPerSec(c) + (CLICKS_PER_SEC + autoClicksPerSec(c)) * clickValue(c);
}

function decide(s: GameState, rng: () => number): void {
  const base = income(s);
  let best: { id: ShopId; payback: number; cost: number } | null = null;
  for (const id of SHOP_CANDIDATES) {
    if (isProject(id) && !s.revealed.includes(id)) continue;
    const cost = costOf(s, id);
    if (!Number.isFinite(cost)) continue;
    const gain = income(s, id) - base;
    if (gain <= 0) continue;
    const payback = cost / gain;
    if (!best || payback < best.payback) best = { id, payback, cost };
  }
  if (s.cafeCooldown <= 0 && s.cafeActive <= 0 && cafeCost(s) * 5 <= s.commits) buy(s, 'cafe');
  // Tiempo estimado para costear los CVs que faltan para entrevistas + proceso final
  const need = (s.upgrades.linkedin ? 0 : 2) + (s.upgrades.portafolio ? 0 : 4) + (s.upgrades.whiteboard ? 0 : 3) + 5 - s.interviews;
  const cvsNeeded = Math.ceil(Math.max(0, need) / Math.max(0.05, pInterview(s)) + s.pending.length * -pInterview(s) * 0);
  const goal = cvCostFor(s, cvsNeeded);
  const timeToGoal = Math.max(0, goal - s.commits) / base;
  if (best && best.payback < timeToGoal * HORIZON) {
    if (canBuy(s, best.id)) buy(s, best.id);
    return; // ahorra para lo mejor
  }
  sendCVs(s, 'max', rng);
}

export interface BotResult {
  time: number | null;
  /** ms totales en soft-lock */
  stuckMs: number;
  /** racha continua más larga sin poder enviar un CV (con espacio y sin evento), en ms */
  longestUnableMs: number;
  fails: number;
  early: boolean;
}

export function runBot(seed: number, early = false): BotResult {
  const rng = mulberry32(seed);
  const s = createState();
  let t = 0;
  let n = 0;
  let stuckMs = 0;
  let unableRun = 0;
  let longestUnableMs = 0;
  let triedEarly = false;
  const clickEvery = Math.round(1000 / CLICKS_PER_SEC / TICK_MS);
  const res = (time: number | null): BotResult => ({ time, stuckMs, longestUnableMs, fails: s.finalFails, early });
  while (t < MAX_MS) {
    n++;
    if (n % clickEvery === 0) click(s);
    s.outbox.length = 0;
    acceptRecruiter(s);
    const earlyPhase = early && !triedEarly && s.finalFails === 0;
    if (!earlyPhase) {
      for (const id of ['linkedin', 'portafolio', 'whiteboard'] as const) {
        if (!s.upgrades[id]) {
          buy(s, id);
          break;
        }
      }
    }
    if (earlyPhase) {
      if (startFinal(s, rng)) triedEarly = true;
    } else if (s.upgrades.linkedin && s.upgrades.portafolio && s.upgrades.whiteboard) startFinal(s, rng);
    if (n % 10 === 0) decide(s, rng);

    // Soft-lock: no se puede enviar pudiendo (espacio, sin evento, produciendo) y la espera es larga
    const production = productionPerSec(s) + autoClicksPerSec(s) * clickValue(s);
    const free = freeSlots(s) > 0 && !cvsBlocked(s) && production > 0;
    if (free && maxCVs(s) === 0) {
      unableRun += TICK_MS;
      longestUnableMs = Math.max(longestUnableMs, unableRun);
      const income = totalPerSec(s) + CLICKS_PER_SEC * clickValue(s);
      if ((cvCost(s) - s.commits) / income > SOFTLOCK_WAIT_S) stuckMs += TICK_MS;
    } else unableRun = 0;

    tick(s, TICK_MS, rng);
    t += TICK_MS;
    if (TRACE_SEED === seed) {
      for (const o of s.outbox) {
        if (o.t === 'cv' && o.result !== 'interview') continue;
        console.log(`${(t / 1000).toFixed(1)}s ${JSON.stringify(o)} int=${s.interviews} cvs=${s.cvsSent} ref=${s.upgrades.referido}`);
      }
    }
    if ((process.env.TRACE && n % 300 === 0) || (TRACE_SEED === seed && n % 100 === 0))
      console.log(
        `${(t / 1000).toFixed(0)}s commits=${s.commits.toFixed(0)} cps=${productionPerSec(s).toFixed(1)} cvs=${s.cvsSent} int=${s.interviews}/${s.interviewsTotal} owned=${Object.values(s.owned)} up=${Object.entries(s.upgrades).filter(([, v]) => v).map(([k]) => k)}`,
      );
    if (s.finished) return res(t);
  }
  return res(null);
}

function pct(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}
const fmt = (ms: number) => `${(ms / 60000).toFixed(2)} min`;

function report(label: string, rs: BotResult[]): void {
  const times = rs.filter((r) => r.time !== null).map((r) => r.time as number).sort((a, b) => a - b);
  const dnf = rs.length - times.length;
  console.log(`
[${label}] partidas: ${rs.length}  (sin terminar en 40 min: ${dnf})`);
  if (!times.length) return;
  console.log(`  p10:    ${fmt(pct(times, 10))}`);
  console.log(`  median: ${fmt(pct(times, 50))}`);
  console.log(`  p90:    ${fmt(pct(times, 90))}`);
  console.log(`  min/max: ${fmt(times[0])} / ${fmt(times[times.length - 1])}`);
  const fails = rs.reduce((a, r) => a + r.fails, 0);
  console.log(`  fallos del proceso final: ${fails} (semillas con algún fallo: ${rs.filter((r) => r.fails > 0).length})`);
}

const N = Number(process.argv[2] ?? 200);
const results: BotResult[] = [];
for (let i = 0; i < N; i++) results.push(runBot(1000 + i, i % 2 === 0));
if (process.env.LIST_FAST) {
  results
    .map((r, i) => ({ seed: 1000 + i, ...r }))
    .filter((r) => r.time !== null)
    .sort((a, b) => (a.time as number) - (b.time as number))
    .slice(0, 8)
    .forEach((r) => console.log(`seed ${r.seed} early=${r.early} ${fmt(r.time as number)} fails=${r.fails}`));
}
report('todas', results);
report('politica normal', results.filter((r) => !r.early));
report('politica temprana (final con 5 entrevistas)', results.filter((r) => r.early));
const stuck = results.map((r) => r.stuckMs);
const maxStuck = Math.max(...stuck);
console.log(`
Soft-lock check (espera > ${SOFTLOCK_WAIT_S}s con espacio libre y produccion > 0):`);
console.log(`  semillas con soft-lock: ${stuck.filter((x) => x > 0).length}/${N}   max tiempo en soft-lock: ${(maxStuck / 1000).toFixed(1)} s`);
console.log(`  racha mas larga sin poder pagar un CV (informativo: el bot gasta en la tienda): ${(Math.max(...results.map((r) => r.longestUnableMs)) / 1000).toFixed(1)} s`);
if (maxStuck > 0) process.exitCode = 1;
