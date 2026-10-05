import { describe, expect, it } from 'vitest';
import {
  BARRIL_FREE_CVS,
  CAFE_COOLDOWN_MS,
  DEMPSEY_MS,
  DEMPSEY_MULT,
  EVENT_DEFS,
  CAFE_DURATION_MS,
  CLICK_PROD_SHARE,
  CV_COST_SECONDS,
  CV_RESOLVE_MAX_MS,
  CV_RESOLVE_MIN_MS,
  P_INTERVIEW_BASE,
  PRESTIGE_P_INTERVIEW,
  PRESTIGE_PROD_BONUS,
  LINKEDIN_P_INTERVIEW,
  PORTAFOLIO_P_INTERVIEW,
  TECLADO_CLICK_MULT,
  UDEMY_CLICK_MULT,
  CV_MIN_COST,
  OUTBOX_BASE,
  OUTBOX_LINKEDIN,
  OUTBOX_PER_PRESTIGE,
  OUTBOX_REFERIDO,
  FINAL_COST,
  FINAL_STAGES,
  FINAL_STAGE_MS,
  OFFLINE_MAX_MS,
  P_INTERVIEW_CAP,
  SAVE_KEY,
  SAVE_VERSION,
} from '../balance';
import {
  applyOffline,
  baseClick,
  baseProduction,
  buy,
  cafeIsBarrel,
  canBuy,
  canPrestige,
  click,
  clickValue,
  continueEndless,
  costOf,
  createState,
  cvCost,
  cvCostFor,
  cvRate,
  cvSendBlock,
  freeSlots,
  maxCVs,
  outboxCap,
  pFinal,
  pInterview,
  prestige,
  productionPerSec,
  markNigerundayo,
  popBarril,
  rollCV,
  sendCVs,
  startFinal,
  tick,
} from '../engine';
import { pickEvent, startEvent } from '../events';
import { formatNumber, formatTime } from '../format';
import { mulberry32 } from '../rng';
import { deserialize, exportSave, importSave, loadFromStorage, migrate, saveToStorage, serialize } from '../save';
import type { GameState } from '../types';

const rng = () => mulberry32(42);

function richState(): GameState {
  const s = createState();
  s.commits = 1e9;
  s.totalCommits = 1e9;
  return s;
}

describe('costos', () => {
  it('escalan 1.15^n en proyectos', () => {
    const s = richState();
    expect(costOf(s, 'yolo')).toBeCloseTo(15);
    buy(s, 'yolo');
    expect(costOf(s, 'yolo')).toBeCloseTo(15 * 1.15);
    buy(s, 'yolo');
    expect(costOf(s, 'yolo')).toBeCloseTo(15 * 1.15 ** 2);
  });

  it('un proyecto no revelado no se puede comprar', () => {
    const s = richState();
    expect(canBuy(s, 'pedidos')).toBe(false);
  });

  it('el costo del CV es max(mínimo, segundos * commits/s) y el lote es n * unitario', () => {
    const s = richState();
    expect(cvCost(s)).toBe(CV_MIN_COST);
    s.owned.pedidos = 10; // 2000 c/s
    expect(cvCost(s)).toBe(Math.ceil(CV_COST_SECONDS * 2000));
    expect(cvCostFor(s, 7)).toBe(7 * cvCost(s));
    expect(cvCostFor(s, 0)).toBe(0);
  });

  it('el costo del CV no depende de cuántos CVs se enviaron', () => {
    const s = richState();
    s.owned.gymubb = 5;
    const before = cvCost(s);
    s.cvsSent = 5000;
    expect(cvCost(s)).toBe(before);
    s.cvsSent = 0;
    expect(cvCost(s)).toBe(before);
    sendCVs(s, 5, rng());
    expect(cvCost(s)).toBe(before);
  });

  it('el café y los eventos no encarecen los CVs', () => {
    const s = richState();
    s.owned.sigespu = 4;
    const base = cvCost(s);
    buy(s, 'cafe');
    s.activeEvent = { id: 'hackathon', left: 5000 };
    expect(cvCost(s)).toBe(base);
  });

  it('copilot cuesta x4 por nivel y llega a nivel 5', () => {
    const s = richState();
    expect(costOf(s, 'copilot')).toBe(500);
    buy(s, 'copilot');
    expect(costOf(s, 'copilot')).toBe(2000);
    for (let i = 0; i < 4; i++) buy(s, 'copilot');
    expect(s.copilotLevel).toBe(5);
    expect(canBuy(s, 'copilot')).toBe(false);
  });
});

