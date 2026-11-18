import { t } from '../i18n';
import { CRAFT_DEF } from './craftParts';

// Todas las "reglas" del juego en datos. Cambiar el balance = editar este archivo.

export const MAP_BASE = 50; // el terreno inicial
export const MAP = 80; // con las ampliaciones
export const TILE = { GRASS: 0, MEADOW: 1, FOREST: 2, WATER: 3, SAND: 4, SOIL: 5, PATH: 6, BRIDGE: 7, VOID: 8 };

/** Ampliaciones de terreno (se compran con monedas). Los rectángulos son [x0,z0,x1,z1) en casillas. */
export const ZONES = {
  east: { id: 'east', emoji: '🌾', label: t("Pradera del Este"), rect: [50, 0, 80, 50], gate: [46, 22, 50, 26], needs: null, coins: 0, items: {}, free: true,
    desc: t("30×50 casillas de pradera con un estanque para pescar, flores y algodón.") },
  south: { id: 'south', emoji: '🌲', label: t("Valle del Sur"), rect: [0, 50, 50, 80], gate: [24, 43, 28, 50], needs: null, coins: 0, items: {}, free: true,
    desc: t("50×30 casillas donde el río se abre en una bahía con islas, y mucho sitio para construir.") },
  southeast: { id: 'southeast', emoji: '⛰️', label: t("Colinas del Sureste"), rect: [50, 50, 80, 80], gate: null, needs: null, coins: 900, items: { crystal: 8 },
    desc: t("30×30 casillas de colinas con cristales, rocas, setas y la entrada de la mina.") },
};

export const SEASONS = [
  { id: 'spring', label: t("Primavera"), emoji: '🌸' },
  { id: 'summer', label: t("Verano"), emoji: '☀️' },
  { id: 'autumn', label: t("Otoño"), emoji: '🍂' },
  { id: 'winter', label: t("Invierno"), emoji: '❄️' },
];

export const WEATHER_LABEL = { clear: t("Despejado"), rain: t("Lluvia"), storm: t("Tormenta"), snow: t("Nieve"), fog: t("Niebla") };
export const WEATHER_EMOJI = { clear: '☀️', rain: '🌧️', storm: '⛈️', snow: '❄️', fog: '🌫️' };

// ---------- Recursos e items ----------
export const RESOURCES = {
  wood: { label: t("Madera"), emoji: '🪵' },
  stone: { label: t("Piedra"), emoji: '🪨' },
  clay: { label: t("Arcilla"), emoji: '🧱' },
  cloth: { label: t("Tela"), emoji: '🧶' },
  crystal: { label: t("Cristales"), emoji: '💎' },
  flower: { label: t("Flores"), emoji: '🌸' },
};

// stages: 1 Sembrado · 2 Regado · 3 Creciendo · 4 Madurado · 5 Cosechado
export const STAGE_LABEL = ['', t("Sembrado"), t("Regado"), t("Creciendo"), t("Madurado"), t("Cosechado")];

export const CROPS = {
  lettuce: { label: t("Lechugas"), emoji: '🥬', growMin: 12, seasons: [0, 2, 3], hearts: 2 },
  carrot: { label: t("Zanahorias"), emoji: '🥕', growMin: 18, seasons: [0, 2], hearts: 2 },
  tomato: { label: t("Tomates"), emoji: '🍅', growMin: 25, seasons: [0, 1], hearts: 2 },
  strawberry: { label: t("Fresas"), emoji: '🍓', growMin: 35, seasons: [0, 1], hearts: 3 },
  rose: { label: t("Rosas"), emoji: '🌹', growMin: 40, seasons: [0, 1, 2], hearts: 3, bonus: { flower: 1 } },
  pumpkin: { label: t("Calabazas"), emoji: '🎃', growMin: 50, seasons: [1, 2], hearts: 4 },
  // Hongos: crecen a la sombra (suelo del bosque) o dentro del Cobertizo de hongos (×1.6)
  // Semillas raras: se desbloquean en el Mercado con monedas
  sunflower: { label: t("Girasoles"), emoji: '🌻', growMin: 45, seasons: [1, 2], hearts: 3, rare: true, price: 120, bonus: { flower: 1 } },
  lavender: { label: t("Lavanda"), emoji: '🪻', growMin: 70, seasons: [0, 1], hearts: 4, rare: true, price: 200, bonus: { flower: 2 } },
  melon: { label: t("Melones"), emoji: '🍈', growMin: 60, seasons: [1], hearts: 5, rare: true, price: 300 },
  mushroom: { label: t("Champiñones"), emoji: '🍄', growMin: 20, seasons: [0, 1, 2, 3], hearts: 2, shade: true },
  shiitake: { label: 'Shiitake', emoji: '🟤', growMin: 35, seasons: [0, 1, 2, 3], hearts: 3, shade: true },
  pinkshroom: { label: t("Seta rosa"), emoji: '🩷', growMin: 55, seasons: [0, 1, 2, 3], hearts: 5, shade: true },
};

// Recetas (requieren Cocina). food = saciedad que dan; energy = energía; hearts = corazones al cocinar
export const DISHES = {
  salad: { label: t("Ensalada fresca"), emoji: '🥗', need: { lettuce: 1, tomato: 1 }, food: 35, energy: 5 },
  carrotsoup: { label: t("Sopa de zanahoria"), emoji: '🍲', need: { carrot: 2 }, food: 40, energy: 8 },
  omelette: { label: t("Tortilla"), emoji: '🍳', need: { egg: 2 }, food: 40, energy: 10 },
  jam: { label: t("Mermelada"), emoji: '🍯', need: { strawberry: 2 }, food: 25, energy: 15, hearts: 1 },
  stew: { label: t("Guiso de setas"), emoji: '🥘', need: { mushroom: 2, carrot: 1 }, food: 55, energy: 12 },
  pie: { label: t("Tarta de calabaza"), emoji: '🥧', need: { pumpkin: 1, egg: 1 }, food: 60, energy: 10, hearts: 3 },
  cheese: { label: t("Queso"), emoji: '🧀', need: { milk: 2 }, food: 45, energy: 8 },
  fishsoup: { label: t("Sopa de pescado"), emoji: '🍜', need: { minnow: 2, carrot: 1 }, food: 45, energy: 10 },
  grilled: { label: t("Trucha asada"), emoji: '🍤', need: { trout: 1 }, food: 50, energy: 12, hearts: 1 },
  sushi: { label: 'Sushi', emoji: '🍣', need: { carp: 1, lettuce: 1 }, food: 55, energy: 14, hearts: 2 },
  crabrice: { label: t("Arroz con cangrejo"), emoji: '🍛', need: { crab: 1, tomato: 1 }, food: 60, energy: 14, hearts: 3 },
};

// ---------- Pesca ----------
// w = peso base de aparición · night/rain/day = multiplicadores · seasons = estaciones en que pica mejor
export const FISH = {
  minnow: { label: t("Pececillo"), emoji: '🐟', w: 30, size: [6, 12], food: 8 },
  shrimp: { label: t("Gamba de río"), emoji: '🦐', w: 18, size: [4, 9], food: 8 },
  carp: { label: t("Carpa"), emoji: '🐟', w: 24, size: [25, 60], food: 14 },
  trout: { label: t("Trucha"), emoji: '🐟', w: 16, size: [20, 45], food: 16, seasons: [0, 2], rain: 1.8 },
  catfish: { label: t("Siluro"), emoji: '🐡', w: 10, size: [40, 90], food: 18, night: 2.5 },
  crab: { label: t("Cangrejo de río"), emoji: '🦀', w: 8, size: [6, 14], food: 14 },
  goldfish: { label: t("Pez dorado"), emoji: '🐠', w: 6, size: [8, 18], food: 12, day: 1.8, rare: true },
  koi: { label: 'Koi', emoji: '🎏', w: 3, size: [40, 80], food: 20, rare: true, hearts: 4 },
};
export const FISHING = { waitMin: 3.5, waitMax: 9, biteWindow: 2.4, junkChance: 0.06, treasureChance: 0.03 };
export const BOAT = { cost: { wood: 25, cloth: 6 }, speed: 3.7 };

