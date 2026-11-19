import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { rareCrop } from '../game/logic';
import { CROPS, RESOURCES, SEASONS, WEATHER_EMOJI, WEATHER_LABEL, DECOR, BUILDINGS } from '../game/constants';
import { fmtHour, fmtDuration } from '../game/time';
import BuildPanel from './BuildPanel';
import DecorPanel from './DecorPanel';
import AnimalsPanel from './AnimalsPanel';
import QuestsPanel from './QuestsPanel';
import MemoriesPanel, { MemoryViewer } from './MemoriesPanel';
import AvatarPanel from './AvatarPanel';
import InventoryPanel from './InventoryPanel';
import FoodPanel from './FoodPanel';
import FamilyPanel from './FamilyPanel';
import MailboxPanel from './MailboxPanel';
import HelpPanel from './HelpPanel';
import ChatPanel from './ChatPanel';
import FishingPanel from './FishingPanel';
import OrdersPanel from './OrdersPanel';
import MarketPanel from './MarketPanel';
import EventsPanel from './EventsPanel';
import LandPanel from './LandPanel';
import DatesPanel from './DatesPanel';
import ExplorePanel from './ExplorePanel';
import MinePanel from './MinePanel';
import CraftPanel from './CraftPanel';
import MapPanel from './MapPanel';
import ChatFab from './ChatFab';
import TouchControls, { isTouchDevice } from './TouchControls';
import { jobList } from '../game/logic';
import { respondDate, dateCondition } from '../game/actions';
import { warmth } from '../game/logic';
import { DATES, ITEMS } from '../game/constants';
import Modal from './Modal';
import { me as meRt } from '../game/runtime';
import { eventsFor, meteorActive, dayUTC } from '../game/logic';
import NewsModal from './NewsModal';
import { isNewTab, markTab } from './news';
import Tutorial from './Tutorial';
import AwayModal from './AwayModal';
import { weeklyGoals, weekKey } from '../game/logic';
import { goalProgress } from '../game/actions';
import { hug, wave, goSleep, wake, reelIn, cancelFish, leaveBoat, rotateDecor, recolorDecor, startMoveDecor, deleteSelectedDecor } from '../game/actions';
import { vitals } from '../game/logic';
import { t } from '../i18n';

function Toast() {
  const t = useGame((s) => s.toastMsg);
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (!t) return;
    setShown(t);
    const id = setTimeout(() => setShown(null), 3800);
    return () => clearTimeout(id);
  }, [t]);
  return shown ? <div className="toast" key={shown.id}>{shown.text}</div> : null;
}

function PartnerChip() {
  const p = useGame((s) => s.partner);
  const members = useGame((s) => s.couple?.members?.length || 1);
  const code = useGame((s) => s.couple?.inviteCode);
  const now = useGame((s) => s.now);
  if (members < 2) return (
    <div className="chip-top col">
      <span><span className="dot off" /> {t("Esperando a tu pareja · código")} <b>{code}</b></span>
      <button className="link" onClick={() => useGame.getState().set({ panel: 'help' })}>{t("¿Tu pareja ya creó una casita? Únete con su código")}</button>
    </div>
  );
  return (
    <div className="chip-top">
      <span className={`dot ${p.online ? 'on' : 'off'}`} />
      <b>{p.name}</b> {p.online ? t("está en la casita") : p.lastSeen ? t("· visto hace {0}", [fmtDuration(now - p.lastSeen)]) : t("· desconectada/o")}
    </div>
  );
}