describe('clicks y producción', () => {
  it('multiplicadores de click: udemy, teclado y café multiplican el click', () => {
    const s = richState();
    expect(clickValue(s)).toBe(1);
    buy(s, 'udemy');
    expect(clickValue(s)).toBe(UDEMY_CLICK_MULT);
    buy(s, 'teclado');
    expect(clickValue(s)).toBe(UDEMY_CLICK_MULT * TECLADO_CLICK_MULT);
    buy(s, 'cafe');
    expect(clickValue(s)).toBe(UDEMY_CLICK_MULT * TECLADO_CLICK_MULT * 3);
    expect(click(s)).toBe(UDEMY_CLICK_MULT * TECLADO_CLICK_MULT * 3);
    expect(s.clicks).toBe(1);
  });

  it('bootcamp duplica la producción', () => {
    const s = richState();
    buy(s, 'yolo');
    expect(productionPerSec(s)).toBeCloseTo(0.5);
    buy(s, 'bootcamp');
    expect(productionPerSec(s)).toBeCloseTo(1);
  });

  it('el tick acredita producción y autoclicks de copilot', () => {
    const s = richState();
    s.commits = 0;
    s.owned.yolo = 2; // 1 cps
    s.copilotLevel = 1; // 2 clicks/s
    tick(s, 1000, rng());
    expect(s.commits).toBeCloseTo(1 + 2 * (1 + CLICK_PROD_SHARE * 1), 5); // el click vale 1 + CLICK_PROD_SHARE de 1 c/s
  });

  it('el prestigio aplica su bono de producción por nivel', () => {
    const s = createState();
    s.owned.yolo = 2;
    s.prestige = 2;
    const mult = 1 + PRESTIGE_PROD_BONUS * 2;
    expect(productionPerSec(s)).toBeCloseTo(1 * mult);
    expect(clickValue(s)).toBeCloseTo((1 + CLICK_PROD_SHARE * 1) * mult);
  });

  it('el click suma una parte de la producción permanente y el café lo multiplica completo', () => {
    const s = richState();
    s.owned.yolo = 20; // 10 cps
    const base = 1 + CLICK_PROD_SHARE * 10;
    expect(clickValue(s)).toBeCloseTo(base);
    expect(baseClick(s)).toBeCloseTo(base);
    buy(s, 'cafe');
    expect(clickValue(s)).toBeCloseTo(base * 3);
    expect(baseClick(s)).toBeCloseTo(base); // el café no entra en la base
    expect(baseProduction(s)).toBeCloseTo(10);
  });

  it('cvRate incluye el autoclick con el click de base', () => {
    const s = createState();
    s.owned.yolo = 20; // 10 cps
    s.copilotLevel = 1; // 2 clicks/s
    const expected = 10 + 2 * (1 + CLICK_PROD_SHARE * 10);
    expect(cvRate(s)).toBeCloseTo(expected);
    s.cafeActive = 10_000;
    expect(cvRate(s)).toBeCloseTo(expected); // sin café
  });
});

describe('café', () => {
  it('multiplica x3 durante 20 s y tiene recarga de 60 s', () => {
    const s = richState();
    s.owned.yolo = 2;
    const r = rng();
    expect(buy(s, 'cafe')).toBe(true);
    expect(productionPerSec(s)).toBeCloseTo(3);
    expect(canBuy(s, 'cafe')).toBe(false);
    tick(s, CAFE_DURATION_MS + 100, r);
    expect(s.cafeActive).toBe(0);
    expect(productionPerSec(s)).toBeCloseTo(1);
    expect(canBuy(s, 'cafe')).toBe(false); // sigue en recarga
    tick(s, CAFE_COOLDOWN_MS - CAFE_DURATION_MS, r);
    expect(canBuy(s, 'cafe')).toBe(true);
  });

  it('su costo sube x1.5 por uso con tope de 2000', () => {
    const s = richState();
    s.cafeUses = 2;
    expect(costOf(s, 'cafe')).toBeCloseTo(30 * 2.25);
    s.cafeUses = 30;
    expect(costOf(s, 'cafe')).toBe(2000);
  });
});

