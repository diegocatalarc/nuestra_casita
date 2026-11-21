import { useFrame } from '@react-three/fiber';
import { tickBoot } from '../game/boot';

/** Sin dibujo: solo cuenta los fotogramas fluidos para la pantalla de carga. */
export default function BootProbe() {
  useFrame((_, dt) => tickBoot(dt));
  return null;
}
