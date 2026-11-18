// Teclado global (ignora cuando se escribe en un campo de texto)
export const keys = {};
const typing = () => {
  const t = document.activeElement?.tagName;
  return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT';
};
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => { if (!typing()) keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
}
export const isTyping = typing;
