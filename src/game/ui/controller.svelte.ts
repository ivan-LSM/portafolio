import { CAFE_DURATION_MS, CAFE_MULT, DEMPSEY_MS, DEMPSEY_MULT, EVENT_DEFS, HACKATHON_MULT, PRODFAIL_MULT, PROJECTS, SENIORITY, TICK_MS, TUTORIAL_STEPS, type EventId, type ShopId } from '../balance';
import { checkAchievements } from '../achievements';
import {
  acceptRecruiter,
  applyOffline,
  canPrestige,
  continueEndless,
  seniorityOf,
  markNigerundayo,
  popBarril,
  buy as engineBuy,
  click as engineClick,
  clickValue,
  createState,
  prestige as enginePrestige,
  productionPerSec,
  sendCVs as engineSendCVs,
  startFinal as engineStartFinal,
  tick,
  isPremium,
} from '../engine';
import { formatNumber, formatTime } from '../format';
import { makeT, pick, type GameLang } from '../i18n';
import { localePath } from '../../i18n/utils';
import { clearStorage, exportSave, importSave, loadFromStorage, saveToStorage } from '../save';
import type { GameState, OutMsg } from '../types';
import { sfx, type SfxName } from '../../lib/sfx';
import { track, trackOnce } from '../../lib/analytics';
import { cardFileName, copyShareText, displayUrl, pickQuip, shareCard, type CardData } from './shareCard';
import { KEYBOARD, LAYOUT } from '../sprites';
import {
  FACE_FALLBACK,
  HOLO_LIFE_MS,
  HOLO_MAX_DESKTOP,
  HOLO_SLOTS,
  HOLO_STORAGE_KEY,
  HOLO_TERM_EVERY,
  forbiddenZones,
  pickSlot,
  planSpawn,
  type HoloKind,
  type HoloTone,
  type HoloWin,
  type Rect,
  type SpawnState,
} from './holo';
import { ASSISTANT_LIFE_MS, ASSISTANT_SLOT, rectsOverlap } from './holo';
import { COMBO_GAP_MS, COMBO_HOLD_MS, COMBO_MILESTONES, bannerTone, bannerTotalMs, clickMult, multLabel, numberSize, type BannerId } from './fx';

export interface FeedItem {
  id: number;
  kind: 'interview' | 'reject' | 'ghost' | 'event' | 'info';
  text: string;
}
export interface Toast {
  id: number;
  text: string;
  href?: string;
  linkText?: string;
  kind: 'info' | 'unlock' | 'achv';
}
export type TutorialTarget = 'click' | 'shop' | 'cvs';
export interface Particle {
  id: number;
  /** posición horizontal sobre el teclado (%) */
  x: number;
  text: string;
  /** tamaño de la fuente (rem) */
  size: number;
  /** giro en grados */
  rot: number;
  /** hay un multiplicador activo: se ve en arcoíris con la etiqueta */
  rainbow: boolean;
  mult: string;
}
/** Texto flotante de un hito: entrevista (verde, sube) o rechazo (rojo, cae y tiembla). */
export interface Fx {
  id: number;
  kind: 'interview' | 'reject';
  text: string;
  /** posición horizontal (%) */
  x: number;
}
/** Aviso grande de un evento o multiplicador (EventBanner.svelte). */
export interface Banner {
  key: number;
  id: BannerId;
  startedAt: number;
  totalMs: number;
  /** valor del evento (p. ej. commits de «exposición») */
  value?: number;
}

const AUTOSAVE_MS = 10_000;
/** Máximo de toasts normales visibles a la vez (el aviso con botón del recruiter/barril cuenta aparte dentro del tope de 3). */
export const MAX_TOASTS = 3;
/** Clicks nuevos que completan el paso 1 del tutorial. */
const TUTORIAL_CLICKS = 3;
const TUTORIAL_TARGETS: TutorialTarget[] = ['click', 'shop', 'cvs'];
const MAX_FEED = 40;
const MIN_OFFLINE_MS = 5_000;
/** Duración de la animación del precipicio al renunciar (ms). Con movimiento reducido es más corta y estática. */
export const CLIFF_MS = 2800;
export const CLIFF_REDUCED_MS = 1800;
/** Cuánto dura la cara de alegría tras un logro o desbloqueo (ms). */
export const HAPPY_MS = 1800;
/** Cara de shock tras un rechazo (ms) y espera minima antes de poder repetirla. */
const SHOCK_MS = 900;
const SHOCK_COOLDOWN_MS = 1500;

