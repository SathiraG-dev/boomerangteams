/* Boomerang Teams, lead notification email.
   Optional at boot: if SMTP_USER/SMTP_PASS aren't set, sendLeadEmail() is a no-op
   so the leads API keeps working without email configured. */
'use strict';

var nodemailer = require('nodemailer');

var transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
} else {
  console.warn('[mailer] SMTP_USER/SMTP_PASS not set, lead notification emails are disabled.');
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

async function sendLeadEmail(lead) {
  if (!transporter) return;
  var to = process.env.LEAD_NOTIFY_TO || process.env.SMTP_USER;
  var subject = 'New Book a Call lead: ' + lead.fullName;
  var html =
    '<h2>New lead from the Boomerang Teams site</h2>' +
    '<p><strong>Name:</strong> ' + escapeHtml(lead.fullName) + '</p>' +
    '<p><strong>Email:</strong> ' + escapeHtml(lead.email) + '</p>' +
    '<p><strong>Phone:</strong> ' + escapeHtml(lead.phone) + '</p>' +
    '<p><strong>Monthly revenue:</strong> ' + escapeHtml(lead.budgetTier || 'Not provided') + '</p>' +
    '<p><strong>Company / website:</strong> ' + escapeHtml(lead.companyWebsite || 'Not provided') + '</p>' +
    '<p><strong>Message:</strong><br>' + escapeHtml(lead.message).replace(/\n/g, '<br>') + '</p>';

  try {
    await transporter.sendMail({
      from: '"Boomerang Teams" <' + process.env.SMTP_USER + '>',
      to: to,
      subject: subject,
      html: html
    });
  } catch (err) {
    console.error('[mailer] failed to send lead notification:', err.message);
  }
}

module.exports = { sendLeadEmail: sendLeadEmail };
