import { LANGS, lang, setLang } from '../i18n';

/** Selector de idioma (recarga la página al cambiar). */
export default function LangSwitch({ className = '' }) {
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l.id} className={l.id === lang ? 'on' : ''} onClick={() => l.id !== lang && setLang(l.id)} aria-pressed={l.id === lang}>{l.id.toUpperCase()}</button>
      ))}
    </div>
  );
}