export class GameController {
  s = $state<GameState>(createState());
  feed = $state<FeedItem[]>([]);
  toasts = $state<Toast[]>([]);
  particles = $state<Particle[]>([]);
  fx = $state<Fx[]>([]);
  banner = $state<Banner | null>(null);
  /** combo cosmético de clicks rápidos (no afecta al juego) y contador de hitos para animar el pop grande */
  combo = $state(0);
  comboPop = $state(0);
  private comboTimer: ReturnType<typeof setTimeout> | undefined;
  /** ventanas emergentes del HUD holografico (HoloHud.svelte), preferencia de visibilidad y tope segun el ancho */
  holoWins = $state<HoloWin[]>([]);
  holoOn = $state(true);
  holoMax = $state(HOLO_MAX_DESKTOP);
  private holoSpawn: SpawnState = { wins: [], lastByKind: {}, lastAny: -10_000 };
  tab = $state<'projects' | 'upgrades' | 'premium'>('projects');
  /** frame del teclado: 0 reposo, 1/2 mitades presionadas */
  keyFrame = $state(0);
  codeFrame = $state(0);
  typingFrame = $state(0);
  shake = $state(false);
  /** timestamp de la última compra del portafolio (para parpadeo de la sección) */
  reduced = $state(false);
  started = $state(false);
  /** contador que avanza cada ~200 ms: dirige las animaciones idle, el RGB y el balanceo del Dempsey Roll */
  phase = $state(0);
  /** performance.now() del último click y de fin de la cara feliz (para elegir el frame del personaje) */
  lastClickAt = $state(-10_000);
  happyUntil = $state(0);
  /** fin de la cara de shock tras un rechazo, y cooldown para que no quede pegada si llueven rechazos */
  shockUntil = $state(0);
  private shockCooldownUntil = 0;
  /** alto (px) del header fijo del sitio: los toasts y el panel se colocan debajo */
  headerH = $state(72);
  /** aviso tras fallar el proceso final (se muestra en el modal hasta que se cierra) */
  finalNotice = $state<{ attempt: number } | null>(null);
  /** el tutorial recuerda desde dónde contar cada paso (no se guarda) */
  private tutBase = { clicks: 0, owned: 0, cvs: 0 };
  /** animación del precipicio en curso */
  cliff = $state(false);
  cliffStart = $state(0);

  readonly t: ReturnType<typeof makeT>;
  private nextId = 1;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private hiddenAt = 0;
  private autosave: ReturnType<typeof setInterval> | undefined;
  private rng: () => number = Math.random;
  private cleanups: (() => void)[] = [];

  constructor(
    readonly lang: GameLang,
    private readonly siteUrl: () => string,
  ) {
    this.t = makeT(lang);
  }

  // ---------- ciclo de vida ----------

  start(): void {
    if (this.started) return;
    this.started = true;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const loaded = loadFromStorage();
    if (loaded) {
      this.s = loaded.state;
      const away = Date.now() - loaded.savedAt;
      this.applyAway(away);
    }
    this.rebaseTutorial();
    try {
      this.holoOn = localStorage.getItem(HOLO_STORAGE_KEY) !== 'off';
    } catch {
      /* sin almacenamiento: queda activado */
    }
    const ae = this.s.activeEvent;
    if (ae && ae.left > 0) this.showBanner(ae.id);

    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      this.acc += Math.min(now - this.last, 1000);
      this.last = now;
      const ph = Math.floor(now / 200);
      if (ph !== this.phase) this.phase = ph;
      let n = 0;
      while (this.acc >= TICK_MS && n < 10) {
        tick(this.s, TICK_MS, this.rng);
        this.acc -= TICK_MS;
        n++;
      }
      this.advanceTutorial();
      this.drain();
    };
    this.raf = requestAnimationFrame(loop);