function ModeBar() {
  const couple = useGame((s) => s.couple);
  const tool = useGame((s) => s.tool);
  const seed = useGame((s) => s.seedSel);
  const season = useGame((s) => s.env.season);
  const buildSel = useGame((s) => s.buildSel);
  const decorSel = useGame((s) => s.decorSel);
  const dragId = useGame((s) => s.dragId);
  const selId = useGame((s) => s.selId);
  const moveMode = useGame((s) => s.moveMode);
  const selType = useGame((s) => s.decor[s.selId]?.type);
  const g = useGame.getState;
  if (tool === 'plant') {
    return (
      <div className="modebar">
        <b>{t("🌱 Semillas")}</b>
        {Object.entries(CROPS).filter(([id]) => rareCrop(couple, id)).map(([id, c]) => {
          const good = c.shade || c.seasons.includes(season);
          return (
            <button key={id} className={`seed ${seed === id ? 'on' : ''}`} onClick={() => g().set({ seedSel: id })} title={c.shade ? t("{0} min · suelo del bosque o Cobertizo de hongos", [c.growMin]) : t("{0} min · {1}", [c.growMin, good ? t("buena estación") : t("fuera de estación (×0.5)")])}>
              {c.emoji}<small>{c.growMin}′{good ? '' : ' ⚠'}</small>
            </button>
          );
        })}
        <button className={`seed ${seed === 'till' ? 'on' : ''}`} onClick={() => g().set({ seedSel: 'till' })} title={t("Convierte hierba y pradera en tierra de cultivo")}>⛏️<small>{t("Arar")}</small></button>
        <button className={`seed ${seed === 'untill' ? 'on' : ''}`} onClick={() => g().set({ seedSel: 'untill' })} title={t("Deshace la tierra arada")}>↩️<small>{t("Quitar")}</small></button>
        <small className="hint">{seed === 'till' ? t("Clic en hierba o pradera para arar") : seed === 'untill' ? t("Clic en tierra arada para quitarla") : CROPS[seed]?.shade ? t("Hongos: suelo del bosque o Cobertizo de hongos") : t("Clic en tierra labrada")} {t("· Esc para salir")}</small>
      </div>
    );
  }
  if (tool === 'fish') return <div className="modebar"><b>{t("🎣 Pesca")}</b><small className="hint">{t("Clic en el agua para lanzar · Espacio/clic para tirar cuando salga ❗ · Esc salir")}</small><button className="btn ghost" onClick={() => g().set({ panel: 'fishing' })}>{t("📖 Diario")}</button></div>;
  if (tool === 'build' && buildSel) return <div className="modebar"><b>{BUILDINGS[buildSel].emoji} {BUILDINGS[buildSel].label}</b><small className="hint">{t("Clic para construir · Esc cancela")}</small></div>;
  if (tool === 'decor') {
    const editing = !decorSel;
    const name = decorSel ? `${DECOR[decorSel].emoji} ${DECOR[decorSel].label}` : selType ? `${DECOR[selType].emoji} ${DECOR[selType].label}` : t("🛋️ Editar decoración");
    return (
      <div className="modebar decorbar">
        <b>{name}</b>
        {(decorSel || selId) && (
          <div className="dtools">
            <button className="btn ghost" onClick={() => rotateDecor(-1)} title={t("Rotar a la izquierda (Mayús+R)")}>↺</button>
            <button className="btn ghost" onClick={() => rotateDecor(1)} title={t("Rotar (R)")}>↻ {t("Rotar")}</button>
            <button className="btn ghost" onClick={recolorDecor} title={t("Cambiar color (C)")}>🎨</button>
            {editing && !moveMode && <button className="btn ghost" onClick={startMoveDecor}>✋ {t("Mover")}</button>}
            {editing && <button className="btn danger" onClick={deleteSelectedDecor} title={t("Eliminar (X)")}>🗑️ {t("Eliminar")}</button>}
          </div>
        )}
        <small className="hint">{decorSel ? t("Clic para colocar · Esc salir") : moveMode ? t("Toca el sitio nuevo para soltarlo") : selId ? t("Arrastra para moverlo · Esc salir") : t("Toca un objeto para seleccionarlo · arrástralo para moverlo")}</small>
      </div>
    );
  }
  return null;
}

function Vitals() {
  const me = useGame((s) => s.couple?.players?.[s.user.uid]);
  const now = useGame((s) => s.now);
  const v = vitals(me, now);
  const Bar = ({ icon, val, warn }) => (
    <div className={`vbar ${warn ? 'warn' : ''}`} title={`${Math.round(val)} %`}><span>{icon}</span><div><i style={{ width: `${val}%` }} /></div></div>
  );
  return <div className="vitals"><Bar icon="⚡" val={v.energy} warn={v.tired} /><Bar icon="🍽️" val={v.full} warn={v.hungry} /></div>;
}

