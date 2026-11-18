import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { MEMORY_KINDS } from '../game/constants';
import { addMemory, deleteMemory } from '../game/actions';
import { daysBetween, dateKey } from '../game/time';
import { PhotoPicker, AudioRecorder } from './media';
import Modal from './Modal';
import { t } from '../i18n';

export default function MemoriesPanel() {
  const memories = useGame((s) => s.memories);
  const buildings = useGame((s) => s.buildings);
  const hasRoom = Object.values(buildings).some((b) => b.type === 'memory');
  const [kind, setKind] = useState('photo');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState(dateKey());
  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null);
  const list = Object.values(memories).sort((a, b) => (b.at || 0) - (a.at || 0));

  const ok = title.trim() && (kind === 'photo' ? image : kind === 'audio' ? audio : kind === 'date' ? date : text.trim());
  const save = () => {
    addMemory({ kind, title: title.trim(), text: text.trim(), image: kind === 'photo' ? image : null, audio: kind === 'audio' ? audio : null, date: kind === 'date' ? date : null });
    setTitle(''); setText(''); setImage(null); setAudio(null);
    useGame.getState().toast(t("💾 Recuerdo guardado"));
  };

  return (
    <Modal title={t("🖼️ Sala de recuerdos")} wide>
      <p className="sub">{hasRoom ? t("Cada recuerdo aparece como un objeto en la sala. Haz clic en él para abrirlo.") : t("⚠️ Construye la Sala de recuerdos para verlos en las estanterías. Mientras tanto se guardan junto a la casita.")}</p>
      <div className="tabs">
        {Object.entries(MEMORY_KINDS).map(([k, d]) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{d.emoji} {d.label}</button>)}
      </div>
      <div className="form">
        <input placeholder={t("Título")} maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} />
        {kind === 'photo' && <PhotoPicker value={image} onChange={setImage} />}
        {kind === 'audio' && <AudioRecorder value={audio} onChange={setAudio} />}
        {kind === 'date' && <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
        {kind !== 'audio' && <textarea rows={3} maxLength={800} placeholder={kind === 'date' ? t("Qué pasó ese día (opcional)") : t("Escribe…")} value={text} onChange={(e) => setText(e.target.value)} />}
        <button className="btn primary" disabled={!ok} onClick={save}>{t("Guardar en la sala")}</button>
      </div>
      <h3 className="sec">{list.length} {t("recuerdos")}</h3>
      <div className="mem-list">
        {list.map((m) => (
          <button key={m.id} className="mem" onClick={() => useGame.getState().set({ viewMemory: m.id })}>
            <span>{MEMORY_KINDS[m.kind]?.emoji || '📝'}</span><b>{m.title || t("Sin título")}</b>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function MemoryViewer() {
  const id = useGame((s) => s.viewMemory);
  const m = useGame((s) => s.memories[id]);
  const players = useGame((s) => s.couple?.players);
  if (!m) return null;
  const close = () => useGame.getState().set({ viewMemory: null });
  const diff = m.date ? daysBetween(dateKey(), m.date) : null;
  return (
    <Modal title={`${MEMORY_KINDS[m.kind]?.emoji || ''} ${m.title || t("Recuerdo")}`} onClose={close}>
      {m.image && <img src={m.image} alt={m.title} className="photo-big" />}
      {m.audio && <audio src={m.audio} controls autoPlay className="audio" />}
      {m.kind === 'date' && <div className="datebox">{m.date}<small>{diff > 0 ? t("faltan {0} días", [diff]) : diff < 0 ? t("hace {0} días", [-diff]) : t("¡es hoy!")}</small></div>}
      {m.text && <p className="memtext">{m.text}</p>}
      <div className="hint">{t("Guardado por")} {players?.[m.by]?.name || '…'} · {new Date(m.at).toLocaleDateString()}</div>
      <div className="row end"><button className="btn ghost" onClick={() => { deleteMemory(m.id); close(); }}>{t("🗑 Quitar")}</button></div>
    </Modal>
  );
}
