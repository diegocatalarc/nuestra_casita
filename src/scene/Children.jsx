import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGame } from '../store/gameStore';
import { animalPos, childInfo } from '../game/logic';
import { serverNow } from '../game/time';
import { childInteract } from '../game/actions';
import Avatar from './Avatar';

function Child({ c }) {
  const g = useRef();
  const anim = useRef('idle');
  const now = useGame((s) => Math.floor(s.now / 3000) * 3000);
  const decor = useGame((s) => s.decor);
  const info = childInfo(c, now);
  const crib = info.stage.id === 'baby' ? Object.values(decor).find((d) => d.type === 'crib') : null;
  const avatar = { skin: c.skin, hair: c.hair, hairColor: c.hairColor, top: c.top, bottom: c.bottom, acc: c.acc };

  useFrame(() => {
    if (!g.current) return;
    if (crib) {
      // el bebé duerme en la cuna
      const th = ((crib.rot || 0) * Math.PI) / 2;
      g.current.position.set(crib.x + Math.sin(th) * 0.3, 0.12, crib.z + Math.cos(th) * 0.3);
      g.current.rotation.y = th;
      anim.current = 'sleep';
    } else {
      const p = animalPos({ id: c.id, home: c.home }, serverNow());
      g.current.position.set(p.x, 0, p.z);
      g.current.rotation.y = p.rot;
      anim.current = p.moving ? 'walk' : 'idle';
    }
  });

  const icon = info.hunger > 0.6 ? '🍼' : info.playReady && info.stage.id !== 'baby' ? '🧸' : null;
  return (
    <group
      ref={g}
      onClick={(e) => { if (useGame.getState().tool !== 'interact') return; e.stopPropagation(); childInteract(c.id); }}
      onPointerOver={() => { if (useGame.getState().tool === 'interact') document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <group scale={info.stage.scale}>
        <Avatar avatar={avatar} getAnim={() => anim.current} name={c.name} showName />
      </group>
      {icon && !crib && <Html position={[0, info.stage.scale * 1.5 + 0.35, 0]} center style={{ pointerEvents: 'none' }}><div className="bubble">{icon}</div></Html>}
    </group>
  );
}

export default function Children() {
  const children = useGame((s) => s.children);
  return <group>{Object.values(children).map((c) => <Child key={c.id} c={c} />)}</group>;
}
