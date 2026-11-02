/* Boomerang Teams — "Our Work" scroller (#work) + Testimonials placeholder rail (#reviews).
   Both render as plain DOM into native CSS horizontal scroll-snap containers — no carousel
   library required. Testimonial cards are intentionally placeholders (poster + "coming soon")
   until real client-praise videos are wired in; set each card's data-cf-video once that
   happens and swap the poster for a <video>/<iframe> at that time. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };

  var R2 = 'https://pub-001112c1e52442e785fd4e1fee21776b.r2.dev';

  /* Real client data only — no invented stats. `views` stays null when there is no
     confirmed aggregate view count on record; those cards show a case-study link instead
     of a fabricated number. `video`, where present, is an actual short-form content piece
     produced for that client (not a testimonial) — it plays as the work-card preview. */
  var CLIENTS = {
    'bellagio':        { name: 'Bellagio Casino Colombo', industry: 'Integrated Resort & Casino',
                          image: 'assets/work/work-1.jpg', views: null,
                          video: R2 + '/Bellagio%20Colombo/bellagio-colombo-01.mp4',
                          case: 'work/bellagio-casino-colombo.html' },
    'milton-motors':   { name: 'Milton Motors', industry: 'Auto Dealership',
                          image: 'assets/work/work-3.jpg', views: '5M+',
                          video: R2 + '/Milton%20Motors/milton-motors-01.mp4',
                          case: 'work/milton-motors.html' },
    'honri':           { name: 'Honri Boma', industry: 'EV City Fleet',
                          image: 'assets/work/work-6.jpg', views: '1M+',
                          case: 'work/honri-sri-lanka.html' },
    'wearhouse-co':    { name: 'Wearhouse Co', industry: 'Street Apparel',
                          image: 'assets/work/work-7.jpg', views: '300K+',
                          case: 'work/wearhouse-co.html' },
    'milton-etec':     { name: 'Milton E-Tec', industry: 'Clean Mobility',
                          image: 'assets/work/work-5.jpg', views: '5M+',
                          video: R2 + '/Milton%20etec/milton-etec-01.mp4',
                          case: 'work/milton-etec.html' },
    'trek-pack':       { name: 'Trek Pack', industry: 'Adventure D2C',
                          image: 'assets/work/work-8.jpg', views: '500K+',
                          video: R2 + '/Trekpack/trekpack-01.mp4',
                          case: 'work/trek-pack.html' },
    'romance-valley':  { name: 'Romance Valley Haputale', industry: 'Boutique Hospitality',
                          image: 'assets/work/work-2.jpg', views: null,
                          case: 'work/romance-valley.html' },
    'mawathe-abhiman': { name: 'Mawathe Abhiman', industry: 'Private Bus Community',
                          image: 'assets/work/work-4.jpg', views: null,
                          case: 'work/mawathe-abhiman.html' },
    'autoshop-expert': { name: 'Autoshop Expert', industry: 'Auto Detailing',
                          image: 'assets/work/work-3.jpg', views: null,
                          video: R2 + '/Autoshop%20Expert/autoshop-expert-01.mp4',
                          case: 'work/autoshop-expert.html' }
  };
  var CLIENT_ORDER = ['bellagio', 'milton-motors', 'honri', 'wearhouse-co', 'milton-etec',
    'trek-pack', 'romance-valley', 'mawathe-abhiman', 'autoshop-expert'];

  /* Work scroller leads with the clients that have real video — video cards are the
     strongest proof, so they go first. Falls back to CLIENT_ORDER after those. */
  var WORK_ORDER = CLIENT_ORDER.slice().sort(function (a, b) {
    return (CLIENTS[b].video ? 1 : 0) - (CLIENTS[a].video ? 1 : 0);
  });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }

  /* ---------- Our Work scroller ---------- */
  function workCard(slug) {
    var c = CLIENTS[slug];
    var statOrLink = c.views
      ? '<div class="work-stat"><strong>' + esc(c.views) + '</strong><span>Views</span></div>'
      : '<span class="work-stat-link">View case study<span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span></span>';
    var media = c.video
      ? '<video class="work-video" src="' + esc(c.video) + '" muted loop playsinline preload="metadata"></video>'
      : '<img src="' + esc(c.image) + '" alt="' + esc(c.name) + ' case study" loading="lazy" decoding="async"/>';
    return (
      '<a class="work-card' + (c.video ? ' has-video' : '') + '" href="' + esc(c.case) + '">' +
        '<span class="work-category">' + esc(c.industry) + '</span>' +
        '<div class="work-frame">' + media + '</div>' +
        '<div class="work-name">' + esc(c.name) + '</div>' +
        statOrLink +
      '</a>'
    );
  }

  function wireWorkVideos() {
    var vids = document.querySelectorAll('#work-scroller .work-card.has-video video');
    vids.forEach(function (v) {
      v.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!v.controls) {
          v.controls = true;
          v.muted = false;
          v.play().catch(function () {});
          v.closest('.work-card').classList.add('is-playing');
        }
      });
    });
  }

  function workViewAllCard() {
    return (
      '<a class="work-card work-card-cta" href="case-studies.html">' +
        '<span class="relative font-headline-sm text-headline-sm uppercase text-white leading-tight">9 Verified Case Studies.<br/>Real Numbers, Not Promises.</span>' +
        '<span class="relative inline-flex items-center gap-space-xs font-label-text text-label-text font-bold text-white w-fit">' +
          '<span>View All Case Studies</span>' +
          '<span class="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>' +
        '</span>' +
      '</a>'
    );
  }

  function renderWork() {
    var el = $('#work-scroller');
    if (!el) return;
    el.innerHTML = WORK_ORDER.map(workCard).join('') + workViewAllCard();
    wireWorkVideos();
  }

  /* ---------- Testimonials placeholder rail ---------- */
  function testimonialCard(slug) {
    var c = CLIENTS[slug];
    return (
      '<div class="testi-card" data-cf-video="">' +
        '<div class="testi-frame">' +
          '<span class="testi-category">' + esc(c.industry) + '</span>' +
          '<span class="testi-brandmark">Boomerang Teams</span>' +
        '</div>' +
        '<div class="testi-info">' +
          '<span class="testi-name">' + esc(c.name) + '</span>' +
          '<span class="testi-role">' + esc(c.industry) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function renderTestimonials() {
    var el = $('#testimonial-scroller');
    if (!el) return;
    el.innerHTML = CLIENT_ORDER.map(testimonialCard).join('');
  }

  renderWork();
  renderTestimonials();

  if (window.gsap && window.ScrollTrigger) {
    setTimeout(function () { ScrollTrigger.refresh(); }, 300);
  }
})();