describe('CVs', () => {
  it('sendCVs descuenta commits y deja CVs en revisión según el rango de resolución', () => {
    const s = richState();
    const before = s.commits;
    const n = sendCVs(s, 10, rng());
    expect(n).toBe(10);
    expect(before - s.commits).toBeCloseTo(cvCostFor({ ...s, cvsSent: 0 }, 10));
    expect(s.pending).toHaveLength(10);
    for (const cv of s.pending) {
      expect(cv.left).toBeGreaterThanOrEqual(CV_RESOLVE_MIN_MS);
      expect(cv.left).toBeLessThanOrEqual(CV_RESOLVE_MAX_MS);
    }
  });

  it('sendCVs max no excede los commits', () => {
    const s = createState();
    s.commits = 200;
    const n = sendCVs(s, 'max', rng());
    expect(n).toBeGreaterThan(0);
    expect(s.commits).toBeGreaterThanOrEqual(0);
    expect(sendCVs(s, 1, rng())).toBe(0);
  });

  it('la bandeja tiene tope: base 10, +5 linkedin, +5 referido, +5 por nivel de prestigio', () => {
    const s = richState();
    expect(outboxCap(s)).toBe(OUTBOX_BASE);
    expect(OUTBOX_BASE).toBe(10);
    s.upgrades.linkedin = true;
    expect(outboxCap(s)).toBe(OUTBOX_BASE + OUTBOX_LINKEDIN);
    s.upgrades.referido = true;
    expect(outboxCap(s)).toBe(OUTBOX_BASE + OUTBOX_LINKEDIN + OUTBOX_REFERIDO);
    s.prestige = 2;
    expect(outboxCap(s)).toBe(OUTBOX_BASE + OUTBOX_LINKEDIN + OUTBOX_REFERIDO + 2 * OUTBOX_PER_PRESTIGE);
  });

  it('el tope de la bandeja se respeta en x1, x10 y max', () => {
    const s = richState();
    expect(sendCVs(s, 'max', rng())).toBe(10);
    expect(s.pending).toHaveLength(10);
    expect(freeSlots(s)).toBe(0);
    expect(maxCVs(s)).toBe(0);
    expect(sendCVs(s, 1, rng())).toBe(0);
    expect(sendCVs(s, 10, rng())).toBe(0);
    expect(sendCVs(s, 'max', rng())).toBe(0);
    // al resolverse se liberan los espacios
    tick(s, 9000, rng());
    expect(freeSlots(s)).toBe(10);
    s.pending = [];
    expect(sendCVs(s, 4, rng())).toBe(4);
    expect(sendCVs(s, 10, rng())).toBe(6);
    expect(s.pending).toHaveLength(10);
  });

  it('cvSendBlock explica por qué no se puede enviar', () => {
    const s = createState();
    s.commits = 10;
    expect(cvSendBlock(s, 1)).toEqual({ reason: 'commits', missing: CV_MIN_COST - 10 });
    expect(cvSendBlock(s, 10)).toEqual({ reason: 'commits', missing: 10 * CV_MIN_COST - 10 });
    s.commits = 1e6;
    expect(cvSendBlock(s, 10)).toBeNull();
    s.pending = Array.from({ length: 7 }, () => ({ left: 5000, direct: false }));
    expect(cvSendBlock(s, 1)).toBeNull();
    expect(cvSendBlock(s, 10)).toMatchObject({ reason: 'full', free: 3, cap: 10, used: 7 });
    s.pending.push(...Array.from({ length: 3 }, () => ({ left: 5000, direct: false })));
    expect(cvSendBlock(s, 1)).toMatchObject({ reason: 'full', free: 0 });
    s.pending = [];
    s.activeEvent = { id: 'junior5', left: 12_000 };
    expect(cvSendBlock(s, 1)).toEqual({ reason: 'event', id: 'junior5', left: 12_000 });
  });

  it('distribución de resultados: P_INTERVIEW_BASE entrevista, 40% del resto rechazo', () => {
    const s = createState();
    const r = mulberry32(7);
    const N = 40000;
    const c = { interview: 0, reject: 0, ghost: 0 };
    for (let i = 0; i < N; i++) c[rollCV(s, false, r)]++;
    const pi = P_INTERVIEW_BASE;
    expect(c.interview / N).toBeCloseTo(pi, 1);
    expect(c.reject / N).toBeCloseTo((1 - pi) * 0.4, 1);
    expect(c.ghost / N).toBeCloseTo((1 - pi) * 0.6, 1);
    expect(Math.abs(c.interview / N - pi)).toBeLessThan(0.01);
    expect(Math.abs(c.reject / N - (1 - pi) * 0.4)).toBeLessThan(0.01);
  });

  it('la probabilidad de entrevista suma bonos y tiene tope 0.60', () => {
    const s = createState();
    expect(pInterview(s)).toBeCloseTo(P_INTERVIEW_BASE);
    s.upgrades.linkedin = true;
    s.upgrades.portafolio = true;
    const withUpgrades = P_INTERVIEW_BASE + LINKEDIN_P_INTERVIEW + PORTAFOLIO_P_INTERVIEW;
    expect(pInterview(s)).toBeCloseTo(withUpgrades);
    s.prestige = 4;
    expect(pInterview(s)).toBeCloseTo(withUpgrades + 4 * PRESTIGE_P_INTERVIEW);
    s.prestige = 100;
    expect(pInterview(s)).toBe(P_INTERVIEW_CAP);
  });

  it('el referido manda ~25% de CVs directo a entrevista', () => {
    const s = richState();
    s.upgrades.referido = true;
    const r = mulberry32(3);
    let direct = 0;
    let total = 0;
    for (let i = 0; i < 40; i++) {
      s.pending = [];
      total += sendCVs(s, 'max', r);
      direct += s.pending.filter((c) => c.direct).length;
    }
    expect(total).toBe(40 * outboxCap(s));
    expect(direct / total).toBeGreaterThan(0.18);
    expect(direct / total).toBeLessThan(0.32);
  });

  it('el tick resuelve los CVs y cuenta rechazos/ghosting/entrevistas', () => {
    const s = richState();
    const r = mulberry32(11);
    for (let i = 0; i < 6; i++) {
      sendCVs(s, 10, r);
      tick(s, 9000, r);
    }
    expect(s.pending).toHaveLength(0);
    expect(s.rejections + s.ghostings + s.interviewsTotal).toBe(60);
    expect(s.interviews).toBe(s.interviewsTotal);
  });

  it('junior5 bloquea el envío de CVs', () => {
    const s = richState();
    s.activeEvent = { id: 'junior5', left: 15000 };
    expect(sendCVs(s, 5, rng())).toBe(0);
  });
});

