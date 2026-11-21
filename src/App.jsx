import { Component, useEffect, useRef, useState } from 'react';
import { useGame, partnerUid } from './store/gameStore';
import { loadBackend, getBackend, CLOUD_CONFIGURED } from './services/backend';
import { generateWorld, zoneKey } from './game/worldGen';
import { computeEnv, serverNow } from './game/time';
import { exploreTick, autoCollectCrafts, recipeInfo, datesTick, checkGifts, ensureHouse, dailyLogin, rainWater, checkStars, checkBirth, autoFeedAnimals, checkSleepTogether, vitalsNotices, tickStory } from './game/actions';
import { me, others, doAnim } from './game/runtime';
import { startAudio, updateAudio, toggleMute, isMuted, sfx } from './game/audio';
import { notify } from './game/notify';
import { eventsFor } from './game/logic';
import { explainError } from './game/errors';
import { touchSeen, computeAway } from './game/actions';
import { L } from './game/lighting';
import LoginScreen from './ui/LoginScreen';
import CoupleSetup from './ui/CoupleSetup';
import GameCanvas from './scene/GameCanvas';
import HUD from './ui/HUD';
import LoadingScreen from './ui/LoadingScreen';
import { t } from './i18n';

let unsubWorld = null;
let unsubAuth = null;

function enterGame(coupleId) {
  unsubWorld?.();
  useGame.setState({ coupleId, phase: 'loading' });
  unsubWorld = getBackend().subscribe(coupleId, {
    onCouple: (c) => {
      const s = useGame.getState();
      const patch = { couple: c };
      if (!s.world || s.world.seed !== c.seed || s.world.zk !== zoneKey(c.zones)) patch.world = generateWorld(c.seed, c.zones);
      if (s.phase !== 'game') patch.phase = 'game';
      useGame.setState(patch);
    },
    onChanges: (col, ch) => useGame.getState().applyChanges(col, ch),
  });
}

async function handleUser(user) {
  if (!user) { unsubWorld?.(); useGame.getState().resetSession(); return; }
  if (useGame.getState().coupleId) return;
  useGame.setState({ user });
  const cid = await getBackend().couple.find(user.uid);
  if (cid) enterGame(cid);
  else useGame.setState({ phase: 'setup' });
}

async function startAuth(mode) {
  await loadBackend(mode);
  useGame.setState({ mode });
  unsubAuth?.();
  unsubAuth = getBackend().auth.onChange(handleUser);
}

/** Pasa a la casita de la pareja con su código y sale de la actual. */
async function switchHouse(code) {
  const s = useGame.getState();
  const be = getBackend();
  const old = s.coupleId;
  const id = await be.couple.join(s.user, code);   // si falla, no se pierde nada
  if (id !== old) { try { await be.leaveHouse(s.user, old); } catch (e) { console.warn('No se pudo salir de la casita anterior', e); } }
  unsubWorld?.();
  useGame.setState({ crops: {}, buildings: {}, decor: {}, animals: {}, memories: {}, nodes: {}, questLog: {}, children: {}, mailbox: {}, activity: {}, chat: {}, soil: {}, gifts: {}, crafts: {}, loaded: {}, couple: null, world: null, panel: null, away: null, phase: 'loading', coupleId: id });
  enterGame(id);
}

async function signOut() {
  try { await getBackend().auth.signOut(); } catch { /* noop */ }
  localStorage.removeItem('nc_cloud');
  unsubWorld?.();
  useGame.getState().resetSession();
}

class Boundary extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { console.error('Error en el juego:', err); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="screen"><div className="card center">
        <div className="logo">🛠️</div><h2>{t("Algo no ha cargado bien")}</h2>
        <p className="sub">{String(this.state.err.message || this.state.err).slice(0, 200)}</p>
        <button className="btn primary big" onClick={() => location.reload()}>{t("Recargar")}</button>
      </div></div>
    );
  }
}

