import { gestureActive } from '../game/cameraControl';
import { useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useGame } from '../store/gameStore';
import { BUILDINGS, DECOR, MAP, TILE } from '../game/constants';
import { tileAt } from '../game/worldGen';
import { me } from '../game/runtime';
import { isPlantable, validateBuilding, validateDecor, decorSize } from '../game/logic';
import { walkTo, plantAt, placeBuilding, placeDecor, moveDecor, removeDecor, hug, wave, tillAt, untillAt, rotateDecor, recolorDecor, deleteSelectedDecor, castLine, reelIn, cancelFish, leaveBoat } from '../game/actions';
import { serverNow } from '../game/time';
import { isTyping } from '../game/input';
import { Ghost } from './Decor';
import { t } from '../i18n';

const Tile = ({ x, z, c, o = 0.4 }) => (
  <mesh position={[x + 0.5, 0.06, z + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[0.94, 0.94]} /><meshBasicMaterial color={c} transparent opacity={o} depthWrite={false} />
  </mesh>
);

let lastDrop = 0;

export default function Interaction() {
  const s = useGame();
  const { tool, buildSel, decorSel, dragId, hover, decorRot, decorVariant, seedSel, world } = s;

  // Teclado de edición
  useEffect(() => {
    const onKey = (e) => {
      if (isTyping()) return;
      const g = useGame.getState();
      if (e.code === 'Escape') { cancelFish(); g.setTool('interact'); g.set({ panel: null }); }
      else if (e.code === 'Space' && me.fish) { e.preventDefault(); reelIn(); }
      else if (e.code === 'KeyF' && me.boat) leaveBoat();
      else if (e.code === 'KeyR' && (g.tool === 'decor')) rotateDecor(e.shiftKey ? -1 : 1);
      else if (e.code === 'KeyC' && (g.tool === 'decor')) recolorDecor();
      else if ((e.code === 'KeyX' || e.code === 'Delete' || e.code === 'Backspace') && g.tool === 'decor' && g.selId) deleteSelectedDecor();
      else if (e.code === 'KeyH') hug();
      else if (e.code === 'KeyG') wave();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Soltar un objeto arrastrado (el oyente es permanente: un clic rápido no se pierde)
  useEffect(() => {
    const up = (ev) => {
      const g = useGame.getState();
      if (!g.dragId) return;
      // un simple toque selecciona; arrastrar (o el modo "mover") coloca
      const ds = g.dragStart;
      const click = !g.moveMode && ds && Math.hypot(ev.clientX - ds.x, ev.clientY - ds.y) < 8;
      if (!click && g.hover) moveDecor(g.dragId, g.hover.x, g.hover.z, g.decorRot, g.decorVariant);
      lastDrop = performance.now();
      g.set({ dragId: null, moveMode: false, dragStart: null });
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  const onMove = (e) => {
    const p = e.point;
    const hv = { x: Math.round(p.x * 2) / 2, z: Math.round(p.z * 2) / 2, tx: Math.floor(p.x), tz: Math.floor(p.z) };
    const h = useGame.getState().hover;
    if (!h || h.x !== hv.x || h.z !== hv.z || h.tx !== hv.tx || h.tz !== hv.tz) useGame.setState({ hover: hv });
  };

  const onClick = (e) => {
    if (gestureActive()) return; // fin de un pellizco o giro con dos dedos: no es un toque
    const g = useGame.getState();
    const tx = Math.floor(e.point.x), tz = Math.floor(e.point.z);
    if (tx < 0 || tz < 0 || tx >= MAP || tz >= MAP) return;
    if (me.fish && (g.tool === 'fish' || g.tool === 'interact')) { reelIn(); return; }
    const water = tileAt(g.world, tx, tz) === TILE.WATER;
    if (g.tool === 'fish') { if (water) castLine(tx, tz); else if (me.boat) walkTo(tx, tz); else { g.toast(t("🎣 Lanza la caña al agua 🌊")); walkTo(tx, tz); } }
    else if (g.tool === 'interact') { if (water && !me.boat) castLine(tx, tz); else walkTo(tx, tz); }
    else if (g.tool === 'plant') { if (g.seedSel === 'till') tillAt(tx, tz); else if (g.seedSel === 'untill') untillAt(tx, tz); else plantAt(tx, tz, g.seedSel); }
    else if (g.tool === 'build' && g.buildSel) {
      const def = BUILDINGS[g.buildSel];
      placeBuilding(g.buildSel, tx - Math.floor(def.w / 2), tz - Math.floor(def.d / 2));
    } else if (g.tool === 'decor' && g.decorSel && g.hover) placeDecor(g.decorSel, g.hover.x, g.hover.z, g.decorRot, g.decorVariant);
    else if (g.tool === 'decor' && !g.decorSel && g.selId && performance.now() - lastDrop > 400) g.set({ selId: null });
  };

  const now = serverNow();
  let overlay = null;
  if (hover) {
    if (tool === 'plant') {
      const tkey = `${hover.tx}_${hover.tz}`, ttile = tileAt(world, hover.tx, hover.tz);
      const ok = seedSel === 'till' ? (ttile === TILE.GRASS || ttile === TILE.MEADOW) && !s.soil[tkey] && !world.byTile.has(tkey)
        : seedSel === 'untill' ? !!s.soil[tkey]
        : isPlantable(world, s.buildings, hover.tx, hover.tz, seedSel, s.soil) && !(s.crops[`${hover.tx}_${hover.tz}`] && !s.crops[`${hover.tx}_${hover.tz}`].harvested);
      overlay = <Tile x={hover.tx} z={hover.tz} c={ok ? '#4ade80' : '#ff5a5a'} />;
    } else if (tool === 'build' && buildSel) {
      const def = BUILDINGS[buildSel];
      const ox = hover.tx - Math.floor(def.w / 2), oz = hover.tz - Math.floor(def.d / 2);
      const v = validateBuilding(world, s, buildSel, ox, oz, now);
      overlay = (
        <group position={[ox + def.w / 2, 0, oz + def.d / 2]}>
          <mesh position={[0, 0.7, 0]}><boxGeometry args={[def.w - 0.04, 1.4, def.d - 0.04]} /><meshBasicMaterial color={v.ok ? '#4ade80' : '#ff5a5a'} transparent opacity={0.3} depthWrite={false} /></mesh>
          <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[def.w, def.d]} /><meshBasicMaterial color={v.ok ? '#4ade80' : '#ff5a5a'} transparent opacity={0.45} depthWrite={false} /></mesh>
          <Html position={[0, 1.8, 0]} center style={{ pointerEvents: 'none' }}><div className={`bubble wide ${v.ok ? '' : 'bad'}`}>{def.emoji} {def.label}{v.ok ? '' : ` · ${v.reason}`}</div></Html>
        </group>
      );
    } else if (tool === 'decor' && (decorSel || dragId)) {
      const type = decorSel || s.decor[dragId]?.type;
      if (type) {
        const v = validateDecor(world, s, type, hover.x, hover.z, decorRot, dragId, now);
        overlay = <Ghost type={type} variant={decorVariant} rot={decorRot} x={hover.x} z={hover.z} valid={v.ok} />;
      }
    } else if (tool === 'fish') {
      overlay = <Tile x={hover.tx} z={hover.tz} c={tileAt(world, hover.tx, hover.tz) === TILE.WATER ? '#5ab8ff' : '#ffffff'} o={0.35} />;
    } else if (tool === 'interact') overlay = <Tile x={hover.tx} z={hover.tz} c="#ffffff" o={0.22} />;
  }

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MAP / 2, 0.0, MAP / 2]} onPointerMove={onMove} onPointerDown={onMove} onClick={onClick}>
        <planeGeometry args={[MAP, MAP]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {overlay}
    </group>
  );
}