describe('sin soft-lock', () => {
  it('tras fallar el proceso final siempre se puede volver a enviar CVs', () => {
    const s = createState();
    s.owned.yolo = 1; // produce 0.5 c/s
    s.commits = 0;
    s.interviews = FINAL_COST;
    startFinal(s, () => 0.999); // fallo seguro
    tick(s, FINAL_STAGES * FINAL_STAGE_MS + 10, rng());
    expect(s.finalFails).toBe(1);
    expect(s.final).toBeNull();
    // con mucho historial de CVs enviados el costo sigue siendo el mínimo
    s.cvsSent = 100_000;
    expect(cvCost(s)).toBe(CV_MIN_COST);
    // los commits siempre alcanzan tarde o temprano para un CV
    s.commits = CV_MIN_COST;
    expect(sendCVs(s, 1, rng())).toBe(1);
  });

  it('con 120k commits y todas las mejoras se envían al menos 10 CVs, sin importar los CVs enviados', () => {
    const s = createState();
    s.commits = 120_000;
    s.totalCommits = 120_000;
    s.cvsSent = 500;
    for (const id of ['udemy', 'teclado', 'bootcamp', 'linkedin', 'referido'] as const) s.upgrades[id] = true;
    s.copilotLevel = 5;
    s.owned = { yolo: 20, reservas: 15, gymubb: 10, sigespu: 5, pedidos: 2 };
    const expected = Math.min(outboxCap(s), Math.floor(120_000 / cvCost(s)));
    expect(expected).toBeGreaterThanOrEqual(10);
    expect(sendCVs(s, 'max', rng())).toBe(expected);
  });

  it('un CV cuesta como mucho unos segundos de producción', () => {
    const s = createState();
    for (const owned of [1, 5, 20, 80, 400]) {
      s.owned.pedidos = owned;
      const secsToAfford = cvCost(s) / productionPerSec(s);
      expect(secsToAfford).toBeLessThanOrEqual(CV_COST_SECONDS + 0.01);
    }
  });
});

describe('proceso final', () => {
  it('requiere 5 entrevistas y las consume', () => {
    const s = createState();
    s.interviews = 4;
    expect(startFinal(s, rng())).toBe(false);
    s.interviews = 6;
    expect(startFinal(s, rng())).toBe(true);
    expect(s.interviews).toBe(6 - FINAL_COST);
    expect(s.final).not.toBeNull();
  });

  it('pÉxito = 0.30 + whiteboard + portafolio + 0.05 por fallo', () => {
    const s = createState();
    expect(pFinal(s)).toBeCloseTo(0.3);
    s.upgrades.whiteboard = true;
    s.upgrades.portafolio = true;
    expect(pFinal(s)).toBeCloseTo(0.6);
    s.finalFails = 2;
    expect(pFinal(s)).toBeCloseTo(0.7);
  });

  it('éxito: termina la partida; fallo: suma intento y sigue', () => {
    const total = FINAL_STAGES * FINAL_STAGE_MS;
    const ok = createState();
    ok.interviews = 5;
    startFinal(ok, () => 0); // rng 0 < p => éxito
    tick(ok, total + 10, rng());
    expect(ok.finished).toBe(true);
    expect(ok.outbox.some((m) => m.t === 'finalResult' && m.success)).toBe(true);

    const bad = createState();
    bad.interviews = 5;
    startFinal(bad, () => 0.999); // fallo
    tick(bad, total + 10, rng());
    expect(bad.finished).toBe(false);
    expect(bad.finalFails).toBe(1);
    expect(bad.final).toBeNull();
    expect(bad.achievements).toContain('failFinal');
  });

  it('pasa por las 3 etapas', () => {
    const s = createState();
    s.interviews = 5;
    startFinal(s, () => 0);
    const r = rng();
    tick(s, FINAL_STAGE_MS + 1, r);
    expect(s.final?.stage).toBe(1);
    tick(s, FINAL_STAGE_MS, r);
    expect(s.final?.stage).toBe(2);
  });
});

describe('prestigio', () => {
  it('solo tras la oferta; reinicia y conserva el bono y los logros', () => {
    const s = richState();
    expect(canPrestige(s)).toBe(false);
    buy(s, 'udemy');
    s.finished = true;
    s.achievements.push('firstCommit');
    expect(prestige(s)).toBe(true);
    expect(s.prestige).toBe(1);
    expect(s.finished).toBe(false);
    expect(s.upgrades.udemy).toBe(false);
    expect(s.commits).toBe(0);
    expect(s.achievements).toContain('firstCommit');
    expect(pInterview(s)).toBeCloseTo(P_INTERVIEW_BASE + PRESTIGE_P_INTERVIEW);
    expect(clickValue(s)).toBeCloseTo(1 + PRESTIGE_PROD_BONUS);
  });

  it('llegar a CTO da logro y no permite más prestigio', () => {
    const s = createState();
    for (let i = 0; i < 4; i++) {
      s.finished = true;
      expect(prestige(s)).toBe(true);
    }
    expect(s.prestige).toBe(4);
    expect(s.achievements).toContain('cto');
    s.finished = true;
    expect(canPrestige(s)).toBe(false);
  });
});

