import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { AVATAR_OPTS, normAvatar } from '../game/constants';
import * as THREE from 'three';
import { P, geo, basicMat } from './toon';

const SPH = (r, w = 22, h = 16) => geo('Sphere', r, w, h);
const EYE = '#2a1f24';

function Hair({ style, color }) {
  const c = color;
  const cap = <P g={geo('Sphere', 0.37, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)} color={c} p={[0, 0.02, -0.03]} r={[-0.5, 0, 0]} />;
  const bangs = [[-0.15, 0.2, 0.29, 0.6], [0, 0.23, 0.31, 0.75], [0.15, 0.2, 0.29, 0.6]].map(([x, y, z, k], i) => (
    <P key={i} g={SPH(0.1 * (k + 0.4), 14, 10)} color={c} p={[x, y, z]} s={[1.1, 0.75, 0.7]} out={0.1} />
  ));
  const sides = [-1, 1].map((s) => <P key={s} g={SPH(0.1, 12, 8)} color={c} p={[s * 0.33, 0.0, 0.0]} s={[0.8, 1.2, 1]} out={0.1} />);
  switch (style) {
    case 1: return (<group>{cap}{bangs}
      <P g={SPH(0.36)} color={c} p={[0, -0.1, -0.13]} s={[1.02, 0.85, 0.72]} />
      {[-1, 1].map((s) => <P key={s} g={SPH(0.12, 12, 8)} color={c} p={[s * 0.3, -0.12, 0.0]} s={[0.8, 1.3, 1]} out={0.1} />)}
    </group>);
    case 2: return (<group>{cap}{bangs}
      <P g={geo('Capsule', 0.17, 0.4, 6, 12)} color={c} p={[0, -0.32, -0.22]} s={[1.6, 1, 0.8]} />
      {[-1, 1].map((s) => <P key={s} g={geo('Capsule', 0.07, 0.25, 6, 10)} color={c} p={[s * 0.31, -0.2, 0.02]} out={0.1} />)}
    </group>);
    case 3: return (<group>{cap}{bangs}{sides}
      <P g={SPH(0.14)} color={c} p={[0, 0.43, -0.08]} />
      <P g={geo('Torus', 0.09, 0.025, 6, 12)} color="#e86a8a" p={[0, 0.32, -0.07]} r={[Math.PI / 2, 0, 0]} out={0} />
    </group>);
    case 4: return (<group>{cap}{bangs}
      {[-1, 1].map((s) => (
        <group key={s}>
          <P g={SPH(0.12)} color={c} p={[s * 0.38, -0.1, -0.06]} />
          <P g={geo('Capsule', 0.07, 0.22, 6, 10)} color={c} p={[s * 0.41, -0.3, -0.06]} out={0.1} />
          <P g={SPH(0.035, 8, 6)} color="#e86a8a" p={[s * 0.37, -0.02, -0.04]} out={0} />
        </group>
      ))}
    </group>);
    case 5: return (<group>{cap}{bangs}{sides}
      {[[0, 0.38, 0], [-0.17, 0.33, -0.02], [0.17, 0.33, -0.02], [-0.08, 0.37, -0.12], [0.1, 0.36, -0.12], [0, 0.34, 0.1]].map(([x, y, z], i) => (
        <P key={i} g={geo('Cone', 0.09, 0.26, 6)} color={c} p={[x, y, z]} r={[z * 3, 0, -x * 2.5]} out={0.1} />
      ))}
    </group>);
    case 6: return (<group>{cap}{bangs}{sides}
      <P g={SPH(0.13)} color={c} p={[0, 0.34, -0.22]} />
      <P g={geo('Capsule', 0.085, 0.36, 6, 12)} color={c} p={[0, 0.08, -0.4]} r={[0.35, 0, 0]} out={0.1} />
      <P g={geo('Torus', 0.09, 0.025, 6, 12)} color="#e86a8a" p={[0, 0.33, -0.2]} r={[1.2, 0, 0]} out={0} />
    </group>);
    case 7: return (<group>{cap}{bangs}{sides}
      {[[-0.12, 0.1], [-0.3, 0.09], [-0.47, 0.08]].map(([y, r], i) => <P key={i} g={SPH(r + 0.02, 12, 10)} color={c} p={[0, y, -0.33 - i * 0.015]} out={0.1} />)}
      <P g={SPH(0.05, 8, 6)} color="#e86a8a" p={[0, -0.57, -0.36]} out={0} />
    </group>);
    case 8: return (<group>
      <P g={SPH(0.47, 22, 16)} color={c} p={[0, 0.2, -0.17]} s={[1.02, 0.95, 0.95]} />
      {[-1, 1].map((s) => <P key={s} g={SPH(0.11, 10, 8)} color={c} p={[s * 0.36, 0.0, -0.02]} out={0.1} />)}
    </group>);
    case 9: return (<group>{cap}{bangs}{sides}
      <P g={SPH(0.37, 18, 12)} color={c} p={[0, -0.14, -0.2]} s={[1.05, 1.15, 0.55]} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <P g={SPH(0.13, 10, 8)} color={c} p={[s * 0.3, -0.28, -0.1]} out={0.1} />
          <P g={SPH(0.1, 10, 8)} color={c} p={[s * 0.33, -0.44, -0.12]} out={0.1} />
        </group>
      ))}
    </group>);
    default: return <group>{cap}{bangs}{sides}</group>;
  }
}

