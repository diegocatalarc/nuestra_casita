import { create } from 'zustand';
import { computeEnv, serverNow } from '../game/time';
import { t } from '../i18n';

const WORLD_COLS = ['crops', 'buildings', 'decor', 'animals', 'memories', 'nodes', 'questLog', 'children', 'mailbox', 'activity', 'chat', 'soil', 'gifts', 'crafts'];

const FX_CODE = { normal: '0', media: 'm', alta: '1' };
const FX_TIER = { '0': 'normal', m: 'media', '1': 'alta' };
const AUTO_DAYS = 14;
const RANK = { normal: 0, media: 1, alta: 2 };
/** Preferencia guardada (nc_fx) y, si es reciente, la bajada automática (nc_fxauto = «código|fecha»); gana la más baja. */
function initialTier() {
  try {
    const base = FX_TIER[localStorage.getItem('nc_fx')] || (window.matchMedia('(pointer: coarse)').matches ? 'normal' : 'alta');
    const [code, at] = (localStorage.getItem('nc_fxauto') || '').split('|');
    const auto = FX_TIER[code];
    if (auto && Date.now() - (+at || 0) < AUTO_DAYS * 86400000 && RANK[auto] < RANK[base]) return auto;
    return base;
  } catch { return 'alta'; }
}
/**
 * Cambia la calidad gráfica. `manual`: elegida por la persona (se guarda en nc_fx y el regulador solo la baja si va injugable, y solo en
 * esa sesión: nc_fxm). `auto`: bajada del regulador (se guarda aparte, caduca a los 14 días para volver a probar).
 * Sin ninguno de los dos: solo en memoria (p. ej. error de shader).
 */
export function setQualityTier(tier, { manual = false, auto = false } = {}) {
  try {
    if (manual) { localStorage.setItem('nc_fx', FX_CODE[tier] || '1'); localStorage.setItem('nc_fxm', '1'); localStorage.removeItem('nc_fxauto'); }
    else if (auto) localStorage.setItem('nc_fxauto', `${FX_CODE[tier] || '0'}|${Date.now()}`);
  } catch { /* noop */ }
  useGame.setState({ qualityTier: tier, quality: tier !== 'normal', ...(manual ? { qualityManual: true } : {}) });
}
/** ¿La persona eligió la calidad a mano alguna vez en este dispositivo? */
export const qualityChosenByUser = () => { try { return localStorage.getItem('nc_fxm') === '1'; } catch { return false; } };

export const useGame = create((set, get) => ({
  // ---- sesión ----
  phase: 'boot', // boot | login | setup | game
  user: null,
  coupleId: null,
  mode: 'demo', // demo | cloud
  inviteCode: null,

  // ---- mundo sincronizado ----
  couple: null,
  crops: {}, buildings: {}, decor: {}, animals: {}, memories: {}, nodes: {}, questLog: {}, children: {}, mailbox: {}, activity: {}, chat: {}, soil: {}, gifts: {}, crafts: {},
  loaded: {}, // col → true tras el primer snapshot
  world: null, // generado de la semilla
  partner: { uid: null, name: t("Tu pareja"), online: false, lastSeen: 0 },
  env: computeEnv(serverNow(), serverNow(), 1),
  now: serverNow(),

  // ---- UI ----
  tool: 'interact', // interact | plant | build | decor
  seedSel: 'lettuce',
  buildSel: null,
  moveBuildId: null, // edificio que se está cambiando de sitio (tool 'build')
  decorSel: null, decorRot: 0, decorVariant: 0,
  dragId: null, selId: null, moveMode: false, dragStart: null,
  hover: null, // {x,z,tx,tz}
  panel: null, // build | decor | animals | quests | memories | avatar | inventory
  viewMemory: null,
  toastMsg: null,
  fx: [],
  sleeping: false,
  chatOpen: false,
  discoverFx: null,
  newsOpen: false, giftFound: null, exploreTab: null, neighborFocus: null, craftTab: 'bench', projectId: null,
  fishState: 'idle', // idle | wait | bite
  boating: 0, // 0 a pie · 1 remando · 2 pasajera/o
  away: null, // resumen "mientras no estabas"
  tutorialSkip: false,
  tutorialHl: null,
  // efectos: en táctil (iPad/móvil) empiezan apagados salvo que la persona los active con ✨
  // calidad gráfica: 'normal' (sin postproceso) · 'media' (contorno ligero, sin bloom) · 'alta' (todo). `quality` = tier !== 'normal'.
  qualityTier: initialTier(),
  quality: initialTier() !== 'normal',
  qualityManual: false, // la persona la eligió en esta sesión: el regulador solo baja si va injugable

  set: (patch) => set(patch),

  applyChanges(col, changes) {
    if (!WORLD_COLS.includes(col)) return;
    set((s) => {
      const next = { ...s[col] };
      for (const c of changes) {
        if (c.type === 'removed') delete next[c.id];
        else next[c.id] = { id: c.id, ...c.data };
      }
      return { [col]: next, loaded: { ...s.loaded, [col]: true } };
    });
  },

  toast(text) { set({ toastMsg: { text, id: Date.now() } }); },

  addFx(text, x, z) {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ fx: [...s.fx.slice(-12), { id, text, x, z }] }));
    setTimeout(() => set((s) => ({ fx: s.fx.filter((f) => f.id !== id) })), 1700);
  },

  setTool(tool, extra = {}) {
    set({ tool, buildSel: null, moveBuildId: null, decorSel: null, dragId: null, selId: null, moveMode: false, ...extra });
  },

  resetSession() {
    set({
      phase: 'login', user: null, coupleId: null, couple: null, inviteCode: null,
      crops: {}, buildings: {}, decor: {}, animals: {}, memories: {}, nodes: {}, questLog: {}, children: {}, mailbox: {}, activity: {}, chat: {}, soil: {}, gifts: {}, crafts: {}, loaded: {},
      world: null, panel: null, tool: 'interact', buildSel: null, moveBuildId: null, decorSel: null, chatOpen: false, fishState: 'idle', boating: 0,
    });
  },
}));

export const partnerUid = (s) => s.couple?.members?.find((u) => u !== s.user?.uid) || null;
export const myPlayer = (s) => s.couple?.players?.[s.user?.uid] || null;
