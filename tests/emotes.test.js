import { describe, it, expect, beforeEach } from 'vitest';
import { EMOTES, EMOTE_MS, EMOTE_PREFIX, emojiForAnim, playEmote } from '../src/game/emotes';
import { me } from '../src/game/runtime';

// Estado limpio antes de cada prueba: nada de pesca, bote ni sueño.
beforeEach(() => {
  me.act = null; me.actUntil = 0;
  me.fish = null; me.boat = false; me.sleeping = false;
});

describe('lista de emotes', () => {
  it('tiene entre 6 y 8 gestos con id, emoji y animación válidos y sin repetir', () => {
    expect(EMOTES.length).toBeGreaterThanOrEqual(6);
    expect(EMOTES.length).toBeLessThanOrEqual(8);
    const ids = new Set(EMOTES.map((e) => e.id));
    const anims = new Set(EMOTES.map((e) => e.anim));
    expect(ids.size).toBe(EMOTES.length);
    expect(anims.size).toBe(EMOTES.length);
    for (const e of EMOTES) {
      expect(typeof e.id).toBe('string');
      expect(e.emoji.length).toBeGreaterThan(0);
      expect(e.anim.startsWith(EMOTE_PREFIX)).toBe(true);
    }
  });

  it('incluye los gestos pedidos: saludar, bailar, aplaudir, abrazo, reír, corazón, sorpresa y dormir', () => {
    const ids = EMOTES.map((e) => e.id);
    for (const id of ['wave', 'dance', 'clap', 'hug', 'laugh', 'heart', 'surprise', 'sleep']) expect(ids).toContain(id);
  });

  it('emojiForAnim devuelve el emoji de un gesto y null para lo que no lo es', () => {
    expect(emojiForAnim('emo_dance')).toBe('💃');
    expect(emojiForAnim('idle')).toBeNull();
    expect(emojiForAnim('wave')).toBeNull(); // el saludo antiguo no lleva globo
    expect(emojiForAnim(undefined)).toBeNull();
    expect(emojiForAnim('emo_inexistente')).toBeNull();
  });
});

describe('playEmote', () => {
  it('no falla sin pareja conectada: hace el gesto en nuestro avatar', () => {
    expect(() => playEmote('wave')).not.toThrow();
    expect(playEmote('wave')).toBe(true);
    expect(me.act).toBe('emo_wave');
    expect(me.actUntil).toBeGreaterThan(performance.now());
    expect(me.actUntil - performance.now()).toBeLessThanOrEqual(EMOTE_MS + 50);
  });

  it('rechaza un id desconocido sin tocar el avatar', () => {
    expect(playEmote('no-existe')).toBe(false);
    expect(me.act).toBeNull();
  });

  it('no interrumpe al pescar, en el bote ni durmiendo', () => {
    me.fish = { x: 0, z: 0, state: 'wait' };
    expect(playEmote('clap')).toBe(false);
    me.fish = null; me.boat = true;
    expect(playEmote('clap')).toBe(false);
    me.boat = false; me.sleeping = true;
    expect(playEmote('clap')).toBe(false);
    expect(me.act).toBeNull();
  });
});
