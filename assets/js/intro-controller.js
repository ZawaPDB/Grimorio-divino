// Zawa Grimorio — Intro Master/Detail
// Controlador mínimo: cambia paneles, adapta acciones de búsqueda y !SalRah.
(() => {
  const root = document.querySelector('[data-intro-widget]');
  if (!root) return;

  const tabs = Array.from(root.querySelectorAll('.intro-tab[data-target]'));
  const panels = Array.from(root.querySelectorAll('.detail-content[data-panel]'));

  function activate(id){
    tabs.forEach(tab => {
      const active = tab.dataset.target === id;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(panel => panel.classList.toggle('is-active', panel.dataset.panel === id));
  }

  function afterPergaminoAction(action){
    if(!action) return;
    window.setTimeout(() => {
      const search = document.querySelector('#grimorio input[type="search"], #grimorio #searchInput, #grimorio .search-input, #grimorio [data-command-search]');
      if(action === 'focus-search' && search){
        search.focus();
        search.select?.();
      }
      if(action === 'salrah' && search){
        search.value = '!SalRah';
        search.dispatchEvent(new Event('input', {bubbles:true}));
        search.focus();
      }
    }, 700);
  }

  root.addEventListener('click', event => {
    const tab = event.target.closest('.intro-tab[data-target]');
    if(tab){
      activate(tab.dataset.target);
      return;
    }

    const actionLink = event.target.closest('[data-intro-action]');
    if(actionLink){
      afterPergaminoAction(actionLink.dataset.introAction);
    }
  });
})();
