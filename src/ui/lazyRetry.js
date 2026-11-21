// import() con un reintento y, si vuelve a fallar (red caída o despliegue nuevo que borró los hashes antiguos), una sola recarga de página.
const FLAG = 'nc_chunk_reload';
export function retryImport(load) {
  return load().catch(() => new Promise((resolve) => setTimeout(resolve, 700)).then(load)).catch((err) => {
    let already = false;
    try { already = sessionStorage.getItem(FLAG) === '1'; sessionStorage.setItem(FLAG, '1'); } catch { /* noop */ }
    if (!already && typeof location !== 'undefined') { location.reload(); return new Promise(() => {}); }
    throw err;
  });
}
