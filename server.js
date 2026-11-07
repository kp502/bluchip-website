require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const { visible } = require('./forms/cond');

const FORMS = { appointment: require('./forms/appointment'), quote: require('./forms/quote') };
const PORT = process.env.PORT || 3000;
const list = v => (v || '').split(',').map(s => s.trim()).filter(Boolean);
const FALLBACK_TO = list(process.env.MAIL_TO);
const SEND_CONFIRMATION = (process.env.SEND_CONFIRMATION || 'true') === 'true';
const SAVE_DIR = path.join(__dirname, 'submissions');
fs.mkdirSync(SAVE_DIR, { recursive: true });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE || 'false') === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
});
const FROM = () => process.env.MAIL_FROM || process.env.SMTP_USER;

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
// Health check for the hosting platform (must answer without the password)
app.get('/healthz', (req, res) => res.type('text').send('ok'));

// Optional password gate for sharing a preview (set PREVIEW_USER / PREVIEW_PASSWORD in .env)
if (process.env.PREVIEW_PASSWORD) {
  const want = 'Basic ' + Buffer.from(`${process.env.PREVIEW_USER || 'review'}:${process.env.PREVIEW_PASSWORD}`).toString('base64');
  app.use((req, res, next) => {
    const a = req.headers.authorization || '';
    if (a.length === want.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(want))) return next();
    res.setHeader('WWW-Authenticate', 'Basic realm="Blu Chip website preview"');
    res.status(401).send('Password required');
  });
}
const PREVIEW_MODE = (process.env.PREVIEW_MODE || 'false') === 'true'; // true = save submissions locally, send no emails
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(pdf|png|jpe?g|dwg|dxf|docx?|xlsx?)$/i.test(file.originalname);
    cb(ok ? null : new Error('Unsupported file type: ' + file.originalname), ok);
  },
});
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, errors: ['Too many submissions from this connection. Please try again later or call 07775 507073.'] } });

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safe = v => { v = String(v ?? '').trim(); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }; // Excel formula-injection guard
const isInput = f => f.type !== 'note';
const shown = (f, body) => visible(f, id => (body[id] || '').toString());
const display = (f, v) => f.type === 'check' ? (v ? 'Yes' : 'No') : safe(v);
const labelOf = (s, f) => f.label.length < 30 ? `${s.title.replace(/^\d+\. /, '')} – ${f.label}` : f.label.replace(/^[a-z]\) /, '');

function validate(form, body) {
  const errors = [];
  for (const s of form.sections) for (const f of s.fields.filter(isInput)) {
    if (!shown(f, body)) continue;
    const v = body[f.id];
    const empty = f.type === 'check' ? !v : !String(v ?? '').trim();
    if (f.required && empty) errors.push(`${labelOf(s, f)} is required`);
    if (f.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) errors.push(`${labelOf(s, f)}: invalid email address`);
    if (f.type === 'select' && v && !f.options.includes(v)) errors.push(`${labelOf(s, f)}: invalid choice`);
    if (f.type === 'yesno' && v && !['Yes', 'No'].includes(v)) errors.push(`${labelOf(s, f)}: invalid choice`);
    if (String(v ?? '').length > 4000) errors.push(`${labelOf(s, f)} is too long`);
  }
  for (const r of form.requireOneOf) if (!r.ids.some(i => String(body[i] || '').trim())) errors.push(r.message);
  return [...new Set(errors)];
}