// ---------- Vestidor: complementos ----------
function HatWear({ kind, hairC }) {
  switch (kind) {
    case 1: return (
      <group position={[0, 0.26, 0]}>
        <P g={geo('Cylinder', 0.56, 0.56, 0.035, 24)} color="#e8c987" />
        <P g={geo('Cylinder', 0.27, 0.31, 0.2, 18)} color="#e8c987" p={[0, 0.1, 0]} />
        <P g={geo('Cylinder', 0.315, 0.315, 0.05, 18)} color="#d9695f" p={[0, 0.04, 0]} out={0} />
      </group>
    );
    case 2: return (
      <group position={[0.22, 0.3, 0.14]} rotation={[0, 0, -0.3]}>
        {[-1, 1].map((s) => <P key={s} g={geo('Cone', 0.08, 0.17, 8)} color="#f06a8a" p={[s * 0.09, 0, 0]} r={[0, 0, -s * 1.57]} />)}
        <P g={SPH(0.05, 10, 8)} color="#c9446a" />
      </group>
    );
    case 3: return (
      <group position={[0, 0.2, -0.02]}>
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return <P key={i} g={SPH(0.05, 8, 6)} color={['#f4a6c0', '#fff2a8', '#ffffff', '#c9a6f0'][i % 4]} p={[Math.cos(a) * 0.33, 0, Math.sin(a) * 0.33]} out={0.12} />;
        })}
      </group>
    );
    case 4: return (<group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.2, 0.33, 0.0]} rotation={[0, 0, -s * 0.35]}>
          <P g={geo('Cone', 0.11, 0.24, 4)} color={hairC} />
          <P g={geo('Cone', 0.06, 0.14, 4)} color="#f4a6c0" p={[0, -0.02, 0.05]} out={0} />
        </group>
      ))}
    </group>);
    case 5: return (<group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.13, 0.5, -0.04]} rotation={[0.1, 0, -s * 0.22]}>
          <P g={geo('Capsule', 0.065, 0.3, 6, 10)} color="#f6efe6" />
          <P g={geo('Capsule', 0.032, 0.22, 4, 8)} color="#f4a6c0" p={[0, 0, 0.04]} out={0} />
        </group>
      ))}
    </group>);
    case 6: return (
      <group position={[0, 0.07, -0.02]}>
        <P g={geo('Sphere', 0.4, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55)} color="#d9695f" p={[0, 0.02, 0]} />
        <P g={geo('Torus', 0.38, 0.05, 8, 24)} color="#f6efe6" p={[0, 0.0, 0]} r={[Math.PI / 2, 0, 0]} out={0.05} />
        <P g={SPH(0.09, 10, 8)} color="#f6efe6" p={[0, 0.4, 0]} />
      </group>
    );
    case 7: return (
      <group position={[0, 0.31, 0]}>
        <P g={geo('Cylinder', 0.26, 0.24, 0.1, 16)} color="#f2c94c" />
        {Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * Math.PI * 2; return <P key={i} g={geo('Cone', 0.06, 0.16, 6)} color="#f2c94c" p={[Math.cos(a) * 0.24, 0.12, Math.sin(a) * 0.24]} />; })}
        {[0, 2, 4].map((i) => { const a = (i / 5) * Math.PI * 2; return <P key={'g' + i} g={SPH(0.035, 8, 6)} color={['#e0524a', '#4aa3e0', '#5bd18a'][i % 3]} p={[Math.cos(a) * 0.255, 0.01, Math.sin(a) * 0.255]} out={0} />; })}
      </group>
    );
    case 8: return (<group>
      <P g={geo('Torus', 0.38, 0.03, 6, 20, Math.PI)} color="#3a3a46" p={[0, 0.0, 0]} r={[0, 0, 0]} out={0.05} />
      {[-1, 1].map((s) => <P key={s} g={geo('Cylinder', 0.1, 0.1, 0.08, 14)} color="#e86a8a" p={[s * 0.38, -0.02, 0]} r={[0, 0, Math.PI / 2]} />)}
    </group>);
    case 9: return (
      <group position={[0, 0.17, 0]}>
        <P g={geo('Torus', 0.335, 0.045, 6, 24)} color="#e0524a" r={[Math.PI / 2 - 0.12, 0, 0]} p={[0, 0, -0.01]} out={0.05} />
        <P g={SPH(0.07, 8, 6)} color="#e0524a" p={[0, 0.0, -0.36]} s={[1.3, 1, 0.8]} out={0.05} />
        <P g={geo('Cone', 0.05, 0.14, 4)} color="#e0524a" p={[0.07, -0.08, -0.37]} r={[Math.PI, 0, 0.3]} out={0} />
      </group>
    );
    default: return null;
  }
}

