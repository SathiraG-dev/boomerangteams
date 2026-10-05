/* Boomerang Teams — hero 3D boomerang + scroll animation (GSAP / ScrollTrigger / Lenis). */
;/* Hero 3D boomerang (fixed: single scope, one Three.js, sized to its container,
   pauses off-screen, calm when reduced-motion is on). */
(function () {
  var container = document.getElementById('threejs-container-ANIMATION_6');
  if (!container || typeof THREE === 'undefined') return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var width = container.clientWidth || 600;
  var height = container.clientHeight || 560;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 10.4);

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  var dir1 = new THREE.DirectionalLight(0x28abc9, 1.5); dir1.position.set(5, 8, 6); scene.add(dir1);
  var dir2 = new THREE.DirectionalLight(0x0e5f73, 1.8); dir2.position.set(-6, -4, 4); scene.add(dir2);
  var point = new THREE.PointLight(0x28abc9, 1.6, 20); point.position.set(0, 2, 4); scene.add(point);

  var mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // Boomerang silhouette matching the brand logo
  var shape = new THREE.Shape();
  shape.moveTo(-2.4, -0.6);
  shape.quadraticCurveTo(-1.8, 1.6, 0.0, 2.2);
  shape.quadraticCurveTo(1.8, 1.6, 2.4, -0.6);
  shape.quadraticCurveTo(2.1, -1.0, 1.6, -0.6);
  shape.quadraticCurveTo(1.1, 0.8, 0.0, 1.3);
  shape.quadraticCurveTo(-1.1, 0.8, -1.6, -0.6);
  shape.quadraticCurveTo(-2.1, -1.0, -2.4, -0.6);

  var geo = new THREE.ExtrudeGeometry(shape, {
    steps: 2, depth: 0.35, bevelEnabled: true,
    bevelThickness: 0.12, bevelSize: 0.08, bevelOffset: 0, bevelSegments: 5
  });
  geo.center();

  var mat = new THREE.MeshPhongMaterial({
    color: 0x28abc9, emissive: 0x073844, specular: 0xffffff, shininess: 90,
    transparent: true, opacity: 0.96
  });
  var boom = new THREE.Mesh(geo, mat);
  mainGroup.add(boom);

  var ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.025, 16, 100),
    new THREE.MeshBasicMaterial({ color: 0x28abc9, transparent: true, opacity: 0.45 }));
  ring1.rotation.x = Math.PI / 3; ring1.rotation.y = Math.PI / 6; mainGroup.add(ring1);

  var ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.018, 16, 100),
    new THREE.MeshBasicMaterial({ color: 0x0e5f73, transparent: true, opacity: 0.3 }));
  ring2.rotation.x = -Math.PI / 4; ring2.rotation.z = Math.PI / 5; mainGroup.add(ring2);

  var count = window.innerWidth < 768 ? 70 : 140;
  var pGeo = new THREE.BufferGeometry();
  var pPos = new Float32Array(count * 3);
  for (var i = 0; i < count * 3; i += 3) {
    pPos[i] = (Math.random() - 0.5) * 14;
    pPos[i + 1] = (Math.random() - 0.5) * 10;
    pPos[i + 2] = (Math.random() - 0.5) * 8;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x28abc9, size: 0.06, transparent: true, opacity: 0.65 }));
  scene.add(particles);

  // Pointer tilt (relative to the hero visual) + scroll coupling
  var mx = 0, my = 0, tx = 0, ty = 0;
  var host = container.closest('[data-hero="visual"]') || container;
  host.addEventListener('pointermove', function (e) {
    var r = host.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  host.addEventListener('pointerleave', function () { tx = 0; ty = 0; });

  function resize() {
    var w = container.clientWidth || width, h = container.clientHeight || height;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    if (reduce) renderer.render(scene, camera);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(container);
  else window.addEventListener('resize', resize);

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(container);
    // Re-check immediately in case the observer's first callback raced the page's layout/scroll setup (Lenis, async Tailwind) and misreported.
    requestAnimationFrame(function () {
      var r = container.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) visible = true;
    });
  }

  var clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    var t = clock.getElapsedTime();
    var sy = window.pageYOffset || 0;
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;

    var targetY = mx * 0.75 + sy * 0.0035;
    var targetX = my * 0.45 - sy * 0.002;
    boom.rotation.z = Math.sin(t * 1.5) * 0.2 + sy * 0.003;
    boom.rotation.y += (targetY - boom.rotation.y) * 0.05 + 0.005;
    boom.rotation.x += (targetX - boom.rotation.x) * 0.05;

    mainGroup.position.y = Math.sin(t * 2.0) * 0.18 - Math.min(sy * 0.002, 2.5);
    ring1.rotation.z += 0.008;
    ring2.rotation.y += 0.012;
    particles.rotation.y = t * 0.03;
    particles.rotation.x = t * 0.015;
    renderer.render(scene, camera);
  }

  if (reduce) { boom.rotation.set(0.25, -0.5, 0.1); renderer.render(scene, camera); }
  else frame();
})();