function SleepOverlay() {
  const sleeping = useGame((s) => s.sleeping);
  const me = useGame((s) => s.couple?.players?.[s.user.uid]);
  const partner = useGame((s) => s.partner);
  const now = useGame((s) => s.now);
  if (!sleeping) return null;
  const v = vitals(me, now);
  return (
    <div className="sleep-overlay">
      <div className="moon">🌙</div>
      <div className="zs"><span>z</span><span>z</span><span>Z</span></div>
      <p>{t("Durmiendo… ⚡")} {Math.round(v.energy)} %</p>
      {partner.online && <p className="hint">{t("Si")} {partner.name} {t("también duerme, ganaréis corazones 💤")}</p>}
      <button className="btn primary big" onClick={wake}>{t("☀️ Despertar")}</button>
    </div>
  );
}

/** Botones contextuales: tirar de la caña y bajar del bote. */
function ActionBar() {
  const fs = useGame((s) => s.fishState);
  const boating = useGame((s) => s.boating);
  if (fs === 'idle' && !boating) return null;
  return (
    <div className="actionbar">
      {fs === 'bite' && <button className="btn primary big pulse" onClick={reelIn}>{t("❗ ¡Tira!")}</button>}
      {fs === 'wait' && <><span className="chip-top">{t("🎣 Esperando a que pique…")}</span><button className="btn ghost" onClick={() => cancelFish()}>{t("Recoger")}</button></>}
      {boating > 0 && fs === 'idle' && <button className="btn big" onClick={() => leaveBoat()}>{t("⚓ Bajar del bote")}</button>}
    </div>
  );
}

/** Aviso de lo que pasa hoy (festival, visitante, estrellas) */
function EventChip() {
  const seed = useGame((s) => s.couple?.seed);
  const now = useGame((s) => s.now);
  const env = useGame((s) => s.env);
  const wished = useGame((s) => !!s.couple?.events?.[dayUTC(s.now)]?.wish?.[s.user.uid]);
  const ev = eventsFor(seed, now, env.season);
  const night = meteorActive(ev, env.hour);
  const label = ev.festival ? `${ev.festival.emoji} ${t("¡Hoy hay festival!")}` : night && !wished ? t("🌠 ¡Lluvia de estrellas! Pide un deseo") : ev.visitor && env.hour >= 7 && env.hour < 21 ? `${ev.visitor.emoji} ${t("Visita en la plaza")}` : null;
  if (!label) return null;
  return <button className="chip-top goal-chip evt" onClick={() => useGame.getState().set({ panel: 'events' })}>{label}</button>;
}

/** Cita en marcha / invitación */
function DateChip() {
  const date = useGame((s) => s.couple?.date);
  const uid = useGame((s) => s.user.uid);
  useGame((s) => s.now);
  if (!date) return null;
  const k = DATES[date.kind];
  if (date.state === 'invited' && date.by !== uid) return (
    <div className="chip-top col evt"><span>{k.emoji} {t("Tu pareja te invita a: {0}", [k.label])}</span><div className="row"><button className="btn primary" onClick={() => respondDate(true)}>{t("💞 Aceptar")}</button><button className="btn ghost" onClick={() => respondDate(false)}>{t("Ahora no")}</button></div></div>
  );
  if (date.state === 'invited') return <button className="chip-top" onClick={() => useGame.getState().set({ panel: 'dates' })}>{k.emoji} {t("Esperando respuesta…")}</button>;
  const c = date.by === uid ? dateCondition(date) : { ok: true };
  return <button className="chip-top" onClick={() => useGame.getState().set({ panel: 'dates' })}>{k.emoji} {k.label} · {Math.round(date.progress || 0)}/{k.goal} s {date.by === uid && !c.ok ? `· ${c.why}` : ''}</button>;
}

/** Pista «frío / caliente» del regalo escondido más cercano */
function GiftChip() {
  const uid = useGame((s) => s.user.uid);
  const gifts = useGame((s) => s.gifts);
  useGame((s) => s.now);
  const list = Object.values(gifts).filter((g) => g.from !== uid && !g.foundBy);
  if (!list.length) return null;
  const near = list.reduce((a, g) => (Math.hypot(meRt.x - g.x, meRt.z - g.z) < Math.hypot(meRt.x - a.x, meRt.z - a.z) ? g : a));
  const w = warmth(Math.hypot(meRt.x - near.x, meRt.z - near.z));
  return <button className="chip-top" onClick={() => useGame.getState().set({ panel: 'dates' })}>🎁 {t("Regalo escondido")}: {w.icon} {w.text}</button>;
}