function GlassesWear({ kind }) {
  if (kind === 1) return (
    <group position={[0, -0.02, 0.335]}>
      {[-0.125, 0.125].map((x) => <P key={x} g={geo('Torus', 0.075, 0.013, 8, 18)} color="#3a3a46" p={[x, 0, 0]} out={0} />)}
      <P g={geo('Box', 0.07, 0.012, 0.012)} color="#3a3a46" out={0} />
    </group>
  );
  if (kind === 2) return (
    <group position={[0, -0.01, 0.335]}>
      {[-0.125, 0.125].map((x) => <P key={x} g={geo('Box', 0.19, 0.11, 0.02)} color="#1d1d26" p={[x, 0, 0]} out={0} />)}
      <P g={geo('Box', 0.07, 0.016, 0.016)} color="#1d1d26" out={0} />
    </group>
  );
  if (kind === 3) return (
    <group position={[0, -0.01, 0.34]}>
      {[-0.125, 0.125].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <P g={SPH(0.055, 10, 8)} color="#ff6f9c" p={[-0.035, 0.03, 0]} s={[1, 1, 0.3]} out={0} />
          <P g={SPH(0.055, 10, 8)} color="#ff6f9c" p={[0.035, 0.03, 0]} s={[1, 1, 0.3]} out={0} />
          <P g={geo('Cone', 0.085, 0.13, 4)} color="#ff6f9c" p={[0, -0.04, 0]} r={[0, 0.78, Math.PI]} s={[1, 1, 0.3]} out={0} />
        </group>
      ))}
      <P g={geo('Box', 0.07, 0.012, 0.012)} color="#e86a8a" out={0} />
    </group>
  );
  return null;
}