;
/* Boomerang Teams — scroll animation layer (GSAP + ScrollTrigger + Lenis) */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function bail() { root.classList.remove('has-js'); }
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') { bail(); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- helpers ---------- */
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function countTo(el, to, o) {
    o = o || {};
    var suffix = o.suffix || '', from = o.from || 0, comma = !!o.comma;
    var obj = { v: from };
    var write = function (v) { el.textContent = (comma ? fmt(v) : Math.round(v)) + suffix; };
    write(from);
    return gsap.to(obj, { v: to, duration: o.duration || 1.6, delay: o.delay || 0, ease: 'power3.out',
      onUpdate: function () { write(obj.v); }, onComplete: function () { write(to); } });
  }
  function splitWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.parentElement.closest('svg')) return NodeFilter.FILTER_REJECT;
        return n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      } });
    var nodes = [], out = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var m = document.createElement('span'); m.className = 'w-mask';
        var i = document.createElement('span'); i.className = 'w-in'; i.textContent = part;
        m.appendChild(i); frag.appendChild(m); out.push(i);
      });
      n.parentNode.replaceChild(frag, n);
    });
    return out;
  }

  /* ---------- static mode for reduced motion ---------- */
  if (reduce) {
    bail();
    $$('#results .progress-bar').forEach(function (b) { b.style.width = b.getAttribute('data-progress'); });
    var sd = $('#signature-path');
    if (sd) {
      var d = document.createElementNS(NS, 'path');
      d.setAttribute('d', sd.getAttribute('d')); d.setAttribute('fill', 'none');
      d.setAttribute('stroke', '#28ABC9'); d.setAttribute('stroke-opacity', '.35'); d.setAttribute('stroke-width', '3');
      sd.after(d);
    }
    window.__animReady = true;
    return;
  }

  /* ---------- smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    var t = $(id); if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: -72, duration: 1.6 });
    else t.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- hero entrance ---------- */
  function initHero() {
    var title = $('#hero-title');
    var words = splitWords(title);
    var ul = $('svg path', title);
    if (ul) { ul.setAttribute('pathLength', '1'); gsap.set(ul, { strokeDasharray: 1, strokeDashoffset: 1 }); }
    gsap.set(title, { opacity: 1 });
    gsap.set(words, { yPercent: 120 });

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: .1 });
    tl.fromTo('#site-header', { yPercent: -100 }, { yPercent: 0, duration: .8, clearProps: 'transform' }, 0)
      .fromTo('[data-hero="eyebrow"]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .7, clearProps: 'transform' }, .15)
      .to(words, { yPercent: 0, duration: 1.05, stagger: .065, ease: 'power4.out' }, .25)
      .fromTo('[data-hero="visual"]', { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out', clearProps: 'transform' }, .35)
      .fromTo('[data-hero="sub"]', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .8, clearProps: 'transform' }, 1.0)
      .fromTo('[data-hero="cta"]', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .8, clearProps: 'transform' }, 1.15)
      .fromTo('#hero-stats', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, clearProps: 'transform' }, 1.0)
      .from('#hero-stats > div', { opacity: 0, y: 24, duration: .7, stagger: .1, clearProps: 'opacity,transform' }, 1.2);
    if (ul) tl.to(ul, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut' }, 1.1);

    // counters: start when the band is on screen
    var counters = $$('#hero-stats .counter');
    counters.forEach(function (c) { countTo(c, 0, { suffix: c.getAttribute('data-suffix') || '' }).kill(); });
    ScrollTrigger.create({ trigger: '#hero-stats', start: 'top 95%', once: true, onEnter: function () {
      counters.forEach(function (c, i) {
        countTo(c, parseInt(c.getAttribute('data-target'), 10), { suffix: c.getAttribute('data-suffix') || '', duration: 1.8, delay: 0.7 + i * .12 });
      });
    } });
  }

  /* ---------- generic scroll reveals ---------- */
  function initReveals() {
    ScrollTrigger.batch('[data-rv]', {
      start: 'top 89%', once: true, interval: .1, batchMax: 6,
      onEnter: function (batch) {
        batch.forEach(function (el) { el.classList.add('rv-in'); });
        gsap.fromTo(batch, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: .95, ease: 'power3.out',
          stagger: .09, overwrite: true, clearProps: 'opacity,transform' });
      } });
    var passed = function () {
      $$('[data-rv]:not(.rv-in)').forEach(function (el) {
        if (el.getBoundingClientRect().bottom < 0) { el.classList.add('rv-in'); gsap.set(el, { clearProps: 'opacity,transform' }); }
      });
    };
    ScrollTrigger.addEventListener('refresh', passed);
  }

  /* ---------- marquee (fixes the missing keyframes) ---------- */
  function initMarquee() {
    var track = $('[class*="animate-[marquee"]');
    if (!track) return;
    track.className = track.className.replace(/animate-\[[^\]]+\]/, '');
    var set = $$(':scope > *', track).map(function (n) { return n.cloneNode(true); });
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var setW = track.scrollWidth + gap;
    var copies = 0;
    while (track.scrollWidth < setW * 2 + window.innerWidth && copies < 6) {
      set.forEach(function (n) { track.appendChild(n.cloneNode(true)); });
      copies++;
    }
    var tween = gsap.to(track, { x: -setW, duration: setW / 55, ease: 'none', repeat: -1 });
    var cur = 1, boost = 1, hover = false;
    track.parentElement.addEventListener('pointerenter', function () { hover = true; });
    track.parentElement.addEventListener('pointerleave', function () { hover = false; });
    ScrollTrigger.create({ onUpdate: function (self) {
      var b = 1 + Math.min(Math.abs(self.getVelocity()) / 320, 8);
      if (b > boost) boost = b;
    } });
    gsap.ticker.add(function () {
      boost = Math.max(1, boost - (boost - 1) * .07);
      var target = hover ? 0 : boost;
      cur += (target - cur) * .12;
      tween.timeScale(cur);
    });
  }

  /* ---------- services: active card + indicator ---------- */
  function initServices() {
    var cards = $$('#services .interactive-card');
    if (!cards.length) return;
    root.classList.add('svc-focus');
    var ticks = $$('#svc-indicator .svc-tick'), label = $('#svc-label');
    var names = cards.map(function (c) { var h = $('h3', c); return h ? h.textContent.trim() : ''; });
    function setActive(i) {
      if (label) label.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0') + '  ·  ' + names[i];
      ticks.forEach(function (t, k) { t.classList.toggle('on', k <= i); });
    }
    setActive(0);
    cards.forEach(function (c, i) {
      ScrollTrigger.create({ trigger: c, start: 'top 62%', end: 'bottom 38%',
        onToggle: function (s) { c.classList.toggle('is-active', s.isActive); if (s.isActive) setActive(i); } });
    });
  }

  /* ---------- featured work: pinned horizontal gallery ---------- */
  function initWork() {
    var sec = $('#work'), track = $('#work-carousel');
    if (!sec || !track) return;
    var prev = $('#gallery-prev'), next = $('#gallery-next');
    var cards = $$(':scope > .interactive-card', track);
    var countEl = $('#work-count'), fill = $('#work-progress-fill');
    var mm = gsap.matchMedia();
    var st = null, stepPx = 340;

    // native swipe carousel for touch / small screens
    prev && prev.addEventListener('click', function () { if (!st) track.scrollBy({ left: -340, behavior: 'smooth' }); });
    next && next.addEventListener('click', function () { if (!st) track.scrollBy({ left: 340, behavior: 'smooth' }); });

    mm.add('(min-width: 1024px)', function () {
      sec.classList.add('work-pinned');
      track.classList.remove('scroll-smooth');
      var dist = function () { return Math.max(0, track.scrollWidth - track.clientWidth); };
      var tween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 80px', end: function () { return '+=' + dist(); },
          pin: true, pinSpacing: true, scrub: .7, anticipatePin: 1, invalidateOnRefresh: true,
          onRefresh: function (self) {
            var c = cards[1], a = cards[0];
            if (c && a) stepPx = c.getBoundingClientRect().left - a.getBoundingClientRect().left || stepPx;
          },
          onUpdate: function (self) {
            if (fill) fill.style.transform = 'scaleX(' + self.progress + ')';
            if (countEl) {
              var shift = self.progress * dist();
              var first = Math.min(cards.length, Math.floor(shift / stepPx + .35) + 1);
              var last = Math.min(cards.length, Math.floor((shift + track.clientWidth) / stepPx + .05));
              var pad = function (n) { return String(n).padStart(2, '0'); };
              countEl.textContent = pad(first) + '–' + pad(Math.max(first, last)) + ' / ' + pad(cards.length);
            }
          } } });
      st = tween.scrollTrigger;

      // image parallax inside each card
      cards.forEach(function (card) {
        var img = $('.work-img', card); if (!img) return;
        gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });

      var go = function (dir) {
        var cur = Math.round(st.progress * dist() / stepPx);
        var idx = Math.max(0, Math.min(cards.length - 1, cur + dir));
        var p = Math.min(1, (idx * stepPx) / Math.max(1, dist()));
        var y = st.start + p * (st.end - st.start);
        if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
      };
      var onPrev = function () { go(-1); }, onNext = function () { go(1); };
      prev && prev.addEventListener('click', onPrev); next && next.addEventListener('click', onNext);

      return function () {
        sec.classList.remove('work-pinned'); st = null;
        prev && prev.removeEventListener('click', onPrev); next && next.removeEventListener('click', onNext);
      };
    });
  }

  /* ---------- "VIEW" cursor over work cards ---------- */
  function initCursor() {
    if (!finePointer) return;
    var cur = document.createElement('div'); cur.id = 'play-cursor'; cur.textContent = 'VIEW';
    document.body.appendChild(cur);
    var qx = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' });
    var qy = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { qx(e.clientX); qy(e.clientY); }, { passive: true });
    $$('#work-carousel > .interactive-card').forEach(function (c) {
      c.addEventListener('pointerenter', function () { gsap.to(cur, { scale: 1, duration: .35, ease: 'back.out(1.8)', overwrite: 'auto' }); });
      c.addEventListener('pointerleave', function () { gsap.to(cur, { scale: 0, duration: .25, ease: 'power2.in', overwrite: 'auto' }); });
    });
  }

  /* ---------- results: bars + follower counters ---------- */
  function initResults() {
    $$('#results .progress-bar').forEach(function (bar) {
      bar.classList.remove('transition-all', 'duration-1000');
      bar.style.width = '0%';
      var row = bar.parentElement.parentElement;
      var strong = $('strong.text-primary', row);
      var startVal = 0, target = 0;
      if (strong) {
        target = parseInt(strong.textContent.replace(/[^0-9]/g, ''), 10) || 0;
        var m = (strong.previousSibling && strong.previousSibling.textContent || '').match(/(\d[\d,]*)\s*→/);
        startVal = m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
        strong.textContent = fmt(startVal);
      }
      ScrollTrigger.create({ trigger: bar, start: 'top 92%', once: true, onEnter: function () {
        gsap.to(bar, { width: bar.getAttribute('data-progress'), duration: 1.8, ease: 'power3.out' });
        if (strong) countTo(strong, target, { from: startVal, comma: true, duration: 1.8 });
      } });
    });
  }

  /* ---------- process connector ---------- */
  function initProcess() {
    var line = $('#process-line'); if (!line) return;
    var dots = $$('#process .proc-dot');
    gsap.to(line, { scaleX: 1, ease: 'none', scrollTrigger: {
      trigger: '#process-grid', start: 'top 82%', end: 'top 30%', scrub: true,
      onUpdate: function (s) {
        dots.forEach(function (d, i) { d.classList.toggle('on', s.progress >= [0.02, 0.5, 0.98][i]); });
      } } });
  }

  /* ---------- final CTA ---------- */
  function initCTA() {
    var title = $('#cta-title'); if (!title) return;
    var words = splitWords(title);
    gsap.set(title, { opacity: 1 });
    gsap.set(words, { yPercent: 120 });
    var hl = $('.hl-sweep', title);
    ScrollTrigger.create({ trigger: title, start: 'top 80%', once: true, onEnter: function () {
      var tl = gsap.timeline();
      tl.to(words, { yPercent: 0, duration: 1, stagger: .06, ease: 'power4.out' });
      if (hl) tl.to(hl, { backgroundSize: '100% 6px', duration: .9, ease: 'power2.inOut' }, '-=.3');
    } });
  }

  /* ---------- micro-interactions ---------- */
  function initMicro() {
    if (!finePointer) return;
    // magnetic pills
    $$('a.rounded-full.bg-primary-container, #hero a.rounded-full').forEach(function (btn) {
      btn.classList.remove('transition-all'); btn.classList.add('transition-colors');
      var qx = gsap.quickTo(btn, 'x', { duration: .5, ease: 'power3' });
      var qy = gsap.quickTo(btn, 'y', { duration: .5, ease: 'power3' });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * .28); qy((e.clientY - (r.top + r.height / 2)) * .35);
      });
      btn.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
    // lift + tilt on cards (GSAP owns transform; CSS owns light + border)
    $$('.interactive-card').forEach(function (card) {
      var rx, ry, base = 0;
      card.addEventListener('pointerenter', function () {
        gsap.set(card, { transformPerspective: 900 });
        base = gsap.getProperty(card, 'y') || 0;
        rx = gsap.quickTo(card, 'rotationX', { duration: .5, ease: 'power3' });
        ry = gsap.quickTo(card, 'rotationY', { duration: .5, ease: 'power3' });
        gsap.to(card, { y: base - 6, duration: .4, ease: 'power3.out', overwrite: 'auto' });
      });
      card.addEventListener('pointermove', function (e) {
        if (!rx) return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        ry(px * 6); rx(-py * 5);
      });
      card.addEventListener('pointerleave', function () {
        if (rx) { rx(0); ry(0); }
        gsap.to(card, { y: base, duration: .5, ease: 'power3.out', overwrite: 'auto',
          onComplete: function () { gsap.set(card, { clearProps: 'transform' }); } });
      });
    });
    // underline wipe in footer
    $$('footer a, #contact a[href^="mailto"]').forEach(function (a) { a.classList.add('link-wipe'); });
  }

  /* ---------- signature arc: draws with scroll, boomerang flies along it ---------- */
  function initArc() {
    var svg = $('#trajectory-svg'), ghost = $('#signature-path');
    if (!svg || !ghost) return;
    var VBW = 1440, VBH = 5600;

    var defs = $('defs', svg);
    var grad = document.createElementNS(NS, 'linearGradient');
    grad.setAttribute('id', 'arcDrawGrad'); grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0'); grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    [['0', '#28ABC9', '.3'], ['.5', '#0E5F73', '.42'], ['1', '#28ABC9', '.55']].forEach(function (s) {
      var st = document.createElementNS(NS, 'stop'); st.setAttribute('offset', s[0]); st.setAttribute('stop-color', s[1]); st.setAttribute('stop-opacity', s[2]); grad.appendChild(st);
    });
    defs.appendChild(grad);

    var draw = document.createElementNS(NS, 'path');
    draw.setAttribute('d', ghost.getAttribute('d')); draw.setAttribute('pathLength', '1');
    draw.setAttribute('fill', 'none'); draw.setAttribute('stroke', 'url(#arcDrawGrad)');
    draw.setAttribute('stroke-width', '2.5'); draw.setAttribute('stroke-linecap', 'round');
    draw.style.strokeDasharray = '1'; draw.style.strokeDashoffset = '1';
    ghost.after(draw);

    var total = ghost.getTotalLength(), N = 900, S = [];
    for (var i = 0; i <= N; i++) { var p = ghost.getPointAtLength(total * i / N); S.push({ l: i / N, x: p.x, y: p.y }); }

    // flying boomerang (fixed layer)
    var layer = document.createElement('div'); layer.id = 'fly-layer'; layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<div id="fly-boom"><svg viewBox="-32 -22 64 44" width="64" height="44" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><filter id="flyShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0E5F73" flood-opacity=".35"/></filter></defs>' +
      '<path filter="url(#flyShadow)" d="M-26 11 Q-17 -15 0 -16 Q17 -15 26 11 Q20 17 15 10 Q9 -2 0 -3 Q-9 -2 -15 10 Q-20 17 -26 11 Z" fill="#28ABC9" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg></div>';
    document.body.appendChild(layer);
    var fly = $('#fly-boom');
    var setX = gsap.quickSetter(fly, 'x', 'px'), setY = gsap.quickSetter(fly, 'y', 'px'),
        setR = gsap.quickSetter(fly, 'rotation', 'deg'), setSX = gsap.quickSetter(fly, 'scaleX'), setSY = gsap.quickSetter(fly, 'scaleY'),
        setO = gsap.quickSetter(fly, 'opacity');

    // nodes
    var nodes = $$('circle', svg).map(function (c) {
      gsap.set(c, { opacity: .25 });
      return { el: c, cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy'), done: false };
    });
    function pulse(n) {
      gsap.to(n.el, { opacity: 1, duration: .4 });
      gsap.fromTo(n.el, { attr: { r: 6 } }, { attr: { r: 11 }, yoyo: true, repeat: 1, duration: .28 });
      var ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', n.cx); ring.setAttribute('cy', n.cy); ring.setAttribute('r', 6);
      ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#28ABC9'); ring.setAttribute('stroke-width', '2');
      svg.appendChild(ring);
      gsap.fromTo(ring, { attr: { r: 6 }, opacity: .8 }, { attr: { r: 40 }, opacity: 0, duration: 1.3, ease: 'power2.out', onComplete: function () { ring.remove(); } });
    }

    // geometry cache
    var sx = 1, sy = 1, top = 0, docH = 1;
    function measure() {
      var r = svg.getBoundingClientRect();
      sx = r.width / VBW; sy = r.height / VBH; top = r.top + window.scrollY;
      docH = document.documentElement.scrollHeight;
    }
    measure();
    ScrollTrigger.addEventListener('refresh', measure);
    window.addEventListener('resize', measure);

    // return-to-button progress (scrubbed)
    var ret = 0, btn = $('#contact a[href^="https://wa.me"]'), hit = false;
    if (btn) ScrollTrigger.create({ trigger: '#contact', start: 'top 72%', end: 'top 24%', scrub: true,
      onUpdate: function (s) { ret = s.progress; }, onLeaveBack: function () { ret = 0; } });
    var ease = gsap.parseEase('power2.inOut');

    var header = $('#site-header'), bar = $('#scroll-progress');
    var navLinks = $$('header nav a[data-path]');
    var secs = ['work', 'services', 'results', 'process', 'packages', 'contact'].map(function (id) { return $('#' + id); });
    var order = secs.filter(Boolean).sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    var lastY = -1, lastRet = -1, idx = 0, curNav = '';

    function update() {
      var y = window.scrollY, vh = window.innerHeight;
      if (y === lastY && ret === lastRet) return;
      lastY = y; lastRet = ret;

      if (header) header.classList.toggle('is-compact', y > 40);
      if (bar) bar.style.transform = 'scaleX(' + Math.min(1, y / Math.max(1, docH - vh)) + ')';

      // scrollspy
      var active = '';
      order.forEach(function (s) { if (s.getBoundingClientRect().top <= vh * .4) active = s.id; });
      if (active !== curNav) {
        curNav = active;
        navLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('data-path') === active); });
      }

      // anchor point on the path = 60% down the viewport
      var ty = (y + vh * .6 - top) / sy;
      idx = Math.max(0, Math.min(N, idx));
      while (idx < N && S[idx].y < ty) idx++;
      while (idx > 0 && S[idx - 1].y >= ty) idx--;
      var s = S[idx];
      draw.style.strokeDashoffset = (1 - s.l).toFixed(4);

      nodes.forEach(function (n) {
        var passed = ty >= n.cy;
        if (passed && !n.done) { n.done = true; pulse(n); }
        else if (!passed && n.done && ty < n.cy - 90) { n.done = false; gsap.to(n.el, { opacity: .25, duration: .3 }); }
      });

      // flying boomerang
      var fx = s.x * sx, fy = vh * .6;
      var vis = Math.max(0, Math.min(1, (y - 260) / 420));
      var e = ease(ret), sc = 1;
      if (btn && ret > 0) {
        var r = btn.getBoundingClientRect();
        fx += (r.left + r.width / 2 - fx) * e;
        fy += (r.top + r.height / 2 - fy) * e;
        sc = 1 - .45 * e;
        layer.classList.toggle('front', ret > .02);
        if (ret > .985) { vis = 0; if (!hit) { hit = true; btn.classList.add('cta-hit'); } }
        else if (hit) { hit = false; btn.classList.remove('cta-hit'); }
      } else { layer.classList.remove('front'); if (hit) { hit = false; btn && btn.classList.remove('cta-hit'); } }
      setX(fx); setY(fy); setR(y * .32 + e * 540); setSX(sc); setSY(sc); setO(vis);
    }
    gsap.ticker.add(update);
    update();
  }

  /* ---------- boot ---------- */
  try {
    initHero();
    initReveals();
    initMarquee();
    initServices();
    initWork();
    initCursor();
    initResults();
    initProcess();
    initCTA();
    initMicro();
    initArc();
    window.__animReady = true;
  } catch (err) {
    console.error('[anim] init failed, showing static page', err);
    bail();
    $$('.w-in').forEach(function (w) { w.style.transform = 'none'; });
  }

  var refresh = function () { ScrollTrigger.refresh(); };
  window.addEventListener('load', function () { setTimeout(refresh, 250); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(refresh, 100); });
})();

