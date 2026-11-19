import { describe, it, expect } from 'vitest';
import { currentTutorialStep } from '../src/ui/Tutorial';

// Estado mínimo de ejemplo: solo los campos que leen los pasos del tutorial.
const ME = 'me';
const baseState = () => ({
  user: { uid: ME },
  crops: {}, nodes: {}, buildings: {}, questLog: {},
  couple: { players: { [ME]: {} }, stats: {}, orders: {}, fishLog: {}, heartsTotal: 0 },
});

// Cada paso del tutorial y el cambio mínimo en el estado que lo completa, en orden.
const PROGRESS = {
  plant: (s) => { s.crops.c1 = { by: ME }; },
  water: (s) => { s.crops.c1.wateredAt = 1; },
  gather: (s) => { s.nodes.n1 = { until: 1 }; },
  build: (s) => { s.buildings.b1 = { type: 'terrace' }; },
  quest: (s) => { s.questLog.q1 = { answers: { [ME]: 'sí' } }; },
  sell: (s) => { s.couple.stats = { '2026-W46': { sell: 2 } }; },
  order: (s) => { s.couple.orders = { 20261119: { 1: ME } }; },
  fish: (s) => { s.couple.fishLog = { carp: 1 }; },
  eat: (s) => { s.couple.players[ME].lastEatAt = 123; },
  hearts: (s) => { s.couple.heartsTotal = 50; },
};
const ORDER = ['move', 'plant', 'water', 'gather', 'build', 'quest', 'sell', 'order', 'fish', 'eat', 'hearts'];

describe('currentTutorialStep', () => {
  it('empieza en "move" y pasa a "plant" cuando la persona se ha movido', () => {
    const s = baseState();
    expect(currentTutorialStep(s, false).id).toBe('move');
    expect(currentTutorialStep(s, true).id).toBe('plant');
  });

  it('avanza paso a paso según se completa el estado del juego', () => {
    const s = baseState();
    expect(currentTutorialStep(s, true).id).toBe('plant');
    for (let i = 1; i < ORDER.length - 1; i++) {
      PROGRESS[ORDER[i]](s);
      expect(currentTutorialStep(s, true).id).toBe(ORDER[i + 1]);
    }
    PROGRESS.hearts(s);
    expect(currentTutorialStep(s, true)).toBeUndefined();
  });

  it('un pedido o una pesca de la pareja no completan los pasos de la persona', () => {
    const s = baseState();
    s.couple.orders = { 20261119: { 1: 'partner' } };
    s.couple.stats = { '2026-W46': { sell: 0 } };
    expect(currentTutorialStep(s, true).id).toBe('plant');
    // Llegamos al paso de pedidos sin completar nada antes.
    Object.assign(s, { crops: { c1: { by: ME, wateredAt: 1 } }, nodes: { n1: {} }, buildings: { b1: { type: 'terrace' } }, questLog: { q1: { answers: { [ME]: 'sí' } } } });
    s.couple.stats = { '2026-W46': { sell: 1 } };
    expect(currentTutorialStep(s, true).id).toBe('order');
    s.couple.orders = { 20261119: { 1: 'partner' } };
    expect(currentTutorialStep(s, true).id).toBe('order');
  });
});