function NeckWear({ kind }) {
  switch (kind) {
    case 1: return (<group position={[0, -0.34, 0]}>
      <P g={geo('Torus', 0.21, 0.075, 10, 20)} color="#e07a5f" r={[Math.PI / 2, 0, 0]} />
      <P g={geo('Box', 0.12, 0.3, 0.05)} color="#e07a5f" p={[0.13, -0.17, 0.2]} r={[0, 0, 0.12]} />
    </group>);
    case 2: return (<group position={[0, -0.35, 0]}>
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <P key={i} g={SPH(0.035, 8, 6)} color="#fbf6ee" p={[Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2 + 0.02]} out={0.1} />; })}
    </group>);
    case 3: return (<group position={[0, -0.36, 0.2]}>
      {[-1, 1].map((s) => <P key={s} g={geo('Cone', 0.09, 0.14, 4)} color="#d9453f" p={[s * 0.09, 0, 0]} r={[0, 0, -s * 1.57]} />)}
      <P g={SPH(0.04, 8, 6)} color="#b3302c" out={0} />
    </group>);
    case 4: return (<group position={[0, -0.34, 0]}>
      <P g={geo('Torus', 0.2, 0.04, 8, 20)} color="#d9453f" r={[Math.PI / 2, 0, 0]} />
      <P g={geo('Cone', 0.1, 0.18, 4)} color="#d9453f" p={[0, -0.1, 0.19]} r={[Math.PI, Math.PI / 4, 0]} />
    </group>);
    default: return null;
  }
}

function BackWear({ kind, glow }) {
  switch (kind) {
    case 1: return (<group position={[0, 0.2, -0.27]}>
      <P g={geo('Box', 0.3, 0.38, 0.14)} color="#c97b4a" />
      <P g={geo('Box', 0.3, 0.14, 0.16)} color="#a8603a" p={[0, 0.13, 0]} />
      <P g={geo('Box', 0.12, 0.1, 0.03)} color="#f2c27a" p={[0, -0.05, 0.09]} out={0} />
    </group>);
    case 2: return (<group position={[0, 0.22, -0.25]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.16, 0, 0]} rotation={[0, s * 0.5, s * 0.35]}>
          <P g={SPH(0.2, 12, 8)} color="#bfe8ff" s={[0.6, 1.1, 0.12]} out={0.05} />
          <P g={SPH(0.13, 10, 8)} color="#e4f6ff" p={[s * 0.02, -0.2, 0]} s={[0.6, 0.9, 0.12]} out={0.05} />
        </group>
      ))}
    </group>);
    case 3: return (<group position={[0, 0.17, -0.25]} rotation={[0.12, 0, 0]}>
      <P g={geo('Box', 0.46, 0.5, 0.04)} color="#c9446a" p={[0, -0.05, 0]} />
      <P g={geo('Box', 0.5, 0.06, 0.07)} color="#f2c94c" p={[0, 0.22, 0.01]} out={0.04} />
    </group>);
    default: return null;
  }
}

