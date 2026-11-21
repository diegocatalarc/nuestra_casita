import { useUnlocked } from './useUnlocked';
import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { COLLECT, COLLECT_PAGES, FISH, DIG, NEIGHBORS, STORIES, FRIEND_LEVELS, NEIGHBOR_LINES, ITEMS, AVATAR_OPTS, PET_CONTEST } from '../game/constants';
import { dayUTC, albumProgress, digSpots, chestReady, friendPts, friendLevel } from '../game/logic';
import { hashStr } from '../game/rng';
import { claimAlbum, talkNeighbor, giftNeighbor, claimChapter, zoneOwned } from '../game/actions';
import Modal from './Modal';
import { t } from '../i18n';

const prizeName = (k) => { const [c, i] = k.split(':'); return AVATAR_OPTS[{ hat: 'hats', glasses: 'glasses', topStyle: 'topStyles' }[c]][+i]; };

function Album() {
  const couple = useGame((s) => s.couple);
  return (<>
    <p className="sub">{t("Cada pieza nueva da +2 💗. Al completar una página hay premio. Se encuentran excavando en la arena (✨), en el cofre de la isla, en la mina y gracias a las mascotas.")}</p>
    {COLLECT_PAGES.map((pg) => {
      const pr = albumProgress(couple, pg.id), claimed = couple.albumClaimed?.[pg.id];
      const list = pg.id === 'fish' ? Object.entries(FISH).map(([id, f]) => ({ id, emoji: f.emoji, label: f.label, n: couple.fishLog?.[id] || 0 })) : COLLECT[pg.id].map((c) => ({ ...c, n: couple.found?.[c.id] || 0 }));
      return (
        <div className="evcard" key={pg.id}>
          <div className="ev-head"><span className="npc">{pg.emoji}</span><div><b>{pg.label}</b><small>{pr.have}/{pr.total} · 🪙 {pg.reward.coins} · 💗 {pg.reward.hearts}</small></div></div>
          <div className="inv">
            {list.map((c) => (
              <div key={c.id} className={`inv-cell ${c.n ? '' : 'zero'}`}><span className="emoji">{c.n ? c.emoji : '❔'}</span><b>{c.n ? `×${c.n}` : '—'}</b><small>{c.n ? c.label : '???'}</small>{c.rare && <i className="tag rare">{t("raro")}</i>}</div>
            ))}
          </div>
          {claimed ? <div className="done-tag">{t("✅ Página completada")}</div> : <button className="btn primary" disabled={pr.have < pr.total} onClick={() => claimAlbum(pg.id)}>{t("🎁 Reclamar premio")}</button>}
        </div>
      );
    })}
  </>);
}

function Neighbors() {
  const couple = useGame((s) => s.couple);
  const now = useGame((s) => s.now);
  const focus = useGame((s) => s.neighborFocus);
  const inv = couple.inventory || {};
  const day = dayUTC(now);
  const [open, setOpen] = useState(focus || null);
  const [pick, setPick] = useState({});
  return (<>
    <p className="sub">{t("Los vecinos viven al otro lado del puente. Charlad y hacedles regalos para subir la amistad y descubrir su historia.")}</p>
    {NEIGHBORS.map((n) => {
      const pts = friendPts(couple, n.id), lvl = friendLevel(pts), next = FRIEND_LEVELS[lvl];
      const fr = couple.friends?.[n.id] || {}, done = fr.ch || 0;
      const line = NEIGHBOR_LINES[n.id][hashStr(n.id + day) % NEIGHBOR_LINES[n.id].length];
      const favs = [...n.likes, ...Object.keys(inv).filter((k) => !n.likes.includes(k))].filter((k) => (inv[k] || 0) > 0 && ITEMS[k] && !['wood', 'stone', 'clay', 'cloth'].includes(k)).slice(0, 14);
      const sel = pick[n.id] || favs[0];
      return (
        <div className="evcard" key={n.id}>
          <div className="ev-head"><span className="npc">{n.emoji}</span><div><b>{n.name} <small>{n.role}</small></b><small>{t("Amistad nivel {0}/5", [lvl])} · {pts}{next ? `/${next}` : ''} ♥</small></div></div>
          <div className="vbar wide"><div><i style={{ width: `${next ? Math.min(100, ((pts - FRIEND_LEVELS[lvl - 1]) / (next - FRIEND_LEVELS[lvl - 1])) * 100) : 100}%` }} /></div></div>
          <p className="say">{line}</p>
          <div className="row">
            <button className="btn primary" disabled={fr.talkDay === day} onClick={() => talkNeighbor(n.id)}>{fr.talkDay === day ? t("💬 Ya charlasteis hoy") : t("💬 Charlar")}</button>
            <button className="btn ghost" onClick={() => setOpen(open === n.id ? null : n.id)}>{t("🎁 Regalar / 📖 Historia")}</button>
          </div>
          {open === n.id && (<>
            {favs.length ? (<>
              <div className="pills">{favs.map((k) => <button key={k} className={`pill ${sel === k ? 'on' : ''}`} onClick={() => setPick({ ...pick, [n.id]: k })}>{ITEMS[k].emoji} {inv[k]}{n.likes.includes(k) ? ' ♥' : ''}</button>)}</div>
              <button className="btn ghost" disabled={fr.giftDay === day || !sel} onClick={() => giftNeighbor(n.id, sel)}>{fr.giftDay === day ? t("Hoy ya le regalasteis algo") : t("Regalar {0}", [ITEMS[sel]?.emoji || ''])}</button>
              <small className="hint">{t("♥ = le encanta (+6 de amistad); otros regalos dan +2. Uno por día.")}</small>
            </>) : <small className="hint">{t("No tenéis objetos para regalar.")}</small>}
            {lvl - 1 > done && <button className="btn primary" onClick={() => claimChapter(n.id)}>{t("📖 Nuevo capítulo disponible: {0}", [STORIES[n.id][done].title])}</button>}
            {STORIES[n.id].slice(0, done).map((c, i) => <div className="chapter" key={i}><b>{t("Capítulo {0}: {1}", [i + 1, c.title])}</b><p>{c.text}</p></div>)}
            {done < 4 && lvl - 1 <= done && <small className="hint">{t("Próximo capítulo con {0} ♥ de amistad. Recompensa final: {1}", [FRIEND_LEVELS[Math.min(4, done + 1)], prizeName(n.prize)])}</small>}
          </>)}
        </div>
      );
    })}
  </>);
}

