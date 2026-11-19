// Pruebas de firestore.rules contra el emulador. Ejecutar con `npm run test:rules`
// (arranca el emulador con `firebase emulators:exec`). NO usa Firebase real.
import { test, before, after, beforeEach, describe } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, writeBatch, increment, arrayUnion, arrayRemove, deleteField, collection, getDocs } from 'firebase/firestore';

const A = 'uidA', B = 'uidB', C = 'uidC', CID = 'casa1';
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-nuestra-casita',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(async () => { await env.cleanup(); });

const baseCouple = (members = [A, B]) => ({
  schemaVersion: 1, members, inviteCode: 'ABC234', seed: 12345, startedAt: 1700000000000,
  hearts: 50, heartsTotal: 200, coins: 300,
  inventory: { wood: 5, tomato: 10 }, skills: { farm: 3 }, upgrades: {},
  players: { [A]: { name: 'Ana', energy: 80 }, [B]: { name: 'Beto', energy: 70 } },
  daily: {}, explored: '0'.repeat(400),
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'couples', CID), baseCouple());
    await setDoc(doc(ctx.firestore(), 'invites', 'ABC234'), { coupleId: CID, owner: A });
    await setDoc(doc(ctx.firestore(), 'couples', CID, 'gifts', 'g1'), { from: B, kind: 'coins', n: 50, foundBy: null, at: 1 });
    await setDoc(doc(ctx.firestore(), 'couples', CID, 'gifts', 'g2'), { from: A, kind: 'coins', n: 50, foundBy: null, at: 1 });
    await setDoc(doc(ctx.firestore(), 'couples', CID, 'mailbox', 'l1'), { from: B, to: A, text: 'hola', readAt: null, at: 1 });
    await setDoc(doc(ctx.firestore(), 'couples', CID, 'chat', 'c1'), { from: B, text: 'hola', at: 1 });
    await setDoc(doc(ctx.firestore(), 'couples', CID, 'crops', '3_4'), { type: 'tomato', x: 3, z: 4, by: B, harvested: false });
  });
});

const fsOf = (uid) => env.authenticatedContext(uid).firestore();
const root = (fs) => doc(fs, 'couples', CID);
const sub = (fs, col, id) => doc(fs, 'couples', CID, col, id);

// Misma forma que firebaseBackend.write(): un solo update con increment() y rutas con puntos + lote de subcolecciones.
const write = (fs, { sets = [], dels = [], root: r = {} }) => {
  const b = writeBatch(fs);
  for (const [col, id, data] of sets) b.set(sub(fs, col, id), data, { merge: true });
  for (const [col, id] of dels) b.delete(sub(fs, col, id));
  if (Object.keys(r).length) b.update(root(fs), r);
  return b.commit();
};

