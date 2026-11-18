import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import Showroom from './Showroom';

createRoot(document.getElementById('root')).render(location.search.includes('showroom') ? <Showroom /> : <App />);

// Gancho de depuración/pruebas: añade ?debug a la URL
if (import.meta.env.DEV || location.search.includes('debug')) {
  Promise.all([import('./store/gameStore'), import('./game/actions'), import('./game/runtime'), import('./game/logic'), import('./services/backend')]).then(([s, a, r, l, b]) => {
    window.__nc = { useGame: s.useGame, actions: a, runtime: r, logic: l, backend: b };
  });
}
