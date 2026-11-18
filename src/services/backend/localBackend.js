// Backend DEMO: misma interfaz que firebaseBackend, con localStorage + BroadcastChannel.
// Dos pestañas del navegador = dos jugadores (cada pestaña tiene su uid en sessionStorage).
import { initialCouple, genCode, COLLECTIONS, clean } from '../../game/initialState';
import { t } from '../../i18n';

const KEY = 'nuestra-casita:demo:v1';
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('nuestra-casita') : null;
const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));

const getUid = () => {
  let u = sessionStorage.getItem('nc_uid');
  if (!u) { u = 'demo_' + Math.random().toString(36).slice(2, 8); sessionStorage.setItem('nc_uid', u); }
  return u;
};

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
let db = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn('No se pudo guardar la demo', e); } };

const getDot = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setDot = (o, p, v) => {
  const ks = p.split('.');
  let t = o;
  for (let i = 0; i < ks.length - 1; i++) { if (t[ks[i]] == null) t[ks[i]] = {}; t = t[ks[i]]; }
  t[ks[ks.length - 1]] = v;
};
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const deepMerge = (a, b) => {
  for (const k of Object.keys(b)) a[k] = isObj(a[k]) && isObj(b[k]) ? deepMerge(a[k], b[k]) : b[k];
  return a;
};

const handlers = new Set();

function applyOps(ops) {
  const changes = {};
  let coupleChanged = false;
  for (const op of ops) {
    if (op.op === 'set') {
      const col = (db[op.col] ||= {});
      const existed = !!col[op.id];
      col[op.id] = deepMerge(col[op.id] || {}, clone(clean(op.data)));
      (changes[op.col] ||= []).push({ type: existed ? 'modified' : 'added', id: op.id, data: clone(col[op.id]) });
    } else if (op.op === 'del') {
      if (db[op.col]?.[op.id]) {
        delete db[op.col][op.id];
        (changes[op.col] ||= []).push({ type: 'removed', id: op.id, data: {} });
      }
    } else if (op.op === 'inc') {
      setDot(db.couple, op.field, (getDot(db.couple, op.field) || 0) + op.by);
      coupleChanged = true;
    } else if (op.op === 'patch') {
      for (const [k, v] of Object.entries(clean(op.data))) setDot(db.couple, k, clone(v));
      coupleChanged = true;
    }
  }
  for (const h of handlers) {
    if (coupleChanged) h.onCouple(clone(db.couple));
    for (const [col, ch] of Object.entries(changes)) h.onChanges(col, ch);
  }
}

// ---- Presencia ----
const presCbs = new Set();
let meP = null;
let lastPres = null;
const emitPres = (uid, data) => presCbs.forEach((cb) => cb(uid, data));

if (bc) {
  bc.onmessage = (ev) => {
    const m = ev.data;
    if (m.t === 'ops' && db) applyOps(m.ops);
    else if (m.t === 'pres' && meP && m.uid !== meP.uid) emitPres(m.uid, m.data);
    else if (m.t === 'hello' && meP && lastPres) bc.postMessage({ t: 'pres', uid: meP.uid, data: lastPres });
  };
}

const backend = {
  mode: 'demo',

  auth: {
    onChange(cb) {
      const raw = sessionStorage.getItem('nc_user');
      setTimeout(() => cb(raw ? JSON.parse(raw) : null), 0);
      return () => {};
    },
    async signIn({ name } = {}) {
      const user = { uid: getUid(), name: (name || t("Jugador")).trim().slice(0, 20) || t("Jugador"), photo: null };
      sessionStorage.setItem('nc_user', JSON.stringify(user));
      return user;
    },
    async signOut() { sessionStorage.removeItem('nc_user'); },
  },

  couple: {
    async find(uid) {
      db = load();
      return db?.couple?.members?.includes(uid) ? 'demo' : null;
    },
    async create(user) {
      const code = genCode();
      db = { couple: initialCouple(user.uid, user.name, code) };
      COLLECTIONS.forEach((c) => (db[c] = {}));
      save();
      return { coupleId: 'demo', code };
    },
    async join(user, code) {
      db = load();
      if (!db?.couple) throw new Error(t("No hay ninguna casita demo en ESTE navegador. El modo demo no se comparte entre dispositivos: para jugar con tu pareja, entrad los dos con Google."));
      if (db.couple.inviteCode !== code.trim().toUpperCase()) throw new Error(t("Código no encontrado"));
      if (db.couple.members.length >= 2 && !db.couple.members.includes(user.uid)) throw new Error(t("La casita ya tiene dos habitantes"));
      if (!db.couple.members.includes(user.uid)) {
        const ops = [{ op: 'patch', data: { members: [...db.couple.members, user.uid], [`players.${user.uid}`]: { name: user.name } } }];
        applyOps(ops); save(); bc?.postMessage({ t: 'ops', ops });
      }
      return 'demo';
    },
  },

  subscribe(coupleId, h) {
    handlers.add(h);
    setTimeout(() => {
      h.onCouple(clone(db.couple));
      for (const c of COLLECTIONS) {
        h.onChanges(c, Object.entries(db[c] || {}).map(([id, data]) => ({ type: 'added', id, data: clone(data) })));
      }
    }, 0);
    return () => handlers.delete(h);
  },

  async write(coupleId, ops) {
    applyOps(ops);
    save();
    bc?.postMessage({ t: 'ops', ops });
  },

  presence: {
    connect(coupleId, uid) {
      meP = { coupleId, uid };
      window.addEventListener('beforeunload', () => bc?.postMessage({ t: 'pres', uid, data: { online: false, t: Date.now() } }));
      bc?.postMessage({ t: 'hello' });
    },
    publish(data) {
      if (!meP) return;
      lastPres = { ...data, online: true, t: Date.now() };
      bc?.postMessage({ t: 'pres', uid: meP.uid, data: lastPres });
    },
    subscribe(cb) { presCbs.add(cb); return () => presCbs.delete(cb); },
    disconnect() { if (meP) bc?.postMessage({ t: 'pres', uid: meP.uid, data: { online: false, t: Date.now() } }); meP = null; },
  },

  async leaveHouse() { /* la demo local solo tiene una casita */ },
  async diagnose() { return { rtdb: true, writeMs: 1, readMs: 1, firestore: 'ok' }; },

  reset() { localStorage.removeItem(KEY); db = null; },
};

export default backend;
