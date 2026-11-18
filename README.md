# 🏡 Nuestra Casita

Videojuego cozy 3D (low poly, isométrico) para parejas a distancia. React + Vite + React Three Fiber + Firebase.

- `docs/01-GDD.md` — Game Design Document completo
- `docs/02-ARQUITECTURA.md` — arquitectura, Firestore, multijugador, guardado, componentes

## Probarlo ya (sin Firebase)
```bash
npm install
npm run dev
```
Abre la URL en **dos pestañas**: en la primera pulsa *Jugar en modo demo → Crear*; en la segunda *demo → Unirme* con el código. Son dos jugadores con presencia y mundo compartido (localStorage + BroadcastChannel).

## Con Firebase
```bash
cp .env.example .env.local   # rellena con tu proyecto
npm run dev
```
Activa Authentication (Google), Firestore y Realtime Database; despliega `firestore.rules` y `database.rules.json`.

## Parámetros de prueba en la URL
`?fast=60` acelera el crecimiento · `?hour=21` fija la hora · `?weather=rain|snow|fog` · `?season=0..3` · `?debug` expone `window.__nc`.

## Controles
WASD/clic: moverse · Q/E: girar cámara · rueda: zoom · R: rotar objeto · C: color · X: quitar · H: abrazo · G: saludar · Esc: cancelar.
