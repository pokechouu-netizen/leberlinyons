/* ============================================================
   js/main.js — Chargement du contenu éditable (data/*.json)
   Le HTML codé en dur sert de fallback : si un JSON est absent
   ou invalide, la section reste telle quelle. Une fois le contenu
   injecté, script.js (animations, carrousels…) est chargé.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  // Texte propre → HTML (retours à la ligne → <br>)
  function htmlFromText(text) { return esc(text).replace(/\r?\n/g, '<br>'); }
  function fetchJSON(path) {
    return fetch(path, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function setText(sel, text) {
    if (text == null || text === '') return;
    $$(sel).forEach(function (el) { el.innerHTML = htmlFromText(text); });
  }
  // Remplace le texte d'un bouton/lien en conservant son icône SVG
  function setLabel(el, text) {
    if (!el || text == null || text === '') return;
    var svg = el.querySelector('svg');
    el.innerHTML = (svg ? svg.outerHTML + ' ' : '') + esc(text);
  }
  function safeUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(u)) return u;
    return 'https://' + u;
  }

  var STAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>';
  var PHONE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
  var PLAY_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';

  /* ---------- icônes d'ingrédients (choisies par mot-clé) ---------- */
  var ICONS = {
    viande: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 8c0-1 .5-3 4-4s6 .5 8 2 4 4 4 6-1 4-3 5-4 1.5-6 1.5S5 17 4 15s0-5.5 0-7z" fill="#e85d3a" opacity=".85"/><path d="M7 10c1-2 3-2.5 5-2s3.5 2 4 4" stroke="#ff6b00" stroke-width="1.2" stroke-linecap="round"/><path d="M6 14c.5 1.5 2 2.5 4 2.5s4-1 5-3" stroke="#c44" stroke-width="1" stroke-linecap="round" opacity=".5"/></svg>',
    legumes: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3c-1 2-4 4-5 7s0 5 1 7 3 3.5 4 4c1-.5 3-2 4-4s2-4 1-7-4-5-5-7z" fill="#4ecb71" opacity=".8"/><path d="M12 6v12M9 10c1 1 2 2 3 2s2-1 3-2" stroke="#2d8a4e" stroke-width="1.2" stroke-linecap="round"/></svg>',
    feta: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 18L12 4l7 14H5z" fill="#f5d67a" opacity=".85"/><path d="M5 18L12 4l7 14" stroke="#d4a836" stroke-width="1.2" stroke-linejoin="round" fill="none"/><circle cx="9" cy="13" r="1" fill="#d4a836" opacity=".5"/><circle cx="13" cy="11" r="1" fill="#d4a836" opacity=".5"/><circle cx="11" cy="15" r=".8" fill="#d4a836" opacity=".4"/></svg>',
    cacahuetes: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><ellipse cx="9" cy="12" rx="4" ry="5" fill="#c4956a" opacity=".8"/><ellipse cx="15" cy="12" rx="4" ry="5" fill="#b07d52" opacity=".7"/><path d="M9 8c1-1 2-1.5 3-1M15 8c-1-1-2-1.5-3-1" stroke="#8b5e3c" stroke-width="1" stroke-linecap="round"/></svg>',
    sauce: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 10c0-2 2-4 6-4s6 2 6 4v2c0 3-2 6-6 6s-6-3-6-6v-2z" fill="#f0ece4" opacity=".8"/><path d="M6 10c0-2 2-4 6-4s6 2 6 4" stroke="#ccc5b5" stroke-width="1.2"/><path d="M10 14a2 2 0 004 0" stroke="#ccc5b5" stroke-width="1" stroke-linecap="round"/></svg>',
    salade: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 16c0-2 1-5 3-7s5-3 7-2 3 3 3 6-2 5-4 6-4 1-6 0-3-1-3-3z" fill="#8bc78b" opacity=".7"/><path d="M8 11c2-1 4-1 6 0M7 14c2 1 5 1 7 0" stroke="#4a9e4a" stroke-width="1" stroke-linecap="round"/><path d="M14 7c1 0 2 1 2 2" stroke="#4a9e4a" stroke-width="1" stroke-linecap="round"/></svg>',
    tomate: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" fill="#e84235" opacity=".85"/><path d="M12 5c0 3-2 5-2 7s2 5 2 5" stroke="#c62828" stroke-width="1" stroke-linecap="round" opacity=".5"/><path d="M8 8c1 0 2 1 2 2M14 8c-1 0-2 1-2 2" stroke="#c62828" stroke-width="1" stroke-linecap="round" opacity=".4"/><circle cx="12" cy="7" r="1.5" fill="#4a9e4a"/></svg>',
    oignon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="6" fill="#d9b3e8" opacity=".7"/><circle cx="12" cy="13" r="4" fill="#c99edb" opacity=".5"/><circle cx="12" cy="13" r="2" fill="#b385c9" opacity=".4"/><path d="M10 7c1-1 3-1 4 0" stroke="#4a9e4a" stroke-width="1.2" stroke-linecap="round"/><path d="M12 7V5" stroke="#4a9e4a" stroke-width="1.2" stroke-linecap="round"/></svg>',
    coriandre: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4c-2 2-5 5-5 8s1 4 3 5 4 .5 5-.5 2-3 1-5c1 2 .5 4-.5 5s-3 1.5-4 1-2-2-1.5-4" stroke="#4ecb71" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M12 4v8" stroke="#2d8a4e" stroke-width="1" stroke-linecap="round"/></svg>',
    citron: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="12" rx="6" ry="7" fill="#c5e84e" opacity=".8"/><ellipse cx="12" cy="12" rx="3.5" ry="4.5" fill="#d4f067" opacity=".6"/><path d="M9 10l2 1M13 10l-2 1M10 14l2-1M14 14l-2-1" stroke="#8ba826" stroke-width=".8" stroke-linecap="round"/><circle cx="12" cy="6" r="1" fill="#4a9e4a"/></svg>',
    poulet: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10 5c-2 1-3 3-3 5s1 4 2 5l2 2c1-1 3-2 4-4s1-4 0-6-3-3-5-2z" fill="#d4956a" opacity=".85"/><path d="M14 6c1 0 2 1 2 3s-1 3-2 4" stroke="#b07340" stroke-width="1.2" stroke-linecap="round"/><path d="M8 17l-2 3" stroke="#c4956a" stroke-width="2" stroke-linecap="round"/></svg>',
    falafel: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" fill="#8b6f3a" opacity=".8"/><circle cx="12" cy="12" r="5" fill="#a68542" opacity=".6"/><circle cx="10" cy="11" r="1" fill="#6b5430" opacity=".6"/><circle cx="14" cy="13" r=".8" fill="#6b5430" opacity=".5"/><circle cx="11" cy="14" r=".6" fill="#6b5430" opacity=".4"/><path d="M9 8c1-1.5 5-1.5 6 0" stroke="#4a9e4a" stroke-width="1.2" stroke-linecap="round"/></svg>',
    autre: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="6" fill="#ff6b00" opacity=".55"/><circle cx="12" cy="12" r="3" fill="#ffb27a" opacity=".8"/></svg>'
  };
  var ICON_RULES = [
    [/poulet|chicken/i, 'poulet'], [/falafel/i, 'falafel'], [/viande|kebab|d[oö]ner|b[oœ]uf|agneau|veau/i, 'viande'],
    [/l[ée]gume|crudit/i, 'legumes'], [/salade/i, 'salade'], [/tomate/i, 'tomate'], [/oignon/i, 'oignon'],
    [/coriandre|persil|menthe/i, 'coriandre'], [/citron/i, 'citron'], [/feta|fromag|cheddar|chèvre|chevre/i, 'feta'],
    [/cacahu|noix|noisette|s[ée]same/i, 'cacahuetes'], [/sauce|mayo|ketchup|harissa|samoura/i, 'sauce']
  ];
  function ingredientIcon(name) {
    for (var i = 0; i < ICON_RULES.length; i++) { if (ICON_RULES[i][0].test(name)) return ICONS[ICON_RULES[i][1]]; }
    return ICONS.autre;
  }
  function ingredientLabel(name) { return esc(name).replace(/\bXXL\b/g, '<strong>XXL</strong>'); }

  /* ========== TEXTES ========== */
  var TEXT_TARGETS = {
    hero_badge: '.hero__badge',
    hero_sub: '.hero__sub',
    hero_horaires_resume: '.hero__info .hero__info-item:nth-of-type(2) span',
    menu_title: '#menu .section__header h2',
    menu_sub: '#menu .section__header p',
    menu_prix_base: '.menu-baseline strong',
    recettes_sub: '.recipes-carousel__subtitle',
    aussi_title: '#aussi .section__header h2',
    aussi_sub: '#aussi .section__header p',
    parcours_title: '#parcours .section__header h2',
    artistes_title: '#artistes .section__header h2',
    artistes_sub: '#artistes .section__header p',
    galerie_title: '#galerie .section__header h2',
    galerie_sub: '#galerie .section__header p',
    avis_title: '#avis .section__header h2',
    services_title: '#services .section__header h2',
    services_sub: '#services .section__header p',
    service1_title: '#services .service-card:nth-of-type(1) h3',
    service1_desc: '#services .service-card:nth-of-type(1) p',
    service2_title: '#services .service-card:nth-of-type(2) h3',
    service2_desc: '#services .service-card:nth-of-type(2) p',
    communaute_title: '#communaute .section__header h2',
    communaute_sub: '#communaute .section__header p',
    contact_title: '#contact .section__header h2'
  };

  function applyTextes(t) {
    if (!t) return;
    Object.keys(TEXT_TARGETS).forEach(function (k) { setText(TEXT_TARGETS[k], t[k]); });

    // Grand titre : partie normale + partie en couleur
    var h1 = $('.hero h1');
    if (h1 && (t.hero_title || t.hero_title_accent)) {
      h1.innerHTML = htmlFromText(t.hero_title || '') + (t.hero_title_accent ? ' <span class="highlight">' + htmlFromText(t.hero_title_accent) + '</span>' : '');
    }
    // Chiffres clés
    var counters = $$('.hero__stat [data-count]');
    if (counters[0] && t.hero_stat_clients) { counters[0].setAttribute('data-count', parseInt(t.hero_stat_clients, 10) || 0); }
    if (counters[1] && t.hero_stat_annees) { counters[1].setAttribute('data-count', parseInt(t.hero_stat_annees, 10) || 0); }
    var note = $('.hero__stat--google .hero__stat-number');
    if (note && t.hero_note_google) note.textContent = t.hero_note_google;
    // Badge sur la photo du hero
    var badge = $('.hero__image-badge');
    if (badge && t.hero_image_badge) badge.innerHTML = '<span class="hero__image-badge-dot"></span>' + esc(t.hero_image_badge);
    // Intro du parcours : un paragraphe par ligne
    var ph = $('#parcours .section__header');
    if (ph && t.parcours_intro) {
      $$('p', ph).forEach(function (p) { p.remove(); });
      String(t.parcours_intro).split(/\r?\n/).forEach(function (line) {
        if (!line.trim()) return;
        var p = document.createElement('p'); p.textContent = line.trim(); ph.appendChild(p);
      });
    }
    // Boutons des services (icône conservée)
    setLabel($('#services .service-card:nth-of-type(1) button'), t.service1_bouton);
    setLabel($('#services .service-card:nth-of-type(2) button'), t.service2_bouton);
  }

  /* ========== PHOTOS CLÉS ========== */
  function applyPhotos(p) {
    if (!p) return;
    if (p.logo) {
      $$('.navbar__brand img').forEach(function (i) { i.src = p.logo; });
      $$('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(function (l) { l.href = p.logo; });
    }
    if (p.logo_flottant) $$('.floating-logo').forEach(function (i) { i.src = p.logo_flottant; });
    if (p.hero_fond) { var bg = $('.hero__bg-img'); if (bg) bg.src = p.hero_fond; }
    if (p.hero_photo) { var hp = $('.hero__image > img:not(.hero__image-broche)'); if (hp) hp.src = p.hero_photo; }
    if (p.hero_broche) { var br = $('.hero__image-broche'); if (br) br.src = p.hero_broche; }
  }

  /* ========== LA CARTE ========== */
  function renderFormats(list) {
    var track = $('.cards-grid__track'), dots = $('.cards-grid__dots');
    if (!track || !Array.isArray(list)) return;
    var vis = list.filter(function (f) { return f.visible !== false; });
    if (!vis.length) return;
    track.innerHTML = '';
    vis.forEach(function (f) {
      var a = document.createElement('article');
      a.className = 'card' + (f.badge ? ' card--featured' : '');
      a.innerHTML = (f.badge ? '<div class="card__badge">' + esc(f.badge) + '</div>' : '') +
        '<div class="card__image">' + (f.image ? '<img src="' + esc(f.image) + '" alt="' + esc(f.nom) + ' Le Berli\'Nyons" />' : '') +
          (f.prix ? '<span class="card__price">' + esc(f.prix) + '</span>' : '') + '</div>' +
        '<div class="card__body"><h3>' + esc(f.nom) + '</h3><p>' + htmlFromText(f.desc) + '</p>' +
          '<button class="btn btn--primary btn--full" data-open-phone>Commander</button></div>';
      track.appendChild(a);
    });
    if (dots) { dots.innerHTML = ''; vis.forEach(function (_, i) { var s = document.createElement('span'); s.className = 'cards-grid__dot' + (i === 0 ? ' active' : ''); dots.appendChild(s); }); }
  }

  function renderRecettes(list) {
    var track = $('.recipes-carousel__track');
    if (!track || !Array.isArray(list)) return;
    var vis = list.filter(function (r) { return r.visible !== false; });
    if (!vis.length) return;
    track.innerHTML = '';
    vis.forEach(function (r, i) {
      var a = document.createElement('article');
      a.className = 'recipe-slide';
      a.setAttribute('data-recipe', r.id || ('r' + i));
      var ings = (Array.isArray(r.ingredients) ? r.ingredients : String(r.ingredients || '').split(/\r?\n/)).filter(function (s) { return String(s).trim(); });
      a.innerHTML =
        '<div class="recipe-slide__header"><span class="recipe-slide__number">#' + (i + 1) + '</span>' +
          (r.badge ? '<span class="recipe-slide__badge' + (r.style ? ' recipe-slide__badge--' + esc(r.style) : '') + '">' + esc(r.badge) + '</span>' : '') + '</div>' +
        '<h4>' + esc(r.nom) + '</h4>' +
        (r.desc ? '<p class="recipe-slide__desc">' + htmlFromText(r.desc) + '</p>' : '') +
        '<ul class="recipe-slide__ingredients">' + ings.map(function (n) {
          return '<li><span class="ingredient-icon">' + ingredientIcon(n) + '</span> ' + ingredientLabel(n) + '</li>';
        }).join('') + '</ul>' +
        '<div class="recipe-slide__footer">' +
          (r.allergenes ? '<span class="recipe-slide__allergens">Allergènes : ' + esc(r.allergenes) + '</span>' : '') +
          (r.supplement ? '<span class="recipe-slide__supplement">' + esc(r.supplement) + '</span>' : '') + '</div>';
      track.appendChild(a);
    });
    var dotsCtn = $('.recipes-carousel__dots'); if (dotsCtn) dotsCtn.innerHTML = '';
  }

  function renderFormules(list, sups) {
    var grid = $('.formules-grid');
    if (grid && Array.isArray(list) && list.length) {
      grid.innerHTML = '';
      list.forEach(function (f) {
        var d = document.createElement('div');
        d.className = 'formule-card' + (f.highlight ? ' formule-card--highlight' : '');
        d.innerHTML = '<span class="formule-card__label">' + esc(f.nom) + '</span><span class="formule-card__price">' + esc(f.prix) + '</span><span class="formule-card__detail">' + esc(f.detail) + '</span>';
        grid.appendChild(d);
      });
    }
    var info = $('.supplements-info');
    if (info && Array.isArray(sups)) {
      var items = sups.filter(function (s) { return s && s.label; });
      info.innerHTML = items.map(function (s) { return '<span>' + esc(s.label) + ' <strong>' + esc(s.prix) + '</strong></span>'; }).join('<span class="supplements-sep">·</span>');
      info.style.display = items.length ? '' : 'none';
    }
  }

  function renderAussi(list) {
    var grid = $('.aussi-grid');
    if (!grid || !Array.isArray(list)) return;
    var vis = list.filter(function (a) { return a.visible !== false; });
    if (!vis.length) return;
    grid.innerHTML = '';
    vis.forEach(function (a) {
      var d = document.createElement('div'); d.className = 'aussi-card';
      var prix = Array.isArray(a.prix) ? a.prix.filter(function (p) { return p && p.label; }) : [];
      d.innerHTML = '<div class="aussi-card__img">' + (a.image ? '<img src="' + esc(a.image) + '" alt="' + esc(a.nom) + ' Berli\'Nyons" loading="lazy" />' : '') + '</div>' +
        '<div class="aussi-card__content"><h3>' + esc(a.nom) + '</h3><p>' + htmlFromText(a.desc) + '</p>' +
        (prix.length ? '<div class="aussi-card__prices">' + prix.map(function (p) { return '<span class="aussi-card__price">' + esc(p.label) + ' <strong>' + esc(p.prix) + '</strong></span>'; }).join('') + '</div>' : '') +
        '</div>';
      grid.appendChild(d);
    });
  }

  /* ========== PARCOURS (timeline) ========== */
  function renderParcours(list) {
    var tl = $('.timeline');
    if (!tl || !Array.isArray(list)) return;
    var vis = list.filter(function (p) { return p.visible !== false; });
    if (!vis.length) return;
    $$('.timeline__item', tl).forEach(function (el) { el.remove(); });
    vis.forEach(function (p, i) {
      var d = document.createElement('div');
      d.className = 'timeline__item ' + (i % 2 === 0 ? 'timeline__item--left' : 'timeline__item--right');
      d.setAttribute('data-confetti', '');
      var titre = esc(p.titre);
      if (/💡\s*$/.test(String(p.titre || ''))) titre = esc(String(p.titre).replace(/💡\s*$/, '')).replace(/\s*$/, '') + ' <span class="bulb-icon" id="bulbIcon">💡</span>';
      var pos = (p.cadrage != null && p.cadrage !== '') ? Math.max(0, Math.min(100, parseInt(p.cadrage, 10) || 50)) : 50;
      d.innerHTML = '<div class="timeline__dot"></div><div class="timeline__confetti"></div><div class="timeline__card">' +
        (p.image ? '<div class="timeline__image"><img src="' + esc(p.image) + '" alt="' + esc(p.titre) + '" style="object-position:center ' + pos + '%" loading="lazy" /></div>' : '') +
        '<div class="timeline__content"><span class="timeline__year">' + esc(p.date) + '</span><h3>' + titre + '</h3><p>' + htmlFromText(p.texte) + '</p></div></div>';
      tl.appendChild(d);
    });
  }

  /* ========== ARTISTES ========== */
  function renderArtistes(list) {
    var grid = $('.artists-grid');
    if (!grid || !Array.isArray(list)) return;
    var vis = list.filter(function (a) { return a.visible !== false; });
    if (!vis.length) return;
    grid.innerHTML = '';
    vis.forEach(function (a) {
      var url = safeUrl(a.url), isLogo = !!a.logo, hasBtn = !!(a.bouton && url);
      var wrapAll = url && !hasBtn;  // sans bouton, toute la carte est cliquable
      var el = document.createElement(wrapAll ? 'a' : 'article');
      if (wrapAll) { el.href = url; el.target = '_blank'; el.rel = 'noreferrer'; }
      el.className = 'artist-card ' + (isLogo ? 'artist-card--with-logo' : 'artist-card--featured');
      var img = a.image ? '<img src="' + esc(a.image) + '" alt="' + esc(a.nom) + '" />' : '';
      var imgBlock = isLogo
        ? '<div class="artist-card__image artist-card__logo-wrap">' + img + '</div>'
        : (hasBtn ? '<a href="' + esc(url) + '" target="_blank" rel="noreferrer" class="artist-card__image">' : '<div class="artist-card__image">') +
            img + (a.categorie ? '<div class="artist-card__overlay"><span class="artist-card__category">' + esc(a.categorie) + '</span></div>' : '') +
          (hasBtn ? '</a>' : '</div>');
      el.innerHTML = imgBlock + '<div class="artist-card__content"><h3>' + esc(a.nom) + '</h3>' +
        (a.desc ? '<p>' + htmlFromText(a.desc) + '</p>' : '') +
        (hasBtn ? '<a class="btn btn--outline btn--sm" href="' + esc(url) + '" target="_blank" rel="noreferrer">' + PLAY_ICON + ' ' + esc(a.bouton) + '</a>' : '') +
        '</div>';
      grid.appendChild(el);
    });
  }

  /* ========== GALERIE ========== */
  function renderGalerie(list) {
    var track = $('.gallery-marquee__track');
    if (!track || !Array.isArray(list)) return;
    var vis = list.filter(function (g) { return g.visible !== false && g.image; });
    if (!vis.length) return;
    track.innerHTML = '';
    vis.forEach(function (g, i) {
      var d = document.createElement('div'); d.className = 'gallery__item';
      d.innerHTML = '<img src="' + esc(g.image) + '" alt="' + esc(g.nom || ('Berli\'Nyons photo ' + (i + 1))) + '" />';
      track.appendChild(d);
    });
  }

  /* ========== AVIS ========== */
  function renderAvis(list) {
    var ctn = $('.testimonials');
    if (!ctn || !Array.isArray(list) || !list.length) return;
    ctn.innerHTML = '';
    list.forEach(function (a) {
      var n = Math.max(1, Math.min(5, parseInt(a.note, 10) || 5));
      var art = document.createElement('article'); art.className = 'testimonial';
      var stars = ''; for (var i = 0; i < n; i++) stars += STAR;
      art.innerHTML = '<div class="testimonial__stars">' + stars + '</div>' +
        '<p>"' + htmlFromText(a.texte) + '"</p>' +
        '<span class="testimonial__author">— ' + esc(a.auteur) + '</span>' +
        (a.source ? '<span class="testimonial__source">' + esc(a.source) + '</span>' : '');
      ctn.appendChild(art);
    });
  }

  /* ========== INFOS ========== */
  var DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  var DAY_LABELS = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche' };

  function applyInfos(infos) {
    if (!infos) return;
    var fullAddr = [infos.adresse, ((infos.code_postal || '') + ' ' + (infos.ville || '')).trim()].filter(Boolean).join(', ');
    if (infos.telephone) {
      $$('.overlay__phone-number, .contact-info__link[href^="tel:"]').forEach(function (e) { e.textContent = infos.telephone; });
    }
    if (infos.telephone_raw) {
      $$('a[href^="tel:"]').forEach(function (a) { a.href = 'tel:' + infos.telephone_raw; });
    }
    if (infos.adresse) {
      var heroAddr = $('.hero__info .hero__info-item:nth-of-type(1) span');
      if (heroAddr) heroAddr.textContent = infos.adresse + (infos.ville ? ', ' + infos.ville : '');
      var contactAddr = $('.contact-info__block:nth-of-type(2) p');
      if (contactAddr) contactAddr.innerHTML = esc(infos.adresse) + '<br>' + esc(((infos.code_postal || '') + ' ' + (infos.ville || '')).trim());
      var q = encodeURIComponent(fullAddr);
      $$('a[href*="google.com/maps/dir"]').forEach(function (a) { a.href = 'https://www.google.com/maps/dir/?api=1&destination=' + q; });
      var map = $('.contact-map iframe'); if (map) map.src = 'https://www.google.com/maps?q=' + q + '&output=embed';
    }
    if (infos.instagram) $$('a[href*="instagram.com"]').forEach(function (a) { a.href = safeUrl(infos.instagram); });
    if (infos.facebook) $$('a[href*="facebook.com"]').forEach(function (a) { a.href = safeUrl(infos.facebook); });
    if (infos.avis_google_url) { var g = $('#avis .section__cta a'); if (g) g.href = safeUrl(infos.avis_google_url); }

    // Horaires par saison
    if (infos.horaires) {
      ['hiver', 'ete'].forEach(function (season) {
        var h = infos.horaires[season]; if (!h) return;
        var slide = $('.hours-carousel__slide[data-season="' + season + '"]'); if (!slide) return;
        var detail = $('.hours-carousel__detail', slide);
        if (detail) { detail.textContent = h.detail || ''; detail.style.display = h.detail ? '' : 'none'; }
        var box = $('.hours', slide); if (!box) return;
        box.innerHTML = '';
        DAYS.forEach(function (d) {
          var v = h[d] == null ? '' : String(h[d]);
          var closed = /^ferm/i.test(v.trim()) || !v.trim();
          var row = document.createElement('div');
          row.className = 'hours__row' + (closed ? ' hours__row--closed' : '');
          row.innerHTML = '<span>' + DAY_LABELS[d] + '</span><span>' + esc(v || 'Fermé') + '</span>';
          box.appendChild(row);
        });
      });
    }
  }

  /* ========== POPUP ========== */
  function initPopup(p) {
    if (!p || !p.actif || !p.message) return;
    try { if (sessionStorage.getItem('berli_popup_closed') === '1') return; } catch (e) {}
    var css = '.site-popup{position:fixed;left:50%;bottom:24px;transform:translate(-50%,140%);z-index:9000;max-width:min(560px,calc(100% - 32px));background:#141414;color:#fff;border:1px solid rgba(255,107,0,.45);border-radius:16px;padding:16px 52px 16px 20px;box-shadow:0 20px 60px rgba(0,0,0,.6);display:flex;gap:14px;align-items:center;flex-wrap:wrap;transition:transform .5s cubic-bezier(.2,.8,.2,1);font-family:inherit}' +
      '.site-popup.show{transform:translate(-50%,0)}.site-popup__msg{flex:1 1 220px;font-size:15px;line-height:1.5}' +
      '.site-popup__cta{background:#ff6b00;color:#fff;padding:10px 18px;border-radius:50px;font-weight:600;font-size:14px;text-decoration:none;white-space:nowrap}' +
      '.site-popup__close{position:absolute;top:8px;right:10px;background:none;border:none;color:#aaa;font-size:22px;cursor:pointer;line-height:1}.site-popup__close:hover{color:#fff}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var el = document.createElement('div'); el.className = 'site-popup'; el.setAttribute('role', 'dialog');
    var url = safeUrl(p.cta_url);
    el.innerHTML = '<div class="site-popup__msg">' + htmlFromText(p.message) + '</div>' +
      (p.cta_label && url ? '<a class="site-popup__cta" href="' + esc(url) + '"' + (/^https?:/i.test(url) ? ' target="_blank" rel="noreferrer"' : '') + '>' + esc(p.cta_label) + '</a>' : '') +
      '<button class="site-popup__close" aria-label="Fermer">&times;</button>';
    document.body.appendChild(el);
    function close() { el.classList.remove('show'); try { sessionStorage.setItem('berli_popup_closed', '1'); } catch (e) {} setTimeout(function () { el.remove(); }, 600); }
    $('.site-popup__close', el).addEventListener('click', close);
    var cta = $('.site-popup__cta', el); if (cta) cta.addEventListener('click', close);
    setTimeout(function () { el.classList.add('show'); }, Math.max(0, (parseInt(p.delai_secondes, 10) || 0) * 1000));
  }

  /* ========== ORCHESTRATION ========== */
  function loadSiteScript() {
    if (document.querySelector('script[data-site-script]')) return;
    var s = document.createElement('script'); s.src = 'script.js'; s.setAttribute('data-site-script', '1');
    document.body.appendChild(s);
  }

  Promise.all([fetchJSON('data/contenu.json'), fetchJSON('data/carte.json'), fetchJSON('data/creations.json'), fetchJSON('data/infos.json')])
    .then(function (res) {
      var contenu = res[0] || {}, carte = res[1] || {}, creations = res[2] || {}, infos = res[3] || {};
      window.SITE_INFOS = infos;
      try {
        applyTextes(contenu.textes);
        applyPhotos(contenu.photos);
        renderFormats(carte.formats);
        renderRecettes(carte.recettes);
        renderFormules(carte.formules, carte.supplements);
        renderAussi(carte.aussi);
        renderParcours(contenu.parcours);
        renderArtistes(contenu.artistes);
        renderGalerie(creations.creations);
        renderAvis(contenu.avis);
        applyInfos(infos);
      } catch (e) { console.error('[CMS] injection', e); }
      loadSiteScript();
      if (infos.popup) initPopup(infos.popup);
    })
    .catch(function (e) { console.error('[CMS] chargement', e); loadSiteScript(); });
})();
