/**
 * Efectos de sonido 8-bit sintetizados en tiempo de ejecución con Web Audio
 * (osciladores cuadrados/triangulares/ruido con envolventes). Sin archivos de
 * audio, así que no hay licencias que atribuir.
 *
 * - El AudioContext se crea con el primer gesto del usuario; antes de eso no suena nada.
 * - El silencio global se guarda en localStorage ("sfx:muted").
 * - Hay un pub/sub mínimo para que la UI refleje el estado de silencio.
 */

export type SfxName =
  | 'uiTap'
  | 'click'
  | 'buy'
  | 'coin'
  | 'cvSent'
  | 'reject'
  | 'ghost'
  | 'interview'
  | 'achievement'
  | 'event'
  | 'success'
  | 'fail'
  | 'powerup'
  | 'powerdown'
  | 'combo'
  | 'milestone'
  | 'sip'
  | 'switch'
  | 'chime';

const MASTER_VOLUME = 0.25;
const MUTE_KEY = 'sfx:muted';

/** Separación mínima entre repeticiones del mismo sonido (ms). */
const MIN_GAP: Partial<Record<SfxName, number>> = { click: 50, uiTap: 40, coin: 60, cvSent: 40, reject: 50, ghost: 60, combo: 70, powerup: 120, powerdown: 120, milestone: 200, sip: 600, switch: 120, chime: 400 };
const DEFAULT_GAP = 30;

type Wave = 'square' | 'triangle' | 'sawtooth' | 'sine';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = readMuted();
const listeners = new Set<(muted: boolean) => void>();
const lastPlayed: Partial<Record<SfxName, number>> = {};

function readMuted(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    /* almacenamiento no disponible */
  }
  listeners.forEach((fn) => fn(muted));
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

