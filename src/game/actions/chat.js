import { serverNow } from '../time';
import { newId } from '../logic';
import { sfx } from '../audio';
import { commit, st } from './core';

// =====================================================================
//  CHAT
// =====================================================================
export function sendChat(text) {
  const s = st();
  const msg = (text || '').trim().slice(0, 400);
  if (!msg || !s.user) return;
  commit([{ op: 'set', col: 'chat', id: newId('c'), data: { from: s.user.uid, text: msg, at: serverNow() } }]);
  sfx('pop');
}

/** Marca como leídos los mensajes de tu pareja (alimenta el "visto ✓✓"). */
export function markChatSeen() {
  const s = st();
  const uid = s.user?.uid;
  if (!uid || !s.couple?.players?.[uid]) return;
  let last = 0;
  for (const m of Object.values(s.chat)) if (m.from !== uid && m.at > last) last = m.at;
  if (!last || (s.couple.players[uid].chatSeen || 0) >= last) return;
  commit([{ op: 'patch', data: { [`players.${uid}.chatSeen`]: last } }]);
}

