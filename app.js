'use strict';

// ── Translations ──────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  da: {
    tagline:           'Mit personlige bibliotek',
    all:               'Alle',
    status_bought:     'Købt',
    status_reading:    'Igang med at læse',
    status_reading_short: 'Igang',
    status_finished:   'Læst',
    status_abandoned:  'Opgivet',
    genre_fiction:        'Fiktion',
    'genre_non-fiction':  'Faglitteratur',
    genre_biography:      'Biografi',
    genre_poetry:         'Poesi',
    all_types:            'Alle typer',
    sort_added_desc:      'Senest tilføjet',
    sort_added_asc:       'Ældste tilføjet',
    sort_title_asc:    'Titel A–Å',
    sort_author_asc:   'Forfatter A–Å',
    sort_rating_desc:  'Bedste rating',
    search_placeholder:'Søg efter titel, forfatter, ISBN eller tag…',
    results_n:         (n) => `${n} ${n === 1 ? 'bog' : 'bøger'}`,
    no_results:        'Ingen bøger matcher din søgning.',
    modal_author:      'Forfatter',
    modal_isbn:        'ISBN',
    modal_type:        'Type',
    modal_format:      'Format',
    modal_status:      'Hylde',
    modal_finished:    'Afsluttet',
    modal_reason:      'Grund til køb',
    modal_review:      'Anmeldelse',
    modal_rating:      'Rating',
    modal_tags:        'Tags',
    format_physical:   'Fysisk bog',
    format_ebook:      'E-bog',
    format_audiobook:  'Lydbog',
    acquisition_new:   'Ny',
    acquisition_used:  'Brugt',
    grid_view:         'Gittervisning',
    list_view:         'Listevisning',
    footer:            '© Steen \u2014 Tsundoku.dk',
    load_error:        'Kunne ikke indlæse bøger.',
  },
  en: {
    tagline:           'My personal library',
    all:               'All',
    status_bought:     'Bought',
    status_reading:    'Currently reading',
    status_reading_short: 'Reading',
    status_finished:   'Read',
    status_abandoned:  'Abandoned',
    genre_fiction:        'Fiction',
    'genre_non-fiction':  'Non-fiction',
    genre_biography:      'Biography',
    genre_poetry:         'Poetry',
    all_types:            'All types',
    sort_added_desc:      'Newest added',
    sort_added_asc:       'Oldest added',
    sort_title_asc:    'Title A–Z',
    sort_author_asc:   'Author A–Z',
    sort_rating_desc:  'Highest rated',
    search_placeholder:'Search by title, author, ISBN or tag…',
    results_n:         (n) => `${n} ${n === 1 ? 'book' : 'books'}`,
    no_results:        'No books match your search.',
    modal_author:      'Author',
    modal_isbn:        'ISBN',
    modal_type:        'Type',
    modal_format:      'Format',
    modal_status:      'Shelf',
    modal_finished:    'Finished',
    modal_reason:      'Purchase reason',
    modal_review:      'Review',
    modal_rating:      'Rating',
    modal_tags:        'Tags',
    format_physical:   'Physical book',
    format_ebook:      'E-book',
    format_audiobook:  'Audiobook',
    acquisition_new:   'New',
    acquisition_used:  'Used',
    grid_view:         'Grid view',
    list_view:         'List view',
    footer:            '© Steen \u2014 Tsundoku.dk',
    load_error:        'Failed to load books.',
  },
};

// ── localStorage helper (guards against SecurityError when storage is blocked) ─
function lsGet(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* storage disabled */ }
}

// ── State ─────────────────────────────────────────────────────────────────────
const VALID_LANGS = new Set(['da', 'en']);
let lang = VALID_LANGS.has(lsGet('lang', '')) ? lsGet('lang', 'da') : 'da';
let view = lsGet('view', 'grid') === 'list' ? 'list' : 'grid';
let books        = [];
let filtered     = [];
let activeStatus = 'all';
let activeType   = 'all';
let sortBy       = 'added_desc';
let searchQuery  = '';

// Translate helper
const t = (key, ...args) => {
  const val = TRANSLATIONS[lang][key];
  return typeof val === 'function' ? val(...args) : (val ?? key);
};

// ── DOM selectors ─────────────────────────────────────────────────────────────
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  applyLang(false);
  applyView(view, false);
  bindStaticEvents();

  try {
    const res = await fetch('boeger.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    books = await res.json();
  } catch {
    $('#bookContainer').innerHTML = `<p class="empty-state">${t('load_error')}</p>`;
    return;
  }

  applyFilters();
});

