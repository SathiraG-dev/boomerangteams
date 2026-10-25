/* Boomerang Teams — static site + minimal leads API.
   Serves the same public files the site always has, plus POST /api/book-call
   for the Book a Call modal. No ORM: one append-only table, raw SQL. */
'use strict';

try { require('dotenv').config(); } catch (e) { /* dotenv is dev-only; fine if absent in production */ }

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // Railway terminates TLS at its edge; needed for correct secure-cookie detection
app.use(cookieParser(process.env.ADMIN_SESSION_SECRET));

/* ---------- static files (explicit allow-list — never blanket-serve the repo root) ---------- */
const ROOT_FILES = ['index.html', 'case-studies.html', 'script.js', 'styles.css', 'proof.js', 'book-call.js', 'admin.css', 'logo.png'];
ROOT_FILES.forEach(function (f) {
  app.get('/' + f, function (req, res) { res.sendFile(path.join(__dirname, f)); });
});
app.get('/', function (req, res) { res.sendFile(path.join(__dirname, 'index.html')); });
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/work', express.static(path.join(__dirname, 'work')));

/* ---------- database (optional at boot: server still serves the site if DATABASE_URL isn't set yet) ---------- */
var pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : false
  });
} else {
  console.warn('[leads] DATABASE_URL not set — /api/book-call will return 503 until it is configured.');
}

async function ensureSchema() {
  if (!pool) return;
  await pool.query(
    'CREATE TABLE IF NOT EXISTS leads (' +
    '  id SERIAL PRIMARY KEY,' +
    '  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),' +
    "  status TEXT NOT NULL DEFAULT 'new'," +
    "  source TEXT NOT NULL DEFAULT 'book-a-call'," +
    '  budget_tier TEXT,' +
    '  full_name TEXT NOT NULL,' +
    '  email TEXT NOT NULL,' +
    '  phone TEXT NOT NULL,' +
    '  company_website TEXT,' +
    '  message TEXT NOT NULL' +
    ')'
  );
  await pool.query(
    'CREATE TABLE IF NOT EXISTS testimonials (' +
    '  id SERIAL PRIMARY KEY,' +
    '  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),' +
    '  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),' +
    '  client_name TEXT NOT NULL,' +
    '  client_title TEXT,' +
    '  company_name TEXT,' +
    "  quote TEXT NOT NULL DEFAULT ''," +
    '  avatar_url TEXT,' +
    '  video_url TEXT,' +
    '  published BOOLEAN NOT NULL DEFAULT false,' +
    '  sort_order INTEGER NOT NULL DEFAULT 0' +
    ')'
  );
  await pool.query(
    'CREATE TABLE IF NOT EXISTS case_studies (' +
    '  id SERIAL PRIMARY KEY,' +
    '  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),' +
    '  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),' +
    '  title TEXT NOT NULL,' +
    "  client_name TEXT NOT NULL DEFAULT ''," +
    '  industry TEXT,' +
    '  summary TEXT,' +
    '  cover_image_url TEXT,' +
    "  metrics JSONB NOT NULL DEFAULT '[]'," +
    '  published BOOLEAN NOT NULL DEFAULT false,' +
    '  sort_order INTEGER NOT NULL DEFAULT 0' +
    ')'
  );
}

/* ---------- leads API ---------- */
app.use(express.json({ limit: '20kb' }));

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLead(body) {
  var errors = {};
  var fullName = String(body.fullName || '').trim();
  var email = String(body.email || '').trim();
  var phone = String(body.phone || '').trim();
  var message = String(body.message || '').trim();
  var budgetTier = String(body.budgetTier || '').trim();
  var companyWebsite = String(body.companyWebsite || '').trim();

  if (!fullName) errors.fullName = 'Full name is required.';
  if (!email || !EMAIL_RE.test(email)) errors.email = 'A valid email is required.';
  if (!phone || phone.replace(/[^0-9]/g, '').length < 6) errors.phone = 'A valid phone number is required.';
  if (!message) errors.message = 'Tell us a little about what you need help with.';

  return {
    errors: errors,
    valid: Object.keys(errors).length === 0,
    data: { fullName: fullName, email: email, phone: phone, message: message, budgetTier: budgetTier, companyWebsite: companyWebsite }
  };
}

app.post('/api/book-call', async function (req, res) {
  var body = req.body || {};

  // Honeypot: bots fill every field including hidden ones. Return success
  // without writing a row, so the sender gets no signal they were caught.
  if (body._gotcha) {
    return res.json({ ok: true });
  }

  var result = validateLead(body);
  if (!result.valid) {
    return res.status(400).json({ ok: false, errors: result.errors });
  }

  if (!pool) {
    return res.status(503).json({ ok: false, error: 'Leads database is not configured yet.' });
  }

  try {
    var d = result.data;
    await pool.query(
      'INSERT INTO leads (budget_tier, full_name, email, phone, company_website, message) VALUES ($1, $2, $3, $4, $5, $6)',
      [d.budgetTier || null, d.fullName, d.email, d.phone, d.companyWebsite || null, d.message]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[leads] insert failed:', err);
    res.status(500).json({ ok: false, error: 'Something went wrong saving your request. Please try again or WhatsApp us directly.' });
  }
});

/* ---------- admin panel ---------- */
app.use('/admin', require('./admin.js')(pool));

ensureSchema()
  .catch(function (err) { console.error('[leads] schema setup failed:', err); })
  .finally(function () {
    app.listen(PORT, function () { console.log('Boomerang Teams site listening on :' + PORT); });
  });
