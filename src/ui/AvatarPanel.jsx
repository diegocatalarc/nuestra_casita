import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGame } from '../store/gameStore';
import { AVATAR_OPTS, defaultAvatar, normAvatar, randomAvatar } from '../game/constants';
import { getBackend } from '../services/backend';
import { cosmeticLocked } from '../game/logic';
import Avatar from '../scene/Avatar';
import Modal from './Modal';
import { t } from '../i18n';

const Swatches = ({ list, value = 0, onPick }) => (
  <div className="swatches">{list.map((c, i) => <button key={i} className={`sw ${value === i ? 'on' : ''}`} style={{ background: c }} onClick={() => onPick(i)} aria-label={`color ${i + 1}`} />)}</div>
);
const Pills = ({ list, value = 0, onPick, lock }) => (
  <div className="pills">{list.map((c, i) => {
    const locked = lock ? lock(i) : false;
    return <button key={i} className={`pill ${value === i ? 'on' : ''} ${locked ? 'locked' : ''}`} disabled={locked} title={locked ? t("Se desbloquea en el 🏪 Mercado o con visitantes del 📋 Tablón") : undefined} onClick={() => onPick(i)}>{locked ? '🔒 ' : ''}{c}</button>;
  })}</div>
);

const MAX_OUTFITS = 4;

/** Vestidor: personaliza el aspecto y guarda conjuntos favoritos. */
export default function AvatarPanel({ first }) {
  const uid = useGame((s) => s.user.uid);
  const coupleId = useGame((s) => s.coupleId);
  const saved = useGame((s) => s.couple?.players?.[uid]?.avatar);
  const couple = useGame((s) => s.couple);
  const outfits = useGame((s) => s.couple?.players?.[uid]?.outfits) || [];
  const [a, setA] = useState(() => normAvatar(saved || defaultAvatar(Math.floor(Math.random() * 6))));
  const [tab, setTab] = useState('body');
  const set = (k) => (v) => setA((o) => ({ ...o, [k]: v }));
  const O = AVATAR_OPTS;
  const lock = (cat) => (i) => cosmeticLocked(couple, normAvatar(saved), cat, i);
  const sanitize = (av) => { const o = { ...av }; for (const c of ['hat', 'glasses', 'neck', 'back', 'topStyle']) if (cosmeticLocked(couple, normAvatar(saved), c, o[c] ?? 0)) o[c] = 0; return o; };

  const write = (data) => getBackend().write(coupleId, [{ op: 'patch', data }]);
  const save = async () => {
    await write({ [`players.${uid}.avatar`]: a });
    useGame.getState().set({ panel: null });
  };
  const saveOutfit = () => {
    const list = [...outfits.filter(Boolean), a].slice(-MAX_OUTFITS);
    write({ [`players.${uid}.outfits`]: list });
    useGame.getState().toast(t("⭐ Conjunto guardado"));
  };
  const delOutfit = (i) => write({ [`players.${uid}.outfits`]: outfits.filter((_, j) => j !== i) });

  const TABS = [['body', t("👤 Cuerpo")], ['hair', t("💇 Pelo")], ['clothes', t("👕 Ropa")], ['extras', t("🎀 Extras")], ['outfits', t("⭐ Conjuntos")]];

  return (
    <Modal title={first ? t("✨ Crea tu personaje") : t("👗 Vestidor")} wide onClose={first ? save : undefined}>
      <div className="avatar-editor">
        <div className="preview3d">
          <Canvas camera={{ position: [0, 0.7, 3.2], fov: 30 }} dpr={[1, 2]}>
            <color attach="background" args={['#fbe9d0']} />
            <ambientLight intensity={1.1} /><directionalLight position={[3, 5, 4]} intensity={1.8} />
            <group position={[0, -0.62, 0]}><Avatar avatar={a} spin /></group>
          </Canvas>
          <button className="btn ghost dice" onClick={() => setA(sanitize(randomAvatar()))}>{t("🎲 Sorpréndeme")}</button>
        </div>
        <div className="opts">
          <div className="tabs">
            {TABS.map(([id, label]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>)}
          </div>
          {tab === 'body' && (<>
            <label>{t("Piel")}</label><Swatches list={O.skin} value={a.skin} onPick={set('skin')} />
            <label>{t("Ojos")}</label><Pills list={O.eyes} value={a.eyes} onPick={set('eyes')} />
            <label>{t("Boca")}</label><Pills list={O.mouth} value={a.mouth} onPick={set('mouth')} />
            <label>{t("Mejillas")}</label><Pills list={O.cheeks} value={a.cheeks} onPick={set('cheeks')} />
          </>)}
          {tab === 'hair' && (<>
            <label>{t("Peinado")}</label><Pills list={O.hairStyles} value={a.hair} onPick={set('hair')} />
            <label>{t("Color de pelo")}</label><Swatches list={O.hairColor} value={a.hairColor} onPick={set('hairColor')} />
          </>)}
          {tab === 'clothes' && (<>
            <label>{t("Parte de arriba")}</label><Pills list={O.topStyles} value={a.topStyle} onPick={set('topStyle')} lock={lock('topStyle')} />
            <label>{t("Color")}</label><Swatches list={O.top} value={a.top} onPick={set('top')} />
            <label>{t("Parte de abajo")}</label><Pills list={O.bottomStyles} value={a.bottomStyle} onPick={set('bottomStyle')} />
            <label>{t("Color")}</label><Swatches list={O.bottom} value={a.bottom} onPick={set('bottom')} />
            <label>{t("Zapatos")}</label><Swatches list={O.shoes} value={a.shoes} onPick={set('shoes')} />
          </>)}
          {tab === 'extras' && (<>
            <label>{t("Cabeza")}</label><Pills list={O.hats} value={a.hat} onPick={set('hat')} lock={lock('hat')} />
            <label>{t("Gafas")}</label><Pills list={O.glasses} value={a.glasses} onPick={set('glasses')} lock={lock('glasses')} />
            <label>{t("Cuello")}</label><Pills list={O.neck} value={a.neck} onPick={set('neck')} lock={lock('neck')} />
            <label>{t("Espalda")}</label><Pills list={O.back} value={a.back} onPick={set('back')} lock={lock('back')} />
          </>)}
          {tab === 'outfits' && (<>
            <p className="sub">{t("Guarda tus looks favoritos (hasta {0}) y póntelos con un toque.", [MAX_OUTFITS])}</p>
            <div className="outfits">
              {outfits.filter(Boolean).map((o, i) => (
                <div className="outfit" key={i}>
                  <div className="o-prev"><Canvas camera={{ position: [0, 0.75, 3.4], fov: 30 }} dpr={1}>
                    <color attach="background" args={['#fbe9d0']} />
                    <ambientLight intensity={1.1} /><directionalLight position={[3, 5, 4]} intensity={1.8} />
                    <group position={[0, -0.62, 0]}><Avatar avatar={o} /></group>
                  </Canvas></div>
                  <button className="btn primary" onClick={() => setA(sanitize(normAvatar(o)))}>{t("Ponérmelo")}</button>
                  <button className="link" onClick={() => delOutfit(i)}>{t("Quitar")}</button>
                </div>
              ))}
            </div>
            <button className="btn ghost" disabled={outfits.filter(Boolean).length >= MAX_OUTFITS} onClick={saveOutfit}>{t("⭐ Guardar este look")}</button>
          </>)}
          <button className="btn primary big" onClick={save}>{first ? t("Empezar") : t("Guardar")}</button>
        </div>
      </div>
    </Modal>
  );
}
