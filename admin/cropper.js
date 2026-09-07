/* ============================================================
   cropper.js — Recadrage d'images côté navigateur (admin)
   CMS.crop(source, opts) → Promise<File|null>
     source : File (fichier choisi) ou URL d'une image déjà en ligne
     opts   : { ratio: nombre | 'free', title, png }
   Résout un nouveau fichier recadré, le fichier d'origine
   (« Sans recadrage ») ou null (annulation).
   CMS.pickAndUpload(source, opts, wrapEl, hintEl) → Promise<chemin|null>
     Enchaîne : recadrage → aperçu local → téléversement.
   ============================================================ */
(function (global) {
  'use strict';

  var PRESETS = [
    { label: 'Carré 1:1', value: 1 },
    { label: 'Paysage 4:3', value: 4 / 3 },
    { label: 'Paysage 3:2', value: 3 / 2 },
    { label: 'Large 16:9', value: 16 / 9 },
    { label: 'Portrait 4:5', value: 4 / 5 },
    { label: 'Portrait 3:4', value: 3 / 4 },
    { label: 'Libre', value: 'free' }
  ];
  var MAX_OUT = 1600;   // largeur max exportée (px)
  var JPEG_Q = 0.9;

  var ui = null, st = null;

  function ratioLabel(r) {
    if (r === 'free' || r == null) return 'Libre';
    var known = { '1.000': '1:1', '1.333': '4:3', '1.500': '3:2', '1.778': '16:9', '0.800': '4:5', '0.750': '3:4', '1.600': '16:10', '2.333': '7:3', '2.000': '2:1' };
    var k = (Math.round(r * 1000) / 1000).toFixed(3);
    return known[k] || (Math.round(r * 100) / 100) + ':1';
  }

  /* ---------- construction de l'interface (une seule fois) ---------- */
  function build() {
    ui = {};
    var o = document.createElement('div');
    o.className = 'crop-overlay';
    o.innerHTML =
      '<div class="crop-modal" role="dialog" aria-label="Recadrer l\'image">' +
        '<div class="crop-head"><h2 class="crop-title">Recadrer l\'image</h2><span class="crop-sub"></span></div>' +
        '<div class="crop-ratios"></div>' +
        '<div class="crop-stage"><canvas class="crop-canvas"></canvas><div class="crop-loading">Chargement…</div></div>' +
        '<div class="crop-tools">' +
          '<label class="crop-zoom">🔍 Zoom <input type="range" min="1" max="4" step="0.01" value="1"></label>' +
          '<div class="crop-btns">' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="rotl" title="Pivoter à gauche">⟲ 90°</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="rotr" title="Pivoter à droite">⟳ 90°</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="flip" title="Miroir horizontal">↔ Miroir</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="reset">Réinitialiser</button>' +
          '</div>' +
        '</div>' +
        '<p class="crop-hint">Faites glisser l\'image pour la positionner, utilisez le zoom (ou la molette) pour cadrer. La zone claire est ce qui apparaîtra sur le site.</p>' +
        '<div class="crop-footer">' +
          '<button type="button" class="btn btn-ghost" data-act="cancel">Annuler</button>' +
          '<button type="button" class="btn btn-ghost" data-act="raw">Utiliser sans recadrer</button>' +
          '<button type="button" class="btn btn-primary" data-act="ok">✂️ Valider le recadrage</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
    ui.overlay = o;
    ui.title = o.querySelector('.crop-title');
    ui.sub = o.querySelector('.crop-sub');
    ui.ratios = o.querySelector('.crop-ratios');
    ui.stage = o.querySelector('.crop-stage');
    ui.canvas = o.querySelector('.crop-canvas');
    ui.loading = o.querySelector('.crop-loading');
    ui.zoom = o.querySelector('input[type=range]');
    ui.raw = o.querySelector('[data-act="raw"]');
    ui.ctx = ui.canvas.getContext('2d');

    ui.zoom.addEventListener('input', function () { st.zoom = parseFloat(this.value); clamp(); draw(); });
    o.addEventListener('click', function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (!act) return;
      if (act === 'rotl') { st.rot = (st.rot + 270) % 360; fit(); }
      else if (act === 'rotr') { st.rot = (st.rot + 90) % 360; fit(); }
      else if (act === 'flip') { st.flip = !st.flip; draw(); }
      else if (act === 'reset') { st.rot = 0; st.flip = false; fit(); }
      else if (act === 'cancel') { finish(null); }
      else if (act === 'raw') { finish(st.file || null); }
      else if (act === 'ok') { exportFile().then(finish); }
    });
    document.addEventListener('keydown', function (e) { if (st && e.key === 'Escape') finish(null); });

    // Déplacement (souris + tactile via Pointer Events)
    var dragging = false, lx = 0, ly = 0;
    ui.canvas.addEventListener('pointerdown', function (e) { dragging = true; lx = e.clientX; ly = e.clientY; ui.canvas.setPointerCapture(e.pointerId); e.preventDefault(); });
    ui.canvas.addEventListener('pointermove', function (e) {
      if (!dragging || !st) return;
      var r = ui.canvas.getBoundingClientRect(), k = ui.canvas.width / r.width;
      st.offX += (e.clientX - lx) * k; st.offY += (e.clientY - ly) * k; lx = e.clientX; ly = e.clientY;
      clamp(); draw();
    });
    ui.canvas.addEventListener('pointerup', function () { dragging = false; });
    ui.canvas.addEventListener('pointercancel', function () { dragging = false; });
    ui.canvas.addEventListener('wheel', function (e) {
      if (!st) return; e.preventDefault();
      st.zoom = Math.max(1, Math.min(4, st.zoom * (e.deltaY < 0 ? 1.08 : 0.926)));
      ui.zoom.value = st.zoom; clamp(); draw();
    }, { passive: false });
    window.addEventListener('resize', function () { if (st) { sizeCanvas(); clamp(); draw(); } });
  }

  function sizeCanvas() {
    var w = Math.min(680, Math.max(280, ui.stage.clientWidth || 680));
    ui.canvas.width = w; ui.canvas.height = Math.round(w * 0.66);
  }

  /* ---------- état / géométrie ---------- */
  function srcDims() {
    var sw = st.img.naturalWidth, sh = st.img.naturalHeight;
    return (st.rot % 180) ? { w: sh, h: sw } : { w: sw, h: sh };
  }
  function frame() {
    var d = srcDims();
    var r = (st.ratio === 'free') ? d.w / d.h : st.ratio;
    var W = ui.canvas.width - 32, H = ui.canvas.height - 32;
    var fw = W, fh = W / r;
    if (fh > H) { fh = H; fw = H * r; }
    return { w: fw, h: fh, r: r };
  }
  function scale() {
    var d = srcDims(), f = frame();
    return Math.max(f.w / d.w, f.h / d.h) * st.zoom;
  }
  function clamp() {
    var d = srcDims(), f = frame(), s = scale();
    var mx = Math.max(0, (d.w * s - f.w) / 2), my = Math.max(0, (d.h * s - f.h) / 2);
    st.offX = Math.max(-mx, Math.min(mx, st.offX));
    st.offY = Math.max(-my, Math.min(my, st.offY));
  }
  function fit() { st.zoom = 1; st.offX = 0; st.offY = 0; ui.zoom.value = 1; draw(); }

  function draw() {
    var c = ui.canvas, ctx = ui.ctx, f = frame(), s = scale();
    var cx = c.width / 2, cy = c.height / 2;
    ctx.clearRect(0, 0, c.width, c.height);
    // damier (transparence)
    ctx.fillStyle = '#e9e5dc'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#d8d3c8';
    for (var y = 0; y < c.height; y += 16) for (var x = ((y / 16) % 2) * 16; x < c.width; x += 32) ctx.fillRect(x, y, 16, 16);
    // image
    ctx.save();
    ctx.translate(cx + st.offX, cy + st.offY);
    ctx.rotate(st.rot * Math.PI / 180);
    if (st.flip) ctx.scale(-1, 1);
    ctx.scale(s, s);
    ctx.drawImage(st.img, -st.img.naturalWidth / 2, -st.img.naturalHeight / 2);
    ctx.restore();
    // assombrir hors cadre
    var fx = cx - f.w / 2, fy = cy - f.h / 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, c.width, c.height); ctx.rect(fx, fy, f.w, f.h);
    ctx.fillStyle = 'rgba(20,18,15,.62)'; ctx.fill('evenodd');
    ctx.restore();
    // cadre + tiers
    ctx.strokeStyle = '#ff6b00'; ctx.lineWidth = 2; ctx.strokeRect(fx + 1, fy + 1, f.w - 2, f.h - 2);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
    for (var i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(fx + f.w * i / 3, fy); ctx.lineTo(fx + f.w * i / 3, fy + f.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx, fy + f.h * i / 3); ctx.lineTo(fx + f.w, fy + f.h * i / 3); ctx.stroke();
    }
    var d = srcDims();
    ui.sub.textContent = ratioLabel(f.r) + ' · ' + Math.round(f.w / s) + ' × ' + Math.round(f.h / s) + ' px (image : ' + d.w + ' × ' + d.h + ')';
  }

  function renderRatios() {
    var list = [];
    if (st.recommended != null) list.push({ label: 'Recommandé (' + ratioLabel(st.recommended) + ')', value: st.recommended, rec: true });
    PRESETS.forEach(function (p) { list.push(p); });
    ui.ratios.innerHTML = '';
    list.forEach(function (p) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'crop-chip' + (p.value === st.ratio ? ' active' : '') + (p.rec ? ' rec' : '');
      b.textContent = p.label;
      b.addEventListener('click', function () { st.ratio = p.value; renderRatios(); clamp(); draw(); });
      ui.ratios.appendChild(b);
    });
  }

  /* ---------- export ---------- */
  function exportFile() {
    return new Promise(function (resolve) {
      var d = srcDims(), f = frame(), s = scale();
      // source « redressée » (rotation + miroir appliqués)
      var src = document.createElement('canvas'); src.width = d.w; src.height = d.h;
      var sc = src.getContext('2d');
      sc.translate(d.w / 2, d.h / 2); sc.rotate(st.rot * Math.PI / 180); if (st.flip) sc.scale(-1, 1);
      sc.drawImage(st.img, -st.img.naturalWidth / 2, -st.img.naturalHeight / 2);
      var sw = f.w / s, sh = f.h / s;
      var sx = d.w / 2 - (f.w / 2 + st.offX) / s, sy = d.h / 2 - (f.h / 2 + st.offY) / s;
      var outW = Math.min(st.png ? 1200 : MAX_OUT, Math.round(sw)), outH = Math.round(outW * sh / sw);
      var out = document.createElement('canvas'); out.width = outW; out.height = outH;
      out.getContext('2d').drawImage(src, sx, sy, sw, sh, 0, 0, outW, outH);
      var png = !!st.png;
      var type = png ? 'image/png' : 'image/jpeg';
      var base = (st.name || 'image').replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9\-_]/gi, '-').toLowerCase() || 'image';
      out.toBlob(function (blob) {
        if (!blob) { resolve(st.file || null); return; }
        resolve(new File([blob], base + '-recadre.' + (png ? 'png' : 'jpg'), { type: type }));
      }, type, JPEG_Q);
    });
  }

  function finish(result) {
    if (!st) return;
    var done = st.resolve; var url = st.objectUrl;
    ui.overlay.classList.remove('open'); st = null;
    if (url) { try { URL.revokeObjectURL(url); } catch (e) {} }
    done(result);
  }

  /* ---------- API ---------- */
  function crop(source, opts) {
    opts = opts || {};
    if (!ui) build();
    return new Promise(function (resolve) {
      var isFile = (typeof File !== 'undefined') && (source instanceof File || source instanceof Blob);
      var url = isFile ? URL.createObjectURL(source) : String(source);
      var recommended = (opts.ratio == null) ? null : opts.ratio;
      st = {
        resolve: resolve, file: isFile ? source : null, objectUrl: isFile ? url : null,
        name: isFile ? source.name : String(source).split('/').pop().split('?')[0],
        // PNG conservé seulement si la source est un PNG (transparence) ; sinon JPEG, bien plus léger
        png: isFile ? (source.type === 'image/png') : /\.png(\?|$)/i.test(String(source)),
        recommended: recommended, ratio: (recommended == null ? 'free' : recommended),
        rot: 0, flip: false, zoom: 1, offX: 0, offY: 0, img: null
      };
      ui.title.textContent = opts.title ? '✂️ ' + opts.title : '✂️ Recadrer l\'image';
      ui.sub.textContent = '';
      ui.raw.style.display = isFile ? '' : 'none';
      ui.loading.style.display = 'flex';
      ui.overlay.classList.add('open');
      sizeCanvas();
      var img = new Image();
      img.onload = function () { if (!st) return; st.img = img; ui.loading.style.display = 'none'; renderRatios(); fit(); };
      img.onerror = function () { if (!st) return; ui.loading.textContent = 'Impossible de charger l\'image.'; };
      img.src = url;
    });
  }

  // Recadrage → aperçu local → téléversement. Résout le chemin dans le dépôt, ou null.
  function pickAndUpload(source, opts, wrap, hint) {
    var setHint = function (t) { if (hint) hint.textContent = t; };
    return crop(source, opts).then(function (file) {
      if (!file) return null;
      if (wrap && global.CMS.localPreview) global.CMS.localPreview(file, wrap);
      setHint('Téléversement…');
      return global.CMS.uploadImage(file).then(function (path) { setHint('Photo prête ✓'); return path; });
    }).catch(function (e) { setHint('Erreur de téléversement'); console.error(e); return null; });
  }

  global.CMS = global.CMS || {};
  global.CMS.crop = crop;
  global.CMS.pickAndUpload = pickAndUpload;
})(window);
