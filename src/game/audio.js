// Audio 100 % procedural (WebAudio): sin archivos. Viento, lluvia, río, pájaros, grillos, búho y efectos.
import { riverX } from './worldGen';

let ctx = null, master = null, started = false;
const L = {}; // capas continuas: {gain}
let muted = false;
try { muted = localStorage.getItem('nc_muted') === '1'; } catch { /* noop */ }

let noiseW = null, noiseB = null;
function makeNoise(brown) {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return buf;
}
function loopLayer(buf, chain) {
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const g = ctx.createGain(); g.gain.value = 0;
  let node = src;
  for (const f of chain) { node.connect(f); node = f; }
  node.connect(g); g.connect(master);
  src.start();
  return g;
}
const filt = (type, f, q = 0.7) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };

export function startAudio() {
  if (started) { ctx?.resume?.(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  started = true;
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.85;
  master.connect(ctx.destination);
  noiseW = makeNoise(false); noiseB = makeNoise(true);
  L.wind = loopLayer(noiseB, [filt('bandpass', 380, 0.6)]);
  L.rain = loopLayer(noiseW, [filt('highpass', 900), filt('lowpass', 7000)]);
  L.river = loopLayer(noiseB, [filt('bandpass', 950, 0.7)]);
  // ráfagas de viento: LFO lento sobre la ganancia
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11;
  const lg = ctx.createGain(); lg.gain.value = 0.02;
  lfo.connect(lg); lg.connect(L.wind.gain); lfo.start();
  setInterval(birdTick, 800);
  setInterval(cricketTick, 520);
}

export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('nc_muted', muted ? '1' : '0'); } catch { /* noop */ }
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.1);
  return muted;
}

let birdLevel = 0, cricketLevel = 0, owlLevel = 0;
const to = (p, v, t = 1.2) => p.setTargetAtTime(v, ctx.currentTime, t);

/** Se llama ~1 vez por segundo con el estado del mundo y la posición del jugador. */
export function updateAudio(env, px, pz) {
  if (!ctx) return;
  const day = 1 - env.night;
  const w = env.weather;
  const windBase = w === 'storm' ? 0.17 : w === 'rain' ? 0.1 : w === 'snow' ? 0.12 : w === 'fog' ? 0.045 : 0.055;
  to(L.wind.gain, (windBase + (env.season === 3 ? 0.03 : 0)) * (0.6 + 0.4 * day));
  to(L.rain.gain, w === 'storm' ? 0.3 : w === 'rain' ? 0.2 : 0);
  const d = Math.abs(px - riverX(pz));
  to(L.river.gain, Math.max(0, 1 - d / 15) * 0.16);
  birdLevel = day > 0.6 && w !== 'rain' && w !== 'storm' && w !== 'snow' && env.season !== 3 ? (w === 'fog' ? 0.5 : 1) : 0;
  cricketLevel = env.night > 0.6 && w !== 'rain' && w !== 'storm' && env.season !== 3 ? (env.season === 2 ? 0.6 : 1) : 0;
  owlLevel = env.night > 0.7 && w !== 'rain' && w !== 'storm' && (env.season === 2 || env.season === 3) ? 1 : 0;
}

