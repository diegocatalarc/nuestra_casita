import { useEffect, useRef } from 'react';
import { useGame } from '../store/gameStore';
import { MAP, TILE, EXPLORE, ZONES } from '../game/constants';
import { idx } from '../game/worldGen';
import { me, others } from '../game/runtime';
import { allDiscoveries, claimExplorer, EXPLORER_REWARDS } from '../game/actions';
import Modal from './Modal';
import { t } from '../i18n';

const COL = { [TILE.GRASS]: '#a8d58a', [TILE.MEADOW]: '#b4dc8a', [TILE.FOREST]: '#5f9a5a', [TILE.WATER]: '#6cc3d8', [TILE.SAND]: '#ecd9aa', [TILE.SOIL]: '#7d533a', [TILE.PATH]: '#dcc99f', [TILE.BRIDGE]: '#b98254', [TILE.VOID]: '#d8dfe6' };
const PX = 6;

/** Mapa del mundo: lo descubierto en color, lo demás cubierto de niebla. */
export default function MapPanel() {
  const world = useGame((s) => s.world);
  const couple = useGame((s) => s.couple);
  const buildings = useGame((s) => s.buildings);
  const now = useGame((s) => s.now);
  const cv = useRef();
  const found = couple.discovered || {};
  const list = allDiscoveries();
  const n = Object.keys(found).length;

  useEffect(() => {
    const c = cv.current; if (!c || !world) return;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    for (let z = 0; z < MAP; z++) for (let x = 0; x < MAP; x++) { g.fillStyle = COL[world.tiles[idx(x, z)]] || '#ccc'; g.fillRect(x * PX, z * PX, PX, PX); }
    for (const b of Object.values(buildings)) { g.fillStyle = '#c9643c'; g.fillRect(b.x * PX, b.z * PX, b.w * PX, b.d * PX); }
    // descubrimientos
    g.font = '15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const d of list) { g.fillText(found[d.id] ? d.emoji : '❔', d.x * PX, d.z * PX); }
    // tú y tu pareja
    const dot = (x, z, col) => { g.beginPath(); g.arc(x * PX, z * PX, 5, 0, 7); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.arc(x * PX, z * PX, 3.4, 0, 7); g.fillStyle = col; g.fill(); };
    for (const o of Object.values(others)) if (o.online) dot(o.x, o.z, '#4a90e2');
    dot(me.x, me.z, '#e8527a');
  }, [world, buildings, now, found, list.length]);

  return (
    <Modal title={t("🗺️ Mapa del mundo")} wide>
      <p className="sub">{t("Los ❔ son lugares por descubrir: acercaos para encontrarlos. 🔴 tú · 🔵 tu pareja.")}</p>
      <div className="mapwrap"><canvas ref={cv} width={MAP * PX} height={MAP * PX} /></div>
      <h3 className="fish-h">{t("🧭 Descubrimientos")} <small>{n}/{list.length}</small></h3>
      <div className="evcard">
        {EXPLORER_REWARDS.map((r) => (
          <div key={r.at} className="job"><span className="npc">🏅</span><div className="grow"><b>{t("Descubre {0} lugares", [r.at])}</b><small>🪙 {r.coins} · 💗 {r.hearts}</small></div>
            {couple.explorerClaimed?.[r.at] ? <span className="done-tag">✅</span> : <button className="btn primary" disabled={n < r.at} onClick={() => claimExplorer(r.at)}>{n >= r.at ? t("Reclamar") : `${n}/${r.at}`}</button>}</div>
        ))}
      </div>
      <div className="inv">
        {list.map((d) => (
          <div key={d.id} className={`inv-cell ${found[d.id] ? '' : 'zero'}`} title={found[d.id] ? d.hint : ''}>
            <span className="emoji">{found[d.id] ? d.emoji : '❔'}</span><small>{found[d.id] ? d.name : '???'}</small>
          </div>
        ))}
      </div>
    </Modal>
  );
}
