import * as THREE from 'three';

// Sombra de contacto suave (mancha oscura difuminada) para asentar los objetos en el suelo.
const tex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  r.addColorStop(0, 'rgba(40,25,20,0.55)'); r.addColorStop(0.55, 'rgba(40,25,20,0.28)'); r.addColorStop(1, 'rgba(40,25,20,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
const geo = new THREE.PlaneGeometry(1, 1);

/** w×d = huella del objeto; se dibuja algo más grande que ella. */
export default function ContactShadow({ w = 1, d = 1, y = 0.018, k = 1.35, o = 1 }) {
  return <mesh geometry={geo} material={mat} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[w * k, d * k, 1]} renderOrder={-1} raycast={() => null} />;
}
