import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useGame } from '../store/gameStore';
import { ZONES, MAP, TILE } from '../game/constants';
import { idx } from '../game/worldGen';
import { rbGeo } from './rb';
import { zoneAvailable, zoneOwned } from '../game/actions';

/** Surcos: caballones de tierra suelta (montoncitos alargados y escalonados), para que el huerto parezca labrado. */
function Furrows({ tiles }) {
  const ref = useRef();
  useEffect(() => {
    const m = ref.current; if (!m) return;
    const d = new THREE.Object3D(), c = new THREE.Color();
    let i = 0;
    const H = (x, z, k) => (((x * 73856093) ^ (z * 19349663) ^ (k * 83492791)) >>> 0) % 1000 / 1000;
    for (const [x, z] of tiles) {
      for (let r = 0; r < 3; r++) {
        {
          const h = H(x, z, r + 1);
          d.position.set(x + 0.5 + (h - 0.5) * 0.08, 0.03, z + 0.17 + r * 0.33);
          d.scale.set(0.5, 0.042 + h * 0.012, 0.082); d.rotation.y = 0; d.updateMatrix();
          m.setMatrixAt(i, d.matrix); m.setColorAt(i, c.set('#7c5439').offsetHSL(0, 0, (h - 0.45) * 0.03)); i++;
        }
      }
    }
    m.count = i; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [tiles]);
  return (
    <instancedMesh ref={ref} args={[null, null, 6 * 1200]} frustumCulled={false} castShadow receiveShadow>
      <sphereGeometry args={[1, 8, 5]} /><meshStandardMaterial roughness={1} />
    </instancedMesh>
  );
}

/** Tierra arada por vosotros (se pinta encima del terreno, sin reconstruirlo). */
export function TilledSoil() {
  const soil = useGame((s) => s.soil);
  const world = useGame((s) => s.world);
  const ref = useRef();
  const list = useMemo(() => Object.values(soil), [soil]);
  const base = useMemo(() => { const o = []; if (!world) return o; for (let z = 0; z < MAP; z++) for (let x = 0; x < MAP; x++) if (world.tiles[idx(x, z)] === TILE.SOIL) o.push([x, z]); return o; }, [world]);
  const all = useMemo(() => [...base, ...list.map((o) => [o.x, o.z])], [base, list]);
  useEffect(() => {
    const m = ref.current; if (!m) return;
    const d = new THREE.Object3D(), c = new THREE.Color();
    list.forEach((o, i) => {
      d.position.set(o.x + 0.5, 0.025, o.z + 0.5); d.updateMatrix(); m.setMatrixAt(i, d.matrix);
      m.setColorAt(i, c.set('#7d533a').offsetHSL(0, 0, ((o.x * 7 + o.z * 13) % 5) * 0.006 - 0.012));
    });
    m.count = list.length; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [list]);
  return (
    <group>
      <instancedMesh ref={ref} args={[null, null, 2500]} frustumCulled={false} receiveShadow>
        <boxGeometry args={[0.99, 0.05, 0.99]} /><meshStandardMaterial roughness={1} />
      </instancedMesh>
      <Furrows tiles={all} />
    </group>
  );
}

/** Niebla, cartel y puerta sobre las ampliaciones aún sin comprar. */
export function LockedZones() {
  const couple = useGame((s) => s.couple);
  const open = () => useGame.getState().set({ panel: 'land' });
  return (
    <group>
      {Object.values(ZONES).filter((z) => !zoneOwned(couple, z.id)).map((z) => {
        const [x0, z0, x1, z1] = z.rect, w = x1 - x0, d = z1 - z0;
        const ok = zoneAvailable(couple, z.id);
        return (
          <group key={z.id}>
            <mesh position={[x0 + w / 2, 1.6, z0 + d / 2]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
              <planeGeometry args={[w, d]} /><meshBasicMaterial color="#e9f1e2" transparent opacity={0.72} depthWrite={false} />
            </mesh>
            <Html position={[x0 + w / 2, 2.2, z0 + d / 2]} center zIndexRange={[6, 0]}>
              <button className={`zone-tag ${ok ? '' : 'dim'}`} onClick={open}>🔒 {z.emoji} {z.label}<small>🪙 {z.coins}</small></button>
            </Html>
            {z.gate && (
              <Html position={[(z.gate[0] + z.gate[2]) / 2, 1.8, (z.gate[1] + z.gate[3]) / 2]} center zIndexRange={[5, 0]}>
                <button className="zone-tag small" onClick={open}>🗺️ {t0()}</button>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
import { t } from '../i18n';
const t0 = () => t("Terreno en venta");
