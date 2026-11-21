import { BUILD, deviceInfo, recentErrors, measureFps } from '../game/diagnostics';
import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { getBackend } from '../services/backend';
import { explainError } from '../game/errors';
import { notifState, askNotify } from '../game/notify';
import { serverNow } from '../game/time';
import { LEGACY_BEFORE } from '../game/unlocks';
import Modal from './Modal';
import LangSwitch from './LangSwitch';
import { t } from '../i18n';

const Row = ({ ok, label, children }) => <li className={ok === false ? t("no") : ok ? 'ok' : ''}>{ok === undefined ? '•' : ok ? '✅' : '❌'} <b>{label}</b> {children}</li>;

export default function HelpPanel({ onSignOut, onSwitchHouse }) {
  const s = useGame();
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const showAll = (() => { try { return localStorage.getItem('nc_showall') === '1'; } catch { return false; } })();
  const [notif, setNotif] = useState(notifState());
  const be = getBackend();
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState('');
  const [joining, setJoining] = useState(false);
  const doJoin = async () => {
    setJoining(true); setErr('');
    try { await onSwitchHouse(code); } catch (e) { setErr(explainError(e)); setConfirm(false); }
    setJoining(false);
  };
  const setQuality = (on) => { try { localStorage.setItem('nc_fx', on ? '1' : '0'); } catch { /* noop */ } s.set({ quality: on }); };
  const members = s.couple?.members?.length || 1;
  const partner = s.partner;

  const [fps, setFps] = useState(null);
  const [measuring, setMeasuring] = useState(false);
  const measure = async () => { setMeasuring(true); setFps(null); setFps(await measureFps(5000)); setMeasuring(false); };
  const run = async () => {
    setBusy(true); setRes(null);
    try { setRes(await be.diagnose(s.coupleId)); } catch (e) { setRes({ firestore: e.code || 'error', error: e }); }
    setBusy(false);
  };
  const report = () => [
    t("Nuestra Casita · modo {0} · {1}", [s.mode, location.hostname]),
    t("Usuario: {0} · Casita: {1} · Miembros: {2}", [s.user?.uid, s.coupleId, members]),
    t("Pareja en línea: {0}", [partner.online ? t("sí") : t("no")]),
    res ? t("Firestore: {0} (escribir {1} ms, leer {2} ms) · Realtime DB: {3}", [res.firestore, res.writeMs ?? '-', res.readMs ?? '-', res.rtdb ? t('conectada') : t("SIN conexión")]) : t("Prueba no ejecutada"),
    res?.error ? `Error: ${res.error.code || ''} ${String(res.error.message || '').slice(0, 200)}` : '',
    `Versión: ${BUILD}`,
    (() => { const d = deviceInfo(); return `Dispositivo: ${d.screen} · ventana ${d.viewport} · táctil ${d.touch ? 'sí' : 'no'} · instalada ${d.standalone ? 'sí' : 'no'} · núcleos ${d.cores ?? '?'} · memoria ${d.memGb ?? '?'} GB · conexión ${d.online ? 'sí' : 'NO'} · ${d.lang}`; })(),
    `Navegador: ${deviceInfo().ua}`,
    `Calidad gráfica: ${s.quality ? 'alta' : 'baja'}`,
    fps ? `Fluidez (5 s): ${fps.fps} fps · fotograma medio ${fps.avg} ms · p95 ${fps.p95} ms · máx ${fps.max} ms · ${fps.long} fotogramas > 100 ms` : '',
    recentErrors().length ? `Errores recientes:\n  ${recentErrors().join('\n  ')}` : 'Errores recientes: ninguno',
  ].filter(Boolean).join('\n');

  return (
    <Modal title={t("⚙️ Ayuda y conexión")} wide>
      <button className="btn" style={{ marginBottom: 8 }} onClick={() => useGame.getState().set({ newsOpen: true, panel: null })}>{t("🆕 Ver novedades")}</button>
      <h3>{t("Estado")}</h3>
      <ul className="checks">
        <Row ok={s.mode === 'cloud' ? true : undefined} label={t('Modo')}>{s.mode === 'cloud' ? t("Firebase (online)") : t("Demo local (solo este navegador)")}</Row>
        <Row ok={members >= 2} label={t('Pareja unida')}>{members >= 2 ? '' : t("Comparte el código {0}", [s.couple?.inviteCode])}</Row>
        <Row ok={partner.online} label={t('Pareja en línea ahora')}>{partner.online ? '' : t("Si ella/él está jugando y no se ve, probad la conexión de abajo")}</Row>
      </ul>

      {s.mode === 'cloud' && (
        <>
          <h3>{t('Casita actual')}</h3>
          <p className="sub">{t('Código: {0} · Personas: {1}/2', [s.couple?.inviteCode, members])}</p>
          <p className="sub">{members < 2 ? t('Si tu pareja ya creó su propia casita, escribe aquí su código para pasar a ella. Dejarás esta casita.') : t('Esta casita ya tiene dos personas. Solo cambiéis de casita si de verdad queréis separaros de ella.')}</p>
          <div className="row">
            <input placeholder={t('CÓDIGO')} value={code} maxLength={6} onChange={(e) => { setCode(e.target.value.toUpperCase()); setConfirm(false); }} />
            {!confirm
              ? <button className="btn primary" disabled={code.length < 6 || joining} onClick={() => (members >= 2 ? setConfirm(true) : doJoin())}>{t('Unirme')}</button>
              : <button className="btn rec" disabled={joining} onClick={doJoin}>{t('Sí, cambiar de casita')}</button>}
          </div>
          {err && <div className="err">{err}</div>}
        </>
      )}

      <h3>{t("Probar conexión")}</h3>
      <p className="sub">{t("Escribe y lee un dato de prueba en el servidor y comprueba la presencia en tiempo real.")}</p>
      <div className="row">
        <button className="btn primary" onClick={run} disabled={busy}>{busy ? t("Probando…") : t("Probar ahora")}</button>
        <button className="btn ghost" onClick={measure} disabled={measuring}>{measuring ? t("Midiendo… (no toques nada)") : t("⏱️ Medir fluidez (5 s)")}</button>
        <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(report())}>{t("📋 Copiar informe")}</button>
      </div>
      {res && (
        <ul className="checks">
          <Row ok={res.firestore === 'ok'} label="Firestore">{res.firestore === 'ok' ? t("escribir {0} ms · leer {1} ms", [res.writeMs, res.readMs]) : explainError(res.error || { code: res.firestore })}</Row>
          <Row ok={!!res.rtdb} label={t('Realtime Database (movimiento)')}>{res.rtdb ? t('conectada') : t("sin conexión: revisa la URL de la base de datos y sus reglas")}</Row>
        </ul>
      )}

      <h3>{t("Avisos")}</h3>
      <p className="sub">{t("Con la pestaña en segundo plano te avisamos de cartas nuevas, de que tu pareja llega y de propuestas. (Con la app cerrada no es posible sin un servidor de notificaciones.)")}</p>
      <div className="row">
        {notif === 'granted' ? <span className="chip">{t("🔔 Avisos activados")}</span>
          : notif === 'unsupported' ? <span className="hint">{t("Tu navegador no admite avisos.")}</span>
          : notif === 'denied' ? <span className="hint">{t("Bloqueados: actívalos en los permisos del sitio de tu navegador.")}</span>
          : <button className="btn ghost" onClick={async () => setNotif(await askNotify())}>{t("🔔 Activar avisos")}</button>}
      </div>

      <h3>{t("Calidad gráfica")}</h3>
      <p className="sub">{t("Alta dibuja un contorno fino en todo el mundo, brillo y color de cine. En tablet gasta más batería: si va a tirones, vuelve a Normal.")}</p>
      <div className="row">
        <button className={'btn ' + (s.quality ? 'ghost' : 'primary')} onClick={() => setQuality(false)}>{t("Normal")}</button>
        <button className={'btn ' + (s.quality ? 'primary' : 'ghost')} onClick={() => setQuality(true)}>{t("Alta")}</button>
      </div>

      {(s.couple?.startedAt || 0) >= LEGACY_BEFORE && (<>
        <h3>{t("Pantalla limpia")}</h3>
        <p className="sub">{t("Las funciones aparecen poco a poco según avanza la historia. Actívalo para verlas todas desde ya (solo en este dispositivo).")}</p>
        <div className="row">
          <button className={'btn ' + (showAll ? 'primary' : 'ghost')} onClick={() => { try { localStorage.setItem('nc_showall', showAll ? '0' : '1'); } catch { /* noop */ } s.set({ uiTick: (s.uiTick || 0) + 1 }); }}>{showAll ? t("Mostrando todas las funciones") : t("Mostrar todas las funciones")}</button>
        </div>
      </>)}

      <h3>{t('Idioma')} / Language</h3>
      <LangSwitch />

      <h3>{t("Más")}</h3>
      <div className="row">
        <button className="btn ghost" onClick={() => s.set({ newsOpen: true, panel: null })}>{t("🆕 Novedades")}</button>
        <button className="btn ghost" onClick={() => { try { localStorage.removeItem(`nc_tut_${s.user.uid}`); } catch { /* noop */ } s.set({ tutorialSkip: false, panel: null }); }}>{t("🎓 Repetir tutorial")}</button>
        <button className="btn ghost" onClick={onSignOut}>{t("⏏ Cerrar sesión")}</button>
      </div>
    </Modal>
  );
}