// ---------- Coleccionables (conchas, fósiles, minerales) ----------
export const COLLECT = {
  shell: [
    { id: 'shell1', emoji: '🐚', label: t("Caracola"), price: 10 }, { id: 'shell2', emoji: '🐌', label: t("Caracol de arena"), price: 8 },
    { id: 'shell3', emoji: '🦪', label: t("Ostra"), price: 14 }, { id: 'shell4', emoji: '🦀', label: t("Concha de cangrejo"), price: 12 },
    { id: 'shell5', emoji: '⭐', label: t("Estrella de mar"), price: 20 }, { id: 'shell6', emoji: '🪸', label: t("Coral rosa"), price: 26 },
    { id: 'shell7', emoji: '🦑', label: t("Pluma de calamar"), price: 30 }, { id: 'shell8', emoji: '🔮', label: t("Perla azul"), price: 70, rare: true },
  ],
  fossil: [
    { id: 'fossil1', emoji: '🦴', label: t("Hueso antiguo"), price: 18 }, { id: 'fossil2', emoji: '🌿', label: t("Helecho fósil"), price: 16 },
    { id: 'fossil3', emoji: '🦷', label: t("Diente de tiburón"), price: 24 }, { id: 'fossil4', emoji: '🐚', label: t("Amonite"), price: 32 },
    { id: 'fossil5', emoji: '🪲', label: t("Ámbar con insecto"), price: 45 }, { id: 'fossil6', emoji: '🦕', label: t("Huevo de dinosaurio"), price: 90, rare: true },
  ],
  mineral: [
    { id: 'min1', emoji: '🪨', label: t("Cuarzo"), price: 14 }, { id: 'min2', emoji: '🟣', label: t("Amatista"), price: 30 },
    { id: 'min3', emoji: '🟡', label: t("Topacio"), price: 38 }, { id: 'min4', emoji: '🟢', label: t("Esmeralda"), price: 55 },
    { id: 'min5', emoji: '🔴', label: t("Rubí"), price: 70 }, { id: 'min6', emoji: '💠', label: t("Zafiro"), price: 85, rare: true },
  ],
};
export const COLLECT_PAGES = [
  { id: 'shell', label: t("Conchas y mar"), emoji: '🐚', reward: { coins: 300, hearts: 20 } },
  { id: 'fossil', label: t("Fósiles"), emoji: '🦴', reward: { coins: 400, hearts: 25 } },
  { id: 'mineral', label: t("Minerales"), emoji: '💎', reward: { coins: 350, hearts: 22 } },
  { id: 'fish', label: t("Peces del río"), emoji: '🎣', reward: { coins: 450, hearts: 25 } },
];
export const COLLECT_ITEMS = Object.fromEntries(Object.values(COLLECT).flat().map((c) => [c.id, c]));

/** Excavación diaria en la arena y cofre de la isla */
export const DIG = { perDay: 7, reach: 1.6, chestCoins: [150, 300], islandName: t("Isla del Tesoro") };
/** Mina: tamaño de la cuadrícula, golpes por visita y energía */
export const MINE = { cols: 6, rows: 5, swings: 12, energy: 10, floors: 5 };


// =====================================================================
//  CRAFTEO: estaciones, materiales intermedios y recetas
// =====================================================================
export const CRAFT_ITEMS = {
  plank: { label: t("Tablón"), emoji: '📏', price: 8 },
  brick: { label: t("Ladrillo"), emoji: '🟥', price: 10 },
  thread: { label: t("Hilo"), emoji: '🧵', price: 6 },
  rope: { label: t("Cuerda"), emoji: '🪢', price: 8 },
  paint: { label: t("Pintura"), emoji: '🎨', price: 12 },
  fabric: { label: t("Tela fina"), emoji: '🪡', price: 20 },
  ingot: { label: t("Lingote"), emoji: '🔩', price: 28 },
  glass: { label: t("Vidrio"), emoji: '🪟', price: 22 },
};

/** Estaciones: la mesa portátil siempre está; las demás son objetos que se colocan con Decorar. */
export const STATIONS = {
  bench: { label: t("Mesa de trabajo"), emoji: '🛠️', always: true, desc: t("Materiales básicos: tablones, ladrillos, hilo, cuerda y pintura.") },
  carpentry: { label: t("Carpintería"), emoji: '🪚', decor: 'st_carpentry', desc: t("Muebles de madera y mejoras del bote.") },
  loom: { label: t("Telar"), emoji: '🧶', decor: 'st_loom', desc: t("Tela fina, alfombras, cortinas y una capa.") },
  forge: { label: t("Herrería"), emoji: '⚒️', decor: 'st_forge', desc: t("Lingotes, objetos de hierro y herramientas mejores.") },
  glass: { label: t("Cristalería y joyas"), emoji: '💎', decor: 'st_glass', desc: t("Vidrio, lámparas, vitrinas y joyas para el Vestidor.") },
};

/**
 * Receta: station · in (ingredientes) · out ({item:n} | {unlock:'hat:7'} | {upgrade:'boat'}) · dur (segundos)
 * · unlock opcional: {lv: nivel de Artesanía} | {friend:[id,nivel]} | {album:'fish'} — las demás están desde el principio.
 */
export const RECIPES = {
  // --- Mesa de trabajo ---
  plank: { station: 'bench', in: { wood: 3 }, out: { plank: 2 }, dur: 15 },
  brick: { station: 'bench', in: { clay: 3, stone: 1 }, out: { brick: 2 }, dur: 20 },
  thread: { station: 'bench', in: { cloth: 2 }, out: { thread: 3 }, dur: 15 },
  rope: { station: 'bench', in: { cloth: 1, wood: 1 }, out: { rope: 2 }, dur: 15 },
  paint: { station: 'bench', in: { flower: 3 }, out: { paint: 1 }, dur: 20 },
  // --- Carpintería ---
  d_stool: { station: 'carpentry', in: { plank: 2 }, out: { d_stool: 1 }, dur: 40 },
  d_shelf: { station: 'carpentry', in: { plank: 4, rope: 1 }, out: { d_shelf: 1 }, dur: 90 },
  d_fence: { station: 'carpentry', in: { plank: 2, rope: 1 }, out: { d_fence: 2 }, dur: 45 },
  d_picnic: { station: 'carpentry', in: { plank: 6, thread: 2 }, out: { d_picnic: 1 }, dur: 120, unlock: { lv: 2 } },
  d_swing: { station: 'carpentry', in: { plank: 4, rope: 3 }, out: { d_swing: 1 }, dur: 150, unlock: { friend: ['marta', 3] } },
  d_cart: { station: 'carpentry', in: { plank: 6, rope: 2, ingot: 1 }, out: { d_cart: 1 }, dur: 200, unlock: { lv: 3 } },
  boat2: { station: 'carpentry', in: { plank: 10, rope: 4, paint: 1 }, out: { upgrade: 'boat' }, dur: 300, unlock: { lv: 2 }, label: t("Bote reforzado"), emoji: '⛵', desc: t("Tu bote navega un 25 % más rápido.") },
  // --- Telar ---
  fabric: { station: 'loom', in: { thread: 3 }, out: { fabric: 1 }, dur: 30 },
  d_rug2: { station: 'loom', in: { fabric: 2, paint: 1 }, out: { d_rug2: 1 }, dur: 90 },
  d_curtain: { station: 'loom', in: { fabric: 2, rope: 1 }, out: { d_curtain: 1 }, dur: 70 },
  d_banner2: { station: 'loom', in: { fabric: 2, paint: 2 }, out: { d_banner2: 1 }, dur: 100, unlock: { lv: 2 } },
  d_hammock: { station: 'loom', in: { fabric: 4, rope: 3 }, out: { d_hammock: 1 }, dur: 160, unlock: { lv: 3 } },
  d_plush: { station: 'loom', in: { fabric: 2, thread: 2 }, out: { d_plush: 1 }, dur: 80 },
  cape: { station: 'loom', in: { fabric: 4, paint: 2 }, out: { unlock: 'back:3' }, dur: 240, unlock: { lv: 2 }, label: t("Capa"), emoji: '🧣', desc: t("Prenda para el Vestidor (espalda).") },
  // --- Herrería ---
  ingot: { station: 'forge', in: { stone: 5, wood: 3 }, out: { ingot: 1 }, dur: 40 },
  d_gate: { station: 'forge', in: { ingot: 3 }, out: { d_gate: 1 }, dur: 120 },
  d_ironlamp: { station: 'forge', in: { ingot: 1, glass: 1 }, out: { d_ironlamp: 1 }, dur: 100 },
  d_vane: { station: 'forge', in: { ingot: 2, plank: 1 }, out: { d_vane: 1 }, dur: 120, unlock: { lv: 2 } },
  d_ironbench: { station: 'forge', in: { ingot: 3, plank: 2 }, out: { d_ironbench: 1 }, dur: 150 },
  pick: { station: 'forge', in: { ingot: 4, plank: 2 }, out: { upgrade: 'pick' }, dur: 240, unlock: { lv: 2 }, label: t("Pico de hierro"), emoji: '⛏️', desc: t("+4 golpes en cada visita a la mina.") },
  hook: { station: 'forge', in: { ingot: 2, thread: 2 }, out: { upgrade: 'hook' }, dur: 150, unlock: { lv: 2 }, label: t("Anzuelo de acero"), emoji: '🪝', desc: t("Más probabilidad de peces raros.") },
  // --- Cristalería y joyas ---
  glass: { station: 'glass', in: { crystal: 1, stone: 2 }, out: { glass: 2 }, dur: 30 },
  d_crystal_lamp: { station: 'glass', in: { glass: 2, crystal: 2 }, out: { d_crystal_lamp: 1 }, dur: 100 },
  d_terrarium: { station: 'glass', in: { glass: 3, flower: 3, stone: 2 }, out: { d_terrarium: 1 }, dur: 110 },
  d_vitrine: { station: 'glass', in: { glass: 4, plank: 4 }, out: { d_vitrine: 1 }, dur: 140, unlock: { lv: 2 } },
  d_aquarium: { station: 'glass', in: { glass: 5, minnow: 2, shrimp: 1 }, out: { d_aquarium: 1 }, dur: 180, unlock: { friend: ['pablo', 2] } },
  hearts_glasses: { station: 'glass', in: { glass: 1, ingot: 1, paint: 1 }, out: { unlock: 'glasses:3' }, dur: 150, label: t("Gafas de corazón"), emoji: '🕶️', desc: t("Prenda para el Vestidor (gafas).") },
  pearls: { station: 'glass', in: { shell8: 1, thread: 2 }, out: { unlock: 'neck:2' }, dur: 180, unlock: { lv: 2 }, label: t("Collar de perlas"), emoji: '📿', desc: t("Prenda para el Vestidor (cuello).") },
  wings: { station: 'glass', in: { glass: 3, fabric: 2, thread: 2 }, out: { unlock: 'back:2' }, dur: 300, unlock: { lv: 3 }, label: t("Alas de hada"), emoji: '🧚', desc: t("Prenda para el Vestidor (espalda).") },
  crown: { station: 'glass', in: { ingot: 2, min4: 1, min5: 1, glass: 1 }, out: { unlock: 'hat:7' }, dur: 360, unlock: { album: 'mineral' }, label: t("Corona de joyas"), emoji: '👑', desc: t("Prenda para el Vestidor (cabeza).") },
};
export const CRAFT = { slots: 4, assist: 0.3, maxRequests: 3 };

