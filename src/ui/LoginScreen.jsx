import { useState } from 'react';
import { CLOUD_CONFIGURED } from '../services/backend';
import { t } from '../i18n';
import LangSwitch from './LangSwitch';

export default function LoginScreen({ onGoogle, onDemo, onReset, error }) {
  const [name, setName] = useState('');
  return (
    <div className="screen login">
      <LangSwitch className="corner" />
      <div className="card center">
        <div className="logo">🏡</div>
        <h1>{t("Nuestra Casita")}</h1>
        <p className="sub">{t("Un mundo para dos, aunque haya kilómetros entre vosotros.")}</p>

        {CLOUD_CONFIGURED && (
          <button className="btn primary big" onClick={onGoogle}>
            <span className="g">G</span> {t("Entrar con Google")}</button>
        )}

        <div className="demo">
          <div className="hint">{CLOUD_CONFIGURED ? t('o prueba sin cuenta') : t("Modo demo local (sin Firebase): abre el juego en dos pestañas para ser dos jugadores.")}</div>
          <input placeholder={t("Tu nombre")} value={name} maxLength={20} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onDemo(name)} />
          <button className="btn big" onClick={() => onDemo(name)}>{t("Jugar en modo demo")}</button>
        </div>
        {CLOUD_CONFIGURED && <div className="hint">{t('El modo demo solo funciona dentro de este navegador. Para jugar con tu pareja desde otro dispositivo, entra con Google.')}</div>}
        {error && <div className="err">{error}</div>}
        {onReset && <button className="link" onClick={onReset}>{t("Borrar partida demo local")}</button>}
      </div>
    </div>
  );
}