// ── Language ──────────────────────────────────────────────────────────────────
function applyLang(rerender = true) {
  document.documentElement.lang = lang;

  const toggle = $('#langToggle');
  if (toggle) toggle.textContent = lang === 'da' ? 'EN' : 'DA';

  // Static data-i18n elements
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = TRANSLATIONS[lang][key];
    if (val && typeof val !== 'function') el.textContent = val;
  });

  // Placeholder attributes
  $$('[data-i18n-placeholder]').forEach(el => {
    const val = TRANSLATIONS[lang][el.dataset.i18nPlaceholder];
    if (val) el.placeholder = val;
  });

  // Select option text
  $$('[data-i18n-option]').forEach(el => {
    const val = TRANSLATIONS[lang][el.dataset.i18nOption];
    if (val) el.textContent = val;
  });

  // Button titles
  const btnGrid = $('#btnGrid');
  const btnList = $('#btnList');
  if (btnGrid) btnGrid.title = t('grid_view');
  if (btnList) btnList.title = t('list_view');

  if (rerender && books.length) renderBooks();
}

function toggleLang() {
  lang = lang === 'da' ? 'en' : 'da';
  lsSet('lang', lang);
  applyLang();
}

// ── View ──────────────────────────────────────────────────────────────────────
function applyView(v, rerender = true) {
  view = v;
  lsSet('view', view);

  const container = $('#bookContainer');
  if (container) {
    container.className = view === 'grid' ? 'book-grid' : 'book-list';
  }

  const btnGrid = $('#btnGrid');
  const btnList = $('#btnList');
  if (btnGrid) {
    btnGrid.classList.toggle('active', view === 'grid');
    btnGrid.setAttribute('aria-pressed', String(view === 'grid'));
  }
  if (btnList) {
    btnList.classList.toggle('active', view === 'list');
    btnList.setAttribute('aria-pressed', String(view === 'list'));
  }

  if (rerender && books.length) renderBooks();
}

// ── Filtering & sorting ───────────────────────────────────────────────────────
function applyFilters() {
  const q = searchQuery.toLowerCase().trim();

  filtered = books.filter(b => {
    if (activeStatus !== 'all' && b.status !== activeStatus) return false;
    if (activeType   !== 'all' && b.genre  !== activeType)   return false;
    if (q) {
      const hit =
        b.title?.toLowerCase().includes(q) ||
        b.authors?.some(a => a.toLowerCase().includes(q)) ||
        b.isbn?.replace(/-/g, '').includes(q.replace(/-/g, '')) ||
        b.tags?.some(tag => tag.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'added_desc':
        return b.id.localeCompare(a.id);
      case 'added_asc':
        return a.id.localeCompare(b.id);
      case 'title_asc':
        return (a.title ?? '').localeCompare(b.title ?? '', lang);
      case 'author_asc':
        return (a.authors?.[0] ?? '').localeCompare(b.authors?.[0] ?? '', lang);
      case 'rating_desc':
        return (b.rating ?? 0) - (a.rating ?? 0);
      default:
        return 0;
    }
  });

  renderBooks();
  updateResultsCount();
}

function cmpDate(a, b) {
  // Missing dates sort as oldest (smallest)
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a > b ? 1 : a < b ? -1 : 0;
}

function updateResultsCount() {
  const el = $('#resultsCount');
  if (el) el.textContent = t('results_n', filtered.length);
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function renderBooks() {
  const container = $('#bookContainer');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `<p class="empty-state">${t('no_results')}</p>`;
    return;
  }

  if (view === 'grid') {
    container.innerHTML = filtered.map(renderCard).join('');
  } else {
    container.innerHTML = filtered.map(renderRow).join('');
  }

  $$('.book-item', container).forEach((el, i) => {
    el.addEventListener('click',  () => openModal(filtered[i]));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(filtered[i]); }
    });
  });
}

function renderCard(book) {
  const cover  = 'images/' + (book.cover_image || 'placeholder.png');
  const author = (book.authors ?? []).join(', ');
  return `
    <article class="book-item book-card" tabindex="0" role="listitem"
      aria-label="${esc(book.title)}">
      <img src="${esc(cover)}" alt="${esc(book.title)}" loading="lazy"
        onerror="this.src='images/placeholder.png';this.onerror=null">
      <div class="card-overlay">
        <div class="card-badges">
          ${statusBadge(book.status)}
          ${book.genre ? typeBadge(book.genre, 'card') : ''}
        </div>
        <h2 class="card-title">${esc(book.title)}</h2>
        <p class="card-author">${esc(author)}</p>
      </div>
    </article>`;
}

function renderRow(book) {
  const cover  = 'images/' + (book.cover_image || 'placeholder.png');
  const author = (book.authors ?? []).join(', ');
  return `
    <div class="book-item book-row" tabindex="0" role="listitem"
      aria-label="${esc(book.title)}">
      <img class="row-cover" src="${esc(cover)}" alt="${esc(book.title)}" loading="lazy"
        onerror="this.src='images/placeholder.png';this.onerror=null">
      <div class="row-info">
        <p class="row-title">${esc(book.title)}</p>
        <p class="row-author">${esc(author)}</p>
      </div>
      <div class="row-meta">
        ${book.genre ? typeBadge(book.genre, 'row') : ''}
        ${statusBadge(book.status)}
        ${book.rating ? `<span class="row-stars">${renderStars(book.rating)}</span>` : ''}
      </div>
    </div>`;
}

