/* Sincronização em tempo real do Controle de Vendas.
   Usa o mesmo cliente Supabase do index.html e mantém o polling como fallback. */
(function () {
  let channel = null;
  let started = false;
  let retryTimer = null;

  function setStatus(text) {
    try { if (typeof status === 'function') status(text); } catch (_) {}
  }

  async function syncNow() {
    try {
      if (typeof carregar === 'function' && !window.__savingVenda) await carregar();
    } catch (e) {
      console.error('Sincronização:', e);
    }
  }

  function subscribe() {
    if (started || !window.sb) return;
    started = true;

    try {
      channel = window.sb
        .channel('controle-vendas-db-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'materiais' }, () => syncNow())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'funcionarios' }, () => syncNow())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendas' }, () => syncNow())
        .subscribe((state) => {
          if (state === 'SUBSCRIBED') {
            setStatus('Banco sincronizado ✓');
          } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
            console.warn('Realtime:', state);
            setStatus('Sincronização automática reconectando...');
            started = false;
            if (retryTimer) clearTimeout(retryTimer);
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
    if (window.session) subscribe();
  }

  // Registro do PWA com versão nova para o Android não reutilizar cache antigo.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=4', { updateViaCache: 'none' })
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

  // Caso o script seja carregado depois de um login já restaurado.
  setTimeout(startAfterLogin, 300);
})();