describe('persistencia', () => {
  function played(): GameState {
    const s = richState();
    buy(s, 'yolo');
    buy(s, 'udemy');
    sendCVs(s, 5, rng());
    tick(s, 500, rng());
    return s;
  }

  it('ida y vuelta de serialize/deserialize', () => {
    const s = played();
    const back = deserialize(serialize(s, 1234));
    expect(back).not.toBeNull();
    expect(back!.savedAt).toBe(1234);
    const { outbox: _a, ...a } = s;
    const { outbox: _b, ...b } = back!.state;
    expect(b).toEqual(a);
  });

  it('exportar/importar en base64', () => {
    const s = played();
    const back = importSave(exportSave(s));
    expect(back!.state.owned.yolo).toBe(1);
    expect(back!.state.upgrades.udemy).toBe(true);
    expect(importSave('esto no es un guardado')).toBeNull();
    expect(importSave(btoa('{"basura":true}'))).toBeNull();
  });

  it('localStorage con almacenamiento simulado y tolerancia a fallos', () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
    expect(loadFromStorage(storage)).toBeNull();
    expect(saveToStorage(played(), storage)).toBe(true);
    expect(mem.has(SAVE_KEY)).toBe(true);
    expect(loadFromStorage(storage)!.state.owned.yolo).toBe(1);
    const broken = {
      getItem: () => {
        throw new Error('x');
      },
      setItem: () => {
        throw new Error('x');
      },
      removeItem: () => {},
    };
    expect(saveToStorage(createState(), broken)).toBe(false);
    expect(loadFromStorage(broken)).toBeNull();
  });

  it('migración v1 -> v2: conserva el progreso, el costo del CV ya no usa cvsSent y no vuelve a mostrar el tutorial', () => {
    expect(SAVE_VERSION).toBe(3);
    const old = {
      version: 1,
      savedAt: 99,
      state: {
        version: 1,
        commits: 12_345,
        totalCommits: 50_000,
        clicks: 400,
        cvsSent: 90, // con la fórmula vieja un CV costaba ~115k
        owned: { yolo: 4, reservas: 3 },
        upgrades: { udemy: true, linkedin: true },
        pending: [{ left: 1000, direct: false }],
        interviews: 3,
        achievements: ['firstCommit'],
      },
    };
    const m = migrate(JSON.parse(JSON.stringify(old)));
    expect(m.version).toBe(SAVE_VERSION);
    const back = deserialize(JSON.stringify(old))!;
    expect(back.state.version).toBe(SAVE_VERSION);
    expect(back.state.commits).toBe(12_345);
    expect(back.state.owned.yolo).toBe(4);
    expect(back.state.upgrades.linkedin).toBe(true);
    expect(back.state.interviews).toBe(3);
    expect(back.state.cvsSent).toBe(90);
    expect(back.state.clicksTotal).toBe(400);
    expect(back.state.tutorialStep).toBeGreaterThanOrEqual(3);
    expect(back.state.pending).toHaveLength(1);
    // costo nuevo: independiente de los 90 CVs enviados; bandeja con linkedin = 15
    expect(cvCost(back.state)).toBeLessThan(200);
    expect(outboxCap(back.state)).toBe(OUTBOX_BASE + OUTBOX_LINKEDIN);
    expect(sendCVs(back.state, 'max', rng())).toBe(outboxCap(back.state) - 1);
  });

  it('migración v1 de una partida sin jugar muestra el tutorial', () => {
    const back = deserialize(JSON.stringify({ version: 1, savedAt: 1, state: { commits: 2, clicks: 2 } }))!;
    expect(back.state.tutorialStep).toBe(0);
  });

  it('migración: un guardado v0 sin campos nuevos se completa con defaults', () => {
    const old = { version: 0, savedAt: 5, state: { commits: 99, owned: { yolo: 3 } } };
    const m = migrate(old);
    expect(m.version).toBe(SAVE_VERSION);
    const back = deserialize(JSON.stringify(old))!;
    expect(back.state.commits).toBe(99);
    expect(back.state.owned.yolo).toBe(3);
    expect(back.state.owned.pedidos).toBe(0);
    expect(back.state.upgrades.udemy).toBe(false);
  });

  it('descarta valores corruptos', () => {
    const bad = { version: 1, savedAt: 1, state: { commits: 'mucho', copilotLevel: 99, owned: { yolo: -5 } } };
    const back = deserialize(JSON.stringify(bad))!;
    expect(back.state.commits).toBe(0);
    expect(back.state.copilotLevel).toBe(5);
    expect(back.state.owned.yolo).toBe(0);
  });
});

describe('progreso offline', () => {
  it('acredita 50% de la producción', () => {
    const s = createState();
    s.owned.yolo = 20; // 10 cps
    const gained = applyOffline(s, 100_000, rng());
    expect(gained).toBeCloseTo(10 * 100 * 0.5);
    expect(s.commits).toBeCloseTo(500, 0);
  });

  it('tiene tope de 2 horas', () => {
    const s = createState();
    s.owned.yolo = 20;
    const gained = applyOffline(s, OFFLINE_MAX_MS * 10, rng());
    expect(gained).toBeCloseTo(10 * (OFFLINE_MAX_MS / 1000) * 0.5);
  });

  it('resuelve los CVs en revisión', () => {
    const s = richState();
    sendCVs(s, 10, rng());
    applyOffline(s, 60_000, rng());
    expect(s.pending).toHaveLength(0);
  });
});

describe('eventos', () => {
  it('no hay dos eventos a la vez y se disparan entre 45 y 90 s', () => {
    const s = createState();
    const r = mulberry32(5);
    const starts: number[] = [];
    let active = 0;
    for (let t = 0; t < 20 * 60_000; t += 100) {
      tick(s, 100, r);
      for (const m of s.outbox.splice(0)) {
        if (m.t === 'event') starts.push(t);
      }
      if (s.activeEvent) active++;
    }
    expect(starts.length).toBeGreaterThan(8);
    for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1]).toBeGreaterThanOrEqual(44_000);
    expect(active).toBeGreaterThan(0);
  });
});

