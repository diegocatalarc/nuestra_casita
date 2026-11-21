// Gancho del descubrimiento progresivo: devuelve una función `unlocked('funcion')` que se actualiza cuando cambia el capítulo
// o el ajuste «Mostrar todas las funciones» (uiTick). Ver game/unlocks.js.
import { useGame } from '../store/gameStore';
import { isUnlocked } from '../game/unlocks';

export function useUnlocked() {
  const couple = useGame((s) => s.couple);
  useGame((s) => s.uiTick); // el ajuste de Ajustes fuerza un nuevo cálculo
  return (id) => isUnlocked(couple, id);
}