function Diary() {
  const couple = useGame((s) => s.couple);
  const world = useGame((s) => s.world);
  const now = useGame((s) => s.now);
  const day = dayUTC(now);
  const spots = digSpots(world, couple.seed, day);
  const dug = Object.keys(couple.digs?.[day] || {}).length;
  const south = zoneOwned(couple, 'south');
  return (<>
    <div className="evcard"><div className="ev-head"><span className="npc">🧭</span><div><b>{t("Descubrimientos")}</b><small>{Object.keys(couple.discovered || {}).length} · <button className="link" onClick={() => useGame.getState().set({ panel: 'map' })}>{t("Abrir el mapa")}</button></small></div></div></div>
    <div className="evcard"><div className="ev-head"><span className="npc">✨</span><div><b>{t("Excavación de hoy")}</b><small>{t("{0} de {1} sitios", [dug, spots.length || DIG.perDay])}</small></div></div>
      <p>{t("Cada día aparecen destellos ✨ en la arena de la orilla. Pulsa uno para excavar: salen conchas, fósiles, monedas y, con suerte, piezas raras.")}</p></div>
    <div className="evcard"><div className="ev-head"><span className="npc">🏴‍☠️</span><div><b>{DIG.islandName}</b><small>{south ? (chestReady(couple, now) ? t("🟢 El cofre está lleno") : t("⚪ Vacío hasta el lunes")) : t("🔒 Necesitas el Valle del Sur")}</small></div></div>
      <p>{t("Sigue el río en bote hacia el sur: se abre en una bahía con islas. En la mayor hay un cofre que se rellena cada semana.")}</p></div>
    <div className="evcard"><div className="ev-head"><span className="npc">⛏️</span><div><b>{t("La mina")}</b><small>{t("Mejor piso: {0}", [couple.mineBest || 0])}</small></div></div>
      <p>{zoneOwned(couple, 'southeast') ? t("La entrada está en las Colinas del Sureste. Cada visita cuesta ⚡ energía y tiene golpes limitados.") : t("🔒 Necesitas las Colinas del Sureste para llegar a la mina.")}</p></div>
    <div className="evcard"><div className="ev-head"><span className="npc">🏆</span><div><b>{t("Concurso de mascotas")}</b><small>{t("Todos los domingos")}</small></div></div>
      <p>{t("Apunta a tu mascota desde 🐾 Animales. Cuanto más vínculo y felicidad, mejor. Premios: {0} 🪙 al primer puesto.", [PET_CONTEST.rewards[0].coins])}</p></div>
  </>);
}

export default function ExplorePanel() {
  const tab0 = useGame((s) => s.exploreTab);
  const [tab, setTab] = useState(tab0 || 'album');
  const unlocked = useUnlocked();
  return (
    <Modal title={t("🧭 Exploración y pueblo")} wide>
      <div className="tabs">
        {[['album', t("📚 Álbum")], ['neighbors', t("🏘️ Vecinos")], ['diary', t("🧭 Diario")]].filter(([id]) => id !== 'diary' || unlocked('explore_diary')).map(([id, l]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l}</button>)}
      </div>
      {tab === 'album' && <Album />}
      {tab === 'neighbors' && <Neighbors />}
      {tab === 'diary' && <Diary />}
    </Modal>
  );
}
