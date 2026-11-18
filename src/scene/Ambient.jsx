import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { L, isWet } from '../game/lighting';
import { me } from '../game/runtime';

const FF = 40, PET = 150, DUST = 20, SPL = 70, FOGN = 9;
const mistTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t; })();
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();

/** Luciérnagas (noche), pétalos/hojas (primavera/otoño) y polvo al caminar. */
export default function Ambient() {
  const ff = useRef(), pet = useRef(), dust = useRef(), spl = useRef(), mist = useRef([]);
  const d = useMemo(() => ({
    ff: Array.from({ length: FF }, () => ({ a: Math.random() * 40, x: Math.random(), z: Math.random(), y: 0.5 + Math.random() * 1.8, ph: Math.random() * 6, sp: 0.3 + Math.random() * 0.5 })),
    pet: Array.from({ length: PET }, () => ({ x: Math.random(), z: Math.random(), y: Math.random() * 16, v: 0.5 + Math.random() * 0.6, ph: Math.random() * 6 })),
    dust: Array.from({ length: DUST }, () => ({ life: 0, x: 0, z: 0 })), dt: 0, di: 0,
    spl: Array.from({ length: SPL }, () => ({ life: 0, x: 0, z: 0 })), si: 0, sacc: 0,
    mist: Array.from({ length: FOGN }, (_, i) => ({ x: Math.random(), z: Math.random(), y: 0.4 + i * 0.13, v: 0.15 + Math.random() * 0.25, s: 14 + Math.random() * 12 })),
  }), []);
  const ffGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FF * 3), 3)); return g; }, []);
  const petGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PET * 3), 3)); return g; }, []);

  useFrame((s, dt) => {
    dt = Math.min(dt, 0.05);
    const t = s.clock.elapsedTime;
    // luciérnagas
    const fm = ff.current.material;
    const on = L.night > 0.35 && !isWet(L.weather) && L.weather !== 'snow' && L.season !== 3;
    fm.opacity += ((on ? 0.95 : 0) - fm.opacity) * Math.min(1, dt * 2);
    ff.current.visible = fm.opacity > 0.02;
    if (ff.current.visible) {
      const p = ffGeo.attributes.position.array;
      d.ff.forEach((f, i) => {
        const blink = Math.sin(t * f.sp * 3 + f.ph) > -0.3;
        p[i * 3] = me.x + (f.x - 0.5) * 30 + Math.sin(t * f.sp + f.ph) * 1.5;
        p[i * 3 + 1] = blink ? f.y + Math.sin(t * 0.8 + f.ph) * 0.3 : -20;
        p[i * 3 + 2] = me.z + (f.z - 0.5) * 30 + Math.cos(t * f.sp * 0.8 + f.ph) * 1.5;
      });
      ffGeo.attributes.position.needsUpdate = true;
    }
    // pétalos (primavera) / hojas (otoño)
    const pm = pet.current.material;
    const petOn = (L.season === 0 || L.season === 2) && (L.weather === 'clear' || L.weather === 'fog');
    pm.opacity += ((petOn ? 0.9 : 0) - pm.opacity) * Math.min(1, dt * 2);
    pet.current.visible = pm.opacity > 0.02;
    if (pet.current.visible) {
      pm.color.set(L.season === 0 ? '#ffc2d4' : '#e8873c');
      const p = petGeo.attributes.position.array;
      d.pet.forEach((f, i) => {
        f.y -= 0.7 * f.v * dt;
        if (f.y < 0) { f.y = 14 + Math.random() * 3; f.x = Math.random(); f.z = Math.random(); }
        p[i * 3] = me.x + (f.x - 0.5) * 40 + Math.sin(t * 0.9 + f.ph) * 1.2 + t * 0.3 % 1;
        p[i * 3 + 1] = f.y;
        p[i * 3 + 2] = me.z + (f.z - 0.5) * 40 + Math.cos(t * 0.7 + f.ph) * 1.2;
      });
      petGeo.attributes.position.needsUpdate = true;
    }
    // charcos: ondas sobre el suelo mojado
    const wet = isWet(L.weather);
    d.sacc += dt * (wet ? (L.weather === 'storm' ? 80 : 40) : 0);
    while (d.sacc > 1) { d.sacc -= 1; const u = d.spl[d.si++ % SPL]; u.life = 1; u.x = me.x + (Math.random() - 0.5) * 26; u.z = me.z + (Math.random() - 0.5) * 26; }
    d.spl.forEach((u, i) => {
      u.life = Math.max(0, u.life - dt * 2.4);
      const k = 1 - u.life, sc = u.life > 0 ? 0.05 + k * 0.3 : 0.0001;
      m4.compose(v3.set(u.x, 0.03, u.z), q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), s3.set(sc, sc, sc * (u.life > 0.5 ? 1 : u.life * 2)));
      spl.current.setMatrixAt(i, m4);
    });
    spl.current.instanceMatrix.needsUpdate = true;
    // bancos de niebla a ras de suelo
    const mistTarget = L.weather === 'fog' ? 0.26 : wet ? 0.12 : L.hour < 8 && L.hour > 5.5 ? 0.18 : 0;
    d.mist.forEach((m, i) => {
      const el = mist.current[i];
      if (!el) return;
      el.material.opacity += (mistTarget - el.material.opacity) * Math.min(1, dt * 1.5);
      el.visible = el.material.opacity > 0.01;
      el.position.set(me.x + ((m.x + t * m.v * 0.02) % 1 - 0.5) * 44, m.y, me.z + (m.z - 0.5) * 44);
      el.scale.set(m.s, m.s, 1);
    });
    q.identity();
    // polvo al caminar
    d.dt += dt;
    if (me.moving && d.dt > 0.17) {
      d.dt = 0;
      const u = d.dust[d.di++ % DUST];
      u.life = 1; u.x = me.x - Math.sin(me.rot) * 0.15 + (Math.random() - 0.5) * 0.15; u.z = me.z - Math.cos(me.rot) * 0.15 + (Math.random() - 0.5) * 0.15;
    }
    d.dust.forEach((u, i) => {
      u.life = Math.max(0, u.life - dt * 2.2);
      const k = u.life, sc = k > 0 ? (1 - k) * 0.22 + 0.05 : 0.0001;
      m4.compose(v3.set(u.x, 0.08 + (1 - k) * 0.25, u.z), q.identity(), s3.set(sc * k * 2, sc * k * 2, sc * k * 2));
      dust.current.setMatrixAt(i, m4);
    });
    dust.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <points ref={ff} geometry={ffGeo} frustumCulled={false}>
        <pointsMaterial color="#eaff7a" size={7} sizeAttenuation={false} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      <points ref={pet} geometry={petGeo} frustumCulled={false}>
        <pointsMaterial color="#ffc2d4" size={5} sizeAttenuation={false} transparent opacity={0} depthWrite={false} />
      </points>
      <instancedMesh ref={spl} args={[null, null, SPL]} frustumCulled={false}>
        <ringGeometry args={[0.7, 1, 14]} />
        <meshBasicMaterial color="#e8f4ff" transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      {d.mist.map((m, i) => (
        <mesh key={i} ref={(el) => (mist.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} frustumCulled={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={mistTex} color="#f3f1ec" transparent opacity={0} depthWrite={false} fog={false} />
        </mesh>
      ))}
      <instancedMesh ref={dust} args={[null, null, DUST]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#f1e6d0" transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>
    </>
  );
}
