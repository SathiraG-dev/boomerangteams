/* Boomerang Teams — Book a Call modal.
   Vanilla JS, no framework. Opens from any [data-bc-open] trigger, 2-step
   qualify -> confirm flow, posts to /api/book-call. Loaded after script.js. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var overlay = $('#book-call-modal');
  if (!overlay) return;

  var backdrop = $('.bc-dialog', overlay);
  var form = $('#bc-form', overlay);
  var gotcha = $('#bc-gotcha', overlay);
  var bars = $$('[data-bc-bar]', overlay);
  var steps = {
    1: $('[data-bc-step="1"]', overlay),
    2: $('[data-bc-step="2"]', overlay),
    success: $('[data-bc-step="success"]', overlay)
  };
  var nextBtn = $('[data-bc-next]', overlay);
  var backBtn = $('[data-bc-back]', overlay);
  var submitBtn = $('[data-bc-submit]', overlay);
  var submitLabel = $('[data-bc-submit-label]', submitBtn);
  var summaryEl = $('[data-bc-summary]', overlay);
  var formErrorEl = $('[data-bc-form-error]', overlay);

  var fields = {
    fullName: $('#bc-name', overlay),
    email: $('#bc-email', overlay),
    dialCode: $('#bc-dial', overlay),
    phoneNumber: $('#bc-phone', overlay),
    companyWebsite: $('#bc-company', overlay),
    message: $('#bc-message', overlay)
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var currentStep = 1;
  var isDirty = false;
  var isLoading = false;
  var lastTrigger = null;
  var openedViaPopstate = false;

  /* ---------- scroll lock (reuses the dormant .lenis-stopped CSS rule) ---------- */
  function lockScroll() {
    document.documentElement.classList.add('lenis-stopped');
    if (window.__lenis) window.__lenis.stop();
  }
  function unlockScroll() {
    document.documentElement.classList.remove('lenis-stopped');
    if (window.__lenis) window.__lenis.start();
  }

  /* ---------- dirty tracking (for the close-confirm guard) ---------- */
  $$('input, textarea', steps[1]).forEach(function (el) {
    el.addEventListener('input', function () { isDirty = true; });
  });

  /* ---------- step transitions ---------- */
  function setBars(step) {
    bars.forEach(function (b) {
      var n = parseInt(b.getAttribute('data-bc-bar'), 10);
      b.classList.toggle('is-on', (step === 2 || step === 'success') ? true : (step === 1 ? n === 1 : false));
    });
  }

  function showStep(target) {
    var from = steps[currentStep];
    var to = steps[target];
    if (!to || to === from) return;

    setBars(target);
    currentStep = target;

    if (!from) { to.hidden = false; return; }

    from.classList.add('bc-anim-out');
    window.setTimeout(function () {
      from.hidden = true;
      from.classList.remove('bc-anim-out');
    }, 320);

    to.hidden = false;
    to.classList.add('bc-anim-in');
    // force reflow so the enter transition actually plays
    void to.offsetWidth;
    requestAnimationFrame(function () { to.classList.remove('bc-anim-in'); });
  }

  /* ---------- validation ---------- */
  function clearFieldError(name) {
    var field = fields[name];
    if (!field) return;
    var wrap = field.closest('.bc-field');
    if (wrap) wrap.classList.remove('is-invalid');
    var err = $('[data-bc-error-for="' + name + '"]', overlay);
    if (err) err.textContent = '';
  }
  function setFieldError(name, message) {
    var field = fields[name];
    if (!field) return;
    var wrap = (name === 'phoneNumber' ? field.closest('.bc-field') : field.closest('.bc-field'));
    if (wrap) wrap.classList.add('is-invalid');
    var errKey = name === 'phoneNumber' ? 'phone' : name;
    var err = $('[data-bc-error-for="' + errKey + '"]', overlay);
    if (err) err.textContent = message;
  }

  function validateStep1() {
    ['fullName', 'email', 'phoneNumber', 'message'].forEach(clearFieldError);
    var ok = true;
    var fullName = fields.fullName.value.trim();
    var email = fields.email.value.trim();
    var phoneNumber = fields.phoneNumber.value.trim();
    var message = fields.message.value.trim();

    if (!fullName) { setFieldError('fullName', 'Full name is required.'); ok = false; }
    if (!email || !EMAIL_RE.test(email)) { setFieldError('email', 'Enter a valid email.'); ok = false; }
    if (!phoneNumber || phoneNumber.replace(/[^0-9]/g, '').length < 6) { setFieldError('phoneNumber', 'Enter a valid phone number.'); ok = false; }
    if (!message) { setFieldError('message', 'Let us know what you need help with.'); ok = false; }

    if (!ok) {
      var firstInvalid = $('.bc-field.is-invalid .bc-input, .bc-field.is-invalid .bc-phone-input', overlay);
      if (firstInvalid) firstInvalid.focus();
    }
    return ok;
  }

  function selectedBudgetLabel() {
    var checked = $('input[name="budgetTier"]:checked', overlay);
    return checked ? checked.closest('.bc-radio-card').textContent.trim() : 'Not specified';
  }

  function buildSummary() {
    var rows = [
      ['Name', fields.fullName.value.trim()],
      ['Email', fields.email.value.trim()],
      ['Phone', fields.dialCode.value.trim() + ' ' + fields.phoneNumber.value.trim()],
      ['Budget', selectedBudgetLabel()]
    ];
    summaryEl.innerHTML = '<dl class="bc-summary-rows">' + rows.map(function (r) {
      return '<div class="bc-summary-row"><dt>' + r[0] + '</dt><dd>' + escapeHtml(r[1]) + '</dd></div>';
    }).join('') + '</dl>';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- submit ---------- */
  function setLoading(on) {
    isLoading = on;
    submitBtn.disabled = on;
    submitLabel.textContent = on ? 'Sending…' : 'Reserve my spot';
  }

  function showFormError(message) {
    formErrorEl.textContent = message;
    formErrorEl.classList.add('is-visible');
  }
  function clearFormError() {
    formErrorEl.textContent = '';
    formErrorEl.classList.remove('is-visible');
  }

  function submitForm() {
    if (isLoading) return;
    clearFormError();
    setLoading(true);

    var payload = {
      fullName: fields.fullName.value.trim(),
      email: fields.email.value.trim(),
      phone: (fields.dialCode.value.trim() + ' ' + fields.phoneNumber.value.trim()).trim(),
      companyWebsite: fields.companyWebsite.value.trim(),
      message: fields.message.value.trim(),
      budgetTier: ($('input[name="budgetTier"]:checked', overlay) || {}).value || '',
      _gotcha: gotcha.value
    };

    fetch('/api/book-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().then(function (data) { return { status: res.status, data: data }; });
    }).then(function (r) {
      setLoading(false);
      if (r.data && r.data.ok) {
        isDirty = false;
        showStep('success');
        return;
      }
      if (r.status === 400 && r.data && r.data.errors) {
        showStep(1);
        Object.keys(r.data.errors).forEach(function (key) {
          var name = key === 'phone' ? 'phoneNumber' : key;
          setFieldError(name, r.data.errors[key]);
        });
        return;
      }
      showFormError((r.data && r.data.error) || 'Something went wrong. Please try again or WhatsApp us directly.');
    }).catch(function () {
      setLoading(false);
      showFormError('Network error — please check your connection and try again, or WhatsApp us directly.');
    });
  }

  /* ---------- open / close ---------- */
  function resetForm() {
    form.reset();
    ['fullName', 'email', 'phoneNumber', 'message'].forEach(clearFieldError);
    clearFormError();
    fields.dialCode.value = '+94';
    setLoading(false);
    isDirty = false;
    [steps[1], steps[2], steps.success].forEach(function (s) { if (s) { s.hidden = true; s.classList.remove('bc-anim-in', 'bc-anim-out'); } });
    currentStep = 1;
    steps[1].hidden = false;
    setBars(1);
  }

  function getFocusable() {
    return $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', backdrop)
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var focusable = getFocusable();
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { requestClose(); return; }
    trapFocus(e);
  }

  function open(trigger, opts) {
    opts = opts || {};
    lastTrigger = trigger || document.activeElement;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    lockScroll();
    document.addEventListener('keydown', onKeydown);

    if (!opts.fromPopState) {
      try { history.pushState({ bcOpen: true }, '', '?book=1'); } catch (e) {}
    }

    var focusable = getFocusable();
    if (focusable.length) focusable[0].focus();
  }

  function close(opts) {
    opts = opts || {};
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    unlockScroll();
    document.removeEventListener('keydown', onKeydown);
    resetForm();

    if (!opts.fromPopState && location.search.indexOf('book=1') !== -1) {
      try { history.replaceState({}, '', location.pathname + location.hash); } catch (e) {}
    }

    var toFocus = lastTrigger || $('[data-bc-open]');
    if (toFocus && typeof toFocus.focus === 'function') toFocus.focus();
  }

  function requestClose() {
    if (isDirty) {
      var ok = window.confirm('Discard your Book a Call request? Your answers won’t be saved.');
      if (!ok) return;
    }
    close();
  }

  /* ---------- wiring ---------- */
  $$('[data-bc-open]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      open(el);
    });
  });
  $$('[data-bc-close]', overlay).forEach(function (el) {
    el.addEventListener('click', requestClose);
  });
  nextBtn.addEventListener('click', function () {
    if (!validateStep1()) return;
    buildSummary();
    showStep(2);
  });
  backBtn.addEventListener('click', function () { showStep(1); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    submitForm();
  });

  window.addEventListener('popstate', function () {
    var hasParam = location.search.indexOf('book=1') !== -1;
    var isOpen = !overlay.classList.contains('hidden');
    if (isOpen && !hasParam) close({ fromPopState: true });
    else if (!isOpen && hasParam) { openedViaPopstate = true; open(null, { fromPopState: true }); }
  });

  if (location.search.indexOf('book=1') !== -1) {
    open(null, { fromPopState: true });
  }
})();
