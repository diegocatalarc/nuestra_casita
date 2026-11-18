import { useState } from 'react';
import { explainError } from '../game/errors';
import LangSwitch from './LangSwitch';
import { t } from '../i18n';

export default function CoupleSetup({ user, onCreate, onJoin, onSignOut, code, onContinue }) {
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true); setErr('');
    try { await fn(); } catch (e) { setErr(explainError(e)); } finally { setBusy(false); }
  };

  if (code) {
    return (
      <div className="screen login">
      <LangSwitch className="corner" />
        <div className="card center">
          <div className="logo">💌</div>
          <h2>{t("¡Vuestra casita está lista!")}</h2>
          <p className="sub">{t("Compartid este código con vuestra pareja para que se una:")}</p>
          <div className="code">{code}</div>
          <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(code)}>{t("Copiar código")}</button>
          <button className="btn primary big" onClick={onContinue}>{t("Entrar a la casita")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen login">
      <LangSwitch className="corner" />
      <div className="card">
        <h2>{t("Hola,")} {user.name} 👋</h2>
        <p className="sub">{t("Una casita es de dos personas. ¿Empezáis una nueva o ya te están esperando?")}</p>
        <div className="two">
          <div className="box">
            <h3>{t("🏡 Crear nuestra casita")}</h3>
            <p>{t("Genera un código de invitación para tu pareja.")}</p>
            <button className="btn primary" disabled={busy} onClick={() => run(onCreate)}>{t("Crear")}</button>
          </div>
          <div className="box">
            <h3>{t("🔑 Unirme con un código")}</h3>
            <input placeholder={t("CÓDIGO")} value={input} maxLength={6} onChange={(e) => setInput(e.target.value.toUpperCase())} />
            <button className="btn primary" disabled={busy || input.length < 6} onClick={() => run(() => onJoin(input))}>{t("Unirme")}</button>
          </div>
        </div>
        {err && <div className="err">{err}</div>}
        <button className="link" onClick={onSignOut}>{t("Cambiar de cuenta")}</button>
      </div>
    </div>
  );
}
