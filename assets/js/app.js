// Zawa Grimorio — arquitectura Ponytail/static-framework
// Datos externos + assets separados. Sin dependencias innecesarias.

(async () => {
  async function zawaLoadCommandsData(){
    const response = await fetch('data/commands-data.json', { cache: 'no-store' });
    if(!response.ok){
      throw new Error(`No se pudo cargar data/commands-data.json (${response.status})`);
    }
    return response.json();
  }

  const zawaCommandsReady = zawaLoadCommandsData();
  window.ZAWA_COMMANDS_READY = zawaCommandsReady;
  const commands = await zawaCommandsReady;
  window.ZAWA_COMMANDS = commands;

const realmNames = {
      todos:'Todos', sapere:'Sapere', economia:'Economía', rituales:'Rituales', titanes:'Asedio', sombras:'Inframundo', maleficios:'Maleficios', cemies:'El Ojo'
    };
    const fotopatasTabIcon = `<span class="realm-tab-icon realm-tab-icon-fotopatas" aria-hidden="true"><img src="assets/img/embedded/asset-0f183754b48a.webp" alt=""></span>`;
    const ritualesTabIcon = `<span class="realm-tab-icon realm-tab-icon-rituales" aria-hidden="true"><img src="assets/img/embedded/asset-e567146bc754.webp" alt=""></span>`;
    const titanesTabIcon = `<span class="realm-tab-icon realm-tab-icon-titanes" aria-hidden="true"><img src="assets/img/embedded/asset-d9045f4a8a68.webp" alt=""></span>`;
    const cemiesTabIcon = `<span class="realm-tab-icon realm-tab-icon-cemies"><img src="assets/img/embedded/asset-b2345906576c.webp" alt=""></span>`;
      const sapereTabIcon = `<span class="realm-tab-icon realm-tab-icon-sapere" aria-hidden="true"><img src="assets/img/embedded/asset-30de501eff58.webp" alt=""></span>`;
      const economiaTabIcon = `<span class="realm-tab-icon realm-tab-icon-economia" aria-hidden="true"><img src="assets/img/embedded/asset-723eb49bb4f5.webp" alt=""></span>`;
      const realmIcons = {todos:'✦', sapere:sapereTabIcon, economia:economiaTabIcon, rituales:ritualesTabIcon, titanes:titanesTabIcon, sombras:'🌑', maleficios:'<span class="realm-tab-icon realm-tab-icon-maleficios" aria-hidden="true"><img src="assets/img/embedded/asset-6d6e0712828d.webp" alt=""></span>', cemies:cemiesTabIcon};
    const grid = document.getElementById('commandGrid');
    const tabsBox = document.getElementById('realmTabs');
    const searchInput = document.getElementById('searchInput');
    const emptyState = document.getElementById('emptyState');
    const drawer = document.getElementById('drawer');
    const drawerContent = document.getElementById('drawerContent');
    const drawerClose = document.getElementById('drawerClose');
    const motionToggle = document.getElementById('motionToggle');
    const clearBtn = document.getElementById('clearBtn');
    let activeRealm = 'todos';
    const chooseState = document.getElementById('chooseState');

    function normalize(value){return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
    function publicCommands(){return commands;}
    function realmCount(realm){
      const list = publicCommands();
      return realm === 'todos' ? list.length : list.filter(c=>c.realm === realm).length;
    }
    function uniqueRealms(){
      const order = ['todos','sapere','economia','rituales','titanes','sombras','maleficios','cemies'];
      return order.filter(r=>r === 'todos' || commands.some(c=>c.realm === r));
    }
    function escapeHtml(value){
      return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
    }
    function shouldUseWave(){
      return !document.body.classList.contains('no-motion') &&
             !window.matchMedia('(max-width: 760px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches;
    }
    function renderTabs(){
      tabsBox.innerHTML = uniqueRealms().map(realm => `<button class="realm-tab ${activeRealm === realm ? 'is-active' : ''}" type="button" data-realm="${realm}" ${activeRealm === realm ? 'aria-current="true"' : ''}>${realmIcons[realm]} ${realmNames[realm]} <small>${realmCount(realm)}</small></button>`).join('');
      tabsBox.querySelectorAll('.realm-tab').forEach(btn=>{
        btn.addEventListener('click',(event)=>{
          event.preventDefault();
          const selectedRealm = btn.dataset.realm;
          if(activeRealm === selectedRealm) return;
          activeRealm = selectedRealm;
          btn.classList.add('is-pulsing');
          render({wave:true});
        });
      });
    }
    function card(item, index){
      const searchable = normalize([item.realm, item.title, item.command, item.syntax, item.description, item.lore, ...(item.tags || [])].join(' '));
      const displayIcon = getDisplayIcon(item);
      return `<article class="spell-card" data-index="${index}" data-realm="${escapeHtml(item.realm)}" data-search="${escapeHtml(searchable)}">
        <div class="card-top">
          <div class="icon-box" aria-hidden="true">${displayIcon}</div>
          <div class="card-title"><span class="realm-name">${realmNames[item.realm] || item.realm}</span><h3>${escapeHtml(item.title)}</h3></div>
        </div>
        <code class="spell-code">${escapeHtml(item.syntax)}</code>
        <div class="meta"><span><b>Costo</b><br>${escapeHtml(item.cost)}</span><span><b>Acceso</b><br>${escapeHtml(item.access)}</span></div>
        <p class="desc">${escapeHtml(item.description)}</p>
        <p class="lore">${escapeHtml(item.lore)}</p>
        <div class="card-actions">
          <button class="copy-btn" type="button" data-copy="${escapeHtml(item.command)}">Copiar hechizo</button>
          <button class="reveal-btn" type="button" data-open="${index}">Leer pergamino</button>
        </div>
      </article>`;
    }
    let lastRenderSignature = '';
    let waveTransitionTimer = null;

    function getEffectiveView(){
      const q = normalize(searchInput.value.trim());
      const effective = activeRealm || (q ? 'todos' : null);
      return {q, effective, signature:`${effective || 'none'}|${q}`};
    }

    function prepareCardsForView(q, effective, enterMode = false){
      // limpiar animaciones ANTES de crear las tarjetas (evita el flash/reset:
      // si quedaba 'wave-exit', las nuevas nacían con la animación de salida)
      grid.classList.remove('wave-enter','wave-exit','is-deploying','is-unfolding','pre-deploy');
      const list = publicCommands();
      grid.innerHTML = list.map((item)=>card(item, commands.indexOf(item))).join('');

      let visible = 0;
      grid.querySelectorAll('.spell-card').forEach(card=>{
        const realmOk = effective === 'todos' || card.dataset.realm === effective;
        const searchOk = !q || card.dataset.search.includes(q);
        const show = realmOk && searchOk;
        card.hidden = !show;

        if(show){
          card.classList.remove('wave-from-left','wave-from-right','wave-exit-left','wave-exit-right');
          card.classList.add(visible % 2 === 0 ? 'wave-from-left' : 'wave-from-right');
          card.style.setProperty('--wave-delay', `${Math.min(visible, 20) * 165}ms`);
          visible++;
        }
      });

      emptyState.classList.toggle('show', visible === 0);

      if(enterMode && visible > 0){
        grid.classList.remove('wave-enter','wave-exit','is-deploying','is-unfolding','pre-deploy');
        void grid.offsetWidth;
        grid.classList.add('wave-enter');

        clearTimeout(waveTransitionTimer);
        waveTransitionTimer = setTimeout(()=>{
          grid.classList.remove('wave-enter');
          grid.querySelectorAll('.spell-card').forEach(card=>{
            card.classList.remove('wave-from-left','wave-from-right');
            card.style.removeProperty('--wave-delay');
          });
        }, 4200);
      }

      wireActions();
      return visible;
    }

    function exitCurrentCardsThenEnter(q, effective){
      const currentCards = [...grid.querySelectorAll('.spell-card:not([hidden])')];

      if(!currentCards.length){
        prepareCardsForView(q, effective, true);
        return;
      }

      clearTimeout(waveTransitionTimer);
      grid.classList.remove('wave-enter','is-deploying','is-unfolding','pre-deploy');
      grid.classList.add('wave-exit');

      const total = currentCards.length;
      currentCards.forEach((card, index)=>{
        card.classList.remove('wave-from-left','wave-from-right','wave-exit-left','wave-exit-right');
        card.classList.add(index % 2 === 0 ? 'wave-exit-left' : 'wave-exit-right');
        card.style.setProperty('--wave-delay', `${Math.min(index, 20) * 130}ms`);
      });

      const exitTime = 560 + Math.min(total, 20) * 130;

      waveTransitionTimer = setTimeout(()=>{
        grid.classList.remove('wave-exit');
        prepareCardsForView(q, effective, true);
      }, exitTime);
    }

    function render(options = {}){
      if(options.wave && !shouldUseWave()) options.wave = false;
      renderTabs();
      const {q, effective, signature} = getEffectiveView();

      if(options.wave && signature === lastRenderSignature){
        options.wave = false;
      }

      chooseState.classList.toggle('hide', !!effective);

      if(!effective){
        clearTimeout(waveTransitionTimer);
        grid.classList.remove('wave-enter','wave-exit','is-deploying','is-unfolding','pre-deploy');
        grid.innerHTML = '';
        emptyState.classList.remove('show');
        lastRenderSignature = signature;
        return;
      }

      if(options.wave){
        exitCurrentCardsThenEnter(q, effective);
      }else{
        prepareCardsForView(q, effective, false);
      }

      lastRenderSignature = signature;
    }

    function wireActions(){
      document.querySelectorAll('[data-copy]').forEach(btn=>{
        btn.onclick = async()=>{
          const value = btn.dataset.copy;
          try{await navigator.clipboard.writeText(value); toast(`Copiado: ${value}`)}catch{toast(`Comando: ${value}`)}
        };
      });
      document.querySelectorAll('[data-open]').forEach(btn=>{
        btn.onclick = ()=>openDrawer(commands[Number(btn.dataset.open)]);
      });
    }
    function openDrawer(item){
      const displayIcon = getDisplayIcon(item);
      drawerContent.innerHTML = `<div class="drawer-head"><div class="drawer-icon" aria-hidden="true">${displayIcon}</div><div class="drawer-title-wrap"><span class="realm-name">${escapeHtml(realmNames[item.realm] || item.realm || '')}</span><h3>${escapeHtml(item.title)}</h3></div></div><code>${escapeHtml(item.syntax)}</code><p><strong>Costo:</strong> ${escapeHtml(item.cost)}<br><strong>Acceso:</strong> ${escapeHtml(item.access)}</p><p>${escapeHtml(item.description)}</p><p class="lore">${escapeHtml(item.lore)}</p><button class="pixel-btn primary drawer-copy-btn" type="button" data-copy="${escapeHtml(item.command)}">Copiar ${escapeHtml(item.command)}</button>`;
      drawer.classList.add('open');
      wireActions();
    }
    function toast(message){
      let el = document.querySelector('.toast');
      if(!el){el = document.createElement('div');el.className='toast';document.body.appendChild(el)}
      el.textContent = message; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),1800);
    }
    if(drawerClose){drawerClose.addEventListener('click',()=>drawer.classList.remove('open'));}
    document.addEventListener('keydown', e=>{if(e.key === 'Escape') drawer.classList.remove('open')});
    /* Buscador legacy desactivado: evita doble render y reinicio de animación. */
    /* Disipar legacy desactivado: evita que corra una segunda animación wave-exit. */
    if(motionToggle){motionToggle.addEventListener('click',()=>{const on=document.body.classList.toggle('no-motion');motionToggle.setAttribute('aria-pressed', String(on));motionToggle.textContent=on?'Quitar sello de runas':'Runas selladas';});}
    const codexBook = document.getElementById('codexBook');
    if(codexBook){
      codexBook.addEventListener('click', ()=>codexBook.classList.toggle('open'));
      codexBook.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); codexBook.classList.toggle('open'); } });
    }

    // ── Altares de la Gloria: integración lista para Twitch ──
    // Para que sea 100% automático, tu bot/sistema del Reino debe exponer uno de estos endpoints:
    //   /api/altares-gloria
    //   ./altares-gloria.json
    // El sistema del Reino es quien debe conectarse a Twitch EventSub/API y escribir estos datos.
    // Para que el slide muestre fotos reales de Twitch, cada persona puede traer: photo, avatar o profile_image_url.
    // Nueva pieza: rachasGloria acepta objetos { name, streak, title, avatar } para reconocer streams seguidos.
    const ALTARES_GLORIA_ENDPOINTS = [
      window.ZAWA_ALTARES_ENDPOINT || '/api/altares-gloria',
      './altares-gloria.json'
    ];


    const ZAWA_GUARDIAN_PHOTOS = {
      edghost: 'assets/img/embedded/asset-150b19621c5e.jpg'
    };

    function zawaGuardianKey(name){
      const n = String(name || '').toLowerCase().replace(/[^a-z0-9]/g,'');
      if(n.includes('edghost')) return 'edghost';
      return '';
    }

    function zawaGuardianPhoto(item){
      const direct = item?.photo || item?.avatar || item?.profile_image_url || item?.profileImageUrl || '';
      if(direct) return direct;
      const key = zawaGuardianKey(item?.name || item?.displayName || '');
      return key ? ZAWA_GUARDIAN_PHOTOS[key] : '';
    }

    function zawaGuardianDisplayName(item){
      const key = zawaGuardianKey(item?.name || item?.displayName || '');
      if(item?.displayName) return item.displayName;
      if(key === 'edghost') return 'EdGhost21';
      return item?.name || 'Guardián';
    }

    const ALTARES_DEMO_DATA = {
      source: 'twitch',
      weekLabel: 'Semana del Reino',
      mesias: [],
      seresDivinos: {
        dioses: [],
        titanes: [],
        primordiales: []
      },
      heraldosGloria: [],
      forjadoresTesoro: [],
      guardianes: []
    };

    function honorMark(index){ return index === 0 ? '♔' : '✦'; }
    function topThree(list){ return Array.isArray(list) ? list.slice(0,3) : []; }

    function renderHonorList(id, list, valueKey, valueLabel, emptyText, opts){
      opts = opts || {};
      const el = document.getElementById(id);
      if(!el) return;
      const items = topThree(list);
      if(!items.length){
        el.innerHTML = [0,1,2].map(()=>`<li class="honor-item empty"><span class="honor-mark">✦</span><span class="honor-name">${escapeHtml(emptyText)}</span></li>`).join('');
        return;
      }
      el.innerHTML = items.map((item,index)=>{
        const value = valueKey ? Number(item[valueKey] || 0).toLocaleString('es') + ' ' + valueLabel.toLowerCase() : escapeHtml(item.status || valueLabel || '');
        const cls = opts.equal ? 'honor-item vip-equal' : `honor-item${index === 0 ? ' is-lead' : ''}`;
        const mark = opts.equal ? '◆' : honorMark(index);
        return `<li class="${cls}">
          <span class="honor-mark">${mark}</span>
          <span class="honor-name" title="${escapeHtml(item.name || 'Anónimo')}">${escapeHtml(item.name || 'Anónimo')}</span>
          ${valueKey || valueLabel ? `<span class="honor-value">${value}</span>` : ''}
        </li>`;
      }).join('');
    }

    function renderMiniHonorList(id, list, emptyText){
      const el = document.getElementById(id);
      if(!el) return;
      const items = topThree(list);
      if(!items.length){
        el.innerHTML = [0,1,2].map(()=>`<li class="honor-item empty"><span class="honor-mark">✦</span><span class="honor-name">${escapeHtml(emptyText)}</span></li>`).join('');
        return;
      }
      el.innerHTML = items.map((item,index)=>`<li class="honor-item${index === 0 ? ' is-lead' : ''}">
        <span class="honor-mark">${honorMark(index)}</span>
        <span class="honor-name" title="${escapeHtml(item.name || 'Anónimo')}">${escapeHtml(item.name || 'Anónimo')}</span>
      </li>`).join('');
    }

    function initials(name){
      return String(name || '?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || '?';
    }

    let divinePageLock = false;

    function setDivinePage(index){
      document.querySelectorAll('[data-divine-pager]').forEach(pager=>{
        const tabs = Array.from(pager.querySelectorAll('[data-divine-page]'));
        const panels = Array.from(pager.querySelectorAll('[data-divine-page-panel]'));
        const safeIndex = Math.max(0, Math.min(Number(index) || 0, Math.max(tabs.length - 1, 0)));
        const currentPanel = panels.find(panel => panel.classList.contains('is-active'));
        const nextPanel = panels[safeIndex];
        const reduce = document.body.classList.contains('no-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if(!nextPanel) return;
        if(currentPanel === nextPanel){
          tabs.forEach((tab, i)=>{
            const active = i === safeIndex;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
            tab.setAttribute('tabindex', active ? '0' : '-1');
          });
          return;
        }
        if(divinePageLock && !reduce) return;
        divinePageLock = true;

        tabs.forEach((tab, i)=>{
          const active = i === safeIndex;
          tab.classList.toggle('is-active', active);
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.setAttribute('tabindex', active ? '0' : '-1');
        });

        const finish = () => {
          panels.forEach(panel=>{
            const active = panel === nextPanel;
            panel.hidden = !active;
            panel.classList.toggle('is-active', active);
            panel.classList.remove('is-leaving');
          });
          nextPanel.hidden = false;
          void nextPanel.offsetWidth;
          nextPanel.classList.add('is-active');
          window.setTimeout(()=>{ divinePageLock = false; }, reduce ? 0 : 120);
        };

        if(reduce || !currentPanel){
          finish();
          return;
        }

        currentPanel.classList.add('is-leaving');
        window.setTimeout(finish, 410);
      });
    }

    document.addEventListener('click', event=>{
      const tab = event.target.closest('[data-divine-page]');
      if(!tab) return;
      setDivinePage(Number(tab.dataset.divinePage));
    });

    document.addEventListener('keydown', event=>{
      const tab = event.target.closest('[data-divine-page]');
      if(!tab || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      const tabs = Array.from(tab.closest('[data-divine-pager]').querySelectorAll('[data-divine-page]'));
      const current = tabs.indexOf(tab);
      const next = event.key === 'ArrowRight'
        ? (current + 1) % tabs.length
        : (current - 1 + tabs.length) % tabs.length;
      event.preventDefault();
      setDivinePage(next);
      tabs[next]?.focus();
    });


    function renderGuardianes(list){
      const el = document.getElementById('altarGuardianes');
      if(!el) return;
      const items = topThree(list);
      if(!items.length){
        el.innerHTML = [
          {name:'EdGhost21', displayName:'EdGhost21', role:'Moderador', photo:ZAWA_GUARDIAN_PHOTOS.edghost}
        ].map(item=>{
          const key = zawaGuardianKey(item.name);
          return `<div class="guardian-card" data-mod-key="${escapeHtml(key)}">
            <span class="guardian-avatar"><img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.displayName || item.name)}"></span>
            <span><span class="guardian-name" title="${escapeHtml(item.displayName || item.name)}">${escapeHtml(item.displayName || item.name)}</span><span class="guardian-role">${escapeHtml(item.role || 'Moderador')}</span></span>
          </div>`;
        }).join('');
        return;
      }
      el.innerHTML = items.map(item=>{
        const key = zawaGuardianKey(item.name || item.displayName);
        const displayName = zawaGuardianDisplayName(item);
        const photoUrl = zawaGuardianPhoto(item);
        const avatar = photoUrl
          ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(displayName)}">`
          : `<span class="guardian-initial">${escapeHtml(initials(displayName))}</span>`;
        return `<div class="guardian-card" data-mod-key="${escapeHtml(key)}">
          <span class="guardian-avatar">${avatar}</span>
          <span><span class="guardian-name" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</span><span class="guardian-role">${escapeHtml(item.role || 'Moderador')}</span></span>
        </div>`;
      }).join('');
    }


    function rachaTitle(streak){
      streak = Number(streak || 0);
      if(streak >= 30) return 'Primordial de la Vigilia';
      if(streak >= 20) return 'Titán de la Vigilia';
      if(streak >= 10) return 'Campeón de la Vigilia';
      if(streak >= 5) return 'Guardián de la Vigilia';
      if(streak >= 3) return 'Vigía de la Vigilia';
      return 'Alma que despierta';
    }

    function renderRachasGloria(list){
      const lead = document.getElementById('rachaLead');
      const el = document.getElementById('altarRachas');
      const items = Array.isArray(list)
        ? [...list].sort((a,b)=>Number(b.streak || b.streams || 0) - Number(a.streak || a.streams || 0)).slice(0,4)
        : [];

      if(lead){
        const top = items[0] || {name:'Esperando al primer guardián', streak:0, title:'Llama por encender'};
        const streak = Number(top.streak || top.streams || 0);
        lead.innerHTML = `
          <span class="racha-crown">${streak >= 30 ? '☀' : streak >= 20 ? '♜' : streak >= 10 ? '♔' : '✦'}</span>
          <span class="racha-main">
            <span class="racha-label">Mayor vigilia</span>
            <span class="racha-name" title="${escapeHtml(top.name || 'Esperando al primer guardián')}">${escapeHtml(top.name || 'Esperando al primer guardián')}</span>
            <span class="racha-title">${escapeHtml(top.title || rachaTitle(streak))}</span>
          </span>
          <span class="racha-count"><strong>${streak}</strong>streams</span>
        `;
      }

      if(!el) return;
      if(!items.length){
        el.innerHTML = [0,1,2].map(()=>`<li class="racha-item"><span class="racha-mark">✦</span><span class="racha-person"><b>Llama por revelar</b><small>Usa !presente durante el directo</small></span><span class="racha-pill">0</span></li>`).join('');
        return;
      }

      el.innerHTML = items.slice(0,3).map((item,index)=>{
        const streak = Number(item.streak || item.streams || 0);
        const title = item.title || rachaTitle(streak);
        return `<li class="racha-item">
          <span class="racha-mark">${index === 0 ? '♔' : '✦'}</span>
          <span class="racha-person"><b title="${escapeHtml(item.name || 'Anónimo')}">${escapeHtml(item.name || 'Anónimo')}</b><small>${escapeHtml(title)}</small></span>
          <span class="racha-pill">${streak} 🔥</span>
        </li>`;
      }).join('');
    }





    let heroAltarSlides = [];
    let heroAltarSlideIndex = 0;
    let heroAltarTimer = null;

    function altarPhoto(item){
      return item?.photo || item?.avatar || item?.profile_image_url || item?.profileImageUrl || item?.image || item?.user_profile_image_url || '';
    }

    function altarInitials(name){
      return String(name || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0,2)
        .map(part => part[0])
        .join('')
        .toUpperCase() || '?';
    }

    function altarPersonHtml(item, index){
      const name = item?.name || item?.display_name || item?.user_name || item?.login || 'Por revelar';
      const photo = altarPhoto(item);
      const avatar = photo
        ? `<span class="altar-slide-avatar"><img src="${escapeHtml(photo)}" alt=""></span>`
        : `<span class="altar-slide-avatar">${escapeHtml(altarInitials(name))}</span>`;

      return `<div class="altar-slide-person" style="--delay:${index * 70}ms">
        ${avatar}
        <span class="altar-slide-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
      </div>`;
    }

    function buildHeroAltarSlides(data){
      const divinos = [
        ...topThree(data.seresDivinos?.dioses || []),
        ...topThree(data.seresDivinos?.titanes || []),
        ...topThree(data.seresDivinos?.primordiales || [])
      ].slice(0,3);

      const slides = [
        {label:'Mesías del Reino', people:topThree(data.mesias || [])},
        {label:'Seres Divinos', people:divinos},
        {label:'Heraldos de Gloria', people:topThree(data.heraldosGloria || [])},
        {label:'Forjadores del Tesoro', people:topThree(data.forjadoresTesoro || [])},
        {label:'Racha de Llamas', people:topThree(data.rachasGloria || [])},
        {label:'Guardianes', people:topThree(data.guardianes || [])}
      ].filter(slide => slide.people.length);

      return slides.length ? slides : [{label:'Altares de la Gloria', people:[{name:'Esperando menciones', photo:''}]}];
    }

    function showHeroAltarSlide(index){
      const label = document.getElementById('heroAltarSlideLabel');
      const track = document.getElementById('heroAltarSlideTrack');
      if(!label || !track || !heroAltarSlides.length) return;

      const slide = heroAltarSlides[index % heroAltarSlides.length];
      track.classList.add('is-switching');

      window.setTimeout(() => {
        label.textContent = slide.label;
        track.innerHTML = slide.people.slice(0,3).map(altarPersonHtml).join('');
        track.classList.remove('is-switching');
      }, 560);
    }

    function renderHeroAltares(data){
      heroAltarSlides = buildHeroAltarSlides(data);
      heroAltarSlideIndex = 0;
      showHeroAltarSlide(heroAltarSlideIndex);

      if(heroAltarTimer) clearInterval(heroAltarTimer);
      heroAltarTimer = setInterval(() => {
        heroAltarSlideIndex = (heroAltarSlideIndex + 1) % heroAltarSlides.length;
        showHeroAltarSlide(heroAltarSlideIndex);
      }, 7000);
    }


    function firstArrayFrom(source, keys){
      if(!source || typeof source !== 'object') return [];
      for(const key of keys){
        const value = source[key];
        if(Array.isArray(value)) return value;
      }
      return [];
    }

    function tierNumberFromItem(item){
      const raw = String(
        item?.tier ?? item?.sub_tier ?? item?.subscription_tier ?? item?.plan ?? item?.plan_name ?? item?.type ?? item?.level ?? ''
      ).toLowerCase();

      if(raw.includes('3000') || raw.includes('tier 3') || raw.includes('t3') || raw.includes('primordial')) return 3;
      if(raw.includes('2000') || raw.includes('tier 2') || raw.includes('t2') || raw.includes('titan')) return 2;
      if(raw.includes('1000') || raw.includes('tier 1') || raw.includes('t1') || raw.includes('prime') || raw.includes('dios') || raw.includes('olimp')) return 1;
      return 1;
    }

    function normalizeAltaresData(data){
      data = data && typeof data === 'object' ? data : {};

      const rawDivinos = data.seresDivinos || data.seres_divinos || data.divinos || data.subscribers || data.subs || data.tiers || {};
      let dioses = [];
      let titanes = [];
      let primordiales = [];

      if(Array.isArray(rawDivinos)){
        rawDivinos.forEach(item=>{
          const tier = tierNumberFromItem(item);
          if(tier === 3) primordiales.push(item);
          else if(tier === 2) titanes.push(item);
          else dioses.push(item);
        });
      }else{
        dioses = firstArrayFrom(rawDivinos, [
          'dioses','diosesOlimpicos','dioses_olimpicos','olimpicos','olímpicos','tier1','tier_1','t1','subTier1','sub_tier_1','1000','prime','tier1000'
        ]);
        titanes = firstArrayFrom(rawDivinos, [
          'titanes','tier2','tier_2','t2','subTier2','sub_tier_2','2000','tier2000'
        ]);
        primordiales = firstArrayFrom(rawDivinos, [
          'primordiales','primordial','tier3','tier_3','t3','subTier3','sub_tier_3','3000','tier3000'
        ]);
      }

      return {
        ...data,
        mesias: data.mesias || data.vip || data.vips || [],
        seresDivinos: {
          ...(rawDivinos && !Array.isArray(rawDivinos) ? rawDivinos : {}),
          dioses,
          titanes,
          primordiales
        },
        heraldosGloria: data.heraldosGloria || data.heraldos_gloria || data.gloria || data.giftSubs || data.gift_subs || [],
        forjadoresTesoro: data.forjadoresTesoro || data.forjadores_tesoro || data.almas || data.bits || data.cheerers || [],
        rachasGloria: data.rachasGloria || data.rachas_gloria || data.attendanceStreaks || data.attendance_streaks || data.rachas || data.constancia || data.streaks || [],
        guardianes: data.guardianes || data.mods || data.moderadores || []
      };
    }


    function renderAltares(data){
      data = normalizeAltaresData(data);
      const syncBar = document.getElementById('altarSyncBar');
      const syncText = document.getElementById('altarSyncText');
      const weekLabel = document.getElementById('altarWeekLabel');

      if(syncBar){
        syncBar.classList.toggle('is-demo', data.source === 'demo');
        syncBar.classList.toggle('is-error', data.source === 'error');
      }
      if(syncText){
        syncText.textContent = data.source === 'twitch'
          ? 'El oráculo refleja nombres vivos'
          : data.source === 'error'
            ? 'El oráculo no respondió; se abrió una visión de respaldo'
            : 'El oráculo muestra una visión del reino';
      }
      if(weekLabel){
        weekLabel.textContent = data.weekLabel || 'Semana de la Corona';
      }

      renderHeroAltares(data);

      renderHonorList('altarMesias', data.mesias, null, 'Mesías activo', 'Mesías por revelar', {equal:true});
      renderMiniHonorList('altarDioses', data.seresDivinos?.dioses, 'Dios por revelar');
      renderMiniHonorList('altarTitanes', data.seresDivinos?.titanes, 'Titán por revelar');
      renderMiniHonorList('altarPrimordiales', data.seresDivinos?.primordiales, 'Primordial por revelar');
      renderHonorList('altarGloria', data.heraldosGloria, 'glorias', 'Glorias', 'Heraldo por revelar');
      renderHonorList('altarAlmas', data.forjadoresTesoro, 'almas', 'Almas', 'Forjador por revelar');
      renderRachasGloria(data.rachasGloria);
      renderGuardianes(data.guardianes);
    }

    async function loadAltaresGloria(){
      for(const endpoint of ALTARES_GLORIA_ENDPOINTS){
        try{
          const response = await fetch(endpoint, {cache:'no-store'});
          if(!response.ok) continue;
          const data = await response.json();
          data.source = data.source || 'twitch';
          renderAltares(data);
          return;
        }catch(error){}
      }
      renderAltares(ALTARES_DEMO_DATA);
    }

    window.renderAltares = renderAltares;
    loadAltaresGloria();

    // ── Router profesional de vistas: cada menú muestra solo su sección ──
    (function(){
      const byId = id => document.getElementById(id);

      const vistas = {
        senda: [
          document.querySelector('.hero'),
          byId('ruta'),
          byId('senda-nucleo'),
          byId('staff-reino')
        ].filter(Boolean),

        pergaminos: [
          byId('grimorio')
        ].filter(Boolean),

        mods: [
          byId('sala-mods')
        ].filter(Boolean),

        glosario: [
          byId('glosario')
        ].filter(Boolean),

        altares: [
          byId('gloria')
        ].filter(Boolean),

        rangos: [
          byId('rangos')
        ].filter(Boolean),

        leyes: [
          byId('leyes')
        ].filter(Boolean)
      };

      const todasLasVistas = Object.values(vistas).flat();
      if(!todasLasVistas.length) return;

      const reduceMotion = () =>
        document.body.classList.contains('no-motion') ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      todasLasVistas.forEach(el=>{
        el.classList.add('view-fade');
        el.dataset.zawaViewSection = 'true';
      });

      function viewFromHash(hash){
        const clean = String(hash || '').replace('#','');
        if(!clean) return 'senda';

        for(const [view, els] of Object.entries(vistas)){
          if(view === clean) return view;
          if(els.some(el => el.id === clean)) return view;
        }

        if(clean === 'codex' || clean === 'commands') return 'pergaminos';
        if(clean === 'mods' || clean === 'sala-mods' || clean === 'consejo') return 'mods';
        return 'senda';
      }

      let current = viewFromHash(window.location.hash);

      Object.entries(vistas).forEach(([view, els])=>{
        const active = view === current;
        els.forEach(el=>{
          el.hidden = !active;
          el.classList.toggle('is-leaving', !active);
        });
      });

      function marcarNav(view){
        document.querySelectorAll('.nav a[data-view]').forEach(a=>{
          a.classList.toggle('is-current', a.dataset.view === view);
        });
      }

      function prepareEntrance(els){
        const selectors = [
          '.section-head',
          '.zawa-pro-card',
          '.path-card',
          '.codex-shell',
          '.command-upgrade-note',
          '.altar-card',
          '.rank-card',
          '.rules-card',
          '.stream-status-card',
          '.staff-person',
          '.mods-lock-card',
          '.mods-command-card',
          '.intro-reino',
          '.intro-tab',
          '.intro-detail'
        ].join(',');

        els.forEach(section=>{
          const pieces = [...section.querySelectorAll(selectors)].slice(0, 22);
          pieces.forEach((piece, index)=>{
            piece.style.setProperty('--view-delay', `${Math.min(index * 58, 560)}ms`);
          });
        });
      }

      function showView(view, targetSel, push=true){
        if(!vistas[view] || !vistas[view].length) return;

        const reduce = reduceMotion();
        const fadeMs = reduce ? 0 : 420;
        const outEls = vistas[current] || [];
        const inEls = vistas[view] || [];

        if(view === current){
          marcarNav(view);
          const target = targetSel ? document.querySelector(targetSel) : null;
          if(target){
            target.scrollIntoView({behavior:reduce?'auto':'smooth', block:'start'});
          }else{
            window.scrollTo({top:0, behavior:reduce?'auto':'smooth'});
          }
          return;
        }

        outEls.forEach(el=>{
          el.classList.remove('is-entering');
          el.classList.add('is-leaving');
        });

        window.setTimeout(()=>{
          outEls.forEach(el=>{ el.hidden = true; });

          prepareEntrance(inEls);
          inEls.forEach(el=>{
            el.hidden = false;
            el.classList.add('is-leaving');
            el.classList.remove('is-entering');
          });

          void document.body.offsetWidth;

          inEls.forEach(el=>{
            el.classList.remove('is-leaving');
            el.classList.add('is-entering');
          });

          window.setTimeout(()=>{
            inEls.forEach(el=>el.classList.remove('is-entering'));
          }, reduce ? 0 : 980);

          window.scrollTo({top:0, behavior:reduce?'auto':'smooth'});
        }, fadeMs);

        current = view;
        marcarNav(view);

        if(push){
          const hash = targetSel || `#${view}`;
          history.replaceState(null, '', hash);
        }
      }

      document.addEventListener('click', e=>{
        const link = e.target.closest('[data-view]');
        if(!link) return;

        const view = link.dataset.view;
        if(!vistas[view]) return;

        e.preventDefault();
        const href = link.getAttribute('href');
        showView(view, href && href.startsWith('#') ? href : null);
      }, true);

      window.addEventListener('hashchange', ()=>{
        const view = viewFromHash(window.location.hash);
        showView(view, window.location.hash || null, false);
      });

      marcarNav(current);
    })();



    /* Render legacy desactivado: el controlador profesional final maneja filtros, buscador y Disipar. */

/* --- split from original HTML --- */

(()=>{
      const brand = document.querySelector('.topbar .brand');
      const sigil = document.querySelector('.topbar .brand > .sigil');
      if(!brand || !sigil) return;

      let awakenTimer = null;
      const WAIT_MS = 7000; // 7 segundos exactos desde que el cursor entra al logo

      const clearAwaken = () => {
        window.clearTimeout(awakenTimer);
        awakenTimer = null;
        sigil.classList.remove('logo-awakened');
      };

      const startAwaken = () => {
        window.clearTimeout(awakenTimer);
        sigil.classList.remove('logo-awakened');
        awakenTimer = window.setTimeout(() => {
          sigil.classList.add('logo-awakened');
        }, WAIT_MS);
      };

      sigil.addEventListener('pointerenter', startAwaken);
      sigil.addEventListener('pointerleave', clearAwaken);
      sigil.addEventListener('focusin', startAwaken);
      sigil.addEventListener('focusout', clearAwaken);
    })();

/* --- split from original HTML --- */

/* Soporte responsive: altura real en móviles, clases por dispositivo y accesibilidad. */
    (()=>{
      const root = document.documentElement;
      let resizeTimer = null;

      function setRealViewportHeight(){
        root.style.setProperty('--real-vh', `${window.innerHeight * 0.01}px`);
      }

      function setDeviceClasses(){
        const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
        const tvLike = window.innerWidth >= 1600 && window.innerHeight >= 850;
        document.body.classList.toggle('is-touch-device', coarse);
        document.body.classList.toggle('is-tv-layout', tvLike);
      }

      function syncReducedMotion(){
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(reduce){
          document.body.classList.add('no-motion');
          const motionToggle = document.getElementById('motionToggle');
          if(motionToggle){
            motionToggle.setAttribute('aria-pressed','true');
            motionToggle.textContent = 'Quitar sello de runas';
          }
        }
      }

      function refreshResponsiveState(){
        setRealViewportHeight();
        setDeviceClasses();
      }

      function scheduleRefresh(){
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(refreshResponsiveState, 90);
      }

      function init(){
        refreshResponsiveState();
        syncReducedMotion();
        document.querySelectorAll('img').forEach(img=>{
          if(!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
        });
      }

      if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', init, {once:true});
      }else{
        init();
      }

      window.addEventListener('resize', scheduleRefresh, {passive:true});
      window.addEventListener('orientationchange', ()=>window.setTimeout(refreshResponsiveState, 160), {passive:true});
      window.visualViewport?.addEventListener('resize', scheduleRefresh, {passive:true});
    })();

/* --- split from original HTML --- */

/* Fix v5 — Los botones Dioses / Titanes / Primordiales ahora cambian siempre, también en celular. */
    (()=>{
      const tierClasses = ['tier-dioses','tier-titanes','tier-primordiales'];

      function forceDivinePage(index){
        const safeIndex = Math.max(0, Math.min(Number(index) || 0, 2));

        document.querySelectorAll('[data-divine-pager]').forEach(pager=>{
          const tabs = Array.from(pager.querySelectorAll('[data-divine-page]'));
          const panels = Array.from(pager.querySelectorAll('[data-divine-page-panel]'));
          const altar = pager.closest('.altar-divinos');

          if(altar){
            altar.classList.remove(...tierClasses);
            altar.classList.add(tierClasses[safeIndex]);
          }

          tabs.forEach((tab, i)=>{
            const active = i === safeIndex;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
            tab.setAttribute('tabindex', active ? '0' : '-1');
          });

          panels.forEach((panel, i)=>{
            const active = i === safeIndex;
            panel.hidden = !active;
            panel.classList.toggle('is-active', active);
            panel.classList.remove('is-leaving');
            panel.setAttribute('aria-hidden', active ? 'false' : 'true');
          });
        });
      }

      function handleDivineSelection(event){
        const tab = event.target.closest?.('[data-divine-page]');
        if(!tab) return;

        event.preventDefault();
        event.stopPropagation();
        if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

        forceDivinePage(tab.dataset.divinePage);
      }

      function initDivinePagerFix(){
        forceDivinePage(0);

        ['pointerup','touchend','click'].forEach(type=>{
          document.addEventListener(type, handleDivineSelection, {capture:true, passive:false});
        });

        document.addEventListener('keydown', event=>{
          const tab = event.target.closest?.('[data-divine-page]');
          if(!tab) return;

          const pager = tab.closest('[data-divine-pager]');
          const tabs = Array.from(pager?.querySelectorAll('[data-divine-page]') || []);
          if(!tabs.length) return;

          const current = tabs.indexOf(tab);
          let next = current;

          if(event.key === 'ArrowRight') next = (current + 1) % tabs.length;
          else if(event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
          else if(event.key === 'Home') next = 0;
          else if(event.key === 'End') next = tabs.length - 1;
          else if(event.key === 'Enter' || event.key === ' ') next = current;
          else return;

          event.preventDefault();
          forceDivinePage(next);
          tabs[next]?.focus();
        }, true);
      }

      if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', initDivinePagerFix, {once:true});
      }else{
        initDivinePagerFix();
      }

      window.zawaSetDivineTier = forceDivinePage;
    })();

/* --- split from original HTML --- */

/* FIX V8 — Control único de filtros + animación profesional sin doble efecto ni reset.
       Categorías: salen en el mismo orden, luego entran como cuadros colocados a mano.
       Disipar: esfuma todos los pergaminos y deja el panel limpio. */
    (()=>{
      const realmNames = {
        todos:'Todos',
        sapere:'Sapere',
        economia:'Economía',
        rituales:'Rituales',
        titanes:'Asedio',
        sombras:'Inframundo',
        maleficios:'Maleficios',
        cemies:'El Ojo'
      };
      const ritualesTabIcon = `<span class="realm-tab-icon realm-tab-icon-rituales" aria-hidden="true"><img src="assets/img/embedded/asset-e567146bc754.webp" alt=""></span>`;
      const titanesTabIcon = `<span class="realm-tab-icon realm-tab-icon-titanes" aria-hidden="true"><img src="assets/img/embedded/asset-d9045f4a8a68.webp" alt=""></span>`;
      const sombraTabIcon = `<span class="realm-tab-icon realm-tab-icon-sombras" aria-hidden="true"><img src="assets/img/embedded/asset-e2703806a6a7.webp" alt=""></span>`;
      const cemiesTabIcon = `<span class="realm-tab-icon realm-tab-icon-cemies"><img src="assets/img/embedded/asset-b2345906576c.webp" alt=""></span>`;
      const sapereTabIcon = `<span class="realm-tab-icon realm-tab-icon-sapere" aria-hidden="true"><img src="assets/img/embedded/asset-30de501eff58.webp" alt=""></span>`;
      const economiaTabIcon = `<span class="realm-tab-icon realm-tab-icon-economia" aria-hidden="true"><img src="assets/img/embedded/asset-723eb49bb4f5.webp" alt=""></span>`;
      const realmIcons = {
        todos:'✦',
        sapere:sapereTabIcon,
        economia:economiaTabIcon,
        rituales:ritualesTabIcon,
        titanes:titanesTabIcon,
        sombras:sombraTabIcon,
        maleficios:'<span class="realm-tab-icon realm-tab-icon-maleficios" aria-hidden="true"><img src="assets/img/embedded/asset-6d6e0712828d.webp" alt=""></span>',
        cemies:cemiesTabIcon
      };

      const tierClasses = ['tier-dioses','tier-titanes','tier-primordiales'];
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      let activeRealmHard = 'todos';
      let lastTouchTime = 0;
      let motionBusy = false;
      let queuedRealm = null;
      let dissipated = false;

      function qs(sel, root=document){ return root.querySelector(sel); }
      function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
      function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
      function escapeHtml(value){
        return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
      }
      function normalize(value){
        return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      }
      function commandsData(){
        if(Array.isArray(window.ZAWA_COMMANDS)) return window.ZAWA_COMMANDS;
        try{return JSON.parse(qs('#commands-data')?.textContent || '[]');}
        catch{return [];}
      }

      function getDisplayIcon(item){
        if(!item) return '✦';
        if(item.command === '!cofre' || item.command === '!ruleta' || item.command === '!duelo' || item.command === '!buscar') return item.icon || economiaTabIcon;
        if(item.command === '!si / !no') return item.icon || ritualesTabIcon;
        if(item.realm === 'rituales') return ritualesTabIcon;
        if(item.realm === 'titanes') return titanesTabIcon;
        if(item.realm === 'sombras') return sombraTabIcon;
        if(item.realm === 'cemies') return cemiesTabIcon;
        if(item.realm === 'economia') return economiaTabIcon;
        return item.icon || '✦';
      }
      function buildDrawerMarkup(item){
        const realmLabel = realmNames[item.realm] || item.realm || '';
        const displayIcon = getDisplayIcon(item);
        return `<div class="drawer-head"><div class="drawer-icon" aria-hidden="true">${displayIcon}</div><div class="drawer-title-wrap"><span class="realm-name">${escapeHtml(realmLabel)}</span><h3>${escapeHtml(item.title || '')}</h3></div></div><code>${escapeHtml(item.syntax || item.command || '')}</code><p><strong>Costo:</strong> ${escapeHtml(item.cost || '')}<br><strong>Acceso:</strong> ${escapeHtml(item.access || '')}</p><p>${escapeHtml(item.description || '')}</p><p class="lore">${escapeHtml(item.lore || '')}</p><button class="pixel-btn primary drawer-copy-btn" type="button" data-copy="${escapeHtml(item.command || '')}">Copiar ${escapeHtml(item.command || '')}</button>`;
      }
      async function swapDrawerContent(item){
        const drawer = qs('#drawer');
        const drawerContent = qs('#drawerContent');
        if(!drawer || !drawerContent || !item) return;
        const markup = buildDrawerMarkup(item);
        const nextKey = String(item.command || item.title || '');
        const currentKey = drawer.dataset.currentCommand || '';
        drawerContent.classList.remove('drawer-enter-up','drawer-exit-down');
        if(drawer.classList.contains('open') && drawerContent.innerHTML.trim()){
          if(currentKey === nextKey){
            drawerContent.innerHTML = markup;
            drawer.dataset.currentCommand = nextKey;
            return;
          }
          drawerContent.classList.add('drawer-exit-down');
          await sleep(190);
          drawerContent.innerHTML = markup;
          drawerContent.classList.remove('drawer-exit-down');
          drawerContent.classList.add('drawer-enter-up');
          drawer.dataset.currentCommand = nextKey;
          setTimeout(()=>drawerContent.classList.remove('drawer-enter-up'), 280);
          return;
        }
        drawerContent.innerHTML = markup;
        drawer.classList.add('open');
        drawer.dataset.currentCommand = nextKey;
        drawerContent.classList.add('drawer-enter-up');
        setTimeout(()=>drawerContent.classList.remove('drawer-enter-up'), 280);
      }
      function getSearch(){ return normalize(qs('#searchInput')?.value?.trim() || ''); }

      function commandCard(item, index){
        const searchable = normalize([item.realm, item.title, item.command, item.syntax, item.description, item.lore, ...(item.tags || [])].join(' '));
        const realmLabel = realmNames[item.realm] || item.realm || '';
        const displayIcon = getDisplayIcon(item);
        return `<article class="spell-card zawa-force-visible" data-index="${index}" data-realm="${escapeHtml(item.realm)}" data-search="${escapeHtml(searchable)}">
          <div class="card-top">
            <div class="icon-box" aria-hidden="true">${displayIcon}</div>
            <div class="card-title"><span class="realm-name">${escapeHtml(realmLabel)}</span><h3>${escapeHtml(item.title)}</h3></div>
          </div>
          <code class="spell-code">${escapeHtml(item.syntax || item.command || '')}</code>
          <div class="meta"><span><b>Costo</b><br>${escapeHtml(item.cost || '')}</span><span><b>Acceso</b><br>${escapeHtml(item.access || '')}</span></div>
          <p class="desc">${escapeHtml(item.description || '')}</p>
          <p class="lore">${escapeHtml(item.lore || '')}</p>
          <div class="card-actions">
            <button class="copy-btn" type="button" data-copy="${escapeHtml(item.command || '')}">Copiar hechizo</button>
            <button class="reveal-btn" type="button" data-open-hard="${index}">Leer pergamino</button>
          </div>
        </article>`;
      }

      function ensureCards(){
        const grid = qs('#commandGrid');
        const data = commandsData();
        if(!grid || !data.length) return;
        const cards = qsa('.spell-card', grid);
        if(cards.length !== data.length){
          grid.innerHTML = data.map(commandCard).join('');
        }
      }

      function setTabState(realm){
        qsa('#realmTabs .realm-tab').forEach(tab=>{
          const active = realm && tab.dataset.realm === realm;
          tab.classList.toggle('is-active', !!active);
          tab.classList.remove('is-pulsing');
          if(active) tab.setAttribute('aria-current','true');
          else tab.removeAttribute('aria-current');
        });
      }

      function matchingCards(realm){
        const query = getSearch();
        return qsa('#commandGrid .spell-card').filter(card=>{
          const realmOk = realm === 'todos' || card.dataset.realm === realm;
          const searchOk = !query || (card.dataset.search || '').includes(query);
          return realmOk && searchOk;
        });
      }

      function visibleCards(){
        return qsa('#commandGrid .spell-card').filter(card => !card.hidden);
      }

      function clearGridAnimationClasses(){
        const grid = qs('#commandGrid');
        if(!grid) return;
        grid.classList.remove('wave-enter','wave-exit','is-deploying','is-unfolding','pre-deploy');
      }

      function clearMotionClasses(cards){
        cards.forEach(card=>{
          card.classList.remove('zawa-card-in','zawa-card-out','zawa-card-dissipate','wave-from-left','wave-from-right','wave-exit-left','wave-exit-right');
          card.style.removeProperty('--place-delay');
          card.style.removeProperty('--remove-delay');
          card.style.removeProperty('--place-x');
          card.style.removeProperty('--remove-x');
          card.style.removeProperty('--place-rot');
          card.style.removeProperty('--remove-rot');
        });
      }

      function setVisibility(cardsToShow){
        clearGridAnimationClasses();
        const showSet = new Set(cardsToShow);
        qsa('#commandGrid .spell-card').forEach(card=>{
          const show = showSet.has(card);
          card.hidden = !show;
          card.classList.toggle('zawa-force-visible', show);
          card.classList.toggle('zawa-force-hidden', !show);
          if(!show) clearMotionClasses([card]);
        });
      }

      function updateStates(visibleCount, showChoose = false){
        const empty = qs('#emptyState');
        const choose = qs('#chooseState');
        if(empty) empty.classList.toggle('show', !showChoose && visibleCount === 0);
        if(choose) choose.classList.toggle('hide', !showChoose);
      }

      function prepareOrderVars(cards, type){
        const maxDelay = Math.min(1380, Math.max(0, (cards.length - 1) * 58));
        cards.forEach((card, i)=>{
          const rowSense = i % 2 === 0 ? -1 : 1;
          const waveX = `${rowSense * (24 + (i % 3) * 7)}px`;
          const rot = `${rowSense * (1.1 + (i % 4) * .35)}deg`;
          const delay = `${Math.min(i * 58, maxDelay)}ms`;
          if(type === 'in'){
            card.style.setProperty('--place-delay', delay);
            card.style.setProperty('--place-x', waveX);
            card.style.setProperty('--place-rot', rot);
          }else{
            card.style.setProperty('--remove-delay', delay);
            card.style.setProperty('--remove-x', waveX);
            card.style.setProperty('--remove-rot', rot);
          }
        });
        return maxDelay;
      }

      async function animateOut(cards, dissipate = false){
        const grid = qs('#commandGrid');
        if(!grid || !cards.length || prefersReducedMotion) return;
        clearGridAnimationClasses();
        clearMotionClasses(cards);
        const maxDelay = prepareOrderVars(cards, 'out');
        grid.classList.add('zawa-motion-lock', dissipate ? 'zawa-dissipating' : 'zawa-removing');
        cards.forEach(card => card.classList.add(dissipate ? 'zawa-card-dissipate' : 'zawa-card-out'));
        await sleep(maxDelay + (dissipate ? 820 : 700));
        grid.classList.remove('zawa-removing','zawa-dissipating','zawa-motion-lock');
        clearMotionClasses(cards);
      }

      async function animateIn(cards){
        const grid = qs('#commandGrid');
        if(!grid || !cards.length || prefersReducedMotion) return;
        clearGridAnimationClasses();
        clearMotionClasses(cards);
        const maxDelay = prepareOrderVars(cards, 'in');
        grid.classList.add('zawa-motion-lock','zawa-placing');
        cards.forEach(card => card.classList.add('zawa-card-in'));
        await sleep(maxDelay + 980);
        grid.classList.remove('zawa-placing','zawa-motion-lock');
        clearMotionClasses(cards);
      }

      function renderInstant(realm = activeRealmHard, showChoose = false){
        activeRealmHard = realm || 'todos';
        ensureCards();
        clearGridAnimationClasses();
        const cards = showChoose ? [] : matchingCards(activeRealmHard);
        setVisibility(cards);
        setTabState(showChoose ? null : activeRealmHard);
        updateStates(cards.length, showChoose);
      }

      async function renderCommandsHard(realm = activeRealmHard, options = {}){
        const requestedRealm = realm || 'todos';
        if(motionBusy){
          queuedRealm = requestedRealm;
          return;
        }

        motionBusy = true;
        queuedRealm = null;
        ensureCards();
        clearGridAnimationClasses();

        if(!options.force && !dissipated && requestedRealm === activeRealmHard && visibleCards().length){
          setTabState(activeRealmHard);
          motionBusy = false;
          return;
        }

        if(options.instant || prefersReducedMotion){
          dissipated = false;
          renderInstant(requestedRealm, false);
          motionBusy = false;
          if(queuedRealm && queuedRealm !== requestedRealm) renderCommandsHard(queuedRealm);
          return;
        }

        const grid = qs('#commandGrid');
        if(grid) grid.classList.add('zawa-motion-lock');

        const oldCards = visibleCards();
        if(oldCards.length) await animateOut(oldCards, false);

        activeRealmHard = requestedRealm;
        dissipated = false;
        const newCards = matchingCards(activeRealmHard);
        setVisibility(newCards);
        setTabState(activeRealmHard);
        updateStates(newCards.length, false);
        await animateIn(newCards);

        if(grid) grid.classList.remove('zawa-motion-lock');
        motionBusy = false;
        if(queuedRealm && queuedRealm !== activeRealmHard){
          const next = queuedRealm;
          queuedRealm = null;
          renderCommandsHard(next);
        }
      }

      async function dissipateCommands(){
        if(motionBusy) return;
        motionBusy = true;
        ensureCards();
        const clearBtn = qs('#clearBtn');
        const input = qs('#searchInput');
        if(input) input.value = '';
        clearBtn?.classList.remove('cast');
        void clearBtn?.offsetWidth;
        clearBtn?.classList.add('cast');
        setTimeout(()=>clearBtn?.classList.remove('cast'), 760);

        const cards = visibleCards();
        if(cards.length) await animateOut(cards, true);
        setVisibility([]);
        activeRealmHard = 'todos';
        dissipated = true;
        setTabState(null);
        updateStates(0, true);
        motionBusy = false;
      }

      async function openDrawerHard(index){
        const data = commandsData();
        const item = data[Number(index)];
        if(!item) return;
        await swapDrawerContent(item);
      }

      async function copyHard(value){
        if(!value) return;
        try{ await navigator.clipboard.writeText(value); }
        catch{}
        let toast = qs('.toast');
        if(!toast){ toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
        toast.textContent = `Copiado: ${value}`;
        toast.classList.add('show');
        clearTimeout(window.__zawaHardToast);
        window.__zawaHardToast = setTimeout(()=>toast.classList.remove('show'), 1600);
      }

      function setDivineTierHard(index){
        const safe = Math.max(0, Math.min(Number(index) || 0, 2));
        qsa('[data-divine-pager]').forEach(pager=>{
          const altar = pager.closest('.altar-divinos');
          const tabs = qsa('[data-divine-page]', pager);
          const panels = qsa('[data-divine-page-panel]', pager);

          if(altar){
            altar.classList.remove(...tierClasses);
            altar.classList.add(tierClasses[safe]);
          }

          tabs.forEach((tab, i)=>{
            const active = i === safe;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
            tab.setAttribute('tabindex', active ? '0' : '-1');
          });

          panels.forEach((panel, i)=>{
            const active = i === safe;
            panel.hidden = !active;
            panel.classList.toggle('is-active', active);
            panel.classList.toggle('zawa-force-visible', active);
            panel.classList.toggle('zawa-force-hidden', !active);
            panel.classList.remove('is-leaving');
            panel.setAttribute('aria-hidden', active ? 'false' : 'true');
            panel.style.display = active ? 'block' : 'none';
          });
        });
      }

      function kill(event){
        event.preventDefault?.();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
      }

      function shouldIgnoreDuplicate(event){
        const now = Date.now();
        if(event.type === 'touchstart'){
          lastTouchTime = now;
          return false;
        }
        if(event.type === 'pointerdown'){
          if(now - lastTouchTime < 120) return true;
          lastTouchTime = now;
          return false;
        }
        if(event.type === 'click' && now - lastTouchTime < 520) return true;
        return false;
      }

      function isControlledTarget(target){
        return !!target?.closest?.('#realmTabs .realm-tab[data-realm], #clearBtn, [data-divine-page], [data-open-hard], [data-open], [data-copy], #drawerClose');
      }

      function handleAction(event){
        const target = event.target;
        if(!target || !target.closest) return;
        if(shouldIgnoreDuplicate(event)){
          if(isControlledTarget(target)) kill(event);
          return;
        }

        const realmBtn = target.closest('#realmTabs .realm-tab[data-realm]');
        if(realmBtn){
          kill(event);
          renderCommandsHard(realmBtn.dataset.realm || 'todos');
          return;
        }

        const clear = target.closest('#clearBtn');
        if(clear){
          kill(event);
          dissipateCommands();
          return;
        }

        const divine = target.closest('[data-divine-page]');
        if(divine){
          kill(event);
          setDivineTierHard(divine.dataset.divinePage);
          return;
        }

        const open = target.closest('[data-open-hard], [data-open]');
        if(open){
          kill(event);
          openDrawerHard(open.dataset.openHard ?? open.dataset.open);
          return;
        }

        const copy = target.closest('[data-copy]');
        if(copy){
          kill(event);
          copyHard(copy.dataset.copy);
          return;
        }

        const close = target.closest('#drawerClose');
        if(close){
          kill(event);
          const drawerNode = qs('#drawer'); if(drawerNode){drawerNode.classList.remove('open'); drawerNode.dataset.currentCommand='';}
        }
      }

      async function init(){
        if(window.ZAWA_COMMANDS_READY && !Array.isArray(window.ZAWA_COMMANDS)){
          try{ window.ZAWA_COMMANDS = await window.ZAWA_COMMANDS_READY; }
          catch(error){ console.warn('[Zawa] No se pudo cargar data/commands-data.json', error); }
        }
        ensureCards();
        renderInstant(activeRealmHard, false);
        setDivineTierHard(0);

        ['touchstart','pointerdown','click'].forEach(type=>{
          document.addEventListener(type, handleAction, {capture:true, passive:false});
        });

        qs('#searchInput')?.addEventListener('input', event=>{
          event.stopImmediatePropagation?.();
          dissipated = false;
          renderInstant(activeRealmHard, false);
        }, {capture:true, passive:true});

        document.addEventListener('keydown', event=>{
          const tab = event.target?.closest?.('[data-divine-page]');
          if(!tab) return;
          const tabs = qsa('[data-divine-page]', tab.closest('[data-divine-pager]') || document);
          const current = tabs.indexOf(tab);
          let next = current;
          if(event.key === 'ArrowRight') next = (current + 1) % tabs.length;
          else if(event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
          else if(event.key === 'Home') next = 0;
          else if(event.key === 'End') next = tabs.length - 1;
          else if(event.key === 'Enter' || event.key === ' ') next = current;
          else return;
          kill(event);
          setDivineTierHard(next);
          tabs[next]?.focus();
        }, true);

        window.zawaRenderCommandsHard = renderCommandsHard;
        window.zawaDisiparCommands = dissipateCommands;
        window.zawaSetDivineTierHard = setDivineTierHard;
      }

      if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
      else init();
    })();

/* --- split from original HTML --- */

window.ZAWA_MOD_AVATARS = {
      edghost: "assets/img/embedded/asset-150b19621c5e.jpg",
    };

    window.zawaModNameWithPhoto = function(name, key){
      const src = window.ZAWA_MOD_AVATARS[key];
      if(!src) return name;
      return `<span class="mod-name-with-photo ${key}" data-mod-avatar="true"><img src="${src}" alt="${name}"><span>${name}</span></span>`;
    };

/* --- split from original HTML --- */

window.ZAWA_PRO_PREVIEW = true;

    async function zawaLoadKingdomStatus(){
      // Preparado para futuro sistema del Reino:
      // const status = await fetch('https://tu-api.com/api/status').then(r=>r.json());
      // Aquí queda en modo preview para no romper GitHub Pages.
      return null;
    }

/* --- split from original HTML --- */

async function zawaSafeJson(path){
      try{
        const res = await fetch(path + '?v=' + Date.now(), {cache:'no-store'});
        if(!res.ok) return null;
        return await res.json();
      }catch(e){
        return null;
      }
    }

    function setKingdomLiveState(data){
      const root = document.getElementById('kingdomLiveState');
      const title = document.getElementById('kingdomLiveTitle');
      const text = document.getElementById('kingdomLiveText');
      const pill = document.getElementById('kingdomLivePill');
      if(!root || !title || !text || !pill) return;

      const twitchOnline = !!data?.twitch?.online;
      const kickOnline = !!data?.kick?.online;
      const online = twitchOnline || kickOnline;

      root.dataset.state = online ? 'online' : 'offline';
      document.body.classList.toggle('reino-despierto', online);
      pill.textContent = online ? 'ONLINE' : 'OFFLINE';
      pill.classList.toggle('on', online);
      pill.classList.toggle('off', !online);

      if(online){
        title.textContent = 'El Ojo de Zawa está abierto';
        text.textContent = 'El Ojo de Zawa está abierto y todo el Reino cae bajo su mirada: cada ofrenda, cada ritual y cada grito del chat quedan grabados en su pupila dorada.';
      }else{
        title.textContent = 'El Ojo de Zawa se ha cerrado';
        text.textContent = 'El Ojo de Zawa se ha cerrado. El Reino guarda silencio tras el párpado violeta, esperando el próximo parpadeo para volver a contemplarlo todo.';
      }
    }

    async function zawaLoadStreamStatus(){
      const data = await zawaSafeJson('stream-status.json');
      setKingdomLiveState(data || {
        twitch:{online:false},
        kick:{online:false}
      });
    }

    function renderOracle(evento){
      const title = document.getElementById('oracleTitle');
      const desc = document.getElementById('oracleDescription');
      const commands = document.getElementById('oracleCommands');
      if(!title || !desc || !commands) return;

      if(!evento || !evento.active){
        title.textContent = 'No hay llamado activo';
        desc.textContent = 'Cuando un evento sea invocado, el Heraldo abrirá el llamado en esta sala.';
        commands.innerHTML = '';
        return;
      }

      title.textContent = evento.title || 'Evento activo';
      desc.textContent = evento.description || 'Hay un evento activo en el Reino.';
      const list = Array.isArray(evento.commands) ? evento.commands : [];
      if(list.length){
        commands.hidden = false;
        commands.innerHTML = list.map(cmd => `<code>${String(cmd).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]))}</code>`).join('');
      }else{
        commands.innerHTML = '';
        commands.hidden = true;
      }
    }

    async function zawaLoadOracle(){
      const evento = await zawaSafeJson('evento.json');
      renderOracle(evento);
    }

    zawaLoadStreamStatus();
    zawaLoadOracle();
    setInterval(zawaLoadStreamStatus, 30000);
    setInterval(zawaLoadOracle, 30000);

/* --- split from original HTML --- */

// Altares de Gloria conectados a Twitch vía altares-gloria.json.
    // AccionZ/altares_gloria.py debe actualizar ese JSON; la página lo relee sola.
    window.ZAWA_ALTARES_SOURCE = 'twitch';
    window.ZAWA_ALTARES_URL = 'altares-gloria.json';

    function zawaEscape(value){
      return String(value ?? '').replace(/[&<>"']/g, s => ({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#039;'
      }[s]));
    }

    function zawaTopThree(list){
      return Array.isArray(list) ? list.slice(0, 3) : [];
    }

    function zawaInitial(name){
      const clean = String(name || '').trim();
      return clean ? clean[0].toUpperCase() : '✦';
    }

    function zawaRenderSimpleList(targetId, list, valueKey, valueSuffix, emptyText){
      const el = document.getElementById(targetId);
      if(!el) return;
      const items = zawaTopThree(list);
      if(!items.length){
        el.innerHTML = `<div class="altar-row altar-empty"><span class="altar-mark">✦</span><strong>${zawaEscape(emptyText || 'Aún sin nombres')}</strong></div>`;
        return;
      }
      el.innerHTML = items.map((item, index)=>{
        const name = item.displayName || item.name || item.user || 'Habitante';
        const value = valueKey ? (item[valueKey] ?? item.value ?? item.total ?? '') : '';
        const badge = value !== '' ? `<span class="altar-badge">${zawaEscape(value)} ${zawaEscape(valueSuffix || '')}</span>` : '';
        return `<div class="altar-row ${index === 0 ? 'is-top' : ''}">
          <span class="altar-mark">${zawaEscape(zawaInitial(name))}</span>
          <strong>${zawaEscape(name)}</strong>
          ${badge}
        </div>`;
      }).join('');
    }

    function zawaRenderSeresDivinos(data){
      // Si el HTML ya tiene render propio para tabs de Seres Divinos, usamos renderAltares si existe.
      // Este fallback solo llena listas básicas si existen IDs previsibles.
      const seres = data?.seresDivinos || {};
      zawaRenderSimpleList('altarDioses', seres.dioses || [], '', '', 'Sin dioses olímpicos');
      zawaRenderSimpleList('altarTitanes', seres.titanes || [], '', '', 'Sin titanes');
      zawaRenderSimpleList('altarPrimordiales', seres.primordiales || [], '', '', 'Sin primordiales');
    }

    function zawaRenderAltaresFromJson(data){
      if(!data) return;

      // Preferir función nativa existente si la página ya la trae.
      if(typeof window.renderAltares === 'function'){
        try{
          window.renderAltares(data);
          return;
        }catch(e){
          console.warn('[Zawa] renderAltares nativo falló, usando fallback.', e);
        }
      }

      zawaRenderSimpleList('altarMesias', data.mesias || [], '', '', 'Sin mesías activos');
      zawaRenderSeresDivinos(data);
      zawaRenderSimpleList('altarHeraldos', data.heraldosGloria || [], 'glorias', 'glorias', 'Sin heraldos todavía');
      zawaRenderSimpleList('altarForjadores', data.forjadoresTesoro || [], 'almas', 'almas', 'Sin forjadores todavía');
      zawaRenderSimpleList('altarGuardianes', data.guardianes || [], '', '', 'Sin guardianes registrados');

      const source = document.getElementById('altarLiveSource');
      if(source){
        window.__zawaUltimaActualizacion = Date.now();
        source.classList.add('viva');
        zawaActualizarSello();
      }
    }

    // Sello "actualizado hace X" que se refresca solo
    function zawaActualizarSello(){
      const source = document.getElementById('altarLiveSource');
      if(!source || !window.__zawaUltimaActualizacion) return;
      const seg = Math.round((Date.now() - window.__zawaUltimaActualizacion) / 1000);
      let cuando;
      if(seg < 8)        cuando = 'ahora mismo';
      else if(seg < 60)  cuando = `hace ${seg}s`;
      else {
        const min = Math.round(seg/60);
        cuando = `hace ${min} min`;
      }
      source.textContent = `Sincronizado con Twitch · ${cuando}`;
    }
    setInterval(zawaActualizarSello, 5000);

    async function zawaLoadAltaresTwitch(){
      try{
        const res = await fetch(window.ZAWA_ALTARES_URL + '?v=' + Date.now(), {cache:'no-store'});
        if(!res.ok) return;
        const data = await res.json();
        zawaRenderAltaresFromJson(data);
      }catch(e){
        console.warn('[Zawa] No se pudo cargar altares-gloria.json', e);
      }
    }

    zawaLoadAltaresTwitch();
    setInterval(zawaLoadAltaresTwitch, 30000);

/* --- split from original HTML --- */

function zawaFixAltarVerticalPlacement(){
      ['altarHeraldos','altarForjadores'].forEach(id=>{
        const list = document.getElementById(id);
        if(!list) return;
        const card = list.closest('.altar-card, .glory-card, .zawa-pro-card');
        if(card) card.classList.add('altar-force-top-list');
      });
    }
    zawaFixAltarVerticalPlacement();
    document.addEventListener('DOMContentLoaded', zawaFixAltarVerticalPlacement);
    setInterval(zawaFixAltarVerticalPlacement, 1500);

/* --- split from original HTML --- */

// FIX: Altares no deben mostrar nombres demo.
    // Solo se llenan con altares-gloria.json generado por AccionZ/Twitch.
    window.ZAWA_ALTARES_ALLOW_DEMO = false;

    function zawaNoDemoFallbacks(){
      const emptyLabels = {
        altarMesias: 'Esperando registros del Reino',
        altarHeraldos: 'Esperando ofrendas de Gloria',
        altarForjadores: 'Esperando Almas registradas',
        altarGuardianes: 'Esperando guardianes registrados',
        altarDioses: 'Esperando suscriptores Tier 1',
        altarTitanes: 'Esperando suscriptores Tier 2',
        altarPrimordiales: 'Esperando suscriptores Tier 3'
      };

      Object.entries(emptyLabels).forEach(([id, label])=>{
        const el = document.getElementById(id);
        if(!el) return;

        const text = (el.textContent || '').toLowerCase();
        const hasFake =
          text.includes('wolf') ||
          text.includes('numichi') ||
          text.includes('darkuser') ||
          text.includes('zawafan') ||
          text.includes('olympususer') ||
          text.includes('luzdivina') ||
          text.includes('ateneadb');

        if(hasFake || !el.children.length){
          el.innerHTML = `<div class="altar-row altar-empty"><span class="altar-mark">✦</span><strong>${label}</strong></div>`;
        }
      });
    }

    zawaNoDemoFallbacks();
    document.addEventListener('DOMContentLoaded', zawaNoDemoFallbacks);
    setInterval(zawaNoDemoFallbacks, 2000);

})();

/* Sala de Mods — sello temporal, sin usuario ni contraseña. */
(()=>{
  const ACCESS_HASH = '0894951488dab930fbc8b6363640c6f45a257ef781bc6253d8854e846b9800c1';
  const SESSION_KEY = 'zawa_mod_room_unlocked';
  const DATA_URL = 'data/mod-commands.json';

  const shell = document.getElementById('modsShell');
  const form = document.getElementById('modsAccessForm');
  const input = document.getElementById('modAccessKey');
  const feedback = document.getElementById('modsFeedback');
  const lockCard = document.getElementById('modsLockCard');
  const room = document.getElementById('modsCommandRoom');
  const grid = document.getElementById('modsCommandGrid');
  const empty = document.getElementById('modsEmptyState');
  const search = document.getElementById('modsSearchInput');
  const lockAgain = document.getElementById('modsLockAgain');

  if(!shell || !form || !input || !room || !grid) return;

  let modCommands = [];

  function normalize(value){
    return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  async function sha256(value){
    const bytes = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hashBuffer)).map(byte => byte.toString(16).padStart(2,'0')).join('');
  }

  async function validSeal(value){
    if(!window.crypto?.subtle) return false;
    return await sha256(normalize(value)) === ACCESS_HASH;
  }

  function setFeedback(message, state=''){
    if(!feedback) return;
    feedback.textContent = message || '';
    feedback.dataset.state = state;
  }

  function setUnlocked(unlocked){
    shell.dataset.locked = unlocked ? 'false' : 'true';
    lockCard.hidden = unlocked;
    room.hidden = !unlocked;
    if(unlocked){
      sessionStorage.setItem(SESSION_KEY, 'true');
      loadModCommands();
      setTimeout(()=>search?.focus(), 80);
    }else{
      sessionStorage.removeItem(SESSION_KEY);
      input.value = '';
      setFeedback('Sala sellada.', 'neutral');
      setTimeout(()=>input.focus(), 80);
    }
  }

  async function loadModCommands(){
    if(modCommands.length){
      renderModCommands();
      return;
    }

    grid.innerHTML = '<div class="mods-loading">Invocando comandos del Consejo...</div>';
    try{
      const response = await fetch(DATA_URL, {cache:'no-store'});
      if(!response.ok) throw new Error(`No se pudo cargar ${DATA_URL}`);
      modCommands = await response.json();
      renderModCommands();
    }catch(error){
      grid.innerHTML = '<div class="mods-error">No se pudo cargar <code>data/mod-commands.json</code>. Revisa que el archivo esté subido en GitHub.</div>';
      console.warn('[Zawa] Sala de Mods:', error);
    }
  }

  function renderModCommands(){
    const q = normalize(search?.value || '');
    const list = modCommands.filter(item => {
      const haystack = normalize([
        item.group,
        item.title,
        item.command,
        item.syntax,
        item.description,
        item.note,
        ...(item.tags || [])
      ].join(' '));
      return !q || haystack.includes(q);
    });

    grid.innerHTML = list.map((item, index)=>`
      <article class="mods-command-card" style="--mods-delay:${Math.min(index, 18) * 55}ms">
        <div class="mods-card-top">
          <span class="mods-card-icon" aria-hidden="true">${escapeHtml(item.icon || '✦')}</span>
          <div>
            <span class="mods-card-group">${escapeHtml(item.group || 'Moderación')}</span>
            <h4>${escapeHtml(item.title || item.command || 'Comando mod')}</h4>
          </div>
        </div>
        <code>${escapeHtml(item.syntax || item.command || '')}</code>
        <p>${escapeHtml(item.description || '')}</p>
        ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ''}
        <button class="copy-btn mods-copy" type="button" data-mod-copy="${escapeHtml(item.syntax || item.command || '')}">Copiar comando</button>
      </article>
    `).join('');

    if(empty) empty.hidden = list.length !== 0;

    grid.querySelectorAll('[data-mod-copy]').forEach(button=>{
      button.addEventListener('click', async ()=>{
        const value = button.dataset.modCopy || '';
        try{
          await navigator.clipboard.writeText(value);
          button.textContent = 'Copiado';
          setTimeout(()=>button.textContent = 'Copiar comando', 1100);
        }catch{
          button.textContent = 'Copia manual';
          setTimeout(()=>button.textContent = 'Copiar comando', 1100);
        }
      });
    });
  }

  form.addEventListener('submit', async event=>{
    event.preventDefault();
    setFeedback('Verificando sello...', 'neutral');
    const ok = await validSeal(input.value);
    if(ok){
      setFeedback('Sello aceptado. Abriendo Sala de Mods.', 'ok');
      setUnlocked(true);
      return;
    }
    sessionStorage.removeItem(SESSION_KEY);
    setFeedback('Sello incorrecto. El Consejo no responde.', 'error');
    input.select();
  });

  search?.addEventListener('input', renderModCommands);
  lockAgain?.addEventListener('click', ()=>setUnlocked(false));

  if(sessionStorage.getItem(SESSION_KEY) === 'true'){
    setUnlocked(true);
  }
})();