// ---------- Economía ----------
/** Precio de venta (monedas 🪙) por unidad */
export const PRICES = {
  lettuce: 8, carrot: 10, tomato: 12, strawberry: 16, rose: 20, pumpkin: 25, sunflower: 28, lavender: 36, melon: 55,
  mushroom: 12, shiitake: 18, pinkshroom: 30, egg: 8, milk: 14,
  minnow: 6, shrimp: 7, carp: 14, trout: 20, catfish: 24, crab: 16, goldfish: 40, koi: 90,
  ...Object.fromEntries(Object.values(COLLECT).flat().map((c) => [c.id, c.price])),
  salad: 40, carrotsoup: 35, omelette: 30, jam: 50, stew: 60, pie: 75, cheese: 40, fishsoup: 40, grilled: 50, sushi: 55, crabrice: 65,
};
for (const [k, v] of Object.entries(CRAFT_ITEMS)) PRICES[k] = v.price;
export const DEMAND_MULT = 1.5;

/** Ropa que hay que desbloquear: coins = precio en el Mercado · visitor = solo la dan los visitantes del Tablón */
export const AVATAR_LOCKS = {
  'hat:4': { coins: 120 }, 'hat:5': { coins: 150 }, 'hat:7': { coins: 250 },
  'glasses:3': { coins: 120 }, 'neck:2': { coins: 150 }, 'topStyle:4': { coins: 200 },
  'back:2': { coins: 300 }, 'back:3': { coins: 200 },
  'hat:6': { visitor: true }, 'topStyle:3': { visitor: true }, 'glasses:2': { visitor: true },
  'hat:8': { visitor: true }, 'hat:9': { visitor: true }, 'neck:4': { visitor: true }, 'back:1': { visitor: true },
};
export const lockKey = (k) => k.replace(':', '_');

export const SKILLS = {
  fish: { label: t("Pesca"), emoji: '🎣', desc: t("Menos espera, más tiempo para tirar y más peces raros") },
  farm: { label: t("Cultivo"), emoji: '🌱', desc: t("Probabilidad de cosecha doble") },
  cook: { label: t("Cocina"), emoji: '🍳', desc: t("Los platos alimentan más") },
  craft: { label: t("Artesanía"), emoji: '🛠️', desc: t("Fabricas más rápido y se abren recetas nuevas") },
};
export const skillLevel = (xp = 0) => Math.min(10, 1 + Math.floor(Math.sqrt(xp / 12)));
export const skillNext = (lv) => 12 * lv * lv; // xp necesaria para pasar de lv a lv+1

/** Mejoras de herramientas (2 niveles, se compran con monedas) */
export const UPGRADES = {
  rod: { label: t("Caña"), emoji: '🎣', costs: [150, 400], desc: t("−10 % de espera, +0,4 s para tirar y más peces raros por nivel") },
  can: { label: t("Regadera"), emoji: '💧', costs: [150, 400], desc: t("Regar acelera más el cultivo y +8 % de cosecha doble por nivel") },
  pan: { label: t("Sartén"), emoji: '🍳', costs: [200, 500], desc: t("15 % de probabilidad de cocinar doble ración por nivel") },
};

// Vecinos y visitantes del Tablón de pedidos
export const NEIGHBORS = [
  { id: 'marta', name: 'Marta', emoji: '👵', role: t("Granjera"), house: { x: 40, z: 13, wall: '#f6d9a8', roof: '#c9643c' }, hours: [7, 21],
    likes: ['lettuce', 'carrot', 'tomato', 'rose', 'pumpkin', 'sunflower'], prize: 'hat:6',
    look: { skin: 1, hair: 4, hairColor: 7, topStyle: 2, top: 4, bottom: 1, shoes: 0, eyes: 1, mouth: 0, cheeks: 2 } },
  { id: 'pablo', name: 'Pablo', emoji: '🧔', role: t("Pescador"), house: { x: 45, z: 13, wall: '#bcd7ee', roof: '#3f6d8f' }, hours: [6, 20],
    likes: ['minnow', 'shrimp', 'carp', 'trout', 'catfish', 'crab', 'sushi', 'grilled'], prize: 'topStyle:3',
    look: { skin: 3, hair: 0, hairColor: 1, topStyle: 0, top: 6, bottom: 2, shoes: 3, hat: 9, eyes: 0, mouth: 0 } },
  { id: 'luna', name: 'Luna', emoji: '👩‍🎨', role: t("Pintora"), house: { x: 46, z: 19, wall: '#e8c9f0', roof: '#8a5ad6' }, hours: [9, 23],
    likes: ['flower', 'sunflower', 'lavender', 'jam', 'pie', 'shell5', 'shell6', 'min2'], prize: 'glasses:2',
    look: { skin: 2, hair: 9, hairColor: 10, topStyle: 1, top: 13, bottom: 8, shoes: 6, eyes: 2, mouth: 1, hat: 3 } },
];
/** Puntos de amistad necesarios para cada nivel (1 a 5). Cada nivel desbloquea un capítulo de su historia. */
export const FRIEND_LEVELS = [0, 6, 18, 36, 60];
export const FRIEND = { talk: 2, like: 6, other: 2 };
export const STORIES = {
  marta: [
    { title: t("El huerto de Marta"), text: t("«Mi marido Anselmo y yo plantamos este huerto hace cuarenta años. Cuando salió el primer tomate lloramos de alegría. Me alegra ver otro huerto cuidado con tanto cariño.»"), reward: { coins: 80 } },
    { title: t("La receta perdida"), text: t("«Mi madre guardaba una sopa de zanahoria en un cuaderno, pero la página se rompió. La sigo recordando por el olor: ajo, un poquito de jengibre y mucha paciencia. Como el amor.»"), reward: { coins: 100, hearts: 10 } },
    { title: t("El banco bajo el cerezo"), text: t("«Anselmo y yo veíamos los atardeceres en ese banco. Desde que no está, vengo sola… pero con vosotros ya no tanto. Tomad mi gorro de lana: me dio suerte toda la vida.»"), reward: { prize: true, hearts: 10 } },
    { title: t("Semillas para vosotros"), text: t("«Esta es mi semilla más querida. No sé cuántos años me quedan, pero sé que en vuestras manos seguirá creciendo. Cuidaos mucho, ¿eh?»"), reward: { coins: 300, hearts: 25 } },
  ],
  pablo: [
    { title: t("Madrugar para pescar"), text: t("«Antes del amanecer el río está tan quieto que se oyen los peces pensar. Yo no hablo mucho, pero con una caña en la mano me siento el hombre más feliz del mundo.»"), reward: { coins: 80 } },
    { title: t("El koi que se escapó"), text: t("«Hace diez años casi saco un koi enorme, dorado como el sol. Se soltó justo al final. Sigo esperando que vuelva a picar… y no pienso rendirme.»"), reward: { coins: 100, hearts: 10 } },
    { title: t("La red de mi abuelo"), text: t("«Mi abuelo me enseñó a pescar con esta red. Los peces no se cuentan: se agradecen. Tomad su peto de trabajo; huele a río, pero os dará suerte.»"), reward: { prize: true, hearts: 10 } },
    { title: t("Un mar de estrellas"), text: t("«Una noche de verano, en el bote, vi caer tantas estrellas que pedí un deseo por cada una. Ahora que os conozco, creo que ya se han cumplido casi todos.»"), reward: { coins: 300, hearts: 25 } },
  ],
  luna: [
    { title: t("Un lienzo en blanco"), text: t("«Llegué aquí buscando inspiración y encontré demasiada. Cada mañana pinto la misma colina y cada mañana es distinta. ¿Os pasa lo mismo con vuestra casita?»"), reward: { coins: 80 } },
    { title: t("Los colores del atardecer"), text: t("«Mezclo rosa, naranja y un poquito de lila… pero nunca me sale igual que el cielo. Dicen que el secreto es no terminarlo del todo. Como una buena historia.»"), reward: { coins: 100, hearts: 10 } },
    { title: t("El retrato"), text: t("«He pintado a la pareja de la casita junto al río: dos figuras pequeñas mirando juntas el agua. Me lo he quedado, perdonad. Tomad mis gafas de sol: dicen que sin ellas el sol me gana.»"), reward: { prize: true, hearts: 10 } },
    { title: t("Exposición en la plaza"), text: t("«¡Voy a exponer en la plaza! Y el cuadro principal es el vuestro. Ya no me importa si lo ven mil personas: solo importa que vosotros lo veáis.»"), reward: { coins: 300, hearts: 25 } },
  ],
};
/** Frases diarias de cada vecino (se elige una por día) */
export const NEIGHBOR_LINES = {
  marta: [t("«Hoy las zanahorias están más dulces, ¿las notáis?»"), t("«Esta mañana vi mariposas en el huerto. Buena señal.»"), t("«No hay prisa: las plantas crecen cuando quieren.»"), t("«¿Ya habéis regado? Lo digo por vuestras lechugas, no por mí.»"), t("«Una sopa caliente lo arregla casi todo.»")],
  pablo: [t("«Hoy pica la trucha. Lo siento en los huesos.»"), t("«Silencio… ¿lo oís? Es el río.»"), t("«Con lluvia, los peces se vuelven valientes.»"), t("«Cada pez tiene su hora. La mía es el amanecer.»"), t("«Si me traéis una carpa, os cuento un secreto.»")],
  luna: [t("«El cielo de hoy me pide un azul que no tengo.»"), t("«¿Ya habéis mirado el atardecer? No os lo perdáis.»"), t("«Hoy pinto con los ojos cerrados. Sale raro, pero sincero.»"), t("«Las flores no posan, pero son las mejores modelos.»"), t("«Pasad cuando queráis. La puerta siempre está abierta.»")],
};

