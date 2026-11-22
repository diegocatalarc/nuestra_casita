import { create } from 'zustand';
import { computeEnv, serverNow } from '../game/time';
import { t } from '../i18n';

const WORLD_COLS = ['crops', 'buildings', 'decor', 'animals', 'memories', 'nodes', 'questLog', 'children', 'mailbox', 'activity', 'chat', 'soil', 'gifts', 'crafts'];

const FX_CODE = { normal: '0', media: 'm', alta: '1' };
function initialTier() {
  try {
    const v = localStorage.getItem('nc_fx');
    if (v === '0') return 'normal';
    if (v === 'm') return 'media';
    if (v === '1') return 'alta';
    return window.matchMedia('(pointer: coarse)').matches ? 'normal' : 'alta';
  } catch { return 'alta'; }
}
/** Cambia la calidad gráfica y la recuerda en este dispositivo. `manual`: elegida por la persona (el regulador automático la respeta). */
export function setQualityTier(tier, { manual = false } = {}) {
  try { localStorage.setItem('nc_fx', FX_CODE[tier] || '1'); } catch { /* noop */ }
  useGame.setState({ qualityTier: tier, quality: tier !== 'normal', ...(manual ? { qualityManual: true } : {}) });
}

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
  qualityManual: false, // la persona la eligió en esta sesión: el regulador automático no la toca

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
    set({ tool, buildSel: null, decorSel: null, dragId: null, selId: null, moveMode: false, ...extra });
  },

  resetSession() {
    set({
      phase: 'login', user: null, coupleId: null, couple: null, inviteCode: null,
      crops: {}, buildings: {}, decor: {}, animals: {}, memories: {}, nodes: {}, questLog: {}, children: {}, mailbox: {}, activity: {}, chat: {}, soil: {}, gifts: {}, crafts: {}, loaded: {},
      world: null, panel: null, tool: 'interact', buildSel: null, decorSel: null, chatOpen: false, fishState: 'idle', boating: 0,
    });
  },
}));

export const partnerUid = (s) => s.couple?.members?.find((u) => u !== s.user?.uid) || null;
export const myPlayer = (s) => s.couple?.players?.[s.user?.uid] || null;
