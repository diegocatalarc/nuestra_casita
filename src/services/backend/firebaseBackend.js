// Backend REAL: Firebase Auth (Google) + Firestore (estado persistente) + Realtime Database (presencia).
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, onSnapshot, writeBatch, getDoc, getDocFromServer, updateDoc, arrayUnion, arrayRemove, deleteField, increment, query, orderBy, limitToLast,
} from 'firebase/firestore';
import { getDatabase, ref, onValue, update, onDisconnect, serverTimestamp as rtdbTs } from 'firebase/database';
import { initialCouple, genCode, COLLECTIONS, clean } from '../../game/initialState';
import { setServerOffset, serverNow } from '../../game/time';
import { t } from '../../i18n';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

let app, auth, fs, rtdb, rtdbConnected = false;
function init() {
  if (app) return;
  app = initializeApp(cfg);
  auth = getAuth(app);
  // Caché persistente multi-pestaña: se puede jugar sin red y se sincroniza al volver.
  fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  rtdb = getDatabase(app);
  onValue(ref(rtdb, '.info/serverTimeOffset'), (s) => setServerOffset(s.val() || 0));
  onValue(ref(rtdb, '.info/connected'), (s) => { rtdbConnected = !!s.val(); });
}

let presRef = null;
const presUnsubs = [];

const backend = {
  mode: 'cloud',

  auth: {
    onChange(cb) {
      init();
      return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, name: u.displayName || t("Amor"), photo: u.photoURL } : null));
    },
    async signIn() { init(); await signInWithPopup(auth, new GoogleAuthProvider()); },
    async signOut() { await fbSignOut(auth); },
  },

  couple: {
    async find(uid) {
      init();
      const s = await getDoc(doc(fs, 'users', uid));
      return s.exists() ? s.data().coupleId : null;
    },
    async create(user) {
      init();
      const coupleId = doc(collection(fs, 'couples')).id;
      for (let attempt = 0; attempt < 4; attempt++) {
        const code = genCode();
        try {
          const b = writeBatch(fs);
          b.set(doc(fs, 'couples', coupleId), clean(initialCouple(user.uid, user.name, code)));
          b.set(doc(fs, 'invites', code), { coupleId, owner: user.uid });
          b.set(doc(fs, 'users', user.uid), { coupleId });
          await b.commit();
          return { coupleId, code };
        } catch (e) {
          if (attempt === 3) throw e; // posible colisión de código: reintenta con otro
        }
      }
    },
    async join(user, code) {
      init();
      const inv = await getDoc(doc(fs, 'invites', code.trim().toUpperCase()));
      if (!inv.exists()) throw new Error(t("Código no encontrado"));
      const { coupleId } = inv.data();
      try {
        await updateDoc(doc(fs, 'couples', coupleId), { members: arrayUnion(user.uid), [`players.${user.uid}`]: { name: user.name } });
      } catch (e) {
        throw new Error(t("No se pudo entrar: la casita ya tiene dos habitantes o el código no es válido."));
      }
      const b = writeBatch(fs);
      b.set(doc(fs, 'users', user.uid), { coupleId });
      await b.commit();
      return coupleId;
    },
  },

  /** Sale de una casita (se quita de los miembros). Se usa al cambiar a la casita de la pareja. */
  async leaveHouse(user, coupleId) {
    init();
    await updateDoc(doc(fs, 'couples', coupleId), { members: arrayRemove(user.uid), [`players.${user.uid}`]: deleteField() });
  },

  /** Suscripción incremental: la raíz completa y cambios (docChanges) por colección. */
  subscribe(coupleId, h) {
    init();
    const unsubs = [onSnapshot(doc(fs, 'couples', coupleId), (s) => s.exists() && h.onCouple(s.data()))];
    for (const col of COLLECTIONS) {
      const src = collection(fs, 'couples', coupleId, col);
      // el chat solo carga los últimos mensajes (el histórico no se descarga entero)
      unsubs.push(onSnapshot(col === 'chat' ? query(src, orderBy('at'), limitToLast(150)) : src, (snap) => {
        h.onChanges(col, snap.docChanges().map((c) => ({ type: c.type, id: c.doc.id, data: c.doc.data() })));
      }));
    }
    return () => unsubs.forEach((u) => u());
  },

  /** Lote atómico. ops: set | del (subcolecciones) · inc | patch (documento raíz). */
  async write(coupleId, ops) {
    const b = writeBatch(fs);
    const root = {};
    const sums = {};
    for (const op of ops) {
      if (op.op === 'set') b.set(doc(fs, 'couples', coupleId, op.col, op.id), clean(op.data), { merge: true });
      else if (op.op === 'del') b.delete(doc(fs, 'couples', coupleId, op.col, op.id));
      else if (op.op === 'inc') sums[op.field] = (sums[op.field] || 0) + op.by;
      else if (op.op === 'patch') Object.assign(root, clean(op.data));
    }
    for (const [k, v] of Object.entries(sums)) root[k] = increment(v);
    if (Object.keys(root).length) b.update(doc(fs, 'couples', coupleId), root);
    await b.commit();
  },

  /** Prueba de conexión: escritura y lectura en el servidor + estado de Realtime Database. */
  async diagnose(coupleId) {
    init();
    const out = { rtdb: rtdbConnected };
    const r = doc(fs, 'couples', coupleId, 'nodes', '__ping');
    try {
      const t0 = performance.now();
      const b = writeBatch(fs);
      b.set(r, { until: 0, ping: Date.now() });
      await b.commit();
      out.writeMs = Math.round(performance.now() - t0);
      const t1 = performance.now();
      await getDocFromServer(r);
      out.readMs = Math.round(performance.now() - t1);
      const d = writeBatch(fs); d.delete(r); await d.commit();
      out.firestore = 'ok';
    } catch (e) { out.firestore = e.code || e.message; out.error = e; }
    return out;
  },

  presence: {
    connect(coupleId, uid) {
      init();
      presRef = ref(rtdb, `presence/${coupleId}/${uid}`);
      presUnsubs.push(onValue(ref(rtdb, '.info/connected'), (s) => {
        if (!s.val()) return;
        onDisconnect(presRef).update({ online: false, lastSeen: rtdbTs() });
        update(presRef, { online: true, t: serverNow() });
      }));
    },
    publish(data) {
      if (presRef) update(presRef, { ...data, online: true, t: serverNow() }).catch(() => {});
    },
    subscribe(cb) {
      const m = presRef.key;
      const u = onValue(ref(rtdb, `presence/${presRef.parent.key}`), (s) => {
        const all = s.val() || {};
        for (const uid of Object.keys(all)) if (uid !== m) cb(uid, all[uid]);
      });
      presUnsubs.push(u);
      return u;
    },
    disconnect() {
      presUnsubs.splice(0).forEach((u) => u());
      if (presRef) update(presRef, { online: false, lastSeen: Date.now() }).catch(() => {});
      presRef = null;
    },
  },
};

export default backend;