/** Suscribe un callback al estado de silencio. Devuelve la función para cancelar. */
export function subscribe(fn: (muted: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Crea o reanuda el AudioContext. Solo debe llamarse desde un gesto del usuario. */
export function unlock(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!ctx) {
      const AC: typeof AudioContext | undefined = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

if (typeof window !== 'undefined') {
  const gesture = () => unlock();
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(ev, gesture, { capture: true, passive: true });
  }
}

interface NoteOpts {
  type?: Wave;
  vol?: number;
  /** frecuencia final (deslizamiento exponencial) */
  to?: number;
  /** retardo desde ahora (s) */
  at?: number;
}

function note(freq: number, dur: number, o: NoteOpts = {}): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + (o.at ?? 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = o.type ?? 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
  const vol = o.vol ?? 0.5;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur: number, o: { vol?: number; at?: number; hp?: number; lp?: number } = {}): void {
  if (!ctx || !master) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime + (o.at ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(o.vol ?? 0.4, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node: AudioNode = src;
  if (o.hp) {
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = o.hp;
    node.connect(f);
    node = f;
  }
  if (o.lp) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.lp;
    node.connect(f);
    node = f;
  }
  node.connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

// Notas (Hz)
const C4 = 261.63, E4 = 329.63, G4 = 392, A4 = 440;
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5;

/** `level` solo lo usan los sonidos que cambian de tono (combo). */
const SOUNDS: Record<SfxName, (level: number) => void> = {
  uiTap: () => {
    note(880, 0.04, { vol: 0.35, to: 620 });
  },
  click: () => {
    const p = 0.85 + Math.random() * 0.3;
    noise(0.03, { vol: 0.5, hp: 2500 });
    note(190 * p, 0.045, { type: 'square', vol: 0.3, to: 110 * p });
  },
  buy: () => {
    note(E5, 0.07, { vol: 0.4 });
    note(G5 * 1.26, 0.12, { vol: 0.4, at: 0.07 });
  },
  coin: () => {
    note(988, 0.06, { vol: 0.35 });
    note(E6, 0.22, { vol: 0.35, at: 0.06 });
  },
  cvSent: () => {
    note(300, 0.14, { type: 'triangle', vol: 0.5, to: 900 });
    noise(0.1, { vol: 0.15, hp: 3000, at: 0.02 });
  },
  reject: () => {
    note(300, 0.22, { type: 'square', vol: 0.3, to: 120 });
    note(150, 0.18, { type: 'sawtooth', vol: 0.18, at: 0.08, to: 90 });
  },
  ghost: () => {
    note(740, 0.12, { type: 'triangle', vol: 0.3, to: 600 });
    note(520, 0.14, { type: 'triangle', vol: 0.22, at: 0.1, to: 420 });
    note(330, 0.3, { type: 'triangle', vol: 0.14, at: 0.22, to: 180 });
  },
  interview: () => {
    note(C5, 0.08, { vol: 0.35 });
    note(E5, 0.08, { vol: 0.35, at: 0.07 });
    note(G5, 0.16, { vol: 0.35, at: 0.14 });
  },
  achievement: () => {
    note(C5, 0.09, { type: 'square', vol: 0.3 });
    note(E5, 0.09, { type: 'square', vol: 0.3, at: 0.08 });
    note(G5, 0.09, { type: 'square', vol: 0.3, at: 0.16 });
    note(C6, 0.3, { type: 'triangle', vol: 0.5, at: 0.24 });
    note(E6, 0.3, { type: 'square', vol: 0.12, at: 0.28 });
  },
  event: () => {
    note(660, 0.09, { vol: 0.3 });
    note(440, 0.09, { vol: 0.3, at: 0.1 });
    note(660, 0.09, { vol: 0.3, at: 0.22 });
    note(440, 0.14, { vol: 0.3, at: 0.32 });
  },
  success: () => {
    const m: [number, number, number][] = [
      [C5, 0, 0.1],
      [C5, 0.12, 0.1],
      [C5, 0.24, 0.1],
      [E5, 0.36, 0.2],
      [G5, 0.58, 0.14],
      [E5, 0.74, 0.1],
      [G5, 0.86, 0.1],
      [C6, 0.98, 0.5],
    ];
    for (const [f, at, d] of m) {
      note(f, d, { type: 'square', vol: 0.3, at });
      note(f / 2, d, { type: 'triangle', vol: 0.4, at });
    }
  },
  fail: () => {
    note(G4, 0.18, { type: 'square', vol: 0.3, at: 0 });
    note(392 * 0.944, 0.18, { type: 'square', vol: 0.3, at: 0.2 });
    note(A4 * 0.75, 0.18, { type: 'square', vol: 0.3, at: 0.4 });
    note(E4, 0.5, { type: 'triangle', vol: 0.5, at: 0.6, to: C4 });
  },
  // Multiplicador o evento positivo: arpegio ascendente con destello agudo
  powerup: () => {
    const seq = [C5, E5, G5, C6, E6];
    seq.forEach((f, i) => note(f, 0.08, { type: 'square', vol: 0.28, at: i * 0.055 }));
    note(C6, 0.35, { type: 'triangle', vol: 0.4, at: 0.3, to: C6 * 1.5 });
    noise(0.12, { vol: 0.1, hp: 5000, at: 0.28 });
  },
  // Evento negativo: arpegio descendente grave
  powerdown: () => {
    const seq = [G5, E5, C5, G4, C4];
    seq.forEach((f, i) => note(f, 0.1, { type: 'sawtooth', vol: 0.2, at: i * 0.07, to: f * 0.9 }));
    note(C4 / 2, 0.35, { type: 'triangle', vol: 0.4, at: 0.34, to: 70 });
  },
  // Blip de combo: el tono sube con el nivel (5, 10, 15...)
  combo: (level) => {
    const f = 520 * Math.pow(1.0595, Math.min(24, Math.max(0, level)));
    note(f, 0.05, { type: 'square', vol: 0.25 });
    note(f * 1.5, 0.07, { type: 'triangle', vol: 0.3, at: 0.04 });
  },
  // Fanfarria corta para los hitos del combo
  milestone: () => {
    const m: [number, number, number][] = [
      [C5, 0, 0.07],
      [G5, 0.07, 0.07],
      [C6, 0.14, 0.07],
      [G5, 0.21, 0.07],
      [C6, 0.28, 0.07],
      [E6, 0.35, 0.3],
    ];
    for (const [f, at, d] of m) {
      note(f, d, { type: 'square', vol: 0.25, at });
      note(f / 2, d, { type: 'triangle', vol: 0.3, at });
    }
  },
  // Sorbito de cafe: slurp de ruido filtrado con barrido ascendente y un "ahh" suave
  sip: () => {
    if (!ctx || !master) return;
    const t0 = ctx.currentTime;
    if (!noiseBuf) noise(0.001, { vol: 0.0001 }); // crea el buffer de ruido
    if (noiseBuf) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 4;
      bp.frequency.setValueAtTime(500, t0);
      bp.frequency.exponentialRampToValueAtTime(2600, t0 + 0.32);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.55, t0 + 0.06);
      g.gain.linearRampToValueAtTime(0.35, t0 + 0.22);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.36);
      src.connect(bp).connect(g).connect(master);
      src.start(t0);
      src.stop(t0 + 0.4);
    }
    note(330, 0.3, { type: 'triangle', vol: 0.16, at: 0.42, to: 250 });
    note(222, 0.3, { type: 'sine', vol: 0.12, at: 0.42, to: 170 });
  },
  // Interruptor de lampara: dos clicks secos
  switch: () => {
    noise(0.015, { vol: 0.5, hp: 3500 });
    note(1500, 0.02, { type: 'square', vol: 0.2, to: 900 });
    noise(0.03, { vol: 0.35, hp: 1800, at: 0.045 });
    note(520, 0.04, { type: 'square', vol: 0.16, at: 0.045, to: 260 });
  },
  // Chime del asistente: dos notas limpias con brillo
  chime: () => {
    note(E5, 0.12, { type: 'sine', vol: 0.4 });
    note(E5 * 2, 0.1, { type: 'sine', vol: 0.1 });
    note(A4 * 1.5 * 1.26, 0.28, { type: 'sine', vol: 0.4, at: 0.11 });
    note(C6 * 1.5, 0.3, { type: 'sine', vol: 0.1, at: 0.11 });
  },
};

/** Reproduce un sonido (si hay gesto previo, no está silenciado y no se repite demasiado rápido). */
export function play(name: SfxName, level = 0): void {
  if (muted || !ctx || ctx.state !== 'running') return;
  const now = performance.now();
  const gap = MIN_GAP[name] ?? DEFAULT_GAP;
  if (now - (lastPlayed[name] ?? -Infinity) < gap) return;
  lastPlayed[name] = now;
  try {
    SOUNDS[name](level);
  } catch {
    /* sin audio */
  }
}

export const sfx = { play, unlock, isMuted, setMuted, toggleMuted, subscribe };