describe('formato', () => {
  it('abrevia números', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1200)).toBe('1.2K');
    expect(formatNumber(3_400_000)).toBe('3.4M');
    expect(formatNumber(15_000)).toBe('15K');
    expect(formatNumber(2.5, 1)).toBe('2.5');
    expect(formatTime(65_000)).toBe('1:05');
  });
});

// ---------- Easter eggs (docs/game-design.md, sección 13) ----------

describe('easter eggs: eventos joseph y barril', () => {
  it('están en el pool de eventos con peso menor que los clásicos y pickEvent puede devolverlos', () => {
    expect(EVENT_DEFS.joseph.weight).toBeGreaterThan(0);
    expect(EVENT_DEFS.barril.weight).toBeGreaterThan(0);
    expect(EVENT_DEFS.joseph.weight).toBeLessThan(EVENT_DEFS.hackathon.weight);
    expect(EVENT_DEFS.barril.weight).toBeLessThan(EVENT_DEFS.hackathon.weight);
    expect(EVENT_DEFS.barril.durationMs).toBe(8000);
    const seen = new Set<string>();
    const r = mulberry32(7);
    for (let i = 0; i < 4000; i++) seen.add(pickEvent(r));
    expect(seen.has('joseph')).toBe(true);
    expect(seen.has('barril')).toBe(true);
    // no son frecuentes: bastante menos que la fracción que tendrían con peso 1
    const r2 = mulberry32(8);
    let n = 0;
    for (let i = 0; i < 6000; i++) if (pickEvent(r2) === 'joseph') n++;
    expect(n / 6000).toBeLessThan(0.1);
  });

  it('joseph: el próximo CV resuelto es un rechazo marcado, aunque fuera entrevista segura', () => {
    const s = richState();
    s.upgrades.referido = true;
    startEvent(s, 'joseph', 0);
    expect(s.josephPending).toBe(true);
    expect(s.outbox.some((m) => m.t === 'event' && m.id === 'joseph')).toBe(true);
    s.outbox.length = 0;
    s.pending.push({ left: 0, direct: true }, { left: 0, direct: true });
    tick(s, 100, mulberry32(1));
    const cvs = s.outbox.filter((m) => m.t === 'cv') as { t: 'cv'; result: string; joseph?: boolean }[];
    expect(cvs).toHaveLength(2);
    expect(cvs[0].result).toBe('reject');
    expect(cvs[0].joseph).toBe(true);
    // solo afecta a uno: el segundo es una entrevista directa normal
    expect(cvs[1].result).toBe('interview');
    expect(cvs[1].joseph).toBeUndefined();
    expect(s.josephPending).toBe(false);
    expect(s.rejections).toBe(1);
  });

  it('joseph: si no hay CVs pendientes la predicción espera al primero que se resuelva', () => {
    const s = createState();
    startEvent(s, 'joseph', 0);
    tick(s, 1000, mulberry32(2));
    expect(s.josephPending).toBe(true);
    s.commits = 1e6;
    sendCVs(s, 1, mulberry32(3));
    tick(s, 9000, mulberry32(4));
    expect(s.josephPending).toBe(false);
    expect(s.rejections).toBe(1);
  });

  it('barril: aparece 8 s; al hacerlo explotar da 10 CVs gratis sin encarecer los siguientes', () => {
    const s = richState();
    startEvent(s, 'barril', 0);
    expect(s.activeEvent).toEqual({ id: 'barril', left: 8000 });
    const costBefore = cvCostFor(s, 1);
    const commitsBefore = s.commits;
    expect(popBarril(s, mulberry32(1))).toBe(BARRIL_FREE_CVS);
    expect(BARRIL_FREE_CVS).toBe(10);
    expect(s.pending).toHaveLength(10);
    expect(s.cvsSent).toBe(0);
    expect(s.commits).toBe(commitsBefore);
    expect(cvCostFor(s, 1)).toBe(costBefore);
    expect(s.activeEvent).toBeNull();
    expect(s.outbox.some((m) => m.t === 'barrilPop' && m.n === 10)).toBe(true);
    // se resuelven como cualquier CV
    tick(s, 9000, mulberry32(5));
    expect(s.pending).toHaveLength(0);
    expect(s.interviews + s.rejections + s.ghostings).toBe(10);
    // ya no se puede hacer explotar de nuevo
    expect(popBarril(s, mulberry32(1))).toBe(0);
  });

  it('barril: si no lo tocas desaparece a los 8 s y no da CVs', () => {
    const s = createState();
    startEvent(s, 'barril', 0);
    s.outbox.length = 0;
    tick(s, 7900, mulberry32(1));
    expect(s.activeEvent?.id).toBe('barril');
    tick(s, 200, mulberry32(1));
    expect(s.activeEvent).toBeNull();
    expect(s.outbox.some((m) => m.t === 'eventEnd' && m.id === 'barril')).toBe(true);
    expect(popBarril(s, mulberry32(1))).toBe(0);
    expect(s.pending).toHaveLength(0);
  });

  it('un guardado con un evento desconocido no rompe la carga', () => {
    const s = createState();
    const raw = JSON.parse(serialize(s));
    raw.state.activeEvent = { id: 'inexistente', left: 5000 };
    expect(deserialize(JSON.stringify(raw))?.state.activeEvent).toBeNull();
  });
});