    const onVis = () => {
      if (document.hidden) {
        markNigerundayo(this.s);
        this.hiddenAt = Date.now();
        cancelAnimationFrame(this.raf);
        this.save();
      } else if (this.hiddenAt) {
        this.applyAway(Date.now() - this.hiddenAt);
        this.hiddenAt = 0;
        this.last = performance.now();
        this.acc = 0;
        this.raf = requestAnimationFrame(loop);
      }
    };
    const onHide = () => {
      markNigerundayo(this.s);
      this.save();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    this.autosave = setInterval(() => this.save(), AUTOSAVE_MS);
    this.cleanups.push(
      () => document.removeEventListener('visibilitychange', onVis),
      () => window.removeEventListener('pagehide', onHide),
    );
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    if (this.autosave) clearInterval(this.autosave);
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.save();
    this.started = false;
  }

  private applyAway(awayMs: number): void {
    if (awayMs < MIN_OFFLINE_MS || this.s.finished) return;
    const gained = applyOffline(this.s, awayMs, this.rng);
    if (gained >= 1) this.pushToast(this.t('toast.offline', { n: formatNumber(gained) }), 'info');
    this.drain();
  }

  save(): void {
    saveToStorage(this.s);
  }

  // ---------- acciones ----------

  click(): void {
    if (this.s.finished) return;
    const nowMs = performance.now();
    const fast = nowMs - this.lastClickAt < COMBO_GAP_MS;
    const v = engineClick(this.s, nowMs);
    this.lastClickAt = nowMs;
    sfx.play('click');
    trackOnce('juego-inicio');
    this.bumpCombo(fast);
    this.keyFrame = this.keyFrame === 1 ? 2 : 1;
    this.typingFrame = this.typingFrame ? 0 : 1;
    this.codeFrame++;
    if (this.s.clicks % HOLO_TERM_EVERY === 0) {
      const n = this.s.clicks / HOLO_TERM_EVERY;
      this.holoEmit('term', 'cyan', 'bash', [pick(this.lang, 'holo.commits', n)]);
    }
    setTimeout(() => (this.keyFrame = 0), 90);
    if (!this.reduced) {
      this.shake = true;
      setTimeout(() => (this.shake = false), 80);
      const id = this.nextId++;
      const cm = clickMult(this.s);
      const rainbow = cm > 1;
      this.particles = [
        ...this.particles.slice(-11),
        {
          id,
          x: 8 + Math.random() * 84,
          text: `+${formatNumber(v, v < 10 ? 1 : 0).replace(/\.0$/, '')}`,
          size: numberSize(v, rainbow),
          rot: Math.round((Math.random() * 12 - 6) * 10) / 10,
          rainbow,
          mult: rainbow ? multLabel(cm) : '',
        },
      ];
      setTimeout(() => (this.particles = this.particles.filter((p) => p.id !== id)), 950);
    }
  }

