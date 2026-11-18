import { useRef, useState } from 'react';
import { t } from '../i18n';

/** Foto → JPEG comprimido (≤ max px) como data URL (cabe de sobra en un documento Firestore). */
export function fileToDataUrl(file, max = 720, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function PhotoPicker({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="media-box">
      {value && <img src={value} alt="" className="preview" />}
      <label className="btn ghost">
        {busy ? t("Procesando…") : value ? t("Cambiar foto") : t("📷 Elegir foto")}
        <input type="file" accept="image/*" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try { onChange(await fileToDataUrl(f)); } finally { setBusy(false); }
        }} />
      </label>
    </div>
  );
}

/** Grabadora de voz (máx. 20 s, Opus a baja tasa → unos 30-60 KB). */
export function AudioRecorder({ value, onChange, maxSec = 20 }) {
  const [rec, setRec] = useState(false);
  const [left, setLeft] = useState(maxSec);
  const [err, setErr] = useState('');
  const mr = useRef(), chunks = useRef([]), timer = useRef();

  const start = async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream, { audioBitsPerSecond: 24000 });
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType });
        const fr = new FileReader();
        fr.onload = () => onChange(fr.result);
        fr.readAsDataURL(blob);
      };
      r.start();
      mr.current = r; setRec(true); setLeft(maxSec);
      timer.current = setInterval(() => setLeft((l) => { if (l <= 1) { stop(); return 0; } return l - 1; }), 1000);
    } catch { setErr(t("No se pudo acceder al micrófono")); }
  };
  const stop = () => {
    clearInterval(timer.current);
    if (mr.current && mr.current.state !== 'inactive') mr.current.stop();
    setRec(false);
  };

  return (
    <div className="media-box">
      {value && !rec && <audio src={value} controls className="audio" />}
      {rec
        ? <button className="btn rec" onClick={stop}>{t("⏹ Detener (")}{left}{t("s)")}</button>
        : <button className="btn ghost" onClick={start}>{value ? t("🎙️ Grabar de nuevo") : t("🎙️ Grabar nota de voz")}</button>}
      {err && <div className="err">{err}</div>}
    </div>
  );
}