// ---------- Mascotas: carácter, vínculo y ayuda diaria ----------
export const PET_TRAITS = {
  curious: { emoji: '🧐', label: t("Curiosa"), desc: t("Más probabilidad de traer objetos raros") },
  lazy: { emoji: '😴', label: t("Perezosa"), desc: t("Duerme mucho, pero su ayuda es más grande") },
  playful: { emoji: '🤸', label: t("Juguetona"), desc: t("Se vincula un 50 % más rápido jugando") },
  greedy: { emoji: '🍗', label: t("Glotona"), desc: t("Le encanta comer: +1 💗 al darle de comer") },
  brave: { emoji: '🦁', label: t("Valiente"), desc: t("Gana más en los concursos") },
};
export const BOND_LEVELS = [0, 6, 16, 32, 56]; // vínculo → nivel 1..5
export const PET = { play: 4, pet: 1, feed: 1, collect: 1, playCooldownMin: 240, helpLevel: 2 };
/** Qué trae cada mascota al pedirle ayuda (1 vez al día, desde vínculo nivel 2) */
export const PET_HELP = {
  dog: { label: t("rastrea el suelo"), pool: ['shell1', 'shell2', 'fossil1', 'fossil2', 'min1'] },
  cat: { label: t("pesca en el río"), pool: ['minnow', 'shrimp', 'carp', 'crab'] },
  rabbit: { label: t("recoge flores"), pool: ['flower'] },
  chicken: { label: t("pone huevos extra"), pool: ['egg'] },
  sheep: { label: t("regala lana"), pool: ['cloth'] },
  cow: { label: t("da leche fresca"), pool: ['milk'] },
};
export const PET_CONTEST = { dow: 0, rewards: [{ coins: 250, hearts: 20 }, { coins: 150, hearts: 12 }, { coins: 80, hearts: 6 }] };
export const VISITORS = [
  { id: 'merchant', name: t("Mercader viajero"), emoji: '🧳', look: { skin: 3, hair: 1, hairColor: 1, topStyle: 4, top: 7, bottom: 1, shoes: 0, hat: 1, neck: 4, back: 1, eyes: 0, mouth: 0 } },
  { id: 'captain', name: t("Capitana Mar"), emoji: '🧭', look: { skin: 2, hair: 6, hairColor: 7, topStyle: 4, top: 6, bottom: 2, shoes: 3, hat: 6, eyes: 2, mouth: 1 } },
  { id: 'baker', name: t("Pastelero Remy"), emoji: '🧑‍🍳', look: { skin: 1, hair: 0, hairColor: 3, topStyle: 0, top: 11, bottom: 5, shoes: 1, neck: 3, eyes: 1, mouth: 0, cheeks: 1 } },
  { id: 'bard', name: t("Bardo Lalo"), emoji: '🪕', look: { skin: 5, hair: 8, hairColor: 0, topStyle: 2, top: 9, bottom: 6, shoes: 2, glasses: 2, eyes: 3, mouth: 2 } },
];


export const ITEMS = {
  ...RESOURCES,
  ...Object.fromEntries(Object.entries(CROPS).map(([k, v]) => [k, { label: v.label, emoji: v.emoji }])),
  egg: { label: t("Huevos"), emoji: '🥚' },
  milk: { label: t("Leche"), emoji: '🥛' },
  ...Object.fromEntries(Object.entries(DISHES).map(([k, v]) => [k, { label: v.label, emoji: v.emoji }])),
  ...Object.fromEntries(Object.entries(FISH).map(([k, v]) => [k, { label: v.label, emoji: v.emoji }])),
  ...Object.fromEntries(Object.values(COLLECT).flat().map((c) => [c.id, { label: c.label, emoji: c.emoji }])),
  ...Object.fromEntries(Object.entries(CRAFT_ITEMS).map(([k, v]) => [k, { label: v.label, emoji: v.emoji }])),
};

export const FOOD = ['lettuce', 'carrot', 'tomato', 'strawberry', 'pumpkin', 'egg', 'milk', 'mushroom', 'shiitake', 'pinkshroom'];
/** Saciedad (0-100) de los alimentos crudos */
export const FOOD_VALUE = { lettuce: 10, carrot: 12, tomato: 12, strawberry: 14, pumpkin: 18, egg: 14, milk: 20, mushroom: 14, shiitake: 18, pinkshroom: 22, ...Object.fromEntries(Object.entries(FISH).map(([k, v]) => [k, v.food])) };

export const START_INVENTORY = {
  wood: 30, stone: 12, clay: 6, cloth: 6, crystal: 1, flower: 6,
  lettuce: 3, carrot: 3, egg: 2,
};
export const START_HEARTS = 20;

// ---------- Nodos de recurso ----------
export const NODE_DEFS = {
  tree: { res: 'wood', min: 2, max: 3, respawnMin: 25, blocks: true, label: t("Árbol") },
  rock: { res: 'stone', min: 2, max: 3, respawnMin: 25, blocks: true, label: t("Roca") },
  clay: { res: 'clay', min: 2, max: 2, respawnMin: 20, blocks: false, label: t("Arcilla") },
  flower: { res: 'flower', min: 1, max: 2, respawnMin: 15, blocks: false, label: t("Flores silvestres") },
  cotton: { res: 'cloth', min: 1, max: 2, respawnMin: 30, blocks: false, label: t("Algodón") },
  crystal: { res: 'crystal', min: 1, max: 1, respawnMin: 60, blocks: true, label: t("Cristal") },
};

// ---------- Edificios ----------
export const BUILDINGS = {
  house: { label: t("Casita"), emoji: '🏠', w: 5, d: 4, cost: {}, H: 2.3, wall: '#f6e3c8', floor: '#d9a36b', roof: '#d4705a', roofType: 'pyramid', fixed: true, desc: t("Vuestro hogar.") },
  bedroom: { label: t("Dormitorio"), emoji: '🛏️', w: 4, d: 4, cost: { wood: 20, cloth: 8, stone: 4 }, H: 2.2, wall: '#f3c9d0', floor: '#c98f6b', roof: '#b86a7c', roofType: 'pyramid', desc: t("Dos camas, armario y alfombra. Un lugar para soñar juntos.") },
  kitchen: { label: t("Cocina"), emoji: '🍳', w: 4, d: 3, cost: { wood: 15, stone: 12, clay: 8 }, H: 2.2, wall: '#fbe6a8', floor: '#c7b08b', roof: '#c9893f', roofType: 'pyramid', desc: t("Desbloquea la Cena romántica.") },
  library: { label: t("Biblioteca"), emoji: '📚', w: 4, d: 4, cost: { wood: 25, cloth: 6, crystal: 2 }, H: 2.5, wall: '#c9b79c', floor: '#8a6446', roof: '#6c4a3a', roofType: 'pyramid', desc: t("Estanterías hasta el techo y un sillón de lectura.") },
  terrace: { label: t("Terraza"), emoji: '🌿', w: 4, d: 3, cost: { wood: 14, stone: 6, flower: 4 }, H: 1.0, wall: '#e8d3a2', floor: '#caa06a', roof: null, open: true, desc: t("Una cubierta abierta con luces de fiesta.") },
  garden: { label: t("Jardín"), emoji: '🌷', w: 5, d: 5, cost: { flower: 12, stone: 6, wood: 6 }, H: 0.8, wall: '#7fb36a', floor: '#9ccf7e', roof: null, open: true, desc: t("Fuente, setos y parterres floridos.") },
  greenhouse: { label: t("Invernadero"), emoji: '🪟', w: 5, d: 4, cost: { wood: 15, crystal: 6, clay: 10 }, H: 2.3, wall: '#cfeee8', floor: '#8a6a4a', roof: '#bfe8e0', roofType: 'glass', glass: true, desc: t("Cultivos ×1.5 de velocidad y sin penalización de estación. Se puede plantar dentro.") },
  memory: { label: t("Sala de recuerdos"), emoji: '🖼️', w: 4, d: 4, cost: { wood: 20, cloth: 10, crystal: 4, flower: 5 }, H: 2.3, wall: '#f9e4cf', floor: '#d6a574', roof: '#a8706a', roofType: 'pyramid', desc: t("Fotos, mensajes, fechas y notas como objetos físicos.") },
  barn: { label: t("Granero"), emoji: '🛖', w: 6, d: 5, cost: { wood: 40, stone: 10, cloth: 4 }, H: 2.6, wall: '#c75a4a', floor: '#c9a96a', roof: '#8c3b32', roofType: 'pyramid', desc: t("Cobija a vacas y ovejas, +6 plazas para animales y da de comer solo a los animales hambrientos.") },
  shroomhouse: { label: t("Cobertizo de hongos"), emoji: '🍄', w: 4, d: 3, cost: { wood: 18, clay: 6, stone: 8 }, H: 1.9, wall: '#6f5d4d', floor: '#4a3a30', roof: '#d9453f', roofType: 'cap', desc: t("Oscuro y húmedo: los hongos crecen ×1.6 más rápido. Se pueden plantar por dentro.") },
  observatory: { label: t("Observatorio"), emoji: '🔭', w: 3, d: 3, cost: { stone: 25, wood: 15, crystal: 12 }, H: 2.2, wall: '#b8b4c8', floor: '#8c88a0', roof: '#c9a46a', roofType: 'dome', desc: t("Mirad las estrellas juntos de noche.") },
};