describe('easter eggs: café -> barril', () => {
  it('tras 10 cafés (acumulados) la taza es un barril y sobrevive al prestigio', () => {
    const s = richState();
    expect(cafeIsBarrel(s)).toBe(false);
    for (let i = 0; i < 9; i++) {
      s.cafeCooldown = 0;
      s.cafeActive = 0;
      expect(buy(s, 'cafe')).toBe(true);
    }
    expect(cafeIsBarrel(s)).toBe(false);
    s.cafeCooldown = 0;
    s.cafeActive = 0;
    buy(s, 'cafe');
    expect(s.cafeUsesTotal).toBe(10);
    expect(cafeIsBarrel(s)).toBe(true);
    tick(s, 100, mulberry32(1));
    expect(s.achievements).toContain('coffee10');
    s.finished = true;
    prestige(s);
    expect(cafeIsBarrel(s)).toBe(true);
  });
});

describe('easter eggs: Dempsey Roll', () => {
  /** Simula clicks a `cps` clicks/s durante `seconds` s (empezando en t0). Devuelve el tiempo final. */
  function clickAt(s: GameState, cps: number, seconds: number, t0 = 1000): number {
    const step = 1000 / cps;
    let t = t0;
    for (; t < t0 + seconds * 1000; t += step) click(s, t);
    return t;
  }

  it('8 clicks/s sostenidos 3 s activan el combo: click x2 durante 10 s', () => {
    const s = createState();
    const base = clickValue(s);
    clickAt(s, 8, 2.5);
    expect(s.dempseyLeft).toBe(0);
    clickAt(s, 8, 1, 3500);
    expect(s.dempseyLeft).toBe(DEMPSEY_MS);
    expect(s.dempseyCount).toBe(1);
    expect(s.outbox.some((m) => m.t === 'dempsey')).toBe(true);
    expect(clickValue(s)).toBeCloseTo(base * DEMPSEY_MULT);
    const before = s.commits;
    click(s, 5000);
    expect(s.commits - before).toBeCloseTo(base * 2);
    // dura 10 s y luego vuelve a la normalidad
    tick(s, 9900, mulberry32(1));
    expect(s.dempseyLeft).toBeGreaterThan(0);
    tick(s, 200, mulberry32(1));
    expect(s.dempseyLeft).toBe(0);
    expect(s.outbox.some((m) => m.t === 'dempseyEnd')).toBe(true);
    expect(clickValue(s)).toBeCloseTo(base);
  });

  it('7 clicks/s no alcanzan, ni una ráfaga seguida de silencio', () => {
    const s = createState();
    clickAt(s, 7, 6);
    expect(s.dempseyLeft).toBe(0);
    const s2 = createState();
    const t = clickAt(s2, 20, 1.5);
    click(s2, t + 2500); // pausa de 2.5 s
    clickAt(s2, 8, 0.5, t + 2600);
    expect(s2.dempseyLeft).toBe(0);
    expect(s2.dempseyCount).toBe(0);
  });

  it('sin nowMs (simulador, autoclick) nunca se activa', () => {
    const s = createState();
    for (let i = 0; i < 500; i++) click(s);
    expect(s.dempseyLeft).toBe(0);
    expect(s.clickLog).toHaveLength(0);
  });

  it('no se reactiva mientras dura y da el logro', () => {
    const s = createState();
    clickAt(s, 10, 3.2);
    expect(s.dempseyCount).toBe(1);
    clickAt(s, 10, 4, 5000);
    expect(s.dempseyCount).toBe(1);
    expect(s.dempseyLeft).toBe(DEMPSEY_MS);
    tick(s, 100, mulberry32(1));
    expect(s.achievements).toContain('dempsey');
  });

  it('un reloj que retrocede no rompe nada', () => {
    const s = createState();
    click(s, 10_000);
    click(s, 500);
    expect(s.clickLog).toEqual([500]);
  });
});