// Poses por animación
function pose(anim, t) {
  const p = { armL: 0, armR: 0, armLz: 0, armRz: 0, legL: 0, legR: 0, bob: 0, lean: 0, jump: 0, squash: 0, hair: 0, lie: 0, sit: 0 };
  switch (anim) {
    case 'walk': {
      const s = Math.sin(t * 11);
      p.legL = s * 0.8; p.legR = -s * 0.8; p.armL = -s * 0.7; p.armR = s * 0.7;
      p.bob = Math.abs(Math.cos(t * 11)) * 0.06; p.squash = Math.cos(t * 22) * 0.035; p.hair = 0.05; p.lean = 0.06;
      break;
    }
    case 'water': p.armR = -1.3; p.armL = -0.2; p.lean = 0.2 + Math.sin(t * 8) * 0.06; break;
    case 'harvest': case 'dig': p.lean = 0.5 + Math.sin(t * 9) * 0.15; p.armL = -1.0; p.armR = -1.0; break;
    case 'build': p.armR = -1.7 + Math.sin(t * 14) * 0.9; p.armL = -0.4; p.squash = Math.sin(t * 14) * 0.03; break;
    case 'emo_sleep': case 'sleep': p.lie = 1; p.armL = 0.15; p.armR = -0.15; p.bob = Math.sin(t * 1.4) * 0.012; break;
    case 'eat': p.armR = -2.0 + Math.sin(t * 9) * 0.3; p.armL = -0.5; p.lean = 0.1; p.bob = Math.abs(Math.sin(t * 9)) * 0.015; break;
    case 'fish': p.armR = -1.35; p.armL = -1.15; p.lean = -0.05 + Math.sin(t * 2) * 0.02; p.bob = Math.sin(t * 1.6) * 0.01; break;
    case 'reel': p.armR = -1.5 + Math.sin(t * 16) * 0.4; p.armL = -1.2; p.lean = -0.18; p.squash = Math.sin(t * 16) * 0.025; break;
    case 'row': p.armL = -0.9 + Math.sin(t * 6) * 0.7; p.armR = -0.9 - Math.sin(t * 6) * 0.7; p.legL = -1.45; p.legR = -1.45; p.lean = 0.12 + Math.sin(t * 6) * 0.08; p.sit = 1; break;
    case 'sit': p.legL = -1.45; p.legR = -1.45; p.armL = -0.5; p.armR = -0.5; p.bob = Math.sin(t * 1.5) * 0.01; p.sit = 1; break;
    case 'wave': case 'emo_wave': p.armRz = -2.6 + Math.sin(t * 12) * 0.35; p.bob = Math.abs(Math.sin(t * 6)) * 0.02; break;
    // Emotes (src/game/emotes.js): mismos huesos que las demás poses
    case 'emo_dance': { const s = Math.sin(t * 6); p.bob = Math.abs(s) * 0.07; p.armLz = 1.1 + s * 0.5; p.armRz = -1.1 - s * 0.5; p.legL = s * 0.35; p.legR = -s * 0.35; p.lean = s * 0.08; break; }
    case 'emo_clap': { const c = Math.abs(Math.sin(t * 12)); p.armL = -1.25; p.armR = -1.25; p.armLz = -(0.3 + c * 0.5); p.armRz = 0.3 + c * 0.5; p.bob = c * 0.015; break; }
    case 'emo_hug': p.armL = -0.9; p.armR = -0.9; p.armLz = -0.5; p.armRz = 0.5; p.lean = 0.12; p.squash = Math.sin(t * 2) * 0.012; break;
    case 'emo_laugh': { const s = Math.sin(t * 10); p.bob = Math.abs(s) * 0.05; p.squash = Math.sin(t * 20) * 0.03; p.lean = 0.1; p.armL = -0.9 + s * 0.2; p.armR = -0.9 - s * 0.2; break; }
    case 'emo_surprise': p.jump = Math.abs(Math.sin(t * 5)) * 0.12; p.armL = -2.8; p.armR = -2.8; p.lean = -0.04; break;
    case 'emo_heart': case 'love': p.jump = Math.abs(Math.sin(t * 6)) * 0.25; p.armLz = 2.4; p.armRz = -2.4; p.squash = Math.cos(t * 12) * 0.05; break;
    default: p.bob = Math.sin(t * 2) * 0.012; p.armL = Math.sin(t * 2) * 0.05; p.armR = -Math.sin(t * 2) * 0.05; p.squash = Math.sin(t * 2) * 0.012; p.hair = 0.015;
  }
  return p;
}

function Zzz({ getAnim }) {
  const [on, setOn] = useState(false);
  useFrame(() => { const a = getAnim ? getAnim() : null; const s = a === 'sleep' || a === 'emo_sleep'; if (s !== on) setOn(s); });
  return on ? <Html position={[0, 1.25, -0.8]} center style={{ pointerEvents: 'none' }} zIndexRange={[4, 0]}><div className="zzz"><span>z</span><span>z</span><span>Z</span></div></Html> : null;
}

