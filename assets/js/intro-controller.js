// Zawa Grimorio — Intro Controller
// Ponytail: componente aislado, datos en JSON, sin dependencias y sin tocar el logo/hero.
(() => {
  const DATA_URL = 'data/intro-data.json';
  const MOUNT = '[data-intro-reino]';

  const fallback = {
    eyebrow: 'Guía del Querubín',
    title: 'Antes de abrir el Grimorio',
    subtitle: 'Aprende en 30 segundos cómo funciona el Reino de los Querubines.',
    items: [],
    actions: []
  };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  async function loadIntro(){
    try{
      const response = await fetch(DATA_URL, {cache:'no-store'});
      if(!response.ok) throw new Error('intro-data missing');
      return await response.json();
    }catch{
      return fallback;
    }
  }

  function actionMarkup(action, extraClass = ''){
    if(!action?.label) return '';
    const view = action.view ? ` data-view="${escapeHtml(action.view)}"` : '';
    const act = action.action ? ` data-intro-action="${escapeHtml(action.action)}"` : '';
    const href = action.href || '#';
    return `<a class="intro-action ${extraClass}" href="${escapeHtml(href)}"${view}${act}>${escapeHtml(action.label)}</a>`;
  }

  function itemButtons(item){
    const actions = Array.isArray(item.actions) ? item.actions : [];
    if(!actions.length) return '';
    return `<div class="intro-mini-actions">${actions.map((a,i)=>actionMarkup(a, i === 0 ? 'primary' : '')).join('')}</div>`;
  }

  function detailMarkup(item, index){
    const intro = item.intro ? `<p class="intro-bridge">${escapeHtml(item.intro)}</p>` : '';
    const paragraphs = (item.paragraphs || []).map(p => `<p>${escapeHtml(p)}</p>`).join('');
    return `<article class="detail-content ${index === 0 ? 'is-active' : ''}" id="intro-panel-${escapeHtml(item.id)}" data-panel="${escapeHtml(item.id)}">
      <div class="detail-kicker">${escapeHtml(item.number)} · ${escapeHtml(item.label)}</div>
      <h3>${escapeHtml(item.title)}</h3>
      ${intro}
      ${paragraphs}
      ${itemButtons(item)}
    </article>`;
  }

  function mobileItemMarkup(item, index){
    return `<article class="intro-mobile-item ${index === 0 ? 'is-active' : ''}">
      <button class="intro-mobile-trigger" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}">
        <span>${escapeHtml(item.number)}</span>
        <strong>${escapeHtml(item.title)}</strong>
      </button>
      <div class="intro-mobile-panel">
        ${item.intro ? `<p class="intro-bridge">${escapeHtml(item.intro)}</p>` : ''}
        ${(item.paragraphs || []).map(p => `<p>${escapeHtml(p)}</p>`).join('')}
        ${itemButtons(item)}
      </div>
    </article>`;
  }

  function render(data){
    const mount = qs(MOUNT);
    if(!mount) return;
    const items = Array.isArray(data.items) ? data.items : [];
    mount.innerHTML = `<div class="intro-reino" data-intro-widget>
      <header class="intro-head">
        <div>
          <p class="eyebrow">${escapeHtml(data.eyebrow || fallback.eyebrow)}</p>
          <h2 id="intro-reino-title">${escapeHtml(data.title || fallback.title)}</h2>
          <p class="intro-subtitle">${escapeHtml(data.subtitle || fallback.subtitle)}</p>
        </div>
      </header>

      <div class="intro-layout">
        <nav class="intro-tabs" aria-label="Temas introductorios del Reino">
          ${items.map((item,index)=>`<button class="intro-tab ${index === 0 ? 'is-active' : ''}" type="button" data-target="${escapeHtml(item.id)}" aria-controls="intro-panel-${escapeHtml(item.id)}" aria-selected="${index === 0 ? 'true' : 'false'}">
            <span class="tab-num">${escapeHtml(item.number)}</span>
            <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.summary || '')}</small></span>
          </button>`).join('')}
        </nav>

        <section class="intro-detail" aria-live="polite">
          ${items.map(detailMarkup).join('')}
        </section>

        <div class="intro-mobile-list">
          ${items.map(mobileItemMarkup).join('')}
        </div>
      </div>

      <div class="intro-actions">
        ${(data.actions || []).map((a,i)=>actionMarkup(a, i === 0 ? 'primary' : '')).join('')}
      </div>
    </div>`;
  }

  function activate(root, id){
    qsa('.intro-tab', root).forEach(tab => {
      const on = tab.dataset.target === id;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    qsa('.detail-content', root).forEach(panel => panel.classList.toggle('is-active', panel.dataset.panel === id));
  }

  function applyCommandAction(action){
    if(!action) return;
    window.setTimeout(() => {
      const input = qs('#grimorio #searchInput');
      if(action === 'focus-search' && input){
        input.focus();
        input.select?.();
      }
      if(action === 'salrah' && input){
        input.value = '!SalRah';
        input.dispatchEvent(new Event('input', {bubbles:true}));
        input.focus();
      }
      if(action === 'sapere'){
        const sapere = qs('#grimorio #realmTabs [data-realm="sapere"]');
        sapere?.click();
      }
    }, 650);
  }

  function bind(){
    const root = qs('[data-intro-widget]');
    if(!root) return;

    root.addEventListener('click', event => {
      const tab = event.target.closest('.intro-tab[data-target]');
      if(tab){
        activate(root, tab.dataset.target);
        return;
      }

      const mobileTrigger = event.target.closest('.intro-mobile-trigger');
      if(mobileTrigger){
        const item = mobileTrigger.closest('.intro-mobile-item');
        const active = item.classList.toggle('is-active');
        mobileTrigger.setAttribute('aria-expanded', active ? 'true' : 'false');
        return;
      }

      const introAction = event.target.closest('[data-intro-action]');
      if(introAction){
        applyCommandAction(introAction.dataset.introAction);
      }
    });
  }

  async function init(){
    const data = await loadIntro();
    render(data);
    bind();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
