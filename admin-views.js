/* Boomerang Teams admin — server-rendered HTML view functions.
   Plain template literals, no templating engine: matches this project's
   existing "no unnecessary dependency" convention. Every value interpolated
   from the database or form input MUST go through escapeHtml(). */
'use strict';

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function fmtDate(d) {
  if (!d) return '';
  var dt = new Date(d);
  return dt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ---------- shared layout ---------- */
function layout(opts) {
  var title = escapeHtml(opts.title || 'Admin');
  var active = opts.active || '';
  var body = opts.body || '';
  var flash = opts.flash ? '<div class="adm-flash adm-flash-' + escapeHtml(opts.flashType || 'ok') + '">' + escapeHtml(opts.flash) + '</div>' : '';

  function navLink(href, label, key) {
    return '<a class="adm-nav-link' + (active === key ? ' is-active' : '') + '" href="' + href + '">' + label + '</a>';
  }

  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>' +
    '<title>' + title + ' — Boomerang Teams Admin</title>' +
    '<link rel="icon" href="/logo.png"/>' +
    '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet"/>' +
    '<link rel="stylesheet" href="/admin.css"/>' +
    '</head><body class="adm-body">' +
    '<div class="adm-shell">' +
    '<aside class="adm-sidebar">' +
    '<div class="adm-brand"><img src="/logo.png" alt="Boomerang Teams" class="adm-brand-logo"/><span>Admin</span></div>' +
    '<nav class="adm-nav">' +
    navLink('/admin/leads', 'Leads', 'leads') +
    navLink('/admin/testimonials', 'Testimonials', 'testimonials') +
    navLink('/admin/case-studies', 'Case Studies', 'case-studies') +
    '</nav>' +
    '<form method="post" action="/admin/logout" class="adm-logout-form">' +
    '<button type="submit" class="adm-logout-btn">Logout</button>' +
    '</form>' +
    '</aside>' +
    '<main class="adm-main">' + flash + body + '</main>' +
    '</div>' +
    '</body></html>';
}

/* ---------- login ---------- */
function loginPage(opts) {
  opts = opts || {};
  var error = opts.error ? '<p class="adm-form-error">' + escapeHtml(opts.error) + '</p>' : '';
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>' +
    '<title>Admin Login — Boomerang Teams</title><link rel="icon" href="/logo.png"/>' +
    '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet"/>' +
    '<link rel="stylesheet" href="/admin.css"/></head>' +
    '<body class="adm-body adm-login-body">' +
    '<form method="post" action="/admin/login" class="adm-login-card">' +
    '<img src="/logo.png" alt="Boomerang Teams" class="adm-login-logo"/>' +
    '<h1>Admin Login</h1>' +
    error +
    '<label class="adm-label" for="password">Password</label>' +
    '<input class="adm-input" type="password" id="password" name="password" required autofocus/>' +
    '<button type="submit" class="adm-btn-primary adm-login-btn">Log in</button>' +
    '</form></body></html>';
}

/* ---------- leads ---------- */
var LEAD_STATUSES = ['new', 'contacted', 'qualified', 'closed', 'spam'];

function statusBadge(status) {
  return '<span class="adm-badge adm-badge-' + escapeHtml(status) + '">' + escapeHtml(status) + '</span>';
}

function leadsListPage(opts) {
  var leads = opts.leads, status = opts.status || '', q = opts.q || '';

  var filterForm =
    '<form method="get" action="/admin/leads" class="adm-filter-bar">' +
    '<select name="status" class="adm-select" onchange="this.form.submit()">' +
    '<option value=""' + (status === '' ? ' selected' : '') + '>All statuses</option>' +
    LEAD_STATUSES.map(function (s) { return '<option value="' + s + '"' + (status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
    '</select>' +
    '<input class="adm-input adm-search" type="text" name="q" value="' + escapeHtml(q) + '" placeholder="Search name or email…"/>' +
    '<button type="submit" class="adm-btn-secondary">Search</button>' +
    (status || q ? '<a class="adm-btn-ghost" href="/admin/leads">Clear</a>' : '') +
    '</form>';

  var rows = leads.map(function (l) {
    return '<tr>' +
      '<td><a class="adm-table-link" href="/admin/leads/' + l.id + '">' + escapeHtml(l.full_name) + '</a></td>' +
      '<td>' + escapeHtml(l.email) + '</td>' +
      '<td>' + escapeHtml(l.phone) + '</td>' +
      '<td>' + escapeHtml(l.budget_tier || '—') + '</td>' +
      '<td class="adm-truncate">' + escapeHtml((l.message || '').slice(0, 60)) + (l.message && l.message.length > 60 ? '…' : '') + '</td>' +
      '<td>' + statusBadge(l.status) + '</td>' +
      '<td>' + fmtDate(l.created_at) + '</td>' +
      '</tr>';
  }).join('');

  var table = leads.length
    ? '<div class="adm-table-wrap"><table class="adm-table"><thead><tr>' +
      '<th>Name</th><th>Email</th><th>Phone</th><th>Budget</th><th>Message</th><th>Status</th><th>Submitted</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>'
    : '<p class="adm-empty">No leads match this filter.</p>';

  return layout({
    title: 'Leads', active: 'leads', flash: opts.flash, flashType: opts.flashType,
    body: '<div class="adm-page-head"><h1>Leads</h1><span class="adm-count">' + leads.length + '</span></div>' + filterForm + table
  });
}

function leadDetailPage(opts) {
  var l = opts.lead;
  var statusOptions = LEAD_STATUSES.map(function (s) {
    return '<option value="' + s + '"' + (l.status === s ? ' selected' : '') + '>' + s + '</option>';
  }).join('');

  var body =
    '<a class="adm-back-link" href="/admin/leads">&larr; All leads</a>' +
    '<div class="adm-page-head"><h1>' + escapeHtml(l.full_name) + '</h1>' + statusBadge(l.status) + '</div>' +
    '<div class="adm-detail-grid">' +
    '<div class="adm-detail-card">' +
    '<dl class="adm-dl">' +
    '<dt>Email</dt><dd><a href="mailto:' + escapeHtml(l.email) + '">' + escapeHtml(l.email) + '</a></dd>' +
    '<dt>Phone</dt><dd>' + escapeHtml(l.phone) + '</dd>' +
    '<dt>Budget tier</dt><dd>' + escapeHtml(l.budget_tier || '—') + '</dd>' +
    '<dt>Company / website</dt><dd>' + escapeHtml(l.company_website || '—') + '</dd>' +
    '<dt>Source</dt><dd>' + escapeHtml(l.source) + '</dd>' +
    '<dt>Submitted</dt><dd>' + fmtDate(l.created_at) + '</dd>' +
    '</dl>' +
    '<h3 class="adm-subhead">Message</h3>' +
    '<p class="adm-message-block">' + escapeHtml(l.message).replace(/\n/g, '<br/>') + '</p>' +
    '</div>' +
    '<div class="adm-detail-card">' +
    '<h3 class="adm-subhead">Update status</h3>' +
    '<form method="post" action="/admin/leads/' + l.id + '/status" class="adm-stack-form">' +
    '<select name="status" class="adm-select">' + statusOptions + '</select>' +
    '<button type="submit" class="adm-btn-primary">Save status</button>' +
    '</form>' +
    '</div>' +
    '</div>';

  return layout({ title: l.full_name, active: 'leads', flash: opts.flash, flashType: opts.flashType, body: body });
}

/* ---------- shared list/form pieces for testimonials + case studies ---------- */
function reorderForm(basePath, id, dir, disabled) {
  if (disabled) return '<span class="adm-reorder-btn adm-reorder-disabled">' + (dir === 'up' ? '&uarr;' : '&darr;') + '</span>';
  return '<form method="post" action="' + basePath + '/' + id + '/move" class="adm-inline-form">' +
    '<input type="hidden" name="dir" value="' + dir + '"/>' +
    '<button type="submit" class="adm-reorder-btn" aria-label="Move ' + dir + '">' + (dir === 'up' ? '&uarr;' : '&darr;') + '</button>' +
    '</form>';
}
function toggleForm(basePath, id, published) {
  return '<form method="post" action="' + basePath + '/' + id + '/toggle" class="adm-inline-form">' +
    '<button type="submit" class="adm-toggle-btn' + (published ? ' is-on' : '') + '">' + (published ? 'Published' : 'Draft') + '</button>' +
    '</form>';
}

/* ---------- testimonials ---------- */
function testimonialsListPage(opts) {
  var items = opts.items;
  var rows = items.map(function (t, i) {
    return '<tr>' +
      '<td class="adm-reorder-cell">' + reorderForm('/admin/testimonials', t.id, 'up', i === 0) + reorderForm('/admin/testimonials', t.id, 'down', i === items.length - 1) + '</td>' +
      '<td>' + (t.avatar_url ? '<img class="adm-avatar-thumb" src="' + escapeHtml(t.avatar_url) + '" alt=""/>' : '<span class="adm-avatar-thumb adm-avatar-placeholder"></span>') + '</td>' +
      '<td><a class="adm-table-link" href="/admin/testimonials/' + t.id + '/edit">' + escapeHtml(t.client_name) + '</a><div class="adm-subtext">' + escapeHtml(t.company_name || '') + '</div></td>' +
      '<td class="adm-truncate">' + escapeHtml((t.quote || '').slice(0, 70)) + (t.quote && t.quote.length > 70 ? '…' : '') + '</td>' +
      '<td>' + toggleForm('/admin/testimonials', t.id, t.published) + '</td>' +
      '<td><a class="adm-btn-ghost-sm" href="/admin/testimonials/' + t.id + '/delete">Delete</a></td>' +
      '</tr>';
  }).join('');

  var table = items.length
    ? '<div class="adm-table-wrap"><table class="adm-table"><thead><tr><th></th><th></th><th>Client</th><th>Quote</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    : '<p class="adm-empty">No testimonials yet.</p>';

  return layout({
    title: 'Testimonials', active: 'testimonials', flash: opts.flash, flashType: opts.flashType,
    body: '<div class="adm-page-head"><h1>Testimonials</h1><a class="adm-btn-primary" href="/admin/testimonials/new">+ Add testimonial</a></div>' + table
  });
}

function testimonialFormPage(opts) {
  var t = opts.item || {};
  var isEdit = !!opts.item;
  var action = isEdit ? '/admin/testimonials/' + t.id : '/admin/testimonials';

  var body =
    '<a class="adm-back-link" href="/admin/testimonials">&larr; All testimonials</a>' +
    '<h1>' + (isEdit ? 'Edit testimonial' : 'Add testimonial') + '</h1>' +
    '<form method="post" action="' + action + '" class="adm-form">' +
    '<div class="adm-form-grid">' +
    '<label class="adm-field"><span class="adm-label">Client name</span><input class="adm-input" type="text" name="clientName" value="' + escapeHtml(t.client_name) + '" required/></label>' +
    '<label class="adm-field"><span class="adm-label">Title</span><input class="adm-input" type="text" name="clientTitle" value="' + escapeHtml(t.client_title) + '"/></label>' +
    '<label class="adm-field"><span class="adm-label">Company</span><input class="adm-input" type="text" name="companyName" value="' + escapeHtml(t.company_name) + '"/></label>' +
    '<label class="adm-field"><span class="adm-label">Avatar image URL</span><input class="adm-input" type="text" name="avatarUrl" value="' + escapeHtml(t.avatar_url) + '"/></label>' +
    '<label class="adm-field"><span class="adm-label">Video URL (optional)</span><input class="adm-input" type="text" name="videoUrl" value="' + escapeHtml(t.video_url) + '"/></label>' +
    '<label class="adm-field adm-field-wide"><span class="adm-label">Quote</span><textarea class="adm-input adm-textarea" name="quote" required>' + escapeHtml(t.quote) + '</textarea></label>' +
    '<label class="adm-checkbox-field"><input type="checkbox" name="published" value="1"' + (t.published ? ' checked' : '') + '/> <span>Published</span></label>' +
    '</div>' +
    '<button type="submit" class="adm-btn-primary">' + (isEdit ? 'Save changes' : 'Add testimonial') + '</button>' +
    '</form>';

  return layout({ title: isEdit ? 'Edit testimonial' : 'Add testimonial', active: 'testimonials', body: body });
}

/* ---------- case studies ---------- */
function metricsToText(metrics) {
  try {
    var arr = typeof metrics === 'string' ? JSON.parse(metrics) : (metrics || []);
    return arr.map(function (m) { return m.label + ': ' + m.value; }).join('\n');
  } catch (e) { return ''; }
}
function metricsPreview(metrics) {
  try {
    var arr = typeof metrics === 'string' ? JSON.parse(metrics) : (metrics || []);
    if (!arr.length) return '—';
    return arr.map(function (m) { return escapeHtml(m.label) + ': <strong>' + escapeHtml(m.value) + '</strong>'; }).join(' · ');
  } catch (e) { return '—'; }
}

function caseStudiesListPage(opts) {
  var items = opts.items;
  var rows = items.map(function (c, i) {
    return '<tr>' +
      '<td class="adm-reorder-cell">' + reorderForm('/admin/case-studies', c.id, 'up', i === 0) + reorderForm('/admin/case-studies', c.id, 'down', i === items.length - 1) + '</td>' +
      '<td>' + (c.cover_image_url ? '<img class="adm-avatar-thumb" src="' + escapeHtml(c.cover_image_url) + '" alt=""/>' : '<span class="adm-avatar-thumb adm-avatar-placeholder"></span>') + '</td>' +
      '<td><a class="adm-table-link" href="/admin/case-studies/' + c.id + '/edit">' + escapeHtml(c.title) + '</a><div class="adm-subtext">' + escapeHtml(c.client_name) + ' · ' + escapeHtml(c.industry || '') + '</div></td>' +
      '<td>' + metricsPreview(c.metrics) + '</td>' +
      '<td>' + toggleForm('/admin/case-studies', c.id, c.published) + '</td>' +
      '<td><a class="adm-btn-ghost-sm" href="/admin/case-studies/' + c.id + '/delete">Delete</a></td>' +
      '</tr>';
  }).join('');

  var table = items.length
    ? '<div class="adm-table-wrap"><table class="adm-table"><thead><tr><th></th><th></th><th>Case study</th><th>Metrics</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    : '<p class="adm-empty">No case studies yet.</p>';

  return layout({
    title: 'Case Studies', active: 'case-studies', flash: opts.flash, flashType: opts.flashType,
    body: '<div class="adm-page-head"><h1>Case Studies</h1><a class="adm-btn-primary" href="/admin/case-studies/new">+ Add case study</a></div>' + table
  });
}

function caseStudyFormPage(opts) {
  var c = opts.item || {};
  var isEdit = !!opts.item;
  var action = isEdit ? '/admin/case-studies/' + c.id : '/admin/case-studies';

  var body =
    '<a class="adm-back-link" href="/admin/case-studies">&larr; All case studies</a>' +
    '<h1>' + (isEdit ? 'Edit case study' : 'Add case study') + '</h1>' +
    '<form method="post" action="' + action + '" class="adm-form">' +
    '<div class="adm-form-grid">' +
    '<label class="adm-field"><span class="adm-label">Title</span><input class="adm-input" type="text" name="title" value="' + escapeHtml(c.title) + '" required/></label>' +
    '<label class="adm-field"><span class="adm-label">Client name</span><input class="adm-input" type="text" name="clientName" value="' + escapeHtml(c.client_name) + '" required/></label>' +
    '<label class="adm-field"><span class="adm-label">Industry</span><input class="adm-input" type="text" name="industry" value="' + escapeHtml(c.industry) + '"/></label>' +
    '<label class="adm-field"><span class="adm-label">Cover image URL</span><input class="adm-input" type="text" name="coverImageUrl" value="' + escapeHtml(c.cover_image_url) + '"/></label>' +
    '<label class="adm-field adm-field-wide"><span class="adm-label">Summary</span><textarea class="adm-input adm-textarea" name="summary">' + escapeHtml(c.summary) + '</textarea></label>' +
    '<label class="adm-field adm-field-wide"><span class="adm-label">Metrics — one per line, <code>Label: Value</code> (e.g. <code>Views: 14.4M</code>)</span><textarea class="adm-input adm-textarea" name="metrics">' + escapeHtml(metricsToText(c.metrics)) + '</textarea></label>' +
    '<label class="adm-checkbox-field"><input type="checkbox" name="published" value="1"' + (c.published ? ' checked' : '') + '/> <span>Published</span></label>' +
    '</div>' +
    '<button type="submit" class="adm-btn-primary">' + (isEdit ? 'Save changes' : 'Add case study') + '</button>' +
    '</form>';

  return layout({ title: isEdit ? 'Edit case study' : 'Add case study', active: 'case-studies', body: body });
}

/* ---------- delete confirm ---------- */
function confirmDeletePage(opts) {
  var body =
    '<a class="adm-back-link" href="' + opts.backHref + '">&larr; Back</a>' +
    '<div class="adm-confirm-card">' +
    '<h1>Delete “' + escapeHtml(opts.name) + '”?</h1>' +
    '<p>This can’t be undone.</p>' +
    '<form method="post" action="' + opts.deleteAction + '" class="adm-confirm-actions">' +
    '<a class="adm-btn-ghost" href="' + opts.backHref + '">Cancel</a>' +
    '<button type="submit" class="adm-btn-danger">Delete</button>' +
    '</form>' +
    '</div>';
  return layout({ title: 'Confirm delete', active: opts.active, body: body });
}

module.exports = {
  escapeHtml: escapeHtml,
  layout: layout,
  loginPage: loginPage,
  LEAD_STATUSES: LEAD_STATUSES,
  leadsListPage: leadsListPage,
  leadDetailPage: leadDetailPage,
  testimonialsListPage: testimonialsListPage,
  testimonialFormPage: testimonialFormPage,
  caseStudiesListPage: caseStudiesListPage,
  caseStudyFormPage: caseStudyFormPage,
  confirmDeletePage: confirmDeletePage
};