// ---------- fuentes puntuales ----------
function tone(freq, t0, dur, vol, type = 'sine', slideTo = null, pan = 0) {
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let out = g;
  if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
  o.connect(g); out.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function burst(t0, dur, vol, type, f, q = 0.8) {
  const s = ctx.createBufferSource(); s.buffer = noiseW;
  const fl = filt(type, f, q);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(fl); fl.connect(g); g.connect(master);
  s.start(t0, Math.random() * 1.5, dur + 0.05);
}

function birdTick() {
  if (!ctx || !birdLevel || muted || Math.random() > 0.4) return;
  const t = ctx.currentTime, pan = Math.random() * 1.6 - 0.8;
  const base = 2200 + Math.random() * 1800, n = 2 + Math.floor(Math.random() * 3), kind = Math.random();
  for (let i = 0; i < n; i++) {
    const f = base * (1 + (kind < 0.5 ? i * 0.12 : -i * 0.08));
    tone(f, t + i * 0.13, 0.09, 0.035 * birdLevel, 'sine', f * (1.2 + Math.random() * 0.3), pan);
  }
}
function cricketTick() {
  if (!ctx || !cricketLevel || muted || Math.random() > 0.65) return;
  const t = ctx.currentTime, pan = Math.random() * 1.6 - 0.8, f = 4100 + Math.random() * 400;
  for (let i = 0; i < 5; i++) tone(f, t + i * 0.055, 0.03, 0.012 * cricketLevel, 'sine', null, pan);
  if (owlLevel && Math.random() < 0.04) { tone(390, t + 0.4, 0.35, 0.04, 'sine', 340, -0.3); tone(330, t + 0.9, 0.5, 0.04, 'sine', 290, -0.3); }
}
// el búho también suena sin grillos (otoño/invierno)
setInterval(() => {
  if (ctx && !muted && owlLevel && !cricketLevel && Math.random() < 0.05) {
    const t = ctx.currentTime;
    tone(390, t, 0.35, 0.04, 'sine', 340, -0.3); tone(330, t + 0.5, 0.5, 0.04, 'sine', 290, -0.3);
  }
}, 1500);

export function step(surface = 'grass') {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  burst(t, 0.07, 0.05, 'lowpass', surface === 'wood' ? 1400 : 650, 0.5);
}

/** Efectos de acción. vol: multiplicador (menor para acciones de la pareja). */
export function sfx(kind, vol = 1) {
  if (!ctx || muted) return;
  const t = ctx.currentTime, v = vol;
  switch (kind) {
    case 'water':
      burst(t, 0.22, 0.09 * v, 'bandpass', 1800, 0.9);
      tone(900, t, 0.14, 0.05 * v, 'sine', 320);
      break;
    case 'dig': burst(t, 0.14, 0.1 * v, 'lowpass', 320, 0.6); burst(t + 0.18, 0.12, 0.08 * v, 'lowpass', 280, 0.6); break;
    case 'harvest': tone(660, t, 0.14, 0.07 * v, 'triangle'); tone(880, t + 0.1, 0.2, 0.07 * v, 'triangle'); break;
    case 'build': [0, 0.2, 0.4].forEach((d) => { tone(130, t + d, 0.12, 0.1 * v, 'sine', 70); burst(t + d, 0.05, 0.08 * v, 'bandpass', 2200, 1.2); }); break;
    case 'wave': tone(700, t, 0.12, 0.05 * v, 'sine', 900); tone(900, t + 0.12, 0.14, 0.05 * v, 'sine', 1100); break;
    case 'love': [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.28, 0.06 * v, 'triangle')); break;
    case 'eat': burst(t, 0.06, 0.1 * v, 'bandpass', 1400, 1.5); burst(t + 0.14, 0.06, 0.09 * v, 'bandpass', 1200, 1.5); burst(t + 0.28, 0.06, 0.08 * v, 'bandpass', 1000, 1.5); tone(520, t + 0.35, 0.12, 0.03 * v, 'sine'); break;
    case 'sleep': [392, 330, 262].forEach((f, i) => tone(f, t + i * 0.45, 0.9, 0.04 * v, 'sine')); break;
    case 'pop': tone(500, t, 0.08, 0.06 * v, 'sine', 900); break;
    case 'cast': burst(t, 0.12, 0.07 * v, 'highpass', 2500, 0.8); burst(t + 0.35, 0.25, 0.1 * v, 'bandpass', 900, 0.8); tone(300, t + 0.35, 0.18, 0.04 * v, 'sine', 120); break;
    case 'bite': tone(880, t, 0.09, 0.08 * v, 'square', 700); tone(1175, t + 0.1, 0.12, 0.08 * v, 'square', 900); break;
    case 'reel': burst(t, 0.2, 0.06 * v, 'bandpass', 1500, 2); break;
    case 'catch': burst(t, 0.3, 0.12 * v, 'bandpass', 1100, 0.7); [523, 659, 784].forEach((f, i) => tone(f, t + 0.12 + i * 0.1, 0.22, 0.06 * v, 'triangle')); break;
    case 'splash': burst(t, 0.3, 0.11 * v, 'bandpass', 700, 0.7); tone(220, t, 0.2, 0.04 * v, 'sine', 90); break;
    default: break;
  }
}

/** Trueno: estruendo grave con barrido de filtro. delay en segundos (luz viaja antes que el sonido). */
export function thunder(delay = 1) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource(); s.buffer = noiseB;
  const f = filt('lowpass', 500, 0.5);
  f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(70, t + 3);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.12);
  g.gain.setTargetAtTime(0.0001, t + 0.4, 0.9);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t, Math.random(), 3.6);
}
