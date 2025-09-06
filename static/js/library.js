// Client-side rendering for library with filters, view toggle, and modal
(function(){
  const state = {
    view: localStorage.getItem('view') || 'cards',
    qTitle: '',
    qAuthor: '',
    qType: '',
    qStatus: '',
    qSort: localStorage.getItem('sort') || 'title'
  };

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const dataEl = document.getElementById('books-data');
  if(!dataEl) return; // not on library page

  let books = [];
  try {
    const raw = dataEl.textContent || '[]';
    const first = JSON.parse(raw);
    // Some template setups double-quote the JSON array; handle that
    books = Array.isArray(first) ? first : JSON.parse(first);
  }
  catch (e) {
    console.error('Kunne ikke parse books-data JSON', e);
    books = [];
  }

  const elLib = $('#library');
  const elCount = $('#resultsCount');
  const elFilters = $('#filters');

  // Inputs
  const qTitle = $('#qTitle');
  const qAuthor = $('#qAuthor');
  const qType = $('#qType');
  const qStatus = $('#qStatus');
  const qSort = $('#qSort');

  // View toggle buttons
  const btns = $$('.view-toggle [data-view]');
  function updateViewButtons(){
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
    elLib.className = state.view === 'cards' ? 'cards' : 'list';
  }
  btns.forEach(b => b.addEventListener('click', () => {
    state.view = b.dataset.view;
    localStorage.setItem('view', state.view);
    render();
  }));

  // Debounce helper
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); } }

  // Filtering
  function normalize(s){ return (s||'').toLowerCase(); }
  function matches(b){
    if(state.qType && b.type !== state.qType) return false;
    if(state.qStatus && b.status !== state.qStatus) return false;
    const t = normalize(state.qTitle);
    const a = normalize(state.qAuthor);
    if(t && !normalize(b.title).includes(t)) return false;
    if(a && !(b.authors||[]).some(x => normalize(x).includes(a))) return false;
    return true;
  }

  // Renderers
  function svgPlaceholder(title, authors){
    const t = (String(title||'').slice(0,40) || 'Ukendt titel');
    const a = (Array.isArray(authors)? authors.join(', ') : String(authors||'')).slice(0,40) || 'Ukendt forfatter';
    const esc = s => encodeURIComponent(s);
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800' role='img' aria-label='Midlertidigt bogomslag'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stop-color='#e5e7eb'/>
          <stop offset='100%' stop-color='#f3f4f6'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <rect x='40' y='60' width='520' height='680' fill='none' stroke='#d1d5db' stroke-width='3'/>
      <text x='50%' y='45%' dominant-baseline='middle' text-anchor='middle' font-family='-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial' font-size='28' fill='#374151'>${t}</text>
      <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial' font-size='20' fill='#6b7280'>${a}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${esc(svg)}`;
  }
  function normalizeSrcOrPlaceholder(src, title, authors){
    const ph = svgPlaceholder(title, authors);
    if(!src) return ph;
    const path = src.startsWith('/') ? src : `/${src}`;
    // Treat any known placeholder filename as missing
    if(/placeholder\.(png|jpg|jpeg|svg)$/i.test(path)) return ph;
    return { path, ph };
  }
  const img = (src, alt, authors) => {
    const safeAlt = alt?alt.replace(/\"/g,'\\"'):'';
    const res = normalizeSrcOrPlaceholder(src, alt, authors);
    if(typeof res === 'string'){
      // direct placeholder data URL
      return `<img src="${res}" alt="${safeAlt}" loading="lazy">`;
    }
    const { path, ph } = res;
    // onerror fallback to dynamic placeholder
    return `<img src="${path}" alt="${safeAlt}" loading="lazy" onerror="this.onerror=null;this.src='${ph}'">`;
  };
  const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const rating = (n) => {
    n = Number(n)||0; if(n<1) return '';
    return `<span class="rating" aria-label="Vurdering: ${n} af 5">${'★'.repeat(n)}${'☆'.repeat(5-n)}</span>`;
  };
  const badges = (b) => {
    const status = b.status==='reading' ? '<span class="badge reading">I gang</span>' : (b.status==='finished' ? '<span class="badge finished">Færdig</span>' : '');
    const type = b.type? `<span class="badge">${esc(b.type)}</span>`: '';
    return `<div class="badges">${status}${type}</div>`;
  };

  function card(b){
    return `<article class="card" data-slug="${esc(b.slug)}" tabindex="0">
  ${img(b.cover_image, b.title, b.authors)}
      <div class="meta">
        <div class="title">${esc(b.title)}</div>
        <div class="muted">${esc((b.authors||[]).join(', '))}</div>
        ${badges(b)}
        ${rating(b.rating)}
      </div>
    </article>`;
  }

  function row(b){
    return `<article class="row" data-slug="${esc(b.slug)}" tabindex="0">
  ${img(b.cover_image, b.title, b.authors)}
      <div>
        <div class="title">${esc(b.title)}</div>
        <div class="muted">${esc((b.authors||[]).join(', '))}</div>
        ${badges(b)}
      </div>
      <div>${rating(b.rating)}</div>
    </article>`;
  }

  function detailsHTML(b){
    const f = (label, val) => val ? `<div><strong>${label}:</strong> ${esc(val)}</div>` : '';
    return `
  ${img(b.cover_image, b.title, b.authors)}
      <div>
        <div><strong>Forfatter(e):</strong> ${esc((b.authors||[]).join(', '))}</div>
        <div><strong>Type:</strong> ${esc(b.type||'')}</div>
        <div><strong>Status:</strong> ${esc(b.status||'')}</div>
        ${f('Færdig', b.finished_at)}
        ${f('Begrundelse', b.purchase_reason)}
        ${f('Tags', (b.tags||[]).join(', '))}
        ${f('Noter', b.notes)}
        ${b.review_text? `<div><strong>Anmeldelse:</strong><br>${esc(b.review_text)}</div>`: ''}
        ${b.rating? `<div>${rating(b.rating)}</div>`: ''}
      </div>
    `;
  }

  // Modal behavior
  const modal = document.getElementById('bookModal');
  const modalTitle = document.getElementById('bookTitle');
  const modalDetails = document.getElementById('bookDetails');
  const closeBtn = modal?.querySelector('[data-modal-close]');
  function openModal(b){
    modalTitle.textContent = b.title;
    modalDetails.innerHTML = detailsHTML(b);
    modal.showModal();
  }
  closeBtn?.addEventListener('click', ()=> modal.close());
  modal?.addEventListener('close', ()=> modalDetails.innerHTML='');
  modal?.addEventListener('cancel', (e)=>{ e.preventDefault(); modal.close(); });

  function attachOpenHandlers(){
    $$('#library .card, #library .row').forEach(el => {
      const slug = el.getAttribute('data-slug');
      const b = books.find(x => x.slug === slug);
      const open = ()=> b && openModal(b);
      el.addEventListener('click', open);
      el.addEventListener('keypress', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); open(); }});
    });
  }

  function render(){
    updateViewButtons();
    const filtered = books.filter(matches).sort((a,b)=> {
      if(state.qSort === 'author'){
        const aa = normalize((a.authors||[])[0] || '');
        const bb = normalize((b.authors||[])[0] || '');
        return aa.localeCompare(bb) || a.title.localeCompare(b.title);
      }
      return a.title.localeCompare(b.title);
    });
    elCount.textContent = `${filtered.length} bøger`;
    if(filtered.length === 0){
      elLib.innerHTML = '<p class="muted">Ingen bøger fundet.</p>';
    } else {
      elLib.innerHTML = filtered.map(b => state.view==='cards' ? card(b) : row(b)).join('');
    }
    attachOpenHandlers();
  }

  // Wire filters
  const applyFilters = debounce(() => {
    state.qTitle = qTitle.value.trim();
    state.qAuthor = qAuthor.value.trim();
    state.qType = qType.value;
    state.qStatus = qStatus.value;
    state.qSort = qSort.value;
    localStorage.setItem('sort', state.qSort);
    render();
  }, 120);
  [qTitle, qAuthor].forEach(i => i.addEventListener('input', applyFilters));
  [qType, qStatus, qSort].forEach(i => i.addEventListener('change', applyFilters));

  // Init
  console.debug('Library init: bøger i JSON =', books.length);
  // Initialize control values from state
  if(qSort) qSort.value = state.qSort;
  render();
})();
