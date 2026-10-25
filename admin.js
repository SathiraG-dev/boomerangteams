/* Boomerang Teams admin — routes.
   Single shared password, no per-user accounts: intentionally simple per the
   original spec. Move to real per-user auth (e.g. NextAuth or similar) before
   this becomes a multi-person team tool. */
'use strict';

const express = require('express');
const crypto = require('crypto');
const views = require('./admin-views.js');

function safeEqual(a, b) {
  var ah = crypto.createHash('sha256').update(String(a)).digest();
  var bh = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ah, bh);
}

function ah(fn) {
  return function (req, res, next) { fn(req, res, next).catch(next); };
}

function parseMetrics(text) {
  return String(text || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (line) {
    var idx = line.indexOf(':');
    if (idx === -1) return { label: line, value: '' };
    return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
  });
}

async function reorder(pool, table, id, dir) {
  var rows = (await pool.query('SELECT id, sort_order FROM ' + table + ' ORDER BY sort_order ASC, id ASC')).rows;
  var idx = rows.findIndex(function (r) { return r.id === id; });
  if (idx === -1) return;
  var swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;
  var a = rows[idx], b = rows[swapIdx];
  await pool.query('UPDATE ' + table + ' SET sort_order = $1 WHERE id = $2', [b.sort_order, a.id]);
  await pool.query('UPDATE ' + table + ' SET sort_order = $1 WHERE id = $2', [a.sort_order, b.id]);
}

