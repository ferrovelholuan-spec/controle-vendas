// Inicialização da sincronização.
// O index.html já cria o cliente Supabase e expõe carregar().
// Chamamos a sincronização ao abrir a página para o status não ficar preso em "Conectando...".
console.info('Sincronização inicial iniciada.');
window.addEventListener('load',()=>{
  setTimeout(()=>{
    if(typeof carregar==='function') carregar();
    else console.error('Função carregar() não encontrada.');
  },100);
});