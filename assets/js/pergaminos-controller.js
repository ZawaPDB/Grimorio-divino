// Zawa Grimorio — Pergaminos Controller
// Ponytail: controlador pequeño, aislado y sin dependencias. Solo gobierna el menú de pergaminos.
(() => {
  const DATA_URL = 'data/commands-data.json';
  const ROOT = '#grimorio';
  const realmNames = {
    todos: 'Todos',
    sapere: 'Sapere',
    economia: 'Economía',
    rituales: 'Rituales',
    titanes: 'Asedio',
    sombras: 'Inframundo',
    maleficios: 'Maleficios',
    cemies: 'El Ojo'
  };
  const realmOrder = ['todos', 'sapere', 'economia', 'rituales', 'titanes', 'sombras', 'maleficios', 'cemies'];
  const fallbackIcons = {
    todos: '✦', sapere: '📖', economia: '🪙', rituales: '🜂', titanes: '⚔️', sombras: '🌑', maleficios: '💀', cemies: '👁️'
  };

  let commands = [];
  let activeRealm = 'todos';

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const root = () => qs(ROOT);
  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function injectStabilityCss(){
    if(qs('#zawa-pergaminos-controller-css')) return;
    const style = document.createElement('style');
    style.id = 'zawa-pergaminos-controller-css';
    style.textContent = `
      #grimorio #commandGrid .spell-card{display:flex!important;}
      #grimorio #commandGrid .spell-card.is-hidden{display:none!important;}
      #grimorio #commandGrid{min-height:260px;}
      #grimorio #emptyState:not(.show), #grimorio #chooseState.hide{display:none!important;}
      #grimorio #emptyState.show{display:block!important;}
    `;
    document.head.appendChild(style);
  }

  async function loadCommands(){
    if(Array.isArray(window.ZAWA_COMMANDS) && window.ZAWA_COMMANDS.length){
      commands = window.ZAWA_COMMANDS;
      return commands;
    }
    try{
      if(window.ZAWA_COMMANDS_READY){
        const readyData = await window.ZAWA_COMMANDS_READY;
        if(Array.isArray(readyData) && readyData.length){
          commands = readyData;
          window.ZAWA_COMMANDS = readyData;
          return commands;
        }
      }
    }catch{}
    const response = await fetch(DATA_URL, {cache: 'no-store'});
    if(!response.ok) throw new Error(`No se pudo cargar ${DATA_URL}`);
    const data = await response.json();
    commands = Array.isArray(data) ? data : [];
    window.ZAWA_COMMANDS = commands;
    return commands;
  }

  function iconFor(item){
    if(item?.icon) return item.icon;
    return fallbackIcons[item?.realm] || '✦';
  }

  function searchableText(item){
    return normalize([
      item.realm, item.title, item.command, item.syntax, item.cost, item.access,
      item.description, item.lore, ...(item.tags || [])
    ].join(' '));
  }

  function cardMarkup(item, index){
    const realmLabel = realmNames[item.realm] || item.realm || '';
    return `<article class="spell-card zawa-force-visible" data-index="${index}" data-realm="${escapeHtml(item.realm)}" data-search="${escapeHtml(searchableText(item))}">
      <div class="card-top">
        <div class="icon-box" aria-hidden="true">${iconFor(item)}</div>
        <div class="card-title"><span class="realm-name">${escapeHtml(realmLabel)}</span><h3>${escapeHtml(item.title || '')}</h3></div>
      </div>
      <code class="spell-code">${escapeHtml(item.syntax || item.command || '')}</code>
      <div class="meta"><span><b>Costo</b><br>${escapeHtml(item.cost || '')}</span><span><b>Acceso</b><br>${escapeHtml(item.access || '')}</span></div>
      <p class="desc">${escapeHtml(item.description || '')}</p>
      <p class="lore">${escapeHtml(item.lore || '')}</p>
      <div class="card-actions">
        <button class="copy-btn" type="button" data-pergamino-copy="${escapeHtml(item.command || '')}">Copiar hechizo</button>
        <button class="reveal-btn" type="button" data-pergamino-open="${index}">Leer pergamino</button>
      </div>
    </article>`;
  }

  function tabIcon(realm){
    const existing = qs(`#realmTabs [data-realm="${realm}"] .realm-tab-icon`, root());
    if(existing) return existing.outerHTML;
    return fallbackIcons[realm] || '✦';
  }

  function renderTabs(){
    const tabs = qs('#realmTabs', root());
    if(!tabs) return;
    const counts = commands.reduce((acc, item) => {
      acc[item.realm] = (acc[item.realm] || 0) + 1;
      return acc;
    }, {});
    tabs.innerHTML = realmOrder
      .filter(realm => realm === 'todos' || counts[realm])
      .map(realm => {
        const count = realm === 'todos' ? commands.length : counts[realm];
        const active = realm === activeRealm;
        return `<button class="realm-tab ${active ? 'is-active' : ''}" type="button" data-realm="${realm}" ${active ? 'aria-current="true"' : ''}>${tabIcon(realm)} ${realmNames[realm]} <small>${count}</small></button>`;
      }).join('');
  }

  function filteredCommands(){
    const query = normalize(qs('#searchInput', root())?.value || '');
    return commands
      .map((item, index) => ({item, index}))
      .filter(({item}) => {
        const realmOk = activeRealm === 'todos' || item.realm === activeRealm;
        const queryOk = !query || searchableText(item).includes(query);
        return realmOk && queryOk;
      });
  }

  function render(){
    const panel = root();
    const grid = qs('#commandGrid', panel);
    const empty = qs('#emptyState', panel);
    const choose = qs('#chooseState', panel);
    if(!panel || !grid) return;

    renderTabs();
    const list = filteredCommands();
    grid.innerHTML = list.map(({item, index}) => cardMarkup(item, index)).join('');
    grid.classList.remove('wave-enter','wave-exit','is-deploying','is-unfolding','pre-deploy','zawa-motion-lock','zawa-placing','zawa-removing','zawa-dissipating');
    if(empty) empty.classList.toggle('show', list.length === 0);
    if(choose) choose.classList.add('hide');
  }

  function openDrawer(index){
    const item = commands[Number(index)];
    const drawer = qs('#drawer');
    const drawerContent = qs('#drawerContent');
    if(!item || !drawer || !drawerContent) return;
    const realmLabel = realmNames[item.realm] || item.realm || '';
    drawerContent.innerHTML = `<div class="drawer-head"><div class="drawer-icon" aria-hidden="true">${iconFor(item)}</div><div class="drawer-title-wrap"><span class="realm-name">${escapeHtml(realmLabel)}</span><h3>${escapeHtml(item.title || '')}</h3></div></div>
      <code>${escapeHtml(item.syntax || item.command || '')}</code>
      <p><strong>Costo:</strong> ${escapeHtml(item.cost || '')}<br><strong>Acceso:</strong> ${escapeHtml(item.access || '')}</p>
      <p>${escapeHtml(item.description || '')}</p>
      <p class="lore">${escapeHtml(item.lore || '')}</p>
      <button class="pixel-btn primary drawer-copy-btn" type="button" data-pergamino-copy="${escapeHtml(item.command || '')}">Copiar ${escapeHtml(item.command || '')}</button>`;
    drawer.classList.add('open');
  }

  async function copyText(value){
    if(!value) return;
    try{ await navigator.clipboard.writeText(value); }catch{}
    let toast = qs('.toast');
    if(!toast){
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = `Copiado: ${value}`;
    toast.classList.add('show');
    clearTimeout(window.__zawaPergaminoToast);
    window.__zawaPergaminoToast = setTimeout(() => toast.classList.remove('show'), 1600);
  }

  function dissipate(){
    const grid = qs('#commandGrid', root());
    const empty = qs('#emptyState', root());
    const choose = qs('#chooseState', root());
    const input = qs('#searchInput', root());
    if(input) input.value = '';
    if(grid) grid.innerHTML = '';
    if(empty) empty.classList.remove('show');
    if(choose) choose.classList.remove('hide');
    qsa('#realmTabs .realm-tab', root()).forEach(tab => {
      tab.classList.remove('is-active');
      tab.removeAttribute('aria-current');
    });
  }

  function controlledTarget(target){
    return target?.closest?.('#grimorio #realmTabs .realm-tab[data-realm], #grimorio #clearBtn, #grimorio #commandGrid [data-pergamino-open], #grimorio #commandGrid [data-open], #grimorio #commandGrid [data-open-hard], #grimorio #commandGrid [data-pergamino-copy], #drawer [data-pergamino-copy]');
  }

  function handlePointer(event){
    const target = event.target;
    const controlled = controlledTarget(target);
    if(!controlled) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const tab = target.closest('#grimorio #realmTabs .realm-tab[data-realm]');
    if(tab){
      activeRealm = tab.dataset.realm || 'todos';
      render();
      return;
    }
    if(target.closest('#grimorio #clearBtn')){
      dissipate();
      return;
    }
    const open = target.closest('[data-pergamino-open], [data-open], [data-open-hard]');
    if(open){
      openDrawer(open.dataset.pergaminoOpen ?? open.dataset.open ?? open.dataset.openHard);
      return;
    }
    const copy = target.closest('[data-pergamino-copy]');
    if(copy){
      copyText(copy.dataset.pergaminoCopy || '');
    }
  }

  function handleSearch(event){
    if(event.target?.matches?.('#grimorio #searchInput')){
      event.stopPropagation();
      event.stopImmediatePropagation();
      activeRealm = activeRealm || 'todos';
      render();
    }
  }

  async function init(){
    injectStabilityCss();
    try{
      await loadCommands();
      render();
    }catch(error){
      const empty = qs('#emptyState', root());
      if(empty){
        empty.textContent = 'No se pudo cargar data/commands-data.json. Revisa que exista en GitHub dentro de la carpeta data.';
        empty.classList.add('show');
      }
    }

    // Ventana en captura: corre antes que los controladores viejos de document y evita dobles renders.
    ['click','pointerdown','touchstart'].forEach(type => window.addEventListener(type, handlePointer, {capture:true, passive:false}));
    window.addEventListener('input', handleSearch, {capture:true});
    window.zawaPergaminosRender = render;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