// ---------- Decoración ----------
export const DECOR = {
  sofa: { label: t("Sofá"), emoji: '🛋️', w: 2, d: 0.9, cost: { wood: 4, cloth: 4 }, colors: ['#e58a8a', '#8fb8de', '#9ec58a'] },
  table: { label: t("Mesa"), emoji: '🪑', w: 1.4, d: 0.9, cost: { wood: 5 }, colors: ['#b98254', '#d9b384', '#8a5e3c'] },
  lamp: { label: t("Lámpara"), emoji: '💡', w: 0.5, d: 0.5, cost: { wood: 2, crystal: 1 }, colors: ['#ffd98a', '#ffb5c2', '#b8e0ff'], light: true },
  plant: { label: t("Planta"), emoji: '🪴', w: 0.6, d: 0.6, cost: { flower: 2 }, colors: ['#d9825b', '#e8e0d0', '#7aa6d6'] },
  painting: { label: t("Cuadro"), emoji: '🖼️', w: 0.9, d: 0.4, cost: { wood: 2, cloth: 1 }, colors: ['#8fb8de', '#f2a6a0', '#9ec58a'] },
  rug: { label: t("Alfombra"), emoji: '🧶', w: 2, d: 1.4, cost: { cloth: 4 }, colors: ['#e9a3ad', '#a6c8e0', '#e8cf8c'], flat: true },
  bed: { label: t("Cama"), emoji: '🛏️', w: 1.3, d: 2, cost: { wood: 8, cloth: 6 }, colors: ['#e58a8a', '#8fb8de', '#c9a6e0'] },
  statue: { label: t("Estatua"), emoji: '🗿', w: 0.9, d: 0.9, cost: { stone: 12, clay: 2 }, colors: ['#fff', '#fff', '#fff'], model: 'statue', scale: 1.1 },
  column: { label: t("Columna"), emoji: '🏛️', w: 0.7, d: 0.7, cost: { stone: 6 }, colors: ['#fff', '#fff', '#fff'], model: 'column', scale: 1.1 },
  banner: { label: t("Estandarte"), emoji: '🚩', w: 0.7, d: 0.4, cost: { cloth: 3, wood: 2 }, colors: ['#fff', '#fff', '#fff'], model: 'banner', scale: 1.2 },
  trophy: { label: t("Trofeo"), emoji: '🏆', w: 0.6, d: 0.5, cost: { crystal: 1, stone: 2 }, colors: ['#fff', '#fff', '#fff'], model: 'trophy', scale: 1.4 },
  crib: { label: t("Cuna"), emoji: '🍼', w: 1.0, d: 1.5, cost: { wood: 8, cloth: 4 }, colors: ['#f4c9d4', '#bcd7ee', '#f6e3a8'] },
  fireplace: { label: t("Chimenea"), emoji: '🔥', w: 1.6, d: 0.8, cost: { stone: 10, clay: 4 }, colors: ['#a8a29a', '#b86a55', '#8c8a9c'], light: true },
};

