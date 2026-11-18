import { Html } from '@react-three/drei';
import { useGame } from '../store/gameStore';

/** Textos flotantes ("+1 💗", "💧") que suben y se desvanecen. */
export default function FloatingFx() {
  const fx = useGame((s) => s.fx);
  return (
    <>
      {fx.map((f) => (
        <Html key={f.id} position={[f.x, 1.3, f.z]} center style={{ pointerEvents: 'none' }} zIndexRange={[20, 10]}>
          <div className="fx">{f.text}</div>
        </Html>
      ))}
    </>
  );
}
