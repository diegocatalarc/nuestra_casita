// Gancho del descubrimiento progresivo: devuelve una función `unlocked('funcion')` (con `.ids()`) que se actualiza cuando cambia
// el capítulo, lo que la pareja ya usa o el ajuste «Pantalla limpia» (uiTick). Ver game/unlocks.js.
import { useMemo } from 'react';
import { useGame } from '../store/gameStore';
import { isUnlocked, unlockedIds, evidenceFeatures } from '../game/unlocks';

const sum = (o) => Object.values(o || {}).reduce((n, w) => n + (+w || 0), 0);
const totalStat = (couple, metric) => Object.values(couple?.stats || {}).reduce((n, w) => n + ((w && w[metric]) || 0), 0);

/** Firma numérica de lo que ya usa la pareja (cambia solo cuando hay algo nuevo, evita renders de más). */
function evidenceKey(s) {
  const c = s.couple || {};
  return [
    Object.keys(s.animals || {}).length, Object.keys(s.children || {}).length,
    Object.values(s.buildings || {}).filter((b) => b.type !== 'house').length, Object.keys(s.decor || {}).length,
    Object.keys(s.memories || {}).length, Object.keys(s.questLog || {}).length, Object.keys(s.mailbox || {}).length,
    Object.keys(c.fishLog || {}).length, Object.keys(c.zones || {}).length, Object.keys(c.discovered || {}).length,
    totalStat(c, 'craft'), totalStat(c, 'sell'), totalStat(c, 'hug'), totalStat(c, 'date'),
  ].join(',');
}

export function useUnlocked() {
  const couple = useGame((s) => s.couple);
  useGame((s) => s.uiTick); // el ajuste de Ajustes fuerza un nuevo cálculo
  const key = useGame(evidenceKey);
  const evidence = useMemo(() => {
    const [animals, children, buildings, decor, memories, quests, mails, fish, zones, discovered, crafted, sold, hugs, dates] = key.split(',').map(Number);
    return evidenceFeatures({ animals, children, buildings, decor, memories, quests, mails, fish, zones, discovered, crafted, sold, hugs, dates });
  }, [key]);
  const f = (id) => isUnlocked(couple, id, { evidence });
  f.ids = () => unlockedIds(couple, { evidence });
  return f;
}