describe('easter eggs: logros', () => {
  it('Lanzado al precipicio: se concede al renunciar', () => {
    const s = createState();
    s.finished = true;
    expect(s.achievements).not.toContain('cliff');
    prestige(s);
    expect(s.achievements).toContain('cliff');
  });

  it('Hardstuck en Master: a la 3ª derrota del proceso final, no antes', () => {
    const s = richState();
    const r = mulberry32(3);
    for (let i = 0; i < 3; i++) {
      s.interviews = FINAL_COST;
      startFinal(s, r);
      s.final!.success = false;
      tick(s, FINAL_STAGES * FINAL_STAGE_MS, r);
      if (i < 2) expect(s.achievements).not.toContain('hardstuck');
    }
    expect(s.finalFails).toBe(3);
    expect(s.achievements).toContain('hardstuck');
  });

  it('Nigerundayo!: solo si la pestaña se oculta durante la prueba técnica; el flag se guarda y se concede al cargar', () => {
    const s = richState();
    const r = mulberry32(9);
    // fuera del proceso final: nada
    expect(markNigerundayo(s)).toBe(false);
    s.interviews = FINAL_COST;
    startFinal(s, r);
    // etapa 1 (RR. HH.): nada
    expect(markNigerundayo(s)).toBe(false);
    tick(s, FINAL_STAGE_MS, r);
    expect(s.final?.stage).toBe(1);
    expect(markNigerundayo(s)).toBe(true);
    expect(s.nigerundayo).toBe(true);
    // la pestaña se cerró: se guarda el estado (el proceso a medias no se restaura, el flag sí)
    const back = deserialize(serialize(s))!.state;
    expect(back.final).toBeNull();
    expect(back.nigerundayo).toBe(true);
    expect(back.achievements).not.toContain('nigerundayo');
    tick(back, 100, r);
    expect(back.achievements).toContain('nigerundayo');
  });

  it('Nigerundayo!: ocultar la pestaña en la etapa 3 no cuenta', () => {
    const s = richState();
    const r = mulberry32(10);
    s.interviews = FINAL_COST;
    startFinal(s, r);
    tick(s, FINAL_STAGE_MS * 2, r);
    expect(s.final?.stage).toBe(2);
    expect(markNigerundayo(s)).toBe(false);
    expect(s.nigerundayo).toBe(false);
  });

  it('el estado serializado no incluye el log de clicks y los campos nuevos hacen ida y vuelta', () => {
    const s = createState();
    for (let i = 0; i < 30; i++) click(s, 1000 + i * 100);
    s.josephPending = true;
    s.dempseyLeft = 4000;
    s.dempseyCount = 2;
    const json = serialize(s);
    expect(json).not.toContain('clickLog');
    const back = deserialize(json)!.state;
    expect(back.josephPending).toBe(true);
    expect(back.dempseyLeft).toBe(4000);
    expect(back.dempseyCount).toBe(2);
    expect(back.clickLog).toEqual([]);
  });
});

describe('balance: exposicion no se multiplica por café ni eventos', () => {
  it('el bono de exposicion usa la producción permanente, no la del café activo', () => {
    const s = createState();
    s.owned.yolo = 10;
    s.cafeActive = 20_000;
    s.eventTimer = 50;
    const perm = cvRate(s);
    expect(productionPerSec(s)).toBeGreaterThan(perm); // el café triplica la producción
    s.commits = 0;
    tick(s, 100, () => 0.2); // 0.2 elige 'exposicion' en pickEvent
    expect(s.outbox.some((m) => m.t === 'event' && m.id === 'exposicion')).toBe(true);
    expect(s.commits).toBeLessThan(perm * 60 * 1.2);
    expect(s.commits).toBeGreaterThanOrEqual(perm * 60);
  });
});

describe('modo libre (seguir jugando tras la oferta)', () => {
  const total = FINAL_STAGES * FINAL_STAGE_MS;

  function win(s: GameState): void {
    s.interviews = FINAL_COST;
    startFinal(s, () => 0);
    tick(s, total + 10, mulberry32(1));
  }

  it('la primera oferta termina la partida y cuenta 1', () => {
    const s = createState();
    win(s);
    expect(s.finished).toBe(true);
    expect(s.endless).toBe(false);
    expect(s.offers).toBe(1);
    expect(click(s)).toBe(0);
  });

  it('seguir jugando reabre el click, el tick y la tienda', () => {
    const s = createState();
    win(s);
    expect(continueEndless(s)).toBe(true);
    expect(s.finished).toBe(false);
    expect(s.endless).toBe(true);
    expect(click(s)).toBeGreaterThan(0);
    const before = s.elapsedMs;
    tick(s, 1000, mulberry32(2));
    expect(s.elapsedMs).toBe(before + 1000);
    s.commits = 1e9;
    expect(canBuy(s, 'udemy')).toBe(true);
    expect(continueEndless(s)).toBe(false);
  });

  it('las ofertas extra suman sin volver a bloquear la partida', () => {
    const s = createState();
    win(s);
    continueEndless(s);
    s.outbox = [];
    win(s);
    expect(s.finished).toBe(false);
    expect(s.offers).toBe(2);
    const msg = s.outbox.find((m) => m.t === 'finalResult');
    expect(msg && msg.t === 'finalResult' && msg.extra).toBe(true);
    win(s);
    expect(s.offers).toBe(3);
    expect(click(s)).toBeGreaterThan(0);
  });

  it('el prestigio sigue disponible en modo libre y reinicia el contador', () => {
    const s = createState();
    win(s);
    continueEndless(s);
    expect(canPrestige(s)).toBe(true);
    expect(prestige(s)).toBe(true);
    expect(s.endless).toBe(false);
    expect(s.offers).toBe(0);
    expect(s.prestige).toBe(1);
  });

  it('migración v2 -> v3: un guardado terminado cuenta 1 oferta y vuelve a mostrar el fin', () => {
    const old = { version: 2, savedAt: 5, state: { version: 2, commits: 10, finished: true, clicks: 50 } };
    const back = deserialize(JSON.stringify(old))!;
    expect(back.state.version).toBe(SAVE_VERSION);
    expect(back.state.finished).toBe(true);
    expect(back.state.endless).toBe(false);
    expect(back.state.offers).toBe(1);
    const fresh = deserialize(JSON.stringify({ version: 2, savedAt: 5, state: { commits: 3 } }))!;
    expect(fresh.state.offers).toBe(0);
  });

  it('el modo libre se guarda y se recarga sin fin de partida', () => {
    const s = createState();
    win(s);
    continueEndless(s);
    const back = deserialize(serialize(s))!;
    expect(back.state.finished).toBe(false);
    expect(back.state.endless).toBe(true);
    expect(back.state.offers).toBe(1);
  });
});
