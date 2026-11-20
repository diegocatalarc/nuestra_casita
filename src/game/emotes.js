// Emotes: gestos cortos que hace tu avatar y que ve la pareja (viajan por el canal de presencia, campo `anim`).
// Lógica pura: sin React. Los textos se traducen en src/ui/Emotes.jsx.
import { me, doAnim } from './runtime';

/** Duración del gesto y del globo flotante (ms). */
export const EMOTE_MS = 2000;

/** Prefijo de los gestos en el campo `anim` (no colisiona con 'wave', 'love', 'sleep'…). */
export const EMOTE_PREFIX = 'emo_';

export const EMOTES = [
  { id: 'wave', emoji: '👋', anim: 'emo_wave' },
  { id: 'dance', emoji: '💃', anim: 'emo_dance' },
  { id: 'clap', emoji: '👏', anim: 'emo_clap' },
  { id: 'hug', emoji: '🤗', anim: 'emo_hug' },
  { id: 'laugh', emoji: '😂', anim: 'emo_laugh' },
  { id: 'heart', emoji: '💗', anim: 'emo_heart' },
  { id: 'surprise', emoji: '❗', anim: 'emo_surprise' },
  { id: 'sleep', emoji: '😴', anim: 'emo_sleep' },
];

/** Emoji del gesto dado su valor de `anim`, o null si no es un gesto. */
export function emojiForAnim(anim) {
  if (typeof anim !== 'string' || !anim.startsWith(EMOTE_PREFIX)) return null;
  return EMOTES.find((e) => e.anim === anim)?.emoji || null;
}

/**
 * Hace el gesto `id` con nuestro avatar. Devuelve false si no existe o si ahora no toca
 * (pescando, en el bote o durmiendo). No necesita pareja: la otra persona lo verá al conectarse.
 */
export function playEmote(id) {
  const e = EMOTES.find((x) => x.id === id);
  if (!e) return false;
  if (me.fish || me.boat || me.sleeping) return false;
  doAnim(e.anim, EMOTE_MS);
  return true;
}