// Decoración fabricada y estaciones de trabajo. parts: ['b'|'c'|'o', [x,y,z], tamaño, color ('v' = color elegido)]
const W = '#b98254', W2 = '#8a5e3c', WH = '#f6efe6';
const CR = (label, emoji, w, d, parts, colors = ['#b98254', '#d9b384', '#8a5e3c'], extra = {}) => ({ label, emoji, w, d, cost: {}, colors, parts, craft: true, ...extra });
Object.assign(DECOR, {
  // estaciones (se colocan con recursos)
  st_carpentry: { label: t("Banco de carpintero"), emoji: '🪚', w: 2.0, d: 1.2, cost: { wood: 20, stone: 4 }, colors: ['#b98254', '#d9b384', '#8a5e3c'], station: 'carpentry',
    parts: [['b', [0, 0.5, 0], [1.9, 0.12, 0.9], 'v'], ['b', [-0.8, 0.25, -0.35], [0.1, 0.5, 0.1], W2], ['b', [0.8, 0.25, -0.35], [0.1, 0.5, 0.1], W2], ['b', [-0.8, 0.25, 0.35], [0.1, 0.5, 0.1], W2], ['b', [0.8, 0.25, 0.35], [0.1, 0.5, 0.1], W2], ['b', [0.45, 0.62, 0], [0.7, 0.12, 0.25], '#e8d3b0'], ['b', [-0.5, 0.7, 0.1], [0.5, 0.3, 0.3], '#e8d3b0'], ['b', [-0.5, 0.88, 0.1], [0.45, 0.06, 0.25], '#c9a070'], ['b', [0.1, 0.62, 0.25], [0.5, 0.04, 0.12], '#c9ccd4']] },
  st_loom: { label: t("Telar"), emoji: '🧶', w: 1.8, d: 1.0, cost: { wood: 15, cloth: 10 }, colors: ['#e58a8a', '#8fb8de', '#9ec58a'], station: 'loom',
    parts: [['b', [-0.8, 0.8, 0], [0.12, 1.6, 0.12], W2], ['b', [0.8, 0.8, 0], [0.12, 1.6, 0.12], W2], ['b', [0, 1.55, 0], [1.7, 0.12, 0.12], W2], ['b', [0, 0.25, 0], [1.7, 0.12, 0.12], W2], ...[-0.55, -0.3, -0.05, 0.2, 0.45].map((x) => ['b', [x, 0.9, 0], [0.03, 1.2, 0.03], WH]), ['b', [0, 0.5, 0.02], [1.2, 0.35, 0.05], 'v'], ['b', [0.1, 0.7, 0.3], [0.35, 0.18, 0.25], '#c9a070']] },
  st_forge: { label: t("Fragua"), emoji: '⚒️', w: 1.8, d: 1.1, cost: { stone: 25, clay: 10 }, colors: ['#8c8a9c', '#a8a29a', '#6f6a86'], station: 'forge',
    parts: [['b', [-0.25, 0.5, 0], [1.1, 1.0, 1.0], 'v'], ['b', [-0.25, 0.4, 0.42], [0.6, 0.45, 0.2], '#2b2024'], ['b', [-0.25, 0.3, 0.45], [0.4, 0.12, 0.1], '#ff8a3c'], ['b', [-0.45, 1.4, -0.2], [0.3, 0.8, 0.3], '#a8a29a'], ['b', [0.7, 0.35, 0.1], [0.5, 0.1, 0.3], '#4a4658'], ['b', [0.7, 0.2, 0.1], [0.2, 0.4, 0.2], '#4a4658'], ['b', [0.7, 0.45, 0.1], [0.7, 0.08, 0.22], '#6a6a7a']] },
  st_glass: { label: t("Horno de cristal"), emoji: '💎', w: 1.6, d: 1.2, cost: { stone: 15, crystal: 4, wood: 10 }, colors: ['#b86a55', '#c9893f', '#8c8a9c'], station: 'glass',
    parts: [['c', [-0.3, 0.45, 0], [0.5, 0.9], 'v'], ['o', [-0.3, 0.95, 0], [0.5, 0.6, 0.5, 0.5], '#d9a07a'], ['b', [-0.3, 0.3, 0.45], [0.35, 0.3, 0.1], '#2b2024'], ['b', [0.6, 0.55, 0], [0.5, 0.06, 0.8], W2], ['c', [0.5, 0.75, 0.1], [0.08, 0.3], '#9fe0f0'], ['c', [0.75, 0.72, -0.1], [0.07, 0.25], '#f4a6c0'], ['o', [0.6, 0.93, 0.25], [0.1], '#bfeaf6']] },
  // carpintería
  d_stool: CR(t("Taburete"), '🪑', 0.6, 0.6, [['c', [0, 0.4, 0], [0.26, 0.08], 'v'], ['b', [-0.15, 0.2, -0.15], [0.07, 0.4, 0.07], W2], ['b', [0.15, 0.2, -0.15], [0.07, 0.4, 0.07], W2], ['b', [-0.15, 0.2, 0.15], [0.07, 0.4, 0.07], W2], ['b', [0.15, 0.2, 0.15], [0.07, 0.4, 0.07], W2]]),
  d_shelf: CR(t("Estantería"), '📚', 1.4, 0.45, [['b', [0, 0.9, 0], [1.3, 1.8, 0.4], 'v'], ...[0.35, 0.8, 1.25].map((y) => ['b', [0, y, 0.02], [1.2, 0.06, 0.4], W2]), ...[[-0.4, 0.5, '#d96a6a'], [-0.1, 0.5, '#6a9bd9'], [0.3, 0.5, '#e8c36a'], [-0.3, 1.0, '#7ab87a'], [0.2, 1.0, '#b07ad9']].map(([x, y, c]) => ['b', [x, y, 0.1], [0.14, 0.3, 0.22], c])]),
  d_fence: CR(t("Cerca"), '🚧', 2.0, 0.3, [...[-0.9, 0, 0.9].map((x) => ['b', [x, 0.4, 0], [0.1, 0.8, 0.1], 'v']), ['b', [0, 0.6, 0], [2.0, 0.08, 0.06], W2], ['b', [0, 0.3, 0], [2.0, 0.08, 0.06], W2]]),
  d_picnic: CR(t("Mesa de picnic"), '🧺', 1.8, 1.4, [['b', [0, 0.65, 0], [1.6, 0.08, 0.7], 'v'], ['b', [0, 0.69, 0], [1.0, 0.02, 0.5], '#e86a6a'], ['b', [0, 0.35, -0.5], [1.6, 0.08, 0.3], W2], ['b', [0, 0.35, 0.5], [1.6, 0.08, 0.3], W2], ...[[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]].map(([x, z]) => ['b', [x, 0.3, z], [0.08, 0.6, 0.08], W2]), ['o', [0.2, 0.8, 0], [0.12], '#f2c94c']]),
  d_swing: CR(t("Columpio"), '🎠', 1.8, 0.8, [['b', [-0.8, 1.0, 0], [0.1, 2.0, 0.1], W2], ['b', [0.8, 1.0, 0], [0.1, 2.0, 0.1], W2], ['b', [0, 2.0, 0], [1.8, 0.1, 0.1], W2], ['b', [-0.3, 1.0, 0], [0.02, 1.8, 0.02], WH], ['b', [0.3, 1.0, 0], [0.02, 1.8, 0.02], WH], ['b', [0, 0.45, 0], [0.7, 0.07, 0.3], 'v']]),
  d_cart: CR(t("Carretilla de flores"), '🛒', 1.5, 0.9, [['b', [0, 0.5, 0], [1.1, 0.35, 0.7], 'v'], ['c', [0.5, 0.25, 0.4], [0.22, 0.06], '#4a3e48'], ['c', [0.5, 0.25, -0.4], [0.22, 0.06], '#4a3e48'], ['b', [-0.75, 0.7, 0], [0.5, 0.05, 0.05], W2], ...[[-0.3, '#f48aa8'], [0, '#ffe27a'], [0.3, '#c9a6f0']].map(([x, c]) => ['o', [x, 0.8, 0], [0.16], c])]),
  // telar
  d_rug2: CR(t("Alfombra bordada"), '🧿', 2.2, 1.6, [['b', [0, 0.02, 0], [2.1, 0.03, 1.5], 'v'], ['b', [0, 0.04, 0], [1.7, 0.02, 1.1], '#fffaf0'], ['b', [0, 0.05, 0], [1.2, 0.02, 0.7], 'v'], ['o', [0, 0.07, 0], [0.18, 0.4, 1], '#ffd98a']], ['#e9a3ad', '#a6c8e0', '#e8cf8c'], { flat: true }),
  d_curtain: CR(t("Cortina"), '🪟', 1.2, 0.3, [['b', [0, 1.6, 0], [1.2, 0.05, 0.05], W2], ['b', [-0.35, 0.85, 0], [0.4, 1.5, 0.06], 'v'], ['b', [0.35, 0.85, 0], [0.4, 1.5, 0.06], 'v'], ['b', [-0.35, 0.9, 0.04], [0.06, 1.4, 0.03], WH], ['b', [0.35, 0.9, 0.04], [0.06, 1.4, 0.03], WH]], ['#f4a6c0', '#8fb8de', '#f6e3a8']),
  d_banner2: CR(t("Estandarte de pareja"), '💞', 0.9, 0.3, [['b', [0, 1.1, 0], [0.06, 2.2, 0.06], W2], ['b', [0.3, 1.85, 0], [0.55, 0.9, 0.04], 'v'], ['o', [0.3, 1.9, 0.04], [0.16, 1, 1, 0.3], '#ff6f9c']], ['#e58a8a', '#8fb8de', '#c9a6e0']),
  d_hammock: CR(t("Hamaca"), '🏖️', 2.4, 1.0, [['b', [-1.1, 0.8, 0], [0.1, 1.6, 0.1], W2], ['b', [1.1, 0.8, 0], [0.1, 1.6, 0.1], W2], ['b', [-0.6, 0.85, 0], [0.9, 0.06, 0.6], 'v'], ['b', [0.6, 0.85, 0], [0.9, 0.06, 0.6], 'v'], ['b', [0, 0.72, 0], [0.9, 0.06, 0.6], 'v'], ['b', [-0.95, 1.3, 0], [0.02, 0.9, 0.02], WH], ['b', [0.95, 1.3, 0], [0.02, 0.9, 0.02], WH]], ['#e58a8a', '#8fb8de', '#9ec58a']),
  d_plush: CR(t("Peluche"), '🧸', 0.6, 0.6, [['o', [0, 0.25, 0], [0.22, 1, 1.1, 1], 'v'], ['o', [0, 0.55, 0.02], [0.17], 'v'], ['o', [-0.12, 0.7, 0], [0.06], 'v'], ['o', [0.12, 0.7, 0], [0.06], 'v'], ['o', [0, 0.52, 0.15], [0.06], '#f6e3d0'], ['o', [-0.06, 0.58, 0.16], [0.02], '#2a1f24'], ['o', [0.06, 0.58, 0.16], [0.02], '#2a1f24']], ['#c9a070', '#f4c9d4', '#bcd7ee']),
  // herrería
  d_gate: CR(t("Verja de hierro"), '⛩️', 2.0, 0.3, [['b', [-0.9, 0.9, 0], [0.12, 1.8, 0.12], '#3a3a46'], ['b', [0.9, 0.9, 0], [0.12, 1.8, 0.12], '#3a3a46'], ['b', [0, 1.7, 0], [1.9, 0.08, 0.08], '#3a3a46'], ...[-0.6, -0.3, 0, 0.3, 0.6].map((x) => ['b', [x, 0.85, 0], [0.05, 1.5, 0.05], 'v']), ['o', [-0.9, 1.9, 0], [0.1], 'v'], ['o', [0.9, 1.9, 0], [0.1], 'v']], ['#3a3a46', '#6a5a4a', '#5a6a7a']),
  d_ironlamp: CR(t("Farol de hierro"), '🏮', 0.5, 0.5, [['c', [0, 0.05, 0], [0.16, 0.1], '#3a3a46'], ['c', [0, 0.9, 0], [0.04, 1.7], '#3a3a46'], ['b', [0, 1.8, 0], [0.3, 0.3, 0.3], '#fff1c8'], ['b', [0, 1.99, 0], [0.38, 0.08, 0.38], '#3a3a46']], ['#3a3a46', '#6a5a4a', '#5a6a7a']),
  d_vane: CR(t("Veleta"), '🐓', 0.5, 0.5, [['c', [0, 1.0, 0], [0.04, 2.0], '#3a3a46'], ['b', [0, 2.05, 0], [0.7, 0.05, 0.05], 'v'], ['b', [0.35, 2.05, 0], [0.18, 0.18, 0.04], 'v'], ['o', [-0.3, 2.15, 0], [0.14, 1, 1, 0.3], 'v']], ['#c9a46a', '#e86a6a', '#8fb8de']),
  d_ironbench: CR(t("Banco de hierro"), '🪑', 1.6, 0.6, [['b', [0, 0.45, 0], [1.5, 0.08, 0.45], W], ['b', [0, 0.8, -0.2], [1.5, 0.4, 0.06], W], ['b', [-0.7, 0.22, 0], [0.08, 0.44, 0.45], 'v'], ['b', [0.7, 0.22, 0], [0.08, 0.44, 0.45], 'v']], ['#3a3a46', '#6a5a4a', '#5a6a7a']),
  // cristalería
  d_crystal_lamp: CR(t("Lámpara de cristal"), '🔮', 0.6, 0.6, [['c', [0, 0.1, 0], [0.22, 0.2], '#6f6a86'], ['o', [0, 0.55, 0], [0.26, 1, 1.4, 1], 'v'], ['o', [0, 0.55, 0], [0.18, 1, 1.4, 1], '#ffffff']], ['#9fb4ff', '#f4a6c0', '#9fe0c0']),
  d_terrarium: CR(t("Terrario"), '🪴', 1.0, 0.8, [['b', [0, 0.1, 0], [0.9, 0.2, 0.7], '#7a5238'], ['b', [0, 0.5, 0], [0.9, 0.6, 0.7], '#cfeef8'], ['b', [0, 0.82, 0], [0.95, 0.05, 0.75], W2], ['o', [-0.2, 0.3, 0], [0.16], '#5fae55'], ['o', [0.15, 0.28, 0.1], [0.12], 'v'], ['o', [0.25, 0.26, -0.1], [0.09], '#ffe27a']], ['#f48aa8', '#c9a6f0', '#ff9a6a']),
  d_vitrine: CR(t("Vitrina"), '🗄️', 1.0, 0.5, [['b', [0, 0.9, 0], [0.9, 1.7, 0.4], '#cfeef8'], ['b', [0, 0.05, 0], [1.0, 0.1, 0.5], 'v'], ['b', [0, 1.78, 0], [1.0, 0.08, 0.5], 'v'], ['b', [0, 0.9, 0], [0.8, 0.05, 0.35], 'v'], ['o', [-0.2, 1.1, 0], [0.12], '#e86a8a'], ['o', [0.2, 1.1, 0], [0.1], '#ffd23a'], ['o', [0, 0.45, 0], [0.14], '#9fb4ff']], ['#8a5e3c', '#3a3a46', '#e8d3b0']),
  d_aquarium: CR(t("Acuario"), '🐠', 1.6, 0.7, [['b', [0, 0.35, 0], [1.5, 0.7, 0.6], '#6a4630'], ['b', [0, 0.95, 0], [1.4, 0.55, 0.5], '#8fe0f0'], ['o', [-0.3, 0.95, 0], [0.09, 1.6, 1, 0.6], '#ff9a3c'], ['o', [0.25, 1.05, 0.05], [0.07, 1.6, 1, 0.6], 'v'], ['o', [0.1, 0.72, 0], [0.12], '#5fae55']], ['#ffd23a', '#f48aa8', '#9fb4ff']),
});
for (const [k, d] of Object.entries(CRAFT_DEF)) { if (DECOR[k]) { DECOR[k].parts = d.parts; if (d.colors) DECOR[k].colors = d.colors; } }
Object.assign(ITEMS, Object.fromEntries(Object.entries(DECOR).filter(([, d]) => d.craft).map(([k, v]) => [k, { label: v.label, emoji: v.emoji }])));
Object.assign(PRICES, Object.fromEntries(Object.entries(DECOR).filter(([, d]) => d.craft).map(([k]) => [k, 0])));
for (const k of Object.keys(DECOR)) if (DECOR[k].craft) { delete PRICES[k]; DECOR[k].cost = { [k]: 1 }; }

