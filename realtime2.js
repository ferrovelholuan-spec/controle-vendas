/* Sincronização em tempo real do Controle de Vendas. */
(function () {
  let channel = null;
  let started = false;
  let retryTimer = null;

  function setStatus(text) {
    try { if (typeof status === 'function') status(text); } catch (_) {}
  }

  async function syncNow() {
    try {
      if (typeof carregar === 'function' && typeof saving !== 'undefined' && !saving) {
        await carregar();
      }
    } catch (e) {
      console.error('Sincronização:', e);
    }
  }

  function subscribe() {
    if (started || typeof sb === 'undefined') return;
    started = true;
    try {
      channel = sb
        .channel('controle-vendas-db-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'materiais' }, syncNow)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'funcionarios' }, syncNow)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendas' }, syncNow)
        .subscribe((state) => {
          if (state === 'SUBSCRIBED') {
            setStatus('Banco sincronizado ✓');
            syncNow();
          } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
            setStatus('Sincronização reconectando...');
            started = false;
            clearTimeout(retryTimer);
            retryTimer = setTimeout(subscribe, 5000);
          }
        });
    } catch (e) {
      console.error('Realtime:', e);
      started = false;
      retryTimer = setTimeout(subscribe, 5000);
    }
  }

  function startAfterLogin() {
    if (typeof session !== 'undefined' && session) subscribe();
  }

  // Registra somente o Service Worker seguro da versão 5.
  // Ele não intercepta fetch(), portanto não pode bloquear o carregamento
  // do aplicativo nem as chamadas ao Supabase.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=5', { updateViaCache: 'none' })
      .then((reg) => reg.update().catch(() => {}))
      .catch((e) => console.warn('Service Worker:', e));
  }

  const oldStart = window.start;
  if (typeof oldStart === 'function') {
    window.start = function () {
      const result = oldStart.apply(this, arguments);
      setTimeout(startAfterLogin, 0);
      return result;
    };
  }

  setTimeout(startAfterLogin, 500);
})();
