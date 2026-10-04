import type { EventId, PremiumId, ProjectId, UpgradeId } from './balance';

export type Rng = () => number;

export interface PendingCV {
  /** ms restantes para resolverse */
  left: number;
  /** viene de un referido: entrevista segura */
  direct: boolean;
}

export type OutMsg =
  | { t: 'cv'; result: 'interview' | 'reject' | 'ghost'; msg: number; direct?: boolean; joseph?: boolean }
  | { t: 'unlock'; id: ProjectId }
  | { t: 'achv'; id: string }
  | { t: 'event'; id: EventId; value?: number }
  | { t: 'eventEnd'; id: EventId }
  | { t: 'finalStage'; stage: number }
  | { t: 'finalResult'; success: boolean; attempt: number; extra?: boolean }
  | { t: 'cafeEnd' }
  | { t: 'dempsey' }
  | { t: 'dempseyEnd' }
  | { t: 'barrilPop'; n: number };

export interface ActiveEvent {
  id: EventId;
  left: number;
}

export interface FinalRun {
  /** ms transcurridos en el proceso */
  elapsed: number;
  success: boolean;
  stage: number;
}

export interface GameState {
  version: number;
  elapsedMs: number;
  commits: number;
  totalCommits: number;
  clicks: number;
  /** clicks de toda la vida (no se reinicia al renunciar): controla la flecha del click */
  clicksTotal: number;
  /** paso actual del tutorial (0..TUTORIAL_STEPS-1); TUTORIAL_STEPS = terminado u omitido */
  tutorialStep: number;
  owned: Record<ProjectId, number>;
  /** proyectos ya visibles en la tienda */
  revealed: ProjectId[];
  /** proyectos comprados al menos una vez (ya lanzaron toast) */
  unlockedProjects: ProjectId[];
  upgrades: Record<UpgradeId | PremiumId, boolean>;
  copilotLevel: number;
  cafeUses: number;
  cafeUsesTotal: number;
  cafeActive: number;
  cafeCooldown: number;
  cvsSent: number;
  pending: PendingCV[];
  rejections: number;
  ghostings: number;
  interviews: number;
  interviewsTotal: number;
  finalFails: number;
  final: FinalRun | null;
  /** la oferta se consiguió y el modal de fin está pendiente (bloquea el juego hasta «Seguir jugando») */
  finished: boolean;
  /** modo libre: se siguió jugando tras la primera oferta (finished vuelve a false) */
  endless: boolean;
  /** ofertas conseguidas en esta carrera (la primera cuenta; las siguientes son extra) */
  offers: number;
  activeEvent: ActiveEvent | null;
  eventTimer: number;
  prestige: number;
  achievements: string[];
  autoAcc: number;
  /** Easter egg joseph: el próximo CV resuelto será un rechazo con el texto predicho */
  josephPending: boolean;
  /** Dempsey Roll: ms restantes del click x2 */
  dempseyLeft: number;
  dempseyCount: number;
  /** Se cerró/ocultó la pestaña durante la prueba técnica del proceso final («Nigerundayo!») */
  nigerundayo: boolean;
  /** timestamps (ms) de los clicks recientes; efímero, no se guarda */
  clickLog: number[];
  /** mensajes para la UI; no se guarda */
  outbox: OutMsg[];
}
