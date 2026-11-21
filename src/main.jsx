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
start();

// Gancho de depuración/pruebas: añade ?debug a la URL
if (import.meta.env.DEV || location.search.includes('debug')) {
  Promise.all([import('./store/gameStore'), import('./game/actions'), import('./game/runtime'), import('./game/logic'), import('./services/backend')]).then(([s, a, r, l, b]) => {
    window.__nc = { useGame: s.useGame, actions: a, runtime: r, logic: l, backend: b };
  });
}