function Game() {
  const couple = useGame((s) => s.couple);
  const user = useGame((s) => s.user);
  const lastHug = couple?.lastHug;
  const prevHug = useRef(lastHug);
  const myEntry = couple?.players?.[user.uid];
  const [muted, setMuted] = useState(isMuted());

  // Reloj del mundo + estado de la pareja + tareas periódicas (1 vez por segundo)
  useEffect(() => {
    const tick = () => {
      const s = useGame.getState();
      const c = s.couple;
      const now = serverNow();
      const env = computeEnv(now, c?.startedAt, c?.seed);
      const pu = partnerUid(s);
      const p = pu && others[pu];
      if (p) p.online = !!p.flag && now - p.t < 20000;
      const partner = { uid: pu, name: c?.players?.[pu]?.name || t("Tu pareja"), online: !!p?.online, lastSeen: p?.lastSeen || p?.t || 0 };
      const old = s.partner;
      const changed = old.uid !== partner.uid || old.name !== partner.name || old.online !== partner.online || old.lastSeen !== partner.lastSeen;
      useGame.setState({ env, now, ...(changed ? { partner } : {}) });
      exploreTick(); autoCollectCrafts(); datesTick(); checkGifts(); rainWater(); checkStars(); ensureHouse(); checkBirth(); autoFeedAnimals(); checkSleepTogether(); vitalsNotices(); tickStory();
      updateAudio(L, me.x, me.z);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (myEntry) dailyLogin(); }, [!!myEntry]);

  // --- "Mientras no estabas": se calcula una vez, con todo cargado ---
  const loaded = useGame((s) => s.loaded);
  const prevSeen = useRef(couple?.players?.[user.uid]?.lastSeenAt);
  const awayDone = useRef(false);
  const ready = loaded.activity && loaded.crops && loaded.animals && loaded.mailbox && loaded.children;
  useEffect(() => {
    if (!ready || awayDone.current) return;
    awayDone.current = true;
    const prev = prevSeen.current;
    if (prev && serverNow() - prev > 10 * 60000) { const a = computeAway(prev); if (a) useGame.getState().set({ away: a }); }
    touchSeen();
  }, [ready]);
  // latido de "última vez visto"
  useEffect(() => {
    const id = setInterval(touchSeen, 3 * 60000);
    const onHide = () => { if (document.hidden) touchSeen(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', touchSeen);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', touchSeen); };
  }, []);

  // --- cartas nuevas: aviso, sonido y contador en la pestaña ---
  const mailbox = useGame((s) => s.mailbox);
  const known = useRef(null);
  useEffect(() => {
    if (!loaded.mailbox) return;
    const mine = Object.values(mailbox).filter((m) => m.to === user.uid);
    if (known.current === null) known.current = new Set(mine.map((m) => m.id));
    for (const m of mine) {
      if (known.current.has(m.id)) continue;
      known.current.add(m.id);
      if (!m.readAt) {
        useGame.getState().toast(t("📬 Tienes una carta nueva"));
        notify(t("📬 Carta nueva"), m.text?.slice(0, 80) || t("Tu pareja te ha escrito"));
        sfx('pop');
      }
    }
  }, [mailbox, loaded.mailbox]);

  // --- eventos del día: un aviso por día y persona ---
  useEffect(() => {
    if (!couple?.seed) return;
    const ev = eventsFor(couple.seed, serverNow(), useGame.getState().env.season);
    let seen = null; try { seen = localStorage.getItem('nc_evday'); } catch { /* noop */ }
    if (seen === ev.day || (!ev.festival && !ev.visitor && !ev.meteor)) return;
    try { localStorage.setItem('nc_evday', ev.day); } catch { /* noop */ }
    const msg = ev.festival ? t("🎪 ¡Hoy es el {0}! Abre 🎪 Eventos para jugar.", [ev.festival.name]) : ev.visitor ? t("{0} {1} ha llegado a la plaza con un regalo.", [ev.visitor.emoji, ev.visitor.name]) : t("🌠 Esta noche hay lluvia de estrellas. ¡Pedid un deseo!");
    setTimeout(() => { useGame.getState().toast(msg); notify(t("🎪 Hoy en la casita"), msg); }, 2500);
  }, [!!couple?.seed]);

  // --- citas: invitación de tu pareja ---
  const dateKeyNow = couple?.date ? `${couple.date.by}${couple.date.at}${couple.date.state}` : '';
  useEffect(() => {
    const d = couple?.date;
    if (d && d.by !== user.uid && d.state === 'invited') { useGame.getState().toast(t("💞 {0} te invita a una cita", [useGame.getState().partner.name])); sfx('love'); notify(t("💞 Invitación a una cita"), t("Tu pareja quiere pasar un rato contigo")); }
  }, [dateKeyNow]);

  // --- regalos: tu pareja encontró el que escondiste ---
  const gifts = useGame((s) => s.gifts);
  const knownGifts = useRef(null);
  useEffect(() => {
    if (!loaded.gifts) return;
    const found = new Set(Object.values(gifts).filter((g) => g.from === user.uid && g.foundBy).map((g) => g.id));
    if (knownGifts.current === null) { knownGifts.current = found; return; }
    for (const id of found) if (!knownGifts.current.has(id)) { knownGifts.current.add(id); useGame.getState().toast(t("🎁 ¡{0} ha encontrado tu regalo!", [useGame.getState().partner.name])); sfx('love'); notify(t("🎁 Regalo encontrado"), t("Tu pareja ha encontrado tu regalo escondido")); }
  }, [gifts, loaded.gifts]);

  // --- taller: avisa cuando termina un trabajo tuyo ---
  const notifiedJobs = useRef(new Set());
  useEffect(() => {
    const id = setInterval(() => {
      const g = useGame.getState(), n = serverNow();
      for (const j of Object.values(g.crafts)) {
        if (j.state !== 'work' || j.by !== g.user.uid || n < j.end || notifiedJobs.current.has(j.id)) continue;
        notifiedJobs.current.add(j.id);
        const info = recipeInfo(j.recipe);
        g.toast(t("🛠️ ¡{0} {1} está listo! Recógelo en el Taller", [info.emoji, info.label])); sfx('pop'); notify(t("🛠️ Trabajo terminado"), info.label);
      }
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // --- chat: avisos de mensajes nuevos y contador en la pestaña ---
  const chat = useGame((s) => s.chat);
  const chatSeen = useGame((s) => s.couple?.players?.[s.user.uid]?.chatSeen || 0);
  const chatOpen = useGame((s) => s.chatOpen);
  const knownChat = useRef(null);
  useEffect(() => {
    if (!loaded.chat) return;
    const theirs = Object.values(chat).filter((m) => m.from !== user.uid);
    if (knownChat.current === null) knownChat.current = new Set(theirs.map((m) => m.id));
    for (const m of theirs) {
      if (knownChat.current.has(m.id)) continue;
      knownChat.current.add(m.id);
      if (serverNow() - m.at > 60000) continue;
      sfx('pop');
      if (!chatOpen || document.hidden) {
        const who = useGame.getState().partner.name;
        if (!chatOpen) useGame.getState().toast(`💬 ${who}: ${m.text.slice(0, 60)}`);
        notify(t("💬 {0}", [who]), m.text.slice(0, 80));
      }
    }
  }, [chat, loaded.chat]);
  useEffect(() => {
    const letters = Object.values(mailbox).filter((m) => m.to === user.uid && !m.readAt).length;
    const msgs = Object.values(chat).filter((m) => m.from !== user.uid && m.at > chatSeen).length;
    const n = letters + msgs;
    document.title = n ? t("({0}) Nuestra Casita", [n]) : t("Nuestra Casita");
  }, [mailbox, chat, chatSeen]);

  // --- tu pareja llega ---
  const pOnline = useGame((s) => s.partner.online);
  const pName = useGame((s) => s.partner.name);
  const wasOnline = useRef(null);
  useEffect(() => {
    if (wasOnline.current === false && pOnline) { useGame.getState().toast(t("💗 {0} está en la casita", [pName])); notify(t("💗 Tu pareja está en línea"), `${pName} acaba de entrar a la casita`); }
    wasOnline.current = pOnline;
  }, [pOnline]);

  // Propuesta de bebé de la pareja
  const plan = couple?.family?.plan;
  useEffect(() => {
    if (plan && plan.by !== user.uid) { useGame.getState().toast(t("💌 Tu pareja quiere que tengáis un bebé. Abre Familia para responder.")); notify(t("💌 Propuesta"), t("Tu pareja quiere que tengáis un bebé")); }
  }, [plan?.at]);

  // Abrazo: ambas personas reaccionan cuando cambia couple.lastHug
  useEffect(() => {
    if (lastHug && lastHug !== prevHug.current && serverNow() - lastHug < 10000) {
      doAnim('love', 2200);
      const g = useGame.getState();
      g.addFx('💗', me.x, me.z); setTimeout(() => g.addFx('💞', me.x, me.z), 500);
    }
    prevHug.current = lastHug;
  }, [lastHug]);

  return (
    <div className="game">
      <GameCanvas />
      <HUD onSignOut={signOut} onSwitchHouse={switchHouse} />
      <LoadingScreen />
      <button className="signout" onClick={signOut} title={t("Salir")}>⏏</button>
      <button className="signout sound" onClick={() => setMuted(toggleMute())} title={muted ? t("Activar sonido") : t("Silenciar")}>{muted ? '🔇' : '🔊'}</button>
    </div>
  );
}

export default function App() {
  const phase = useGame((s) => s.phase);
  const user = useGame((s) => s.user);
  const code = useGame((s) => s.inviteCode);
  const coupleId = useGame((s) => s.coupleId);
  const [error, setError] = useState('');

  useEffect(() => { document.title = t('Nuestra Casita'); }, []);

  useEffect(() => {
    const unlock = () => startAudio();
    window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);

  useEffect(() => {
    (async () => {
      if (sessionStorage.getItem('nc_user')) await startAuth('demo');
      else if (CLOUD_CONFIGURED && localStorage.getItem('nc_cloud') === '1') await startAuth('cloud');
      else useGame.setState({ phase: 'login' });
    })();
  }, []);

  const onGoogle = async () => {
    try {
      localStorage.setItem('nc_cloud', '1');
      await startAuth('cloud');
      await getBackend().auth.signIn();
    } catch (e) { setError(explainError(e)); }
  };
  const onDemo = async (name) => {
    await loadBackend('demo');
    useGame.setState({ mode: 'demo' });
    const u = await getBackend().auth.signIn({ name });
    handleUser(u);
  };
  const onReset = async () => { await loadBackend('demo'); getBackend().reset(); setError(t("Partida demo borrada")); };

  if (phase === 'boot' || phase === 'loading') return <div className="screen"><div className="card center"><div className="logo bob">🏡</div><p>{t("Preparando vuestra casita…")}</p></div></div>;
  if (phase === 'login') return <LoginScreen onGoogle={onGoogle} onDemo={onDemo} onReset={onReset} error={error} />;
  if (phase === 'setup') {
    return (
      <CoupleSetup
        user={user} code={code}
        onCreate={async () => { const r = await getBackend().couple.create(user); useGame.setState({ coupleId: r.coupleId, inviteCode: r.code }); }}
        onJoin={async (c) => { const id = await getBackend().couple.join(user, c); enterGame(id); }}
        onContinue={() => enterGame(coupleId)}
        onSignOut={signOut}
      />
    );
  }
  return <Boundary><Game /></Boundary>;
}

