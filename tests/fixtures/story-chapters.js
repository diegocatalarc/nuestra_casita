// Capítulos de ejemplo SOLO para pruebas (los reales los escribe el chat de contenido en src/game/story/chapters.js).
export const FIX = [
  { id: 'c1', title: 'Bienvenida', from: 'remedios', letter: 'Hola.', reward: { coins: 100, hearts: 5, items: { wood: 3 }, unlock: 'shop:bakery', piece: 1 },
    steps: [
      { id: 'talk', text: 'Habla con Remedios', cond: { type: 'talk', npc: 'remedios' } },
      { id: 'harvest', text: 'Cosecha 3', cond: { type: 'stat', metric: 'harvest', n: 3 } },
      { id: 'give', text: 'Entrega 2 de trigo', cond: { type: 'deliver', item: 'wheat', n: 2 } },
    ] },
  { id: 'c2', title: 'El horno', from: 'rosa', letter: 'Pan.', reward: { coins: 50 },
    steps: [{ id: 'sell', text: 'Vende 2', cond: { type: 'stat', metric: 'sell', n: 2 } }] },
];
