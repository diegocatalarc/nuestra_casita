import { useState } from 'react';
import { t } from '../i18n';
import { EMOTES, playEmote } from '../game/emotes';

export { playEmote };

/** Textos de cada gesto (se evalúan al pintar, para que cambien con el idioma). */
function labels() {
  return {
    wave: t("Saludar"),
    dance: t("Bailar"),
    clap: t("Aplaudir"),
    hug: t("Abrazo"),
    laugh: t("Reír"),
    heart: t("Corazón"),
    surprise: t("¡Sorpresa!"),
    sleep: t("Dormir"),
  };
}

/**
 * Botón flotante pequeño que abre una rejilla de emotes grandes (pensada para tocar en iPad).
 * Se posiciona con `style` (por defecto, esquina inferior derecha, a la izquierda del botón de chat).
 * El contenedor padre debe ser `position: relative` o `absolute`.
 */
export default function Emotes({ style }) {
  const [open, setOpen] = useState(false);
  const txt = labels();
  return (
    <div style={{ position: 'absolute', right: 92, bottom: 14, zIndex: 23, pointerEvents: 'auto', ...style }}>
      {open && (
        <div
          role="menu"
          aria-label={t("Emotes")}
          style={{
            position: 'absolute', right: 0, bottom: 74, width: 'min(300px, 80vw)',
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 10,
            background: '#fffdf8', borderRadius: 16, boxShadow: '0 6px 18px rgba(0,0,0,.25)',
          }}
        >
          {EMOTES.map((e) => (
            <button
              key={e.id}
              role="menuitem"
              aria-label={txt[e.id]}
              onClick={() => { playEmote(e.id); setOpen(false); }}
              style={{
                minHeight: 64, minWidth: 64, borderRadius: 14, border: '2px solid #f2c6d2',
                background: '#fff8fb', color: '#4a3a44', cursor: 'pointer', touchAction: 'manipulation',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: 4,
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{e.emoji}</span>
              <small style={{ fontSize: 11, fontWeight: 800 }}>{txt[e.id]}</small>
            </button>
          ))}
        </div>
      )}
      <button
        aria-expanded={open}
        aria-label={t("Emotes")}
        title={t("Emotes")}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 62, height: 62, borderRadius: '50%', border: '3px solid #fff',
          background: 'linear-gradient(145deg, #ffd27a, #f5a25a)', color: '#fff', fontSize: 28,
          boxShadow: '0 4px 12px rgba(0,0,0,.25)', cursor: 'pointer', touchAction: 'manipulation',
        }}
      >
        😊
      </button>
    </div>
  );
}
