import { useGame } from '../store/gameStore';
import { FISH, BOAT, ITEMS } from '../game/constants';
import { canAfford } from '../game/logic';
import { buyBoat, boardBoat, leaveBoat } from '../game/actions';
import Modal, { Cost } from './Modal';
import { t } from '../i18n';

/** Pesca y bote: empezar a pescar, comprar/usar el bote y diario de capturas. */
export default function FishingPanel() {
  const couple = useGame((s) => s.couple);
  const boating = useGame((s) => s.boating);
  const inv = couple?.inventory || {};
  const log = couple?.fishLog || {}, best = couple?.fishBest || {};
  const boat = couple?.boat;
  const caught = Object.keys(FISH).filter((k) => log[k] > 0).length;
  const close = () => useGame.getState().set({ panel: null });

  return (
    <Modal title={t("🎣 Pesca y bote")} wide>
      <div className="fish-top">
        <div className="box">
          <h3>{t("🎣 Pescar")}</h3>
          <p>{t("Pulsa el agua para lanzar la caña. Cuando aparezca ❗ pulsa de nuevo (o Espacio) para tirar. Pica más al amanecer, al atardecer y con lluvia.")}</p>
          <button className="btn primary" onClick={() => { useGame.getState().setTool('fish', { panel: null }); }}>{t("Empezar a pescar")}</button>
        </div>
        <div className="box">
          <h3>{t("⛵ Bote")}</h3>
          {!boat && (<>
            <p>{t("Navegad por el río juntos: uno rema y la otra persona se sube de pasajera 💗. También se puede pescar desde el bote.")}</p>
            <Cost cost={BOAT.cost} inv={inv} />
            <button className="btn primary" disabled={!canAfford(inv, BOAT.cost)} onClick={buyBoat}>{canAfford(inv, BOAT.cost) ? t("Construir bote") : t("Faltan recursos")}</button>
          </>)}
          {boat && !boating && (<>
            <p>{t("Vuestro bote está amarrado en el río. Si tu pareja ya navega, te subirás de pasajera/o.")}</p>
            <button className="btn primary" onClick={() => { close(); boardBoat(); }}>{t("⛵ Subir al bote")}</button>
          </>)}
          {boat && boating > 0 && (<>
            <p>{t("Estás navegando. Acércate a la orilla para bajar.")}</p>
            <button className="btn primary" onClick={() => { close(); leaveBoat(); }}>{t("⚓ Bajar del bote")}</button>
          </>)}
        </div>
      </div>
      <h3 className="fish-h">{t("📖 Diario de pesca")} <small>{caught}/{Object.keys(FISH).length}</small></h3>
      <div className="inv">
        {Object.entries(FISH).map(([k, f]) => (
          <div key={k} className={`inv-cell ${log[k] > 0 ? '' : 'zero'}`}>
            <span className="emoji">{log[k] > 0 ? f.emoji : '❔'}</span>
            <b>{log[k] > 0 ? `×${log[k]}` : '—'}</b>
            <small>{log[k] > 0 ? f.label : '???'}</small>
            {log[k] > 0 && <i className="tag">{t("récord {0} cm", [best[k] || '?'])}</i>}
            {f.rare && <i className="tag rare">{t("raro")}</i>}
          </div>
        ))}
      </div>
      <p className="hint">{t("Con la Cocina podéis preparar sushi, trucha asada y más. En la mochila tenéis: {0}", [Object.keys(FISH).map((k) => `${ITEMS[k].emoji}${inv[k] || 0}`).join(' ')])}</p>
    </Modal>
  );
}
