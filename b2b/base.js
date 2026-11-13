/* =====================================================================
   BASE JS CONDIVISO — navbar, reveal, contatori, tab, form → WhatsApp.
   Dati del cliente: window.SITE = { whatsapp, email } (definito in index.html)
   ===================================================================== */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var S = window.SITE || {};
  var WA = (S.whatsapp || '390000000000').replace(/\D/g, '');

  function waUrl(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }

  /* ---- Navbar ---- */
  var nav = d.querySelector('.nav');
  if (nav) {
    var burger = nav.querySelector('.burger');
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      if (burger) { burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu'); }
    };
    if (burger) burger.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.querySelectorAll('.nav-panel a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 20); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Marquee: duplica il contenuto per il loop continuo ---- */
  d.querySelectorAll('.marquee-track').forEach(function (t) {
    t.innerHTML += t.innerHTML;
    for (var i = t.children.length / 2; i < t.children.length; i++) t.children[i].setAttribute('aria-hidden', 'true');
  });

  /* ---- Contatori ---- */
  function fmt(v, dec) {
    var p = v.toFixed(dec).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return p.join(',');
  }
  function runCount(el) {
    var to = parseFloat(el.getAttribute('data-count')), dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
    var dur = 1500, t0 = null;
    function tick(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(to * e, dec) + suf;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---- Reveal on scroll + contatori ---- */
  root.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var counters = d.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    counters.forEach(function (c) { c.textContent = (c.getAttribute('data-prefix') || '') + '0' + (c.getAttribute('data-suffix') || ''); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.querySelectorAll('[data-count]').forEach(runCount);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    d.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { if (!c.closest('.reveal')) cio.observe(c); });
  } else {
    d.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Tabs ---- */
  d.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = group.querySelectorAll('[role="tab"]');
    var panels = group.querySelectorAll('[role="tabpanel"]');
    function select(tab) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
      panels.forEach(function (p) { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
        if (n === null) return; n = (n + tabs.length) % tabs.length; tabs[n].focus(); select(tabs[n]); e.preventDefault();
      });
    });
  });

  /* ---- Date: minimo = oggi ---- */
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  var iso = today.toISOString().slice(0, 10);
  d.querySelectorAll('input[type="date"]').forEach(function (i) { i.min = iso; });

  /* ---- Link WhatsApp diretti ---- */
  d.querySelectorAll('[data-wa-link]').forEach(function (a) {
    a.href = waUrl(a.getAttribute('data-msg') || 'Ciao! Vorrei maggiori informazioni.');
    a.target = '_blank'; a.rel = 'noopener';
  });

  /* ---- Form → messaggio WhatsApp precompilato ---- */
  function prettyDate(v) {
    if (!v) return '';
    var dt = new Date(v + 'T12:00:00');
    return isNaN(dt) ? v : dt.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  d.querySelectorAll('form[data-wa]').forEach(function (form) {
    var note = form.querySelector('.form-note');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var lines = [form.getAttribute('data-wa') || 'Ciao! Vorrei fare una richiesta.', ''];
      form.querySelectorAll('[data-label]').forEach(function (f) {
        var val = '';
        if (f.type === 'radio' || f.type === 'checkbox') return;
        if (f.matches('.chips')) { var c = f.querySelector('input:checked'); val = c ? c.value : ''; }
        else if (f.tagName === 'INPUT' || f.tagName === 'SELECT' || f.tagName === 'TEXTAREA') { val = f.type === 'date' ? prettyDate(f.value) : f.value.trim(); }
        if (val) lines.push(f.getAttribute('data-label') + ': ' + val);
      });
      var url = waUrl(lines.join('\n'));
      var w = window.open(url, '_blank', 'noopener');
      if (!w) window.location.href = url;
      if (note) { note.textContent = 'Si è aperto WhatsApp con la tua richiesta già scritta: premi invia per confermare.'; note.classList.add('ok'); }
    });
  });

  /* ---- Anno nel footer ---- */
  d.querySelectorAll('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });
})();
