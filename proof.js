/* Boomerang Teams — client video testimonial rail (inside #reviews).
   Loaded after script.js and the Swiper bundle. Renders from assets/data/proof-videos.json.
   Visual language matches #work's existing cards: category badge + views badge overlaid
   on the same case-study image already used there — never a personal client photo used
   as a fake video-frame thumbnail. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Presentation data we already know (not in the video JSON): name, industry,
     subtitle copy, the #work case-study image, real aggregate view count (if any),
     case-study link. Keyed by a normalized slug. */
  var CLIENTS = {
    'bellagio':        { name: 'Bellagio Casino, Bellagio Colombo', industry: 'Integrated Resort & Casino',
                          subtitle: 'Brand film & social campaign', image: 'assets/work/work-1.jpg', views: null,
                          logo: 'assets/logos/light/bellagio.png', case: 'work/bellagio-casino-colombo.html' },
    'milton-etec':     { name: 'Milton E-Tec', industry: 'Clean Mobility',
                          subtitle: 'EV launch content strategy', image: 'assets/work/work-5.jpg', views: '5M+',
                          logo: 'assets/logos/light/milton-etec.png', case: 'work/milton-etec.html' },
    'milton-motors':   { name: 'Milton Motors', industry: 'Auto Dealership',
                          subtitle: 'Social growth & video production', image: 'assets/work/work-3.jpg', views: '5M+',
                          logo: 'assets/logos/light/milton-motors.png', case: 'work/milton-motors.html' },
    'romance-valley':  { name: 'Romance Valley Haputale', industry: 'Boutique Hospitality',
                          subtitle: 'Photography & content strategy', image: 'assets/work/work-2.jpg', views: null,
                          logo: 'assets/logos/light/romance-valley.png', case: 'work/romance-valley.html' },
    'honri':           { name: 'Honri Boma', industry: 'EV City Fleet',
                          subtitle: 'EV import launch campaign', image: 'assets/work/work-6.jpg', views: '1M+',
                          logo: 'assets/logos/light/honri.png', case: 'work/honri-sri-lanka.html' },
    'trek-pack':       { name: 'Trek Pack', industry: 'Adventure D2C',
                          subtitle: 'Viral UGC campaign', image: 'assets/work/work-8.jpg', views: '500K+',
                          logo: 'assets/logos/light/trekpack.png', case: 'work/trek-pack.html' },
    'wearhouse-co':    { name: 'Wearhouse Co', industry: 'Street Apparel',
                          subtitle: 'Zero-to-launch brand content', image: 'assets/work/work-7.jpg', views: '300K+',
                          logo: 'assets/logos/light/wearhouse-co.jpg', case: 'work/wearhouse-co.html' },
    'mawathe-abhiman': { name: 'Mawathe Abhiman', industry: 'Private Bus Community',
                          subtitle: 'Community storytelling & video', image: 'assets/work/work-4.jpg', views: null,
                          logo: 'assets/logos/light/mawathe-abhiman.jpg', case: 'work/mawathe-abhiman.html' }
  };
  var CLIENT_ORDER = ['bellagio', 'milton-motors', 'honri', 'wearhouse-co', 'milton-etec', 'trek-pack', 'romance-valley', 'mawathe-abhiman'];

  function slugify(s) {
    return String(s || '').toLowerCase()
      .replace(/milton e-?tec/i, 'milton-etec')
      .replace(/milton motors/i, 'milton-motors')
      .replace(/roman(ce)? valley.*/i, 'romance-valley')
      .replace(/honri.*/i, 'honri')
      .replace(/trek ?pack/i, 'trek-pack')
      .replace(/wearhouse.*/i, 'wearhouse-co')
      .replace(/mawathe.*/i, 'mawathe-abhiman')
      .replace(/bellagio.*/i, 'bellagio')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }

  var PLATFORM_LABEL = { tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook' };

  function initialsOf(name) {
    return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  function logoBadgeHtml(client) {
    if (client.logo) return '<img class="testi-logo-badge" src="' + esc(client.logo) + '" alt="" loading="lazy" decoding="async"/>';
    return '<span class="testi-logo-badge testi-logo-badge-mono" aria-hidden="true">' + esc(initialsOf(client.name)) + '</span>';
  }

  function openLinkHtml(video) {
    var platform = PLATFORM_LABEL[video.platform] || video.platform || 'source';
    return '<a class="proof-open-link" href="' + esc(video.canonicalUrl) + '" target="_blank" rel="noopener noreferrer">Open on ' + esc(platform) + '</a>';
  }

  function playButtonHtml(client, video) {
    var label = 'Play video: ' + client.name + (video.title ? ' – ' + video.title : '');
    return '<button type="button" class="testi-play-btn" aria-label="' + esc(label) + '">' +
      '<span class="play-glyph"><span class="material-symbols-outlined text-2xl" aria-hidden="true" style="font-variation-settings:\'FILL\' 1;">play_arrow</span></span>' +
      '</button>';
  }

  /* Testimonial rail slide — same badge/overlay language as #work cards. */
  function slideB(video) {
    var slug = slugify(video.slug || video.client);
    var client = CLIENTS[slug] || { name: video.client, industry: video.industry, image: 'assets/work/work-1.jpg' };
    var viewsBadge = client.views ? (
      '<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-container text-on-primary rounded-full font-label-text text-[11px] font-bold shadow-xs">' +
        '<span class="material-symbols-outlined text-[14px]">trending_up</span> ' + esc(client.views) + ' views' +
      '</span>'
    ) : '';
    return (
      '<div class="swiper-slide testi-card">' +
        '<div class="testi-video-wrap group" data-video="' + esc(JSON.stringify(video)) + '">' +
          '<img class="testi-poster" src="' + esc(client.image) + '" alt="" loading="lazy" decoding="async"/>' +
          '<div class="testi-gradient" aria-hidden="true"></div>' +
          '<div class="testi-badges">' +
            '<span class="px-2.5 py-1 bg-surface-container-lowest/90 backdrop-blur-md rounded-full font-label-caps-sm text-label-caps-sm text-on-surface uppercase font-bold">' + esc(client.industry || '') + '</span>' +
            viewsBadge +
          '</div>' +
          logoBadgeHtml(client) +
          playButtonHtml(client, video) +
          openLinkHtml(video) +
        '</div>' +
        '<div class="testi-info">' +
          '<a class="testi-name link-wipe" href="' + esc(client.case || '#') + '">' + esc(client.name) + '</a>' +
          '<div class="testi-role">' + esc(client.subtitle || client.industry || 'Boomerang Teams client') + '</div>' +
          '<a class="testi-case-link" href="' + esc(client.case || '#') + '">View case study' +
            '<span class="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>' +
          '</a>' +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- poster-facade player ---------- */
  function stopAllPlayers(exceptEl) {
    $$('.testi-player-active').forEach(function (el) {
      if (el === exceptEl) return;
      var media = $('iframe, video', el);
      if (media) { if (media.tagName === 'VIDEO') media.pause(); media.remove(); }
      el.classList.remove('testi-player-active');
      var poster = $('.testi-poster, .testi-gradient, .testi-badges, .testi-logo-badge', el);
      $$('.testi-poster, .testi-gradient, .testi-badges, .testi-logo-badge', el).forEach(function (n) { n.style.display = ''; });
      var btn = $('.testi-play-btn', el); if (btn) btn.style.display = '';
    });
  }

  function buildMediaEl(video, wrapper) {
    if (video.mp4) {
      var v = document.createElement('video');
      v.src = video.mp4; v.controls = true; v.autoplay = true; v.muted = false; v.playsInline = true;
      v.className = 'absolute inset-0 w-full h-full';
      return v;
    }
    var w = wrapper.clientWidth || 266, h = wrapper.clientHeight || Math.round(w * 2);
    var src = video.embedUrl;
    if (video.platform === 'facebook' && src) {
      try {
        var u = new URL(src, location.href);
        u.searchParams.set('width', w); u.searchParams.set('height', h);
        src = u.toString();
      } catch (e) {}
    }
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = (video.client || 'Client') + ' – ' + (video.title || 'video');
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; clipboard-write');
    iframe.allowFullscreen = true;
    iframe.loading = 'eager';
    iframe.style.border = '0';
    iframe.className = 'absolute inset-0 w-full h-full';
    return iframe;
  }

  function playVideo(wrapper, video, swiperInstance) {
    stopAllPlayers(wrapper);
    if (swiperInstance && swiperInstance.autoplay) { swiperInstance.autoplay.stop(); swiperInstance.__manuallyStopped = true; }
    var media = buildMediaEl(video, wrapper);
    wrapper.appendChild(media);
    wrapper.classList.add('testi-player-active');
    $$('.testi-poster, .testi-gradient, .testi-badges, .testi-logo-badge', wrapper).forEach(function (n) { n.style.display = 'none'; });
    var btn = $('.testi-play-btn', wrapper); if (btn) btn.style.display = 'none';
  }

  function wireClicks(container, swiperInstance) {
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.testi-play-btn');
      if (!btn) return;
      var wrapper = btn.closest('.testi-video-wrap');
      if (!wrapper) return;
      var raw = wrapper.getAttribute('data-video');
      if (!raw) return;
      var video;
      try { video = JSON.parse(raw); } catch (err) { return; }
      playVideo(wrapper, video, swiperInstance);
    });
  }

  function wireAutoplayLifecycle(rootEl, swiperInstance, minWidthForAutoplay) {
    if (!swiperInstance || !swiperInstance.autoplay) return;
    function allowed() { return !reduceMotion && window.innerWidth >= minWidthForAutoplay && !swiperInstance.__manuallyStopped; }
    function sync() { if (allowed()) swiperInstance.autoplay.start(); else swiperInstance.autoplay.stop(); }
    sync();
    window.addEventListener('resize', sync, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { if (allowed()) swiperInstance.autoplay.start(); }
        else swiperInstance.autoplay.stop();
      }, { threshold: 0.15 }).observe(rootEl);
    }
  }

  function initSwiperB() {
    var el = $('.testimonial-swiper'); if (!el || typeof Swiper === 'undefined') return null;
    var swiper = new Swiper(el, {
      slidesPerView: 1.4, spaceBetween: 20, loop: true, speed: 300,
      autoplay: false,
      a11y: { enabled: true },
      breakpoints: {
        768: { slidesPerView: 2.2, autoplay: { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true } },
        1024: { slidesPerView: 5, autoplay: { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true } }
      }
    });
    wireClicks(el, swiper);
    wireAutoplayLifecycle(el, swiper, 768);
    return swiper;
  }

  function render(list) {
    // One tile per client — pick that client's first usable (resolved) video.
    var byClient = {};
    list.forEach(function (v) {
      var slug = slugify(v.slug || v.client);
      if (v.status === 'ok' && !byClient[slug]) byClient[slug] = v;
    });
    var chosen = CLIENT_ORDER.map(function (slug) { return byClient[slug]; }).filter(Boolean);

    var bWrap = $('#proof-b-slides');
    var band = $('.testimonial-band');
    if (bWrap && chosen.length) {
      bWrap.innerHTML = chosen.map(slideB).join('');
      initSwiperB();
    } else if (band) {
      band.style.display = 'none';
    }

    if (chosen.length && window.gsap && window.ScrollTrigger) {
      // Deferred as a macrotask (not rAF) so it never lands inside Lenis's own raf/scroll
      // tick — calling ScrollTrigger.refresh() synchronously with that tick caused a hang.
      setTimeout(function () { ScrollTrigger.refresh(); }, 300);
    }
  }

  fetch('assets/data/proof-videos.json')
    .then(function (r) { if (!r.ok) throw new Error('proof data ' + r.status); return r.json(); })
    .then(function (list) { render(Array.isArray(list) ? list : []); })
    .catch(function (err) {
      console.warn('[proof] video data unavailable, hiding testimonial rail:', err && err.message);
      var band = $('.testimonial-band'); if (band) band.style.display = 'none';
    });
})();