// ---------- Animales ----------
export const ANIMALS = {
  chicken: { label: t("Gallina"), emoji: '🐔', unlockAt: 0, cost: 15, hungerMin: 120, prodMin: 20, prod: { item: 'egg', amount: 1 }, names: [t("Pepita"), t("Clara"), t("Yema"), t("Plumita")] },
  rabbit: { label: t("Conejo"), emoji: '🐇', unlockAt: 50, cost: 40, hungerMin: 150, prodMin: 60, prod: { item: 'cloth', amount: 1 }, names: [t("Nube"), t("Bombón"), t("Trébol"), t("Copito")] },
  cat: { label: t("Gato"), emoji: '🐈', unlockAt: 120, cost: 60, hungerMin: 240, prodMin: 180, prod: { item: 'crystal', amount: 1 }, names: [t("Mochi"), t("Luna"), t("Canela"), t("Miso")] },
  dog: { label: t("Perro"), emoji: '🐕', unlockAt: 250, cost: 80, hungerMin: 240, prodMin: 60, prod: { item: 'hearts', amount: 3 }, names: [t("Toby"), t("Churro"), t("Ron"), t("Bimba")] },
  sheep: { label: t("Oveja"), emoji: '🐑', unlockAt: 150, cost: 70, hungerMin: 200, prodMin: 75, prod: { item: 'cloth', amount: 2 }, needsBarn: true, names: [t("Lana"), t("Nubecita"), t("Rizos"), t("Algodón")] },
  cow: { label: t("Vaca"), emoji: '🐄', unlockAt: 200, cost: 90, hungerMin: 240, prodMin: 90, prod: { item: 'milk', amount: 1 }, needsBarn: true, names: [t("Margarita"), t("Manchas"), t("Paca"), t("Flor")] },
};
export const PASTURE = { x0: 22, z0: 26, x1: 30, z1: 32 };

// ---------- Corazones ----------
export const HEART_RULES = {
  water: { each: 1, cap: 10 },
  harvest: { each: 0, cap: 20 }, // each depende del cultivo
  feed: { each: 1, cap: 8 },
  collect: { each: 1, cap: 10 },
  build: { each: 10, cap: 999 },
  care: { each: 2, cap: 12 },
  letter: { each: 2, cap: 10 },
  fish: { each: 1, cap: 8 },
  order: { each: 0, cap: 60 },
};
export const QUEST_HEARTS = 8;
export const QUEST_BOTH_BONUS = 10;

// ---------- Misiones de pareja ----------
export const QUEST_POOL = [
  { id: 'best_moment', kind: 'text', title: t("Comparte tu mejor momento del día"), hint: t("¿Qué fue lo mejor de hoy?") },
  { id: 'grateful', kind: 'text', title: t("Cuenta algo que agradezcas"), hint: t("Algo pequeño o grande por lo que estés agradecida/o.") },
  { id: 'dream_date', kind: 'text', title: t("Describe una cita soñada"), hint: t("¿Dónde, qué haríamos, qué comeríamos?") },
  { id: 'miss', kind: 'text', title: t("Algo que extrañas de nosotros"), hint: t("Un gesto, un lugar, una costumbre…") },
  { id: 'song', kind: 'text', title: t("Una canción que te recuerda a mí"), hint: t("Título y por qué.") },
  { id: 'future', kind: 'text', title: t("Un sueño para el próximo año"), hint: t("Juntos o por separado.") },
  { id: 'voice', kind: 'audio', title: t("Envía una nota de voz"), hint: t("Hasta 20 segundos. Di lo que te apetezca.") },
  { id: 'voice2', kind: 'audio', title: t("Cuéntame tu día con tu voz"), hint: t("Hasta 20 segundos.") },
  { id: 'photo', kind: 'image', title: t("Comparte una fotografía"), hint: t("Algo que hayas visto hoy.") },
  { id: 'photo2', kind: 'image', title: t("Foto de lo que tienes delante"), hint: t("Sin filtros, tal como es.") },
];

// ---------- Avatar ----------
export const AVATAR_OPTS = {
  skin: ['#fddbc0', '#f5c39b', '#e0a97c', '#c58a5c', '#9b6a44', '#6f4a2f', '#bfe6d0', '#d6c6f0'],
  eyes: [t("Redondos"), t("Felices"), t("Brillantes"), t("Somnolientos")],
  mouth: [t("Sonrisa"), t("Boca abierta"), t("Gatuna")],
  cheeks: [t("Normal"), t("Pecas"), t("Rubor fuerte")],
  hairStyles: [t("Corto"), 'Bob', t("Largo"), t("Moño"), t("Coletas"), t("Rebelde"), t("Cola alta"), t("Trenza"), 'Afro', t("Ondas")],
  hairColor: ['#2b1d16', '#6b3f24', '#b5702f', '#e8c06a', '#d65a5a', '#f2a6c4', '#7a8fe0', '#e9e2d8', '#3fa7a0', '#7bd389', '#8a5ad6', '#9aa0a6', '#ff7a45', '#1d2b53'],
  topStyles: [t("Camiseta"), t("Vestido"), t("Sudadera"), t("Peto"), t("Chaqueta")],
  top: ['#e58a8a', '#f2c27a', '#9ec58a', '#8fb8de', '#c9a6e0', '#f4efe6', '#4f6d8f', '#d98a5a', '#e0524a', '#2f7d6b', '#f6c945', '#ffffff', '#2b2b30', '#ff9ac4', '#7fd0e8', '#a2d27a'],
  bottomStyles: [t("Pantalón"), t("Falda"), t("Shorts")],
  bottom: ['#5b6b8c', '#8a6a4a', '#3f4a5c', '#b88a8a', '#7a9a7a', '#d9c9a8', '#2b2b30', '#b5c9a0', '#f0b8c8', '#d4b06a'],
  shoes: ['#5a4038', '#ffffff', '#e0524a', '#2b2b30', '#8fb8de', '#f2c27a', '#f4a6c0'],
  hats: [t("Ninguno"), t("Sombrero de paja"), t("Lazo"), t("Corona de flores"), t("Orejas de gato"), t("Orejas de conejo"), t("Gorro de lana"), t("Corona"), t("Auriculares"), t("Pañuelo")],
  glasses: [t("Ninguna"), t("Gafas redondas"), t("Gafas de sol"), t("Gafas de corazón")],
  neck: [t("Ninguno"), t("Bufanda"), t("Collar de perlas"), t("Pajarita"), t("Pañuelo rojo")],
  back: [t("Ninguno"), t("Mochila"), t("Alas de hada"), t("Capa")],
};