const shade = (c, k) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();

function Eyes({ kind }) {
  return [-1, 1].map((s) => {
    const x = s * 0.125;
    if (kind === 1) return <P key={s} g={geo('Torus', 0.055, 0.014, 6, 12, Math.PI)} color={EYE} p={[x, -0.03, 0.31]} r={[0.1, 0, 0]} out={0} />;
    if (kind === 2) return (
      <group key={s}>
        <P g={SPH(0.065, 14, 12)} color={EYE} p={[x, -0.02, 0.295]} s={[0.95, 1.3, 0.5]} out={0} />
        <mesh geometry={SPH(0.042, 10, 8)} material={basicMat('#5b8dd9')} position={[x, -0.03, 0.322]} scale={[0.95, 1.2, 0.4]} />
        <mesh geometry={SPH(0.02, 8, 6)} material={basicMat('#ffffff')} position={[x + 0.02, 0.02, 0.335]} />
        <mesh geometry={SPH(0.011, 8, 6)} material={basicMat('#ffffff')} position={[x - 0.022, -0.04, 0.335]} />
      </group>
    );
    if (kind === 3) return (
      <group key={s}>
        <P g={SPH(0.05, 14, 12)} color={EYE} p={[x, -0.035, 0.3]} s={[1.05, 0.6, 0.5]} out={0} />
        <P g={geo('Box', 0.12, 0.02, 0.015)} color={EYE} p={[x, -0.008, 0.325]} r={[0, 0, s * -0.12]} out={0} />
      </group>
    );
    return (
      <group key={s}>
        <P g={SPH(0.05, 14, 12)} color={EYE} p={[x, -0.02, 0.3]} s={[0.95, 1.4, 0.5]} out={0} />
        <mesh geometry={SPH(0.017, 8, 6)} material={basicMat('#ffffff')} position={[x + 0.014, 0.018, 0.325]} />
      </group>
    );
  });
}

function Mouth({ kind }) {
  if (kind === 1) return (
    <group position={[0, -0.115, 0.31]}>
      <P g={SPH(0.04, 10, 8)} color="#7a2f3a" s={[1.1, 0.85, 0.4]} out={0} />
      <P g={SPH(0.022, 8, 6)} color="#f08a8a" p={[0, -0.014, 0.012]} s={[1.2, 0.6, 0.4]} out={0} />
    </group>
  );
  if (kind === 2) return (
    <group position={[0, -0.09, 0.322]}>
      {[-1, 1].map((s) => <P key={s} g={geo('Torus', 0.022, 0.007, 6, 10, Math.PI)} color="#8a4a4a" p={[s * 0.022, 0, 0]} r={[0, 0, Math.PI]} out={0} />)}
    </group>
  );
  return <P g={geo('Torus', 0.03, 0.008, 6, 14, Math.PI)} color="#8a4a4a" p={[0, -0.1, 0.318]} r={[0, 0, Math.PI]} out={0} />;
}

