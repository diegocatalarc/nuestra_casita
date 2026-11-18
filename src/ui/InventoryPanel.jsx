import { useGame } from '../store/gameStore';
import { ITEMS, RESOURCES } from '../game/constants';
import Modal from './Modal';
import { t } from '../i18n';

export default function InventoryPanel() {
  const inv = useGame((s) => s.couple?.inventory) || {};
  const keys = Object.keys(ITEMS);
  return (
    <Modal title={t("🎒 Mochila compartida")}>
      <p className="sub">{t("Todo lo que recojáis es de los dos.")}</p>
      <div className="inv">
        {keys.map((k) => (
          <div key={k} className={`inv-cell ${(inv[k] || 0) === 0 ? 'zero' : ''}`}>
            <span className="emoji">{ITEMS[k].emoji}</span>
            <b>{inv[k] || 0}</b><small>{ITEMS[k].label}</small>
            {k in RESOURCES ? null : <i className="tag">{t("cosecha")}</i>}
          </div>
        ))}
      </div>
    </Modal>
  );
}
