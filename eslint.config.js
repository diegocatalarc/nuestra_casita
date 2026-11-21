// Comprobación mínima: detecta identificadores sin definir (p. ej. imports que faltan tras mover código).
const browser = Object.fromEntries(['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'URLSearchParams', 'URL', 'Audio', 'AudioContext', 'Image', 'fetch', 'Blob', 'FileReader', 'FormData', 'File', 'crypto', 'location', 'alert', 'confirm', 'prompt', 'Notification', 'HTMLElement', 'ResizeObserver', 'IntersectionObserver', 'MutationObserver', 'TextEncoder', 'TextDecoder', 'structuredClone', 'atob', 'btoa', 'queueMicrotask', 'CustomEvent', 'Event', 'KeyboardEvent', 'PointerEvent', 'MouseEvent', 'WebSocket', 'AbortController', 'self', 'globalThis', 'MediaRecorder', 'BroadcastChannel', 'MediaStream', 'SpeechSynthesisUtterance', 'speechSynthesis', 'Worker', 'matchMedia', 'getComputedStyle', 'innerWidth', 'innerHeight', '__BUILD__'].map((k) => [k, 'readonly']));
export default [{
  files: ['src/**/*.{js,jsx}', 'tests/**/*.js'],
  languageOptions: { ecmaVersion: 2022, sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: browser },
  rules: { 'no-undef': 'error' },
}];