describe('PERMITIDO: escrituras reales del juego', () => {
  test('cosechar: cultivo + inventario + stats + xp + corazones + daily', async () => {
    await assertSucceeds(write(fsOf(A), {
      sets: [['crops', '3_4', { harvested: true, harvestedAt: 5 }]],
      root: { 'inventory.tomato': increment(2), 'stats.2026-W47.harvest': increment(1), 'skills.farm': increment(2),
        hearts: increment(3), heartsTotal: increment(3), 'daily.uidA': { date: '2026-11-19', harvest: 3 } },
    }));
  });
  test('vender: inventario baja y monedas suben', () => assertSucceeds(write(fsOf(A), {
    root: { 'inventory.tomato': increment(-10), coins: increment(120), 'stats.2026-W47.sell': increment(10) } })));
  test('vender TODO un inventario enorme (hasta el tope de 100.000)', () => assertSucceeds(write(fsOf(A), { root: { coins: increment(99000) } })));
  test('entregar pedido: monedas + corazones + orders.<día>.<slot> + unlocks', () => assertSucceeds(write(fsOf(A), {
    root: { 'inventory.tomato': increment(-3), coins: increment(80), hearts: increment(6), heartsTotal: increment(6),
      'orders.20411.0': A, 'unlocks.hat_7': true } })));
  test('adoptar animal (set en animals + gasto de inventario/monedas)', () => assertSucceeds(write(fsOf(A), {
    sets: [['animals', 'a1', { type: 'hen', name: 'Clara', bornAt: 1 }]], root: { coins: increment(-120), 'inventory.egg': increment(-1) } })));
  test('comprar decoración con 💗', () => assertSucceeds(write(fsOf(A), {
    sets: [['decor', 'd1', { type: 'fountain', x: 1, z: 2, by: A }]], root: { hearts: increment(-40), 'inventory.stone': increment(-2) } })));
  test('retirar decoración con reembolso de 💗', () => assertSucceeds(write(fsOf(A), {
    dels: [['decor', 'd0']], root: { hearts: increment(40) } })));
  test('patch de explored (niebla)', () => assertSucceeds(write(fsOf(A), { root: { explored: '1'.repeat(400) } })));
  test('patch de discovered / digs / unlocks / upgrades con ruta con puntos', () => assertSucceeds(write(fsOf(B), {
    root: { 'discovered.lighthouse': B, 'digs.20411.3': B, 'upgrades.rod': 2, coins: increment(-250) } })));
  test('energía propia (vitalsPatch) y lastSeenAt / chatSeen / avatar propios', () => assertSucceeds(write(fsOf(A), {
    root: { 'players.uidA.energy': 60, 'players.uidA.energyAt': 99, 'players.uidA.full': 10, 'players.uidA.lastSeenAt': 5,
      'players.uidA.chatSeen': 7, 'players.uidA.avatar': { skin: 1 }, 'players.uidA.outfits': [] } })));
  test('cofre semanal / álbum / explorador (monedas + corazones)', () => assertSucceeds(write(fsOf(A), {
    root: { chestWeek: 2900, coins: increment(300), hearts: increment(8), heartsTotal: increment(8), 'inventory.pearl': increment(1) } })));
  test('citas, familia, barco y evento (patch de objetos y null)', () => assertSucceeds(write(fsOf(A), {
    root: { date: { state: 'active' }, 'family.plan': { by: A, at: 1 }, boat: { x: 1, z: 2, rot: 0, at: 3 }, 'events.20411.score.uidA': 40 } })));
  test('irse de la casita (members sin uno mismo + borrar su players)', () => assertSucceeds(
    updateDoc(root(fsOf(A)), { members: arrayRemove(A), 'players.uidA': deleteField() })));

  test('crear pareja con el estado inicial', async () => {
    await assertSucceeds(setDoc(doc(fsOf(C), 'couples', 'nueva'), {
      schemaVersion: 1, members: [C], inviteCode: 'ZZZ999', seed: 5000, startedAt: 1, hearts: 20, heartsTotal: 20,
      inventory: { wood: 3 }, players: { [C]: { name: 'Cris' } }, daily: {} }));
  });
  test('unirse a una pareja con 1 miembro (arrayUnion + players propio)', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'couples', 'sola'), { ...baseCouple([A]), players: { [A]: { name: 'Ana' } } }));
    await assertSucceeds(updateDoc(doc(fsOf(B), 'couples', 'sola'), { members: arrayUnion(B), 'players.uidB': { name: 'Beto' } }));
  });
  test('users/{uid} propio e invites (crear / get)', async () => {
    await assertSucceeds(setDoc(doc(fsOf(C), 'users', C), { coupleId: 'x' }));
    await assertSucceeds(setDoc(doc(fsOf(C), 'invites', 'NEW234'), { coupleId: 'x', owner: C }));
    await assertSucceeds(getDoc(doc(fsOf(C), 'invites', 'ABC234')));
  });
  test('chat: enviar mensaje propio (≤ 400)', () => assertSucceeds(setDoc(sub(fsOf(A), 'chat', 'c2'), { from: A, text: 'x'.repeat(400), at: 2 }, { merge: true })));
  test('buzón: enviar carta y marcarla como leída (solo la receptora)', async () => {
    await assertSucceeds(setDoc(sub(fsOf(A), 'mailbox', 'l2'), { from: A, to: B, text: 'hey', image: null, quick: false, at: 2, readAt: null }, { merge: true }));
    await assertSucceeds(setDoc(sub(fsOf(A), 'mailbox', 'l1'), { readAt: 9 }, { merge: true }));
  });
  test('regalos: esconder, encontrar el de la pareja y recuperar el propio', async () => {
    await assertSucceeds(write(fsOf(A), { sets: [['gifts', 'g3', { from: A, kind: 'coins', n: 20, note: 'ñ', foundBy: null, at: 3 }]], root: { coins: increment(-20) } }));
    await assertSucceeds(write(fsOf(A), { sets: [['gifts', 'g1', { foundBy: A, foundAt: 4 }]], root: { coins: increment(50), hearts: increment(6), heartsTotal: increment(6) } }));
    await assertSucceeds(write(fsOf(A), { dels: [['gifts', 'g2']], root: { coins: increment(50) } }));
  });
  test('crear documentos en una colección nueva (comodín)', () => assertSucceeds(setDoc(sub(fsOf(A), 'coleccionNueva', 'x'), { v: 1 })));
  test('leer y listar subcolecciones siendo miembro', async () => {
    await assertSucceeds(getDoc(root(fsOf(B))));
    await assertSucceeds(getDocs(collection(fsOf(B), 'couples', CID, 'crops')));
  });
});

