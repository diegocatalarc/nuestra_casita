import { createRoot } from 'react-dom/client';
import './styles.css';
import { installDiagnostics } from './game/diagnostics';
import { loadDictionary } from './i18n';
installDiagnostics();

// El diccionario inglés se descarga solo si hace falta, y antes de evaluar los módulos que llaman a t() al cargarse.
async function start() {
  await loadDictionary();
  const showroom = location.search.includes('showroom');
  const { default: Root } = await (showroom ? import('./Showroom') : import('./App'));
  createRoot(document.getElementById('root')).render(<Root />);
}
// Si no se puede descargar el juego (red caída, versión nueva publicada), en vez de una pantalla en blanco: botón para recargar.
start().catch(() => {
  const el = document.getElementById('root');
  if (!el) return;
  el.innerHTML = '<div style="font-family:sans-serif;text-align:center;padding:48px 16px;color:#4a3828"><div style="font-size:56px">🏡</div><p>No se ha podido cargar el juego. Comprueba tu conexión.<br>Could not load the game. Check your connection.</p><button style="font-size:18px;padding:12px 22px;border-radius:14px;border:0;background:#e8688a;color:#fff" onclick="location.reload()">↻</button></div>';
});

// Gancho de depuración/pruebas: añade ?debug a la URL
if (import.meta.env.DEV || location.search.includes('debug')) {
  Promise.all([import('./store/gameStore'), import('./game/actions'), import('./game/runtime'), import('./game/logic'), import('./services/backend')]).then(([s, a, r, l, b]) => {
    window.__nc = { useGame: s.useGame, actions: a, runtime: r, logic: l, backend: b };
  });
}