function statusBadge(status) {
  const label = t(`status_${status}`) || status;
  return `<span class="badge badge-${esc(status)}">${esc(label)}</span>`;
}

function typeBadge(type, context = 'card') {
  const label = t(`genre_${type}`) || type;
  return `<span class="badge badge-type">${esc(label)}</span>`;
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="star${i < rating ? ' filled' : ''}">★</span>`
  ).join('');
}

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── About ────────────────────────────────────────────────────────────────────
function openAbout() {
  const overlay = $('#aboutOverlay');
  if (!overlay) return;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => $('#aboutClose')?.focus());
}

function closeAbout() {
  const overlay = $('#aboutOverlay');
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = '';
}

// ── Modal ─────────────────────────────────────────────────────────────────────
let _modalOpener = null;

function openModal(book) {
  _modalOpener = document.activeElement;
  const overlay = $('#modalOverlay');
  const body    = $('#modalBody');
  if (!overlay || !body) return;

  const cover       = 'images/' + (book.cover_image || 'placeholder.png');
  const author      = (book.authors ?? []).join(', ') || '—';
  const formatLabel = t(`format_${book.format}`) || book.format || '—';
  const acqLabel    = book.acquisition ? t(`acquisition_${book.acquisition}`) || book.acquisition : '';

  const metaRows = [
    [t('modal_author'),  esc(author)],
    book.isbn            ? [t('modal_isbn'),   esc(book.isbn)] : null,
    book.genre           ? [t('modal_type'),   t(`genre_${book.genre}`)] : null,
    [t('modal_format'),  esc(formatLabel) + (acqLabel ? ` · ${esc(acqLabel)}` : '')],
    [t('modal_status'),  statusBadge(book.status)],
    book.finished_at     ? [t('modal_finished'), fmtDate(book.finished_at)]   : null,
    book.purchase_reason ? [t('modal_reason'),   esc(book.purchase_reason)]   : null,
  ].filter(Boolean);

  const tagsHtml = book.tags?.length
    ? `<div class="modal-section">
         <h3>${t('modal_tags')}</h3>
         <div class="modal-tags">${book.tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
       </div>`
    : '';

  const reviewHtml = book.review_text
    ? `<div class="modal-section">
         <h3>${t('modal_review')}</h3>
         ${book.rating ? `<div class="modal-rating">${renderStars(book.rating)}</div>` : ''}
         <p>${esc(book.review_text)}</p>
       </div>`
    : '';

  body.innerHTML = `
    <div class="modal-cover-wrap">
      <img src="${esc(cover)}" alt="${esc(book.title)}"
        onerror="this.src='images/placeholder.png';this.onerror=null">
    </div>
    <div class="modal-details">
      <h2 class="modal-title" id="modalTitle">${esc(book.title)}</h2>
      <table class="modal-meta">
        ${metaRows.map(([lbl, val]) => `<tr><th>${lbl}</th><td>${val}</td></tr>`).join('')}
      </table>
      ${reviewHtml}
      ${tagsHtml}
    </div>`;

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => $('#modalClose')?.focus());
}

function closeModal() {
  const overlay = $('#modalOverlay');
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = '';
  _modalOpener?.focus();
  _modalOpener = null;
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString(lang === 'da' ? 'da-DK' : 'en-GB', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── Event bindings ────────────────────────────────────────────────────────────
function bindStaticEvents() {
  // About
  $('#btnAbout')?.addEventListener('click', openAbout);
  $('#aboutClose')?.addEventListener('click', closeAbout);
  $('#aboutOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAbout();
  });

  // Language
  $('#langToggle')?.addEventListener('click', toggleLang);

  // View toggle
  $('#btnGrid')?.addEventListener('click', () => applyView('grid'));
  $('#btnList')?.addEventListener('click', () => applyView('list'));

  // Status chips
  $$('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.chip').forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      activeStatus = chip.dataset.status;
      applyFilters();
    });
  });

  // Type filter
  $('#typeFilter')?.addEventListener('change', e => {
    activeType = e.target.value;
    applyFilters();
  });

  // Sort
  $('#sortSelect')?.addEventListener('change', e => {
    sortBy = e.target.value;
    applyFilters();
  });

  // Search
  $('#searchInput')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    applyFilters();
  });

  // Modal close — button
  $('#modalClose')?.addEventListener('click', closeModal);

  // Modal close — overlay click
  $('#modalOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Modal close — Escape key + focus trap
  document.addEventListener('keydown', e => {
    const overlay = $('#modalOverlay');
    if (!overlay || overlay.hidden) return;
    if (e.key === 'Escape') {
      if (overlay && !overlay.hidden) { closeModal(); return; }
      const aboutOverlay = $('#aboutOverlay');
      if (aboutOverlay && !aboutOverlay.hidden) { closeAbout(); return; }
    }
    if (e.key === 'Tab') {
      const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', overlay)
        .filter(el => !el.hidden && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });
}