describe('DENEGADO: trampas y accesos ajenos', () => {
  test('subirse 1.000.000 de monedas', () => assertFails(updateDoc(root(fsOf(A)), { coins: increment(1000000) })));
  test('poner monedas con un valor absoluto enorme', () => assertFails(updateDoc(root(fsOf(A)), { coins: 9999999 })));
  test('monedas negativas / no enteras', async () => {
    await assertFails(updateDoc(root(fsOf(A)), { coins: increment(-1000) }));
    await assertFails(updateDoc(root(fsOf(A)), { coins: 10.5 }));
  });
  test('corazones: salto enorme y negativos', async () => {
    await assertFails(updateDoc(root(fsOf(A)), { hearts: increment(100000), heartsTotal: increment(100000) }));
    await assertFails(updateDoc(root(fsOf(A)), { hearts: increment(-9999) }));
  });
  test('heartsTotal nunca baja', () => assertFails(updateDoc(root(fsOf(A)), { heartsTotal: 10 })));
  test('escribir en la entrada de players de la pareja', async () => {
    await assertFails(updateDoc(root(fsOf(A)), { 'players.uidB.name': 'Hackeada' }));
    await assertFails(updateDoc(root(fsOf(A)), { 'players.uidB': deleteField() }));
  });
  test('cambiar members, seed, startedAt, inviteCode', async () => {
    await assertFails(updateDoc(root(fsOf(A)), { members: [A, B, C] }));
    await assertFails(updateDoc(root(fsOf(A)), { members: arrayRemove(B) })); // expulsar a la pareja
    await assertFails(updateDoc(root(fsOf(A)), { seed: 1 }));
    await assertFails(updateDoc(root(fsOf(A)), { startedAt: 0 }));
    await assertFails(updateDoc(root(fsOf(A)), { inviteCode: 'HACK22' }));
  });
  test('una persona ajena no puede unirse a una casita completa', async () => {
    await assertFails(updateDoc(root(fsOf(C)), { members: arrayUnion(C), 'players.uidC': { name: 'Intrusa' } }));
  });
  test('unirse a una casita con 1 miembro tocando otros campos o players ajenos', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'couples', 'sola'), { ...baseCouple([A]), players: { [A]: { name: 'Ana' } } }));
    await assertFails(updateDoc(doc(fsOf(C), 'couples', 'sola'), { members: arrayUnion(C), 'players.uidC': { name: 'C' }, coins: increment(50000) }));
    await assertFails(updateDoc(doc(fsOf(C), 'couples', 'sola'), { members: arrayUnion(C), 'players.uidA.name': 'robada' }));
  });
  test('no miembro: leer y escribir', async () => {
    await assertFails(getDoc(root(fsOf(C))));
    await assertFails(getDoc(sub(fsOf(C), 'crops', '3_4')));
    await assertFails(updateDoc(root(fsOf(C)), { coins: increment(1) }));
    await assertFails(setDoc(sub(fsOf(C), 'chat', 'x'), { from: C, text: 'hola', at: 1 }));
  });
  test('sin sesión', async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(root(anon)));
    await assertFails(updateDoc(root(anon), { coins: increment(1) }));
  });
  test('borrar la pareja', () => assertFails(deleteDoc(root(fsOf(A)))));
  test('crear pareja con monedas de partida absurdas o miembros ajenos', async () => {
    await assertFails(setDoc(doc(fsOf(C), 'couples', 'n1'), { members: [C], coins: 999999, players: { [C]: { name: 'C' } } }));
    await assertFails(setDoc(doc(fsOf(C), 'couples', 'n2'), { members: [A], players: { [A]: { name: 'A' } } }));
  });
  test('chat: suplantar a la pareja, texto largo, editar y borrar', async () => {
    await assertFails(setDoc(sub(fsOf(A), 'chat', 'c3'), { from: B, text: 'yo soy Beto', at: 1 }));
    await assertFails(setDoc(sub(fsOf(A), 'chat', 'c4'), { from: A, text: 'x'.repeat(401), at: 1 }));
    await assertFails(updateDoc(sub(fsOf(A), 'chat', 'c1'), { text: 'editado' }));
    await assertFails(deleteDoc(sub(fsOf(A), 'chat', 'c1')));
  });
  test('buzón: suplantar y marcar como leída una carta que no es tuya', async () => {
    await assertFails(setDoc(sub(fsOf(A), 'mailbox', 'l3'), { from: B, to: A, text: 'falsa', at: 1 }));
    await assertFails(setDoc(sub(fsOf(B), 'mailbox', 'l1'), { readAt: 9 }, { merge: true })); // B es la remitente
    await assertFails(setDoc(sub(fsOf(A), 'mailbox', 'l1'), { text: 'cambiada' }, { merge: true }));
  });
  test('regalos: suplantar, encontrar el propio, reclamar dos veces o borrar el ajeno', async () => {
    await assertFails(setDoc(sub(fsOf(A), 'gifts', 'g4'), { from: B, kind: 'coins', n: 1, at: 1 }));
    await assertFails(setDoc(sub(fsOf(A), 'gifts', 'g2'), { foundBy: A, foundAt: 1 }, { merge: true }));
    await assertFails(deleteDoc(sub(fsOf(A), 'gifts', 'g1')));
    await env.withSecurityRulesDisabled((ctx) => setDoc(sub(ctx.firestore(), 'gifts', 'g1'), { foundBy: B, foundAt: 2 }, { merge: true }));
    await assertFails(setDoc(sub(fsOf(A), 'gifts', 'g1'), { foundBy: A, foundAt: 3 }, { merge: true }));
  });
  test('crear con by de otra persona (cultivo, decoración, actividad)', async () => {
    await assertFails(setDoc(sub(fsOf(A), 'crops', '9_9'), { type: 'tomato', by: B }, { merge: true }));
    await assertFails(setDoc(sub(fsOf(A), 'activity', 'e1'), { by: B, kind: 'x', at: 1 }));
  });
});