export default function Avatar({ avatar, getAnim, name, showName, status, spin }) {
  const root = useRef(), body = useRef(), aL = useRef(), aR = useRef(), lL = useRef(), lR = useRef(), eyes = useRef(), hair = useRef(), rod = useRef(), phase = useRef(Math.random() * 5);
  const a = normAvatar(avatar);
  const O = AVATAR_OPTS;
  const skin = O.skin[a.skin ?? 0] || O.skin[0];
  const hairC = O.hairColor[a.hairColor ?? 0] || O.hairColor[0];
  const top = O.top[a.top ?? 0] || O.top[0];
  const bottom = O.bottom[a.bottom ?? 0] || O.bottom[0];
  const shoe = O.shoes[a.shoes ?? 0] || O.shoes[0];
  const tStyle = a.topStyle ?? 0, bStyle = a.bottomStyle ?? 0;
  const dress = tStyle === 1;
  const bareLegs = dress || bStyle === 1;

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const anim = getAnim ? getAnim() : 'idle';
    const p = pose(anim, t);
    const r = root.current;
    if (r) {
      r.rotation.x = (-Math.PI / 2) * p.lie;
      r.position.y = p.bob + p.jump + 0.74 * p.lie - 0.14 * p.sit;
      r.scale.set(1 - p.squash * 0.6, 1 + p.squash, 1 - p.squash * 0.6);
      if (spin) r.rotation.y = t * 0.8;
    }
    if (body.current) body.current.rotation.x = p.lean;
    if (aL.current) { aL.current.rotation.x = p.armL; aL.current.rotation.z = p.armLz; }
    if (aR.current) { aR.current.rotation.x = p.armR; aR.current.rotation.z = p.armRz; }
    if (lL.current) lL.current.rotation.x = p.legL;
    if (lR.current) lR.current.rotation.x = p.legR;
    if (hair.current) hair.current.rotation.x = Math.sin(t * 3 + phase.current) * p.hair;
    if (rod.current) rod.current.visible = anim === 'fish' || anim === 'reel';
    // parpadeo cada ~3.5 s
    if (eyes.current) { const b = (t + phase.current) % 3.5; eyes.current.scale.y = b < 0.12 ? 0.12 : 1; }
  });

  const sleeveR = tStyle === 2 ? 0.07 : 0.058;
  const arm = (side, ref) => (
    <group ref={ref} position={[side * 0.25, 0.32, 0]}>
      <P g={geo('Capsule', sleeveR, 0.13, 6, 10)} color={tStyle === 2 ? shade(top, 0.95) : top} p={[0, -0.12, 0]} />
      <P g={SPH(0.058, 12, 10)} color={skin} p={[0, -0.27, 0]} />
      {side === 1 && (
        <group ref={rod} visible={false} position={[0, -0.79, 0.54]} rotation={[2.33, 0, 0]}>
          <P g={geo('Cylinder', 0.012, 0.022, 1.5, 6)} color="#8a5e3c" out={0.15} />
          <P g={SPH(0.03, 6, 5)} color="#e0524a" p={[0, 0.75, 0]} out={0} />
        </group>
      )}
    </group>
  );
  const leg = (side, ref) => (
    <group ref={ref} position={[side * 0.1, 0.26, 0]}>
      {bStyle === 2 && !dress ? (<>
        <P g={geo('Cylinder', 0.075, 0.08, 0.11, 10)} color={bottom} p={[0, -0.035, 0]} />
        <P g={geo('Cylinder', 0.058, 0.058, 0.1, 10)} color={skin} p={[0, -0.14, 0]} />
      </>) : bareLegs ? (
        <P g={geo('Cylinder', 0.058, 0.058, 0.2, 10)} color={skin} p={[0, -0.08, 0]} />
      ) : (
        <P g={geo('Cylinder', 0.07, 0.075, 0.2, 10)} color={bottom} p={[0, -0.08, 0]} />
      )}
      <P g={SPH(0.09, 12, 10)} color={shoe} p={[0, -0.2, 0.035]} s={[1.05, 0.7, 1.5]} />
    </group>
  );

  return (
    <>
    <group ref={root}>
      {leg(-1, lL)}{leg(1, lR)}
      <group ref={body} position={[0, 0.26, 0]}>
        <P g={SPH(0.23, 20, 16)} color={top} p={[0, 0.18, 0]} s={tStyle === 2 ? [1.1, 1.08, 1] : [1, 1.05, 0.9]} />
        <P g={geo('Cylinder', 0.2, 0.215, 0.11, 16)} color={dress ? top : bottom} p={[0, 0.03, 0]} />
        {dress && <P g={geo('Cylinder', 0.2, 0.34, 0.3, 18)} color={top} p={[0, -0.09, 0]} />}
        {!dress && bStyle === 1 && <P g={geo('Cylinder', 0.2, 0.31, 0.2, 18)} color={bottom} p={[0, -0.04, 0]} />}
        {tStyle === 2 && (<>
          <P g={SPH(0.16, 12, 10)} color={shade(top, 0.9)} p={[0, 0.4, -0.13]} s={[1.25, 0.85, 0.8]} />
          <P g={geo('Box', 0.24, 0.09, 0.05)} color={shade(top, 0.85)} p={[0, 0.06, 0.2]} out={0.04} />
        </>)}
        {tStyle === 3 && (<>
          <P g={geo('Box', 0.27, 0.22, 0.05)} color={bottom} p={[0, 0.15, 0.2]} r={[-0.18, 0, 0]} out={0.04} />
          {[-1, 1].map((s) => <P key={s} g={geo('Box', 0.04, 0.26, 0.04)} color={bottom} p={[s * 0.1, 0.3, 0.15]} r={[-0.5, 0, 0]} out={0} />)}
          {[-1, 1].map((s) => <P key={'b' + s} g={SPH(0.022, 6, 5)} color="#f2c94c" p={[s * 0.1, 0.27, 0.205]} out={0} />)}
        </>)}
        {tStyle === 4 && (<>
          {[0.08, 0.18, 0.28].map((y, i) => <P key={i} g={SPH(0.02, 6, 5)} color="#f2c94c" p={[0, y, 0.21 - i * 0.012]} out={0} />)}
          {[-1, 1].map((s) => <P key={s} g={geo('Cone', 0.06, 0.12, 4)} color="#fbf6ee" p={[s * 0.08, 0.38, 0.14]} r={[Math.PI, 0, s * 0.6]} out={0.05} />)}
          <P g={geo('Box', 0.02, 0.26, 0.02)} color={shade(top, 0.7)} p={[0, 0.17, 0.215]} out={0} />
        </>)}
        {a.back > 0 && <BackWear kind={a.back} />}
        {arm(-1, aL)}{arm(1, aR)}
        {/* cabeza grande (chibi) */}
        <group position={[0, 0.6, 0]}>
          <P g={SPH(0.34, 28, 20)} color={skin} s={[1, 0.93, 0.97]} />
          {[-1, 1].map((s) => <P key={s} g={SPH(0.06, 10, 8)} color={skin} p={[s * 0.33, -0.03, 0]} out={0.1} />)}
          <group ref={eyes}><Eyes kind={a.eyes ?? 0} /></group>
          {[-1, 1].map((s) => <P key={s} g={geo('Box', 0.075, 0.017, 0.016)} color={EYE} p={[s * 0.125, 0.095, 0.31]} r={[0, 0, s * -0.18]} out={0} />)}
          {[-1, 1].map((s) => <mesh key={s} geometry={geo('Circle', a.cheeks === 2 ? 0.062 : 0.048, 14)} material={basicMat('#f08a8a', { transparent: true, opacity: a.cheeks === 2 ? 0.85 : 0.55 })} position={[s * 0.2, -0.09, 0.285]} rotation={[0, s * 0.55, 0]} />)}
          {a.cheeks === 1 && [[-0.17, -0.03], [-0.12, -0.05], [-0.22, -0.055], [0.17, -0.03], [0.12, -0.05], [0.22, -0.055]].map(([x, y], i) => (
            <mesh key={i} geometry={SPH(0.012, 6, 5)} material={basicMat(shade(skin, 0.62))} position={[x, y, 0.318 - Math.abs(x) * 0.45]} />
          ))}
          <Mouth kind={a.mouth ?? 0} />
          <group ref={hair}><Hair style={a.hair ?? 0} color={hairC} /></group>
          <HatWear kind={a.hat ?? 0} hairC={hairC} />
          <GlassesWear kind={a.glasses ?? 0} />
          <NeckWear kind={a.neck ?? 0} />
        </group>
      </group>
      {showName && (
        <Html position={[0, 1.55, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[5, 0]}>
          <div className="nametag">{name}{status ? <span className="nt-status">{status}</span> : null}</div>
        </Html>
      )}
    </group>
    <Zzz getAnim={getAnim} />
    </>
  );
}