async function buildWorkbook(form, body, files, ref) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Blu Chip Compliance'; wb.created = new Date();
  const title = form.id === 'quote' ? 'Quote Request' : 'Building Control Appointment';
  const ws = wb.addWorksheet(form.id === 'quote' ? 'Quote request' : 'Appointment', { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 62 }, { width: 70 }];
  const fill = argb => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
  const t = ws.addRow([`Blu Chip Compliance – ${title}`]); ws.mergeCells('A1:B1');
  t.font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' } }; t.fill = fill('FF354253'); t.height = 28; t.alignment = { vertical: 'middle' };
  ws.addRow([`Received: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`, `Ref: ${safe(ref)}`]).font = { italic: true, color: { argb: 'FF555555' } };
  ws.addRow([]);
  const flat = {};
  for (const s of form.sections) {
    const rows = s.fields.filter(isInput).filter(f => shown(f, body));
    if (!rows.length) continue;
    const h = ws.addRow([s.title]); ws.mergeCells(`A${h.number}:B${h.number}`);
    h.font = { bold: true, color: { argb: 'FFFFFFFF' } }; h.fill = fill('FF5B9BD5');
    for (const f of rows) {
      const val = display(f, body[f.id]); flat[f.id] = val;
      const r = ws.addRow([f.label, val]);
      r.getCell(1).font = { bold: true };
      r.eachCell(c => { c.alignment = { wrapText: true, vertical: 'top' }; c.border = { bottom: { style: 'hair', color: { argb: 'FFBBBBBB' } } }; });
      if ((f.id === 'hrbIsHigherRisk' || f.id === 'hrbCheck') && val === 'Yes') r.getCell(2).font = { bold: true, color: { argb: 'FFC00000' } };
    }
    ws.addRow([]);
  }
  if (files.length) {
    const h = ws.addRow(['Attached documents']); ws.mergeCells(`A${h.number}:B${h.number}`);
    h.font = { bold: true, color: { argb: 'FFFFFFFF' } }; h.fill = fill('FF5B9BD5');
    files.forEach(f => ws.addRow([safe(f.originalname), `${Math.round(f.size / 1024)} KB`]));
  }
  ws.pageSetup = { paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  const all = form.sections.flatMap(s => s.fields).filter(isInput);
  const data = wb.addWorksheet('Data row');
  data.addRow(['Received', 'Ref', ...all.map(f => f.label)]).font = { bold: true };
  data.addRow([new Date().toISOString(), safe(ref), ...all.map(f => flat[f.id] ?? '')]);
  data.columns.forEach(c => (c.width = 24));
  return wb.xlsx.writeBuffer();
}

const newRef = prefix => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

app.post('/api/submit/:form', limiter, (req, res, next) => {
  if (!FORMS[req.params.form]) return res.status(404).json({ ok: false, errors: ['Unknown form'] });
  upload.array('attachments', 5)(req, res, err => (err ? res.status(400).json({ ok: false, errors: [err.message] }) : next()));
}, async (req, res) => {
  try {
    const form = FORMS[req.params.form];
    const body = req.body || {};
    if (body.website) return res.json({ ok: true }); // honeypot – bots get a silent success
    for (const k of Object.keys(body)) if (typeof body[k] !== 'string') delete body[k];
    const errors = validate(form, body);
    if (errors.length) return res.status(400).json({ ok: false, errors });

    const to = PREVIEW_MODE ? ['preview@localhost'] : list(process.env[form.envTo]).length ? list(process.env[form.envTo]) : FALLBACK_TO;
    if (!to.length) throw new Error(`No recipients configured (${form.envTo} or MAIL_TO)`);

    const files = req.files || [];
    const ref = form.id === 'quote' ? newRef('QR') : String(body.quoteRef).trim();
    const site = form.site(body);
    const xlsx = await buildWorkbook(form, body, files, ref);
    const filename = `${form.fileStem(body, ref).replace(/[^\w.-]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    fs.writeFileSync(path.join(SAVE_DIR, `${Date.now()}_${filename}`), xlsx);

    const summary = form.summary(body, site).map(([k, v]) => [k, k === 'Ref' ? ref : v]);
    const alert = form.alert(body);
    if (PREVIEW_MODE) { console.log(`[PREVIEW] ${form.id} submission saved: ${filename}`); return res.json({ ok: true, ref }); }
    const html = `<h2>${form.id === 'quote' ? 'New quote request' : 'New building control appointment'}</h2>
      <p>${summary.map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`).join('<br>')}</p>
      ${alert ? `<p style="color:#c00"><b>⚠ ${esc(alert)}</b></p>` : ''}
      <p>Full details are in the attached Excel file.</p>`;
    await transporter.sendMail({
      from: FROM(), to, replyTo: form.replyTo(body) || undefined,
      subject: form.subject(body, ref, site), html,
      attachments: [
        { filename, content: Buffer.from(xlsx), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        ...files.map(f => ({ filename: f.originalname, content: f.buffer })),
      ],
    });

    const ct = form.confirmTo(body);
    if (SEND_CONFIRMATION && ct) {
      transporter.sendMail({
        from: FROM(), to: ct, subject: form.confirmSubject(body, ref),
        html: `<p>Dear ${esc(form.confirmName(body))},</p><p>${form.confirmText(esc(site), esc(ref))}</p>
          <p>Blu Chip Compliance Ltd<br>Registered Building Control Approver<br>07775 507073 · info@bc-compliance.co.uk</p>`,
      }).catch(e => console.error('Confirmation email failed:', e.message));
    }
    res.json({ ok: true, ref });
  } catch (e) {
    console.error('Submit failed:', e);
    res.status(500).json({ ok: false, errors: ['Sorry, something went wrong sending your form. Please call 07775 507073 or email info@bc-compliance.co.uk.'] });
  }
});

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public/404.html')));
if (require.main === module) app.listen(PORT, () => console.log(`Blu Chip site running on http://localhost:${PORT}`));
module.exports = { app, validate, FORMS };