/** Aviso al encontrar un regalo, con la nota */
function GiftFoundModal() {
  const g = useGame((s) => s.giftFound);
  const players = useGame((s) => s.couple?.players) || {};
  if (!g) return null;
  const close = () => useGame.getState().set({ giftFound: null });
  return (
    <Modal title={t("🎁 ¡Has encontrado un regalo!")} onClose={close}>
      <p className="sub">{t("{0} lo escondió para ti:", [players[g.from]?.name || t("Tu pareja")])}</p>
      <div className="evcard"><b>{g.kind === 'coins' ? `🪙 ${g.n}` : `${ITEMS[g.item].emoji} ×${g.n}`} · +6 💗</b>{g.note && <p className="say">“{g.note}”</p>}</div>
      <button className="btn primary big" onClick={close}>{t("💗 Qué bonito")}</button>
    </Modal>
  );
}

/** Aviso de trabajos del taller terminados */
function CraftChip() {
  const crafts = useGame((s) => s.crafts);
  const now = useGame((s) => s.now);
  const uid = useGame((s) => s.user.uid);
  const ready = jobList(crafts).filter((j) => now >= j.end).length;
  const asks = Object.values(crafts).filter((j) => j.state === 'request' && j.by !== uid).length;
  if (!ready && !asks) return null;
  return <button className="chip-top" onClick={() => useGame.getState().set({ panel: 'craft', craftTab: 'bench' })}>🛠️ {ready ? t("{0} listo(s) para recoger", [ready]) : ''}{ready && asks ? ' · ' : ''}{asks ? t("🙏 {0} petición(es)", [asks]) : ''}</button>;
}

function GoalChip() {
  const s = useGame();
  const goals = weeklyGoals(s.now);
  const claimed = s.couple?.goalsClaimed?.[weekKey(s.now)] || {};
  const g = goals.find((x) => !claimed[x.id]) || goals[0];
  const p = Math.min(goalProgress(s, g), g.target);
  return <button className="chip-top goal-chip" onClick={() => s.set({ panel: 'quests' })}>🎯 {g.text} · <b>{p}/{g.target}</b></button>;
}