export const defaultAvatar = (n = 0) => ({
  skin: n % 6, hair: n % 6, hairColor: (n * 3) % 8, top: n % 8, bottom: n % 6,
});

/** Compatibilidad: los avatares antiguos tenían un único "acc". */
export function normAvatar(a) {
  const o = { ...(a || {}) };
  if (o.acc && o.hat === undefined && o.glasses === undefined && o.neck === undefined) {
    if (o.acc === 1) o.glasses = 1; else if (o.acc === 2) o.hat = 1; else if (o.acc === 3) o.hat = 2; else if (o.acc === 4) o.neck = 1; else if (o.acc === 5) o.hat = 3;
  }
  return o;
}

export function randomAvatar() {
  const r = (n) => Math.floor(Math.random() * n), O = AVATAR_OPTS;
  return {
    skin: r(O.skin.length), eyes: r(O.eyes.length), mouth: r(O.mouth.length), cheeks: r(O.cheeks.length),
    hair: r(O.hairStyles.length), hairColor: r(O.hairColor.length),
    topStyle: r(O.topStyles.length), top: r(O.top.length), bottomStyle: r(O.bottomStyles.length), bottom: r(O.bottom.length), shoes: r(O.shoes.length),
    hat: Math.random() < 0.5 ? r(O.hats.length) : 0, glasses: Math.random() < 0.3 ? r(O.glasses.length) : 0,
    neck: Math.random() < 0.3 ? r(O.neck.length) : 0, back: Math.random() < 0.25 ? r(O.back.length) : 0,
  };
}

export const MEMORY_KINDS = {
  photo: { label: t("Foto"), emoji: '📷' },
  message: { label: t("Mensaje"), emoji: '💌' },
  date: { label: t("Fecha importante"), emoji: '📅' },
  note: { label: t("Nota"), emoji: '📝' },
  audio: { label: t("Nota de voz"), emoji: '🎙️' },
};

export const SPAWN = { x: 16.5, z: 22.5 };
export const HOUSE = { x: 14, z: 17, w: 5, d: 4 };

// ---------- Necesidades (por persona; se derivan de marcas de tiempo) ----------
export const VITALS = {
  energyDrainMs: 180000, // −1 energía cada 3 min despierta (100 → 0 en 5 h)
  sleepGainMs: 3000, // +1 energía cada 3 s durmiendo (0 → 100 en 5 min)
  fullDrainMs: 120000, // −1 saciedad cada 2 min
  tiredBelow: 12, hungryBelow: 15,
  actionCost: { water: 1, harvest: 1.5, gather: 2.5, build: 4, plant: 1, dig: 1, reel: 1 },
  sleepTogetherSec: 60, sleepTogetherHearts: 8,
  eatTogetherHearts: 5,
};

// ---------- Familia ----------
export const FAMILY = {
  needHeartsTotal: 150, cost: 40, maxChildren: 3,
  gestationMs: 8 * 3600 * 1000, // 8 h reales
  stages: [ // edad en días reales
    { id: 'baby', label: t("Bebé"), emoji: '👶', maxDays: 1, scale: 0.46 },
    { id: 'toddler', label: t("Gateando"), emoji: '🧒', maxDays: 3, scale: 0.6 },
    { id: 'kid', label: t("Peque"), emoji: '🧒', maxDays: 10, scale: 0.78 },
    { id: 'teen', label: t("Joven"), emoji: '🧑', maxDays: Infinity, scale: 0.92 },
  ],
  hungerMin: 180, playCooldownMin: 8,
};

// ---------- Metas semanales (3 por semana, elegidas de este pool) ----------
export const GOALS = [
  { id: 'harvest15', metric: 'harvest', target: 15, text: t("Cosechad 15 cultivos"), reward: 20 },
  { id: 'quest7', metric: 'quest', target: 7, text: t("Responded 7 misiones de pareja"), reward: 25 },
  { id: 'mem3', metric: 'memory', target: 3, text: t("Guardad 3 recuerdos"), reward: 20 },
  { id: 'build2', metric: 'build', target: 2, text: t("Construid 2 edificios"), reward: 30 },
  { id: 'hug3', metric: 'hug', target: 3, text: t("Abrazaos 3 veces"), reward: 20 },
  { id: 'sleep2', metric: 'sleepTogether', target: 2, text: t("Dormid juntos 2 noches"), reward: 25 },
  { id: 'feed10', metric: 'feed', target: 10, text: t("Dad de comer a los animales 10 veces"), reward: 15 },
  { id: 'gather25', metric: 'gather', target: 25, text: t("Recolectad 25 recursos"), reward: 15 },
  { id: 'fish6', metric: 'fish', target: 6, text: t("Pescad 6 peces"), reward: 20 },
  { id: 'order4', metric: 'order', target: 4, text: t("Completad 4 pedidos del Tablón"), reward: 25 },
  { id: 'sell30', metric: 'sell', target: 30, text: t("Vended 30 productos en el Mercado"), reward: 20 },
  { id: 'date2', metric: 'date', target: 2, text: t("Tened 2 citas en pareja"), reward: 30 },
  { id: 'gift2', metric: 'gift', target: 2, text: t("Encontrad 2 regalos escondidos"), reward: 25 },
  { id: 'letter5', metric: 'letter', target: 5, text: t("Enviaos 5 cartas"), reward: 20 },
];

// ---------- Notas rápidas para el buzón ----------
export const QUICK_NOTES = [
  { emoji: '☀️', text: t("Buenos días, mi amor") },
  { emoji: '🌙', text: t("Buenas noches, que sueñes bonito") },
  { emoji: '💗', text: t("Te quiero muchísimo") },
  { emoji: '🥺', text: t("Te extraño") },
  { emoji: '🌻', text: t("Pensando en ti") },
  { emoji: '🎉', text: t("¡Estoy orgullosa/o de ti!") },
];

// ---------- Eventos ----------
/** Festival de temporada: se celebra cada sábado (UTC). El tema depende de la estación. */
export const FESTIVALS = [
  { id: 'flowers', name: t("Festival de las Flores"), emoji: '🌸', item: '🌸', golden: '🌷', color: '#f7a8c4', desc: t("Atrapad los pétalos que caen. ¡Los tulipanes valen triple!"), prize: 'hat:9' },
  { id: 'stars', name: t("Verbena de las Estrellas"), emoji: '🎆', item: '⭐', golden: '🌟', color: '#7a8fe0', desc: t("Atrapad las estrellas fugaces. ¡Las brillantes valen triple!"), prize: 'neck:4' },
  { id: 'harvest', name: t("Fiesta de la Cosecha"), emoji: '🎃', item: '🍂', golden: '🎃', color: '#f2a03c', desc: t("Recoged las hojas y calabazas. ¡Las calabazas valen triple!"), prize: 'hat:8' },
  { id: 'snow', name: t("Fiesta de la Nieve"), emoji: '⛄', item: '❄️', golden: '⛄', color: '#8fd0f0', desc: t("Atrapad los copos de nieve. ¡Los muñecos valen triple!"), prize: 'back:1' },
];
/** Puntos combinados de los dos (mejor intento de cada uno) para cada premio */
export const FESTIVAL_TIERS = [
  { score: 40, coins: 60, hearts: 4 },
  { score: 80, coins: 130, hearts: 8 },
  { score: 120, coins: 250, hearts: 15, prize: true },
];
export const FESTIVAL = { seconds: 25, tries: 3 };
export const WISH = { hearts: 3, bonus: 10, windowMs: 10 * 60000 };
export const VISITOR_HOURS = [7, 21];

// ---------- Citas en pareja ----------
// Cada cita se cumple estando JUNTOS haciendo algo: el contador sube mientras se cumple la condición.
export const DATES = {
  picnic: { emoji: '🧺', label: t("Picnic"), goal: 90, spot: true, desc: t("Extendemos una manta en un buen sitio y nos quedamos juntos (de día, a menos de 5 casillas)."), hours: [8, 20] },
  stars: { emoji: '🔭', label: t("Noche de estrellas"), goal: 90, spot: true, desc: t("Tumbarse a mirar el cielo juntos (de noche, a menos de 5 casillas de la manta)."), hours: [20, 5] },
  boat: { emoji: '⛵', label: t("Paseo en bote"), goal: 75, desc: t("Navegad juntos por el río: una persona rema y la otra va de pasajera.") },
  fishing: { emoji: '🎣', label: t("Pesca a dúo"), goal: 60, desc: t("Los dos con la caña lanzada al agua a la vez, esperando que pique.") },
  dinner: { emoji: '🕯️', label: t("Cena romántica"), goal: 75, desc: t("Los dos dentro de la misma habitación por la tarde-noche (de 18:00 a 24:00)."), hours: [18, 24] },
};
export const DATE_LIMIT = 3; // citas por día
export const DATE_REWARD = { hearts: 12, coins: 60 };

// ---------- Regalos escondidos ----------
export const GIFT = { max: 3, coinOptions: [20, 50, 100], findDist: 1.3, sparkleDist: 4.5, noteMax: 140 };

export * from './exploreData';