module.exports = function createAdminRouter(pool) {
  const router = express.Router();
  router.use(express.urlencoded({ extended: false }));

  router.use(function (req, res, next) {
    if (!pool) return res.status(503).send('Admin panel database is not configured yet.');
    next();
  });

  /* ---------- auth gate (skips /login) ---------- */
  router.use(function (req, res, next) {
    if (req.path === '/login') return next();
    if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
      return res.status(503).send('Admin panel is not configured yet (missing ADMIN_PASSWORD / ADMIN_SESSION_SECRET).');
    }
    if (req.signedCookies && req.signedCookies.admin_auth === '1') return next();
    return res.redirect('/admin/login');
  });

  router.get('/login', function (req, res) {
    if (req.signedCookies && req.signedCookies.admin_auth === '1') return res.redirect('/admin/leads');
    res.send(views.loginPage());
  });

  router.post('/login', function (req, res) {
    var password = (req.body && req.body.password) || '';
    if (!process.env.ADMIN_PASSWORD) {
      return res.status(503).send(views.loginPage({ error: 'Admin panel is not configured yet.' }));
    }
    if (!password || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
      return res.status(401).send(views.loginPage({ error: 'Incorrect password.' }));
    }
    res.cookie('admin_auth', '1', {
      httpOnly: true, signed: true, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 12 * 60 * 60 * 1000
    });
    res.redirect('/admin/leads');
  });

  router.post('/logout', function (req, res) {
    res.clearCookie('admin_auth');
    res.redirect('/admin/login');
  });

  router.get('/', function (req, res) { res.redirect('/admin/leads'); });

  /* ---------- leads ---------- */
  router.get('/leads', ah(async function (req, res) {
    var status = req.query.status || '';
    var q = (req.query.q || '').trim();
    var clauses = [], params = [];
    if (status) { params.push(status); clauses.push('status = $' + params.length); }
    if (q) { params.push('%' + q + '%'); clauses.push('(full_name ILIKE $' + params.length + ' OR email ILIKE $' + params.length + ')'); }
    var where = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
    var result = await pool.query('SELECT * FROM leads' + where + ' ORDER BY created_at DESC', params);
    res.send(views.leadsListPage({ leads: result.rows, status: status, q: q, flash: req.query.flash, flashType: req.query.ft }));
  }));

  router.get('/leads/:id', ah(async function (req, res) {
    var id = parseInt(req.params.id, 10);
    var result = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).send('Lead not found');
    res.send(views.leadDetailPage({ lead: result.rows[0], flash: req.query.flash, flashType: req.query.ft }));
  }));

  router.post('/leads/:id/status', ah(async function (req, res) {
    var id = parseInt(req.params.id, 10);
    var status = req.body.status;
    if (views.LEAD_STATUSES.indexOf(status) === -1) return res.redirect('/admin/leads/' + id);
    await pool.query('UPDATE leads SET status = $1 WHERE id = $2', [status, id]);
    res.redirect('/admin/leads/' + id + '?flash=Status updated&ft=ok');
  }));

  /* ---------- testimonials ---------- */
  router.get('/testimonials', ah(async function (req, res) {
    var result = await pool.query('SELECT * FROM testimonials ORDER BY sort_order ASC, id ASC');
    res.send(views.testimonialsListPage({ items: result.rows, flash: req.query.flash, flashType: req.query.ft }));
  }));

  router.get('/testimonials/new', function (req, res) { res.send(views.testimonialFormPage({})); });

  router.post('/testimonials', ah(async function (req, res) {
    var b = req.body;
    var maxOrder = (await pool.query('SELECT COALESCE(MAX(sort_order), -1) AS m FROM testimonials')).rows[0].m;
    await pool.query(
      'INSERT INTO testimonials (client_name, client_title, company_name, quote, avatar_url, video_url, published, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [b.clientName || '', b.clientTitle || null, b.companyName || null, b.quote || '', b.avatarUrl || null, b.videoUrl || null, !!b.published, maxOrder + 1]
    );
    res.redirect('/admin/testimonials?flash=Testimonial added&ft=ok');
  }));

  router.get('/testimonials/:id/edit', ah(async function (req, res) {
    var id = parseInt(req.params.id, 10);
    var result = await pool.query('SELECT * FROM testimonials WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).send('Not found');
    res.send(views.testimonialFormPage({ item: result.rows[0] }));
  }));

  router.post('/testimonials/:id', ah(async function (req, res) {
    var id = parseInt(req.params.id, 10);
    var b = req.body;
    await pool.query(
      'UPDATE testimonials SET client_name=$1, client_title=$2, company_name=$3, quote=$4, avatar_url=$5, video_url=$6, published=$7, updated_at=now() WHERE id=$8',
      [b.clientName || '', b.clientTitle || null, b.companyName || null, b.quote || '', b.avatarUrl || null, b.videoUrl || null, !!b.published, id]
    );
    res.redirect('/admin/testimonials?flash=Testimonial updated&ft=ok');
  }));

  router.post('/testimonials/:id/toggle', ah(async function (req, res) {
    await pool.query('UPDATE testimonials SET published = NOT published, updated_at = now() WHERE id = $1', [parseInt(req.params.id, 10)]);
    res.redirect('/admin/testimonials');
  }));

  router.post('/testimonials/:id/move', ah(async function (req, res) {
    await reorder(pool, 'testimonials', parseInt(req.params.id, 10), req.body.dir);
    res.redirect('/admin/testimonials');
  }));

  router.get('/testimonials/:id/delete', ah(async function (req, res) {
    var id = parseInt(req.params.id, 10);
    var result = await pool.query('SELECT * FROM testimonials WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).send('Not found');
    res.send(views.confirmDeletePage({ name: result.rows[0].client_name, backHref: '/admin/testimonials', deleteAction: '/admin/testimonials/' + id + '/delete', active: 'testimonials' }));
  }));

  router.post('/testimonials/:id/delete', ah(async function (req, res) {
    await pool.query('DELETE FROM testimonials WHERE id = $1', [parseInt(req.params.id, 10)]);
    res.redirect('/admin/testimonials?flash=Testimonial deleted&ft=ok');
  }));

  /* ---------- case studies ---------- */
  router.get('/case-studies', ah(async function (req, res) {
    var result = await pool.query('SELECT * FROM case_studies ORDER BY sort_order ASC, id ASC');
    res.send(views.caseStudiesListPage({ items: result.rows, flash: req.query.flash, flashType: req.query.ft }));
  }));

  router.get('/case-studies/new', function (req, res) { res.send(views.caseStudyFormPage({})); });

  router.post('/case-studies', ah(async function (req, res) {
    var b = req.body;
    var maxOrder = (await pool.query('SELECT COALESCE(MAX(sort_order), -1) AS m FROM case_studies')).rows[0].m;
    await pool.query(
      'INSERT INTO case_studies (title, client_name, industry, summary, cover_image_url, metrics, published, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [b.title || '', b.clientName || '', b.industry || null, b.summary || null, b.coverImageUrl || null, JSON.stringify(parseMetrics(b.metrics)), !!b.published, maxOrder + 1]
    );
    res.redirect('/admin/case-studies?flash=Case study added&ft=ok');
  }));

  router.get('/case-studies/:id/edit', ah(async function (req, res) {
    var id = parseInt(req.params.id, 10);
    var result = await pool.query('SELECT * FROM case_studies WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).send('Not found');
    res.send(views.caseStudyFormPage({ item: result.rows[0] }));
  }));

  router.post('/case-studies/:id', ah(async function (req, res) {
    var id = parseInt(req.params.id, 10);
    var b = req.body;
    await pool.query(
      'UPDATE case_studies SET title=$1, client_name=$2, industry=$3, summary=$4, cover_image_url=$5, metrics=$6, published=$7, updated_at=now() WHERE id=$8',
      [b.title || '', b.clientName || '', b.industry || null, b.summary || null, b.coverImageUrl || null, JSON.stringify(parseMetrics(b.metrics)), !!b.published, id]
    );
    res.redirect('/admin/case-studies?flash=Case study updated&ft=ok');
  }));

  router.post('/case-studies/:id/toggle', ah(async function (req, res) {
    await pool.query('UPDATE case_studies SET published = NOT published, updated_at = now() WHERE id = $1', [parseInt(req.params.id, 10)]);
    res.redirect('/admin/case-studies');
  }));

  router.post('/case-studies/:id/move', ah(async function (req, res) {
    await reorder(pool, 'case_studies', parseInt(req.params.id, 10), req.body.dir);
    res.redirect('/admin/case-studies');
  }));

  router.get('/case-studies/:id/delete', ah(async function (req, res) {
    var id = parseInt(req.params.id, 10);
    var result = await pool.query('SELECT * FROM case_studies WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).send('Not found');
    res.send(views.confirmDeletePage({ name: result.rows[0].title, backHref: '/admin/case-studies', deleteAction: '/admin/case-studies/' + id + '/delete', active: 'case-studies' }));
  }));

  router.post('/case-studies/:id/delete', ah(async function (req, res) {
    await pool.query('DELETE FROM case_studies WHERE id = $1', [parseInt(req.params.id, 10)]);
    res.redirect('/admin/case-studies?flash=Case study deleted&ft=ok');
  }));

  router.use(function (err, req, res, next) {
    console.error('[admin] error:', err);
    res.status(500).send('Something went wrong in the admin panel.');
  });

  return router;
};