  /** Combo cosmético: clicks separados por menos de COMBO_GAP_MS suben el contador; se apaga solo al parar. */
  private bumpCombo(fast: boolean): void {
    this.combo = fast ? this.combo + 1 : 1;
    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => (this.combo = 0), COMBO_HOLD_MS);
    const c = this.combo;
    if (COMBO_MILESTONES.includes(c)) {
      this.comboPop++;
      sfx.play(c >= 25 ? 'milestone' : 'combo', c / 5);
    } else if (c >= 5 && c % 5 === 0) {
      sfx.play('combo', c / 5);
    }
  }

  private showBanner(id: BannerId, value?: number): void {
    this.banner = { key: this.nextId++, id, startedAt: performance.now(), totalMs: bannerTotalMs(id), value };
  }

  /** Parámetros de la línea de efecto del banner (multiplicador y segundos). */
  effectParams(id: BannerId): Record<string, string | number> {
    const mult = id === 'hackathon' ? HACKATHON_MULT : id === 'prodfail' ? PRODFAIL_MULT : id === 'dempsey' ? DEMPSEY_MULT : id === 'cafe' ? CAFE_MULT : 1;
    const ms = id === 'dempsey' ? DEMPSEY_MS : id === 'cafe' ? CAFE_DURATION_MS : (EVENT_DEFS[id as EventId]?.durationMs ?? 0);
    return { m: mult, s: Math.round(ms / 1000) };
  }

  private addFx(kind: Fx['kind'], text: string): void {
    const id = this.nextId++;
    const x = kind === 'interview' ? 50 : 30 + Math.random() * 40;
    this.fx = [...this.fx.slice(-4), { id, kind, text, x }];
    setTimeout(() => (this.fx = this.fx.filter((f) => f.id !== id)), kind === 'interview' ? 1500 : 1100);
  }

  buy(id: ShopId): void {
    if (engineBuy(this.s, id)) {
      sfx.play(id === 'cafe' ? 'powerup' : isPremium(id) ? 'coin' : 'buy');
      if (id === 'cafe') this.showBanner('cafe');
      if (id === 'portafolio') this.blinkProjects();
      const proj = PROJECTS.find((p) => p.id === id);
      if (proj) this.holoEmit('install', 'cyan', 'npm', [`npm install ${proj.slug}`]);
      this.drain();
    }
  }

  sendCVs(n: number | 'max'): void {
    const sent = engineSendCVs(this.s, n, this.rng);
    if (sent > 0) {
      sfx.play('cvSent');
      this.holoEmit('cv', 'cyan', 'http', [this.t('holo.cv')]);
    }
  }

  startFinal(): void {
    this.finalNotice = null;
    if (engineStartFinal(this.s, this.rng)) sfx.play('uiTap');
    this.drain();
  }

  dismissFinalNotice(): void {
    this.finalNotice = null;
  }

  // ---------- tutorial ----------

  private ownedTotal(): number {
    return Object.values(this.s.owned).reduce((a, b) => a + b, 0);
  }
  private rebaseTutorial(): void {
    this.tutBase = { clicks: this.s.clicks, owned: this.ownedTotal(), cvs: this.s.cvsSent };
  }
  get tutorialActive(): boolean {
    return this.s.tutorialStep < TUTORIAL_STEPS && !this.s.finished;
  }
  get tutorialTarget(): TutorialTarget | null {
    return this.tutorialActive ? TUTORIAL_TARGETS[this.s.tutorialStep] : null;
  }
  /** Avanza solo cuando se hizo la acción del paso actual. */
  private advanceTutorial(): void {
    const s = this.s;
    if (s.tutorialStep >= TUTORIAL_STEPS) return;
    const done =
      s.tutorialStep === 0
        ? s.clicks - this.tutBase.clicks >= TUTORIAL_CLICKS
        : s.tutorialStep === 1
          ? this.ownedTotal() - this.tutBase.owned >= 1
          : s.cvsSent - this.tutBase.cvs >= 1;
    if (done) this.nextTutorial();
  }
  nextTutorial(): void {
    if (this.s.tutorialStep >= TUTORIAL_STEPS) return;
    this.s.tutorialStep += 1;
    this.rebaseTutorial();
    this.save();
  }
  skipTutorial(): void {
    this.s.tutorialStep = TUTORIAL_STEPS;
    this.save();
  }
  /** Botón «?»: vuelve a mostrar el tutorial desde el principio. */
  replayTutorial(): void {
    this.s.tutorialStep = 0;
    this.rebaseTutorial();
    this.save();
  }

  acceptRecruiter(): void {
    if (acceptRecruiter(this.s)) {
      sfx.play('interview');
      this.addFeed('interview', this.t('event.recruiter.ok'));
      this.drain();
    }
  }

  /** Renunciar: primero la animación del precipicio y luego se reinicia la partida. */
  prestige(): void {
    if (this.cliff || !canPrestige(this.s)) return;
    this.cliff = true;
    this.cliffStart = performance.now();
    sfx.play('fail');
    setTimeout(() => {
      if (enginePrestige(this.s)) {
        track('juego-prestigio');
        this.feed = [];
        this.banner = null;
        sfx.play('achievement');
        this.happyUntil = performance.now() + HAPPY_MS;
        this.save();
        this.drain();
      }
      this.cliff = false;
    }, this.reduced ? CLIFF_REDUCED_MS : CLIFF_MS);
  }

  /** Click sobre el barril del evento «Barril explosivo»: 10 CVs gratis. */
  popBarril(): void {
    if (popBarril(this.s, this.rng) > 0) {
      sfx.play('coin');
      this.drain();
    }
  }

  // ---------- HUD holografico ----------

  /** Activa o apaga el HUD y recuerda la preferencia. */
  setHolo(on: boolean): void {
    this.holoOn = on;
    if (!on) {
      this.holoWins = [];
      this.holoSpawn.wins = [];
    }
    try {
      localStorage.setItem(HOLO_STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      /* sin almacenamiento */
    }
  }

  /** Pide una ventana emergente; respeta cooldowns, tope y zonas libres (ver holo.ts). */
  private holoEmit(kind: HoloKind, tone: HoloTone, title: string, lines: string[]): void {
    if (!this.holoOn || this.cliff || typeof window === 'undefined') return;
    const now = performance.now();
    const plan = planSpawn(this.holoSpawn, kind, now, this.holoMax);
    if (!plan.ok) return;
    if (plan.evictId !== undefined) this.holoDrop(plan.evictId);
    const face = (LAYOUT as { face?: Rect }).face ?? FACE_FALLBACK;
    const kb: Rect = { x: LAYOUT.keyboard.x, y: LAYOUT.keyboard.y, w: KEYBOARD.w, h: KEYBOARD.h };
    const slot = pickSlot(HOLO_SLOTS, forbiddenZones(face, kb), this.holoWins.map((w) => w.slot), Math.random);
    if (!slot) return;
    const id = this.nextId++;
    this.holoWins = [...this.holoWins, { id, kind, tone, title, lines, slot }];
    this.holoSpawn.wins.push({ id, kind, born: now });
    this.holoSpawn.lastByKind[kind] = now;
    this.holoSpawn.lastAny = now;
    setTimeout(() => this.holoDrop(id), HOLO_LIFE_MS);
  }

  private holoDrop(id: number): void {
    this.holoWins = this.holoWins.filter((w) => w.id !== id);
    this.holoSpawn.wins = this.holoSpawn.wins.filter((w) => w.id !== id);
  }

  private celebrate(): void {
    this.happyUntil = performance.now() + HAPPY_MS;
  }

  reset(): void {
    clearStorage();
    Object.assign(this.s, createState());
    this.feed = [];
    this.toasts = [];
    this.banner = null;
    this.finalNotice = null;
    this.rebaseTutorial();
    this.save();
  }

  exportCode(): string {
    return exportSave(this.s);
  }

  importCode(code: string): boolean {
    const r = importSave(code);
    if (!r) {
      this.pushToast(this.t('toast.importFail'), 'info');
      return false;
    }
    Object.assign(this.s, r.state);
    this.s.outbox = [];
    this.finalNotice = null;
    this.rebaseTutorial();
    this.feed = [];
    this.save();
    this.pushToast(this.t('toast.imported'), 'info');
    return true;
  }

  /** «Seguir jugando»: cierra el fin de partida y sigue en modo libre. */
  continuePlaying(): void {
    if (continueEndless(this.s)) {
      sfx.play('uiTap');
      this.rebaseTutorial();
      this.save();
    }
  }

  /** Datos de la tarjeta de resultado (pixel art) para compartir. */
  cardData(): CardData {
    const s = this.s;
    const t = this.t;
    const stats = [
      { label: t('end.stat.time'), value: formatTime(s.elapsedMs) },
      { label: t('end.stat.cvs'), value: formatNumber(s.cvsSent) },
      { label: t('end.stat.rejections'), value: formatNumber(s.rejections) },
      { label: t('end.stat.ghostings'), value: formatNumber(s.ghostings) },
      { label: t('end.stat.seniority'), value: t(`seniority.${seniorityOf(s)}`) },
      s.offers > 1
        ? { label: t('end.stat.offers'), value: String(s.offers) }
        : { label: t('end.stat.interviews'), value: formatNumber(s.interviewsTotal) },
    ];
    const quips = this.quips();
    return {
      title: t('title'),
      kicker: t('card.kicker'),
      stats,
      quip: pickQuip(quips, s.cvsSent + s.rejections + s.ghostings),
      url: displayUrl(this.siteUrl()),
      level: Math.min(s.prestige, SENIORITY.length - 1),
    };
  }

  private quips(): string[] {
    return [0, 1, 2].map((i) => pick(this.lang, 'card.quips', i));
  }

  /** Comparte la tarjeta (Web Share con imagen o descarga + texto) y avisa con un toast. */
  async shareResultCard(): Promise<void> {
    const out = await shareCard(this.cardData(), this.shareText(), cardFileName(this.lang), this.t('title'));
    if (out === 'shared' || out === 'downloaded') track('juego-compartir');
    const key = out === 'shared' ? 'end.shareDone' : out === 'downloaded' ? 'end.shareDownloaded' : out === 'textOnly' ? 'end.shareTextOnly' : out === 'failed' ? 'end.shareFail' : '';
    if (key) this.pushToast(this.t(key), 'info');
  }

  async copyResultText(): Promise<void> {
    const ok = await copyShareText(this.shareText());
    this.pushToast(this.t(ok ? 'toast.copied' : 'end.shareFail'), 'info');
  }

  /** El fin de partida está pendiente de confirmar: Scene/EndScreen pueden usarlo para el estado «feliz» y el modal. */
  get showEnd(): boolean {
    return this.s.finished && !this.cliff;
  }

  shareText(): string {
    const s = this.s;
    const secs = Math.round(s.elapsedMs / 1000);
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    return this.t('end.shareText', { time, cvs: s.cvsSent, rej: s.rejections, gho: s.ghostings, url: this.siteUrl() });
  }

  // ---------- salida del motor -> UI ----------

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  private pushToast(text: string, kind: Toast['kind'], href?: string, linkText?: string): void {
    const id = this.nextId++;
    this.toasts = [...this.toasts.slice(-(MAX_TOASTS - 1)), { id, text, kind, href, linkText }];
    setTimeout(() => this.dismissToast(id), kind === 'unlock' ? 9000 : 5000);
  }

  private addFeed(kind: FeedItem['kind'], text: string): void {
    this.feed = [{ id: this.nextId++, kind, text }, ...this.feed].slice(0, MAX_FEED);
  }

  private blinkProjects(): void {
    const el = document.getElementById('projects');
    if (!el) return;
    el.style.setProperty('--game-tag', JSON.stringify(this.lang === 'es' ? '(este mismo)' : '(this one)'));
    el.classList.add('game-blink');
    setTimeout(() => el.classList.remove('game-blink'), 12_000);
  }

  private drain(): void {
    const out = this.s.outbox.splice(0);
    if (!out.length) return;
    const sounds = new Set<SfxName>();
    let interviews = 0;
    let rejects = 0;
    for (const m of out) this.handle(m, sounds, () => interviews++, () => rejects++);
    if (interviews > 0) this.addFx('interview', interviews === 1 ? this.t('fx.interview.one') : this.t('fx.interview.many', { n: interviews }));
    if (rejects > 0 || sounds.has('ghost')) {
      const now = performance.now();
      if (now >= this.shockCooldownUntil) {
        this.shockUntil = now + SHOCK_MS;
        this.shockCooldownUntil = now + SHOCK_MS + SHOCK_COOLDOWN_MS;
      }
    }
    if (rejects > 0) this.addFx('reject', this.t('fx.reject', { n: rejects }));
    // Un solo sonido por tipo por frame (evita ráfagas al resolver muchos CVs)
    if (sounds.has('success')) sounds.delete('interview');
    sounds.forEach((n) => sfx.play(n));
  }

  private handle(m: OutMsg, sounds: Set<SfxName>, onInterview: () => void, onReject: () => void): void {
    const t = this.t;
    switch (m.t) {
      case 'cv':
        if (m.joseph) {
          this.addFeed('reject', t('feed.joseph'));
          this.holoEmit('reject', 'red', 'ERROR 418', [t('holo.reject')]);
          onReject();
          sounds.add('reject');
        } else if (m.result === 'interview') {
          onInterview();
          this.addFeed('interview', pick(this.lang, 'feed.interview', m.msg));
          this.holoEmit('interview', 'green', 'calendar', [t('holo.interview')]);
          sounds.add('interview');
        } else if (m.result === 'reject') {
          this.addFeed('reject', pick(this.lang, 'feed.reject', m.msg));
          this.holoEmit('reject', 'red', 'ERROR 418', [t('holo.reject')]);
          onReject();
          sounds.add('reject');
        } else {
          this.addFeed('ghost', pick(this.lang, 'feed.ghost', m.msg));
          sounds.add('ghost');
        }
        break;
      case 'unlock': {
        const def = PROJECTS.find((p) => p.id === m.id)!;
        const name = t(`item.${m.id}.name`);
        this.pushToast(t('toast.unlock', { name }), 'unlock', localePath(this.lang, `proyectos/${def.slug}`), t('toast.unlock.link'));
        this.celebrate();
        break;
      }
      case 'achv':
        this.pushToast(t('toast.achievement', { name: t(`ach.${m.id}.name`) }), 'achv');
        this.holoEmit('achv', 'gold', t('holo.achv'), [t(`ach.${m.id}.name`)]);
        sounds.add('achievement');
        this.celebrate();
        break;
      case 'event': {
        const id: EventId = m.id;
        let desc = t(`event.${id}.desc`, { n: formatNumber(m.value ?? 0) });
        if (id === 'cafederramado') desc = t(m.value ? 'event.cafederramado.descHit' : 'event.cafederramado.descJoke');
        this.addFeed('event', `${t(`event.${id}.title`)} ${desc}`);
        // el recruiter y el barril tienen su propio aviso con botón (Toasts.svelte)
        if (id !== 'recruiter' && id !== 'barril') this.pushToast(t(`event.${id}.title`), 'info');
        this.showBanner(id, m.value);
        // sin ventana holo para eventos: el banner (grande y luego pastilla) ya los muestra y duplicaba el aviso
        sounds.add(id === 'hackathon' ? 'powerup' : bannerTone(id) === 'bad' ? 'powerdown' : 'event');
        break;
      }
      case 'eventEnd':
        if (m.id === 'recruiter') this.addFeed('info', t('event.recruiter.missed'));
        else if (m.id === 'barril') this.addFeed('info', t('event.barril.missed'));
        break;
      case 'dempsey':
        this.addFeed('event', t('dempsey.start'));
        this.pushToast(t('dempsey.start'), 'info');
        this.showBanner('dempsey');
        sounds.add('powerup');
        break;
      case 'dempseyEnd':
        this.addFeed('info', t('dempsey.end'));
        break;
      case 'barrilPop':
        this.addFeed('interview', t('event.barril.ok'));
        this.pushToast(t('event.barril.ok'), 'info');
        this.celebrate();
        break;
      case 'finalStage':
        sounds.add('uiTap');
        break;
      case 'finalResult':
        if (m.success && m.extra) {
          sounds.add('success');
          this.addFeed('interview', t('feed.offerExtra'));
          this.pushToast(t('toast.offerExtra', { n: this.s.offers }), 'achv');
          this.celebrate();
        } else if (m.success) {
          track('juego-oferta');
          sounds.add('success');
          this.celebrate();
          // el logro de speedrun se evalúa tras terminar
          checkAchievements(this.s);
        } else {
          sounds.add('fail');
          this.addFeed('info', t('final.failed'));
          this.finalNotice = { attempt: m.attempt };
        }
        this.save();
        break;
      case 'cafeEnd':
        this.pushToast(t('toast.cafeEnd'), 'info');
        break;
    }
  }

  // ---------- derivados útiles para la UI ----------

  get perSecProduction(): number {
    return productionPerSec(this.s);
  }
  get clickGain(): number {
    return clickValue(this.s);
  }

  // ---------- objetos interactivos de la escena (cosmeticos, sin efecto en el juego) ----------

  /** fin del sorbo de cafe (performance.now) y fin de la animacion del anillo del asistente */
  sipUntil = $state(0);
  assistantUntil = $state(0);
  /** lampara encendida (se recuerda en localStorage) */
  lampOn = $state(true);
  /** ultima respuesta del asistente, para lectores de pantalla */
  assistantLine = $state('');
  private lastAssistant = -1;

  /** Lee la preferencia de la lampara; la escena lo llama al montarse. */
  loadLamp(): void {
    try {
      this.lampOn = localStorage.getItem('busca-pega-lamp') !== 'off';
    } catch {
      /* sin almacenamiento: queda encendida */
    }
  }

  /** Click en la taza: el personaje toma un sorbito (~1.2 s). */
  sip(): void {
    if (this.cliff) return;
    const now = performance.now();
    if (now < this.sipUntil) return;
    this.sipUntil = now + SIP_MS;
    sfx.play('sip');
  }

  /** Click en la lampara: enciende o apaga. */
  toggleLamp(): void {
    this.lampOn = !this.lampOn;
    sfx.play('switch');
    try {
      localStorage.setItem('busca-pega-lamp', this.lampOn ? 'on' : 'off');
    } catch {
      /* sin almacenamiento */
    }
  }

  /** Click en el parlante (asistente): chime, anillo cian y una respuesta graciosa en una ventana holo. */
  assistantSay(): void {
    if (this.cliff) return;
    const now = performance.now();
    this.assistantUntil = now + ASSISTANT_ANIM_MS;
    sfx.play('chime');
    let n = Math.floor(Math.random() * ASSISTANT_LINES);
    if (n === this.lastAssistant) n = (n + 1) % ASSISTANT_LINES;
    this.lastAssistant = n;
    const line = pick(this.lang, 'assistant.say', n);
    this.assistantLine = line;
    if (!this.holoOn) {
      this.pushToast(`${this.t('holo.assistant')}: ${line}`, 'info');
      return;
    }
    // la ventana del asistente desplaza a las que tapen su zona y respeta el tope de ventanas
    for (const w of this.holoWins.filter((w) => rectsOverlap(w.slot, ASSISTANT_SLOT))) this.holoDrop(w.id);
    while (this.holoWins.length >= this.holoMax && this.holoWins.length > 0) this.holoDrop(this.holoWins[0].id);
    const id = this.nextId++;
    this.holoWins = [...this.holoWins, { id, kind: 'assistant', tone: 'cyan', title: this.t('holo.assistant'), lines: [line], slot: ASSISTANT_SLOT, lifeMs: ASSISTANT_LIFE_MS }];
    this.holoSpawn.wins.push({ id, kind: 'assistant', born: now });
    this.holoSpawn.lastAny = now;
    setTimeout(() => this.holoDrop(id), ASSISTANT_LIFE_MS);
  }
}

/** Duracion del sorbo de cafe y de la animacion del anillo del asistente (ms). */
export const SIP_MS = 1200;
export const ASSISTANT_ANIM_MS = 1700;
/** Cantidad de respuestas del asistente en el i18n (assistant.say). */
const ASSISTANT_LINES = 10;
