import { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { emojiForAnim, EMOTE_MS } from '../game/emotes';

/**
 * Globo con el emoji del gesto sobre la cabeza durante EMOTE_MS.
 * Mira el `anim` de quien sea (getAnim) cada 100 ms con un temporizador, no con el bucle de render:
 * así no se pierde un gesto aunque la escena vaya a pocos fotogramas. React solo se actualiza
 * al empezar un gesto y al retirar el globo.
 */
export default function EmoteBubble({ getAnim, y = 2.7 }) {
  const [shown, setShown] = useState(null);
  const getter = useRef(getAnim);
  getter.current = getAnim;

  useEffect(() => {
    let last = null, hide = null;
    const id = setInterval(() => {
      const a = getter.current ? getter.current() : null;
      if (a === last) return;
      last = a;
      const emoji = emojiForAnim(a);
      if (!emoji) return;
      clearTimeout(hide);
      setShown({ emoji, k: performance.now() });
      hide = setTimeout(() => setShown(null), EMOTE_MS);
    }, 100);
    return () => { clearInterval(id); clearTimeout(hide); };
  }, []);

  if (!shown) return null;
  return (
    <Html position={[0, y, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[7, 0]}>
      <style>{'@keyframes ncEmotePop{0%{transform:translateY(8px) scale(.4);opacity:0}30%{transform:translateY(0) scale(1.15);opacity:1}100%{transform:translateY(-6px) scale(1);opacity:1}}'}</style>
      <div
        key={shown.k}
        style={{
          width: 46, height: 46, borderRadius: '50%', background: '#fff', border: '3px solid #ff9db4',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, lineHeight: 1,
          boxShadow: '0 4px 12px rgba(0,0,0,.25)', animation: 'ncEmotePop .35s ease-out',
        }}
      >
        {shown.emoji}
      </div>
    </Html>
  );
}