export default function HUD({ onSignOut, onSwitchHouse }) {
  const env = useGame((s) => s.env);
  const couple = useGame((s) => s.couple);
  const tool = useGame((s) => s.tool);
  const panel = useGame((s) => s.panel);
  const first = useGame((s) => !s.couple?.players?.[s.user.uid]?.avatar);
  const set = useGame.getState().set;
  const [hint, setHint] = useState(true);
  useEffect(() => { const id = setTimeout(() => setHint(false), 14000); return () => clearTimeout(id); }, []);
  const inv = couple?.inventory || {};
  const open = (p) => () => set({ panel: panel === p ? null : p });
  const hl = useGame((s) => s.tutorialHl);
  const chatOpen = useGame((s) => s.chatOpen);
  const unread = useGame((s) => Object.values(s.mailbox).filter((m) => m.to === s.user.uid && !m.readAt).length);
  const tb = (id, icon, label, on, active) => (
    <button key={id} className={`tb ${active ? 'on' : ''} ${hl === id ? 'hl' : ''}`} onClick={() => { if (isNewTab(id)) { markTab(id); } on(); }} title={label}><span>{icon}{isNewTab(id) ? <em className="badge new">🆕</em> : null}{id === 'mail' && unread > 0 ? <em className="badge">{unread}</em> : null}</span><small>{label}</small></button>
  );

  const [menu, setMenu] = useState(null);
  useEffect(() => { const k = (e) => { if (e.code === 'Escape') setMenu(null); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  const G = useGame.getState;
  // [id, icono, nombre, acción, activo, descripción corta]
  const GROUPS = [
    { id: 'home', icon: '🏡', short: t("Hogar"), label: t("🏡 Hogar"), items: [
      ['sleep', '😴', t("Dormir"), goSleep, false, t("Recupera energía en una cama")],
      ['food', '🍽️', t("Comer"), open('food'), panel === 'food', t("Cocina y come para no tener hambre")],
      ['inv', '🎒', t("Mochila"), open('inventory'), panel === 'inventory', t("Todo lo que lleváis")],
      ['craft', '🛠️', t("Taller"), () => G().set({ panel: panel === 'craft' ? null : 'craft', craftTab: 'bench' }), panel === 'craft', t("Fabrica muebles, ropa y mejoras")],
      ['animals', '🐾', t("Animales"), open('animals'), panel === 'animals', t("Cuida y recoge sus productos")],
      ['family', '👶', t("Familia"), open('family'), panel === 'family', t("Vuestros peques")],
      ['avatar', '👗', t("Vestidor"), open('avatar'), panel === 'avatar', t("Cambia tu aspecto")],
    ] },
    { id: 'love', icon: '💞', short: t("Pareja"), label: t("💞 Pareja"), items: [
      ['hug', '🤗', t("Abrazar"), hug, false, t("Si estáis cerca, +3 💗 (cada 30 min)")],
      ['wave', '👋', t("Saludar"), wave, false, t("Dile hola a tu pareja")],
      ['quests', '💌', t("Misiones"), open('quests'), panel === 'quests', t("Preguntas y retos del día")],
      ['mail', '📬', t("Buzón"), open('mailbox'), panel === 'mailbox', t("Cartas para vuestra pareja")],
      ['dates', '💞', t("Citas"), open('dates'), panel === 'dates', t("Planes para hacer juntos")],
      ['mem', '🖼️', t("Recuerdos"), open('memories'), panel === 'memories', t("Vuestra sala de fotos y notas")],
    ] },
    { id: 'world', icon: '🌍', short: t("Mundo"), label: t("🌍 Mundo"), items: [
      ['explore', '🧭', t("Explorar"), () => G().set({ panel: panel === 'explore' ? null : 'explore', exploreTab: null, neighborFocus: null }), panel === 'explore' || panel === 'map', t("Mapa, excavar, mina, vecinos y mascotas")],
      ['fish', '🎣', t("Pescar"), open('fishing'), tool === 'fish' || panel === 'fishing', t("Caña, bote y diario de peces")],
      ['land', '📐', t("Terreno"), open('land'), panel === 'land', t("Ampliar la parcela y arar")],
      ['events', '🎪', t("Eventos"), open('events'), panel === 'events', t("Festivales y visitantes")],
    ] },
    { id: 'trade', icon: '🏪', short: t("Comercio"), label: t("🏪 Comercio"), items: [
      ['orders', '📋', t("Pedidos"), open('orders'), panel === 'orders', t("Encargos de los vecinos")],
      ['market', '🏪', t("Mercado"), open('market'), panel === 'market', t("Vende cosecha y compra semillas")],
    ] },
  ];
  return (
    <div className="hud">
      <div className="top-left">
        <div className="pill-box">
          <span>{SEASONS[env.season].emoji} {SEASONS[env.season].label}</span>
          <span>{t("Día")} {env.day}</span>
          <span>🕒 {fmtHour(env.hour)}</span>
          <span>{WEATHER_EMOJI[env.weather]} {WEATHER_LABEL[env.weather]}</span>
        </div>
        <PartnerChip />
        <GoalChip />
        <EventChip />
        <DateChip />
        <GiftChip />
        <CraftChip />
      </div>

      <div className="top-right">
        <div className="hearts" title={t("Corazones: se ganan con casi todo y se gastan en decoración del corazón, animales y familia")}>💗 <b>{couple?.hearts ?? 0}</b><span className="coins" title={t("Monedas")}>🪙 <b>{couple?.coins ?? 0}</b></span></div>
        <Vitals />
        <div className="res">
          {Object.entries(RESOURCES).map(([k, r]) => <span key={k} title={r.label}>{r.emoji} {inv[k] || 0}</span>)}
        </div>
      </div>

      <ModeBar />
      <Toast />
      {hint && <div className="helper">{isTouchDevice() ? t("Toca el suelo para moverte · pellizca para el zoom · gira dos dedos para la cámara · toca árboles, rocas y cultivos para actuar") : t("WASD o clic para moverte · Q/E girar cámara · rueda: zoom · clic en árboles, rocas y cultivos para actuar")}</div>}

      {menu && <div className="menu-catch" onClick={() => setMenu(null)} />}
      {menu && (() => { const g = GROUPS.find((x) => x.id === menu); return (
        <div className="menu-pop">
          <div className="menu-title">{g.label}</div>
          <div className="menu-list">{g.items.map(([id, icon, label, on, active, desc]) => (
            <button key={id} className={`mrow ${active ? 'on' : ''} ${hl === id ? 'hl' : ''}`} onClick={() => { setMenu(null); if (isNewTab(id)) markTab(id); on(); }}>
              <span className="mi">{icon}{id === 'mail' && unread > 0 ? <em className="badge">{unread}</em> : isNewTab(id) ? <em className="badge new">🆕</em> : null}</span>
              <span className="mt"><b>{label}</b><small>{desc}</small></span>
            </button>
          ))}</div>
        </div>
      ); })()}
      <div className="toolbar">
        {tb('hand', '✋', t("Mano"), () => { setMenu(null); useGame.getState().setTool('interact', { panel: null }); }, tool === 'interact')}
        {tb('plant', '🌱', t("Plantar"), () => { setMenu(null); useGame.getState().setTool('plant', { panel: null }); }, tool === 'plant')}
        {tb('build', '🔨', t("Construir"), () => { setMenu(null); open('build')(); }, tool === 'build' || panel === 'build')}
        {tb('decor', '🛋️', t("Decorar"), () => { setMenu(null); open('decor')(); }, tool === 'decor' || panel === 'decor')}
        <span className="tb-sep" />
        {GROUPS.map((g) => {
          const ids = g.items.map((i) => i[0]);
          const badge = g.items.reduce((n, [id]) => n + (id === 'mail' ? unread : 0) + (isNewTab(id) ? 1 : 0), 0);
          const act = g.items.some((i) => i[4]);
          return (
            <button key={g.id} className={`tb group ${menu === g.id || act ? 'on' : ''} ${ids.includes(hl) ? 'hl' : ''}`} onClick={() => setMenu(menu === g.id ? null : g.id)} title={g.label}>
              <span>{g.icon}{badge > 0 ? <em className="badge">{badge}</em> : null}</span><small>{g.short}</small>
            </button>
          );
        })}
      </div>

      {panel === 'build' && <BuildPanel />}
      {panel === 'decor' && <DecorPanel />}
      {panel === 'animals' && <AnimalsPanel />}
      {panel === 'quests' && <QuestsPanel />}
      {panel === 'memories' && <MemoriesPanel />}
      {panel === 'inventory' && <InventoryPanel />}
      {panel === 'food' && <FoodPanel />}
      {panel === 'mailbox' && <MailboxPanel />}
      {panel === 'fishing' && <FishingPanel />}
      {panel === 'orders' && <OrdersPanel />}
      {panel === 'market' && <MarketPanel />}
      {panel === 'events' && <EventsPanel />}
      {panel === 'land' && <LandPanel />}
      {panel === 'dates' && <DatesPanel />}
      {panel === 'explore' && <ExplorePanel />}
      {panel === 'mine' && <MinePanel />}
      {panel === 'craft' && <CraftPanel />}
      {panel === 'map' && <MapPanel />}
      <GiftFoundModal />
      <NewsModal />
      {chatOpen && <ChatPanel />}
      <ChatFab />
      <TouchControls />
      <button className="signout gear" onClick={open('help')} title={t("Ajustes y ayuda")}>⚙️</button>
      <ActionBar />
      {panel === 'help' && <HelpPanel onSignOut={onSignOut} onSwitchHouse={onSwitchHouse} />}
      <Tutorial />
      <AwayModal />
      {panel === 'family' && <FamilyPanel />}
      <SleepOverlay />
      {(panel === 'avatar' || first) && <AvatarPanel first={first} />}
      <MemoryViewer />
    </div>
  );
}
