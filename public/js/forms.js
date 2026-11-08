// Renders a form from window.FORM_DEF, handles show/hide logic, validation and submission.
(function () {
  var root = document.getElementById('form-root'); if (!root || !window.FORM_DEF) return;
  var def = window.FORM_DEF, C = window.Cond;
  var API = window.SITE_API || (location.protocol === 'file:' ? 'http://localhost:3000' : '');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var form = document.createElement('form'); form.className = 'bc'; form.noValidate = true;
  var html = '<div id="errors" class="errors hidden" role="alert" tabindex="-1"></div>';
  def.sections.forEach(function (s) {
    html += '<fieldset><legend>' + esc(s.title) + '</legend>';
    s.fields.forEach(function (f) {
      var req = f.required ? ' <span class="req" aria-hidden="true">*</span>' : '';
      var help = f.help ? '<div class="help">' + esc(f.help) + '</div>' : '';
      var d = 'data-f="' + f.id + '"';
      if (f.type === 'note') html += '<div class="note ' + (f.tone || '') + '" ' + d + '>' + esc(f.text) + '</div>';
      else if (f.type === 'check') html += '<div class="chk" ' + d + '><label><input type="checkbox" id="' + f.id + '" name="' + f.id + '" value="Yes"><span>' + esc(f.label) + req + '</span></label></div>';
      else if (f.type === 'yesno') html += '<div class="fld" ' + d + '><div class="lbl" id="l_' + f.id + '">' + esc(f.label) + req + '</div><div class="radios" role="radiogroup" aria-labelledby="l_' + f.id + '"><label><input type="radio" name="' + f.id + '" value="Yes"> Yes</label><label><input type="radio" name="' + f.id + '" value="No"> No</label></div></div>';
      else if (f.type === 'textarea') html += '<div class="fld" ' + d + '><label for="' + f.id + '">' + esc(f.label) + req + '</label><textarea id="' + f.id + '" name="' + f.id + '"></textarea>' + help + '</div>';
      else if (f.type === 'select') html += '<div class="fld" ' + d + '><label for="' + f.id + '">' + esc(f.label) + req + '</label><select id="' + f.id + '" name="' + f.id + '"><option value="">Please select…</option>' + f.options.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>' + help + '</div>';
      else html += '<div class="fld" ' + d + '><label for="' + f.id + '">' + esc(f.label) + req + '</label><input type="' + f.type + '" id="' + f.id + '" name="' + f.id + '"' + (f.type === 'number' ? ' min="0" step="any" inputmode="decimal"' : '') + '>' + help + '</div>';
    });
    html += '</fieldset>';
  });
  html += '<fieldset><legend>' + esc(def.uploads.label) + '</legend><div class="fld"><label for="attachments">Attach files</label><input type="file" id="attachments" name="attachments" multiple accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf,.doc,.docx,.xls,.xlsx"><div class="help">' + esc(def.uploads.help) + '</div></div></fieldset>';
  html += '<div class="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>';
  html += '<button type="submit" class="btn" id="submit">' + esc(def.submitLabel) + '</button>';
  form.innerHTML = html; root.appendChild(form);

  var all = []; def.sections.forEach(function (s) { s.fields.forEach(function (f) { all.push(f); }); });
  function get(id) {
    var e = form.elements[id]; if (!e) return '';
    if (e.length !== undefined && e.type === undefined) { for (var i = 0; i < e.length; i++) if (e[i].checked) return e[i].value; return ''; }
    if (e.type === 'checkbox') return e.checked ? 'Yes' : '';
    return (e.value || '').trim();
  }
  function sync() { all.forEach(function (f) { var n = $('[data-f="' + f.id + '"]', form); if (n) n.classList.toggle('hidden', !C.visible(f, get)); }); }
  form.addEventListener('input', sync); form.addEventListener('change', sync);
  all.forEach(function (f) { if (f.today && form.elements[f.id]) form.elements[f.id].value = new Date().toISOString().slice(0, 10); });
  var q = new URLSearchParams(location.search);
  [['ref', 'quoteRef'], ['fee', 'quoteFee']].forEach(function (p) { if (q.get(p[0]) && form.elements[p[1]]) form.elements[p[1]].value = q.get(p[0]); });
  sync();

  function label(s, f) { return f.label.length < 30 ? s.title.replace(/^\d+\. /, '') + ' – ' + f.label : f.label.replace(/^[a-z]\) /, ''); }
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  // Mark one field as invalid (red outline + short message under it). Never touches what the user typed.
  function mark(id, msg) {
    var n = $('[data-f="' + id + '"]', form); if (!n) return null;
    n.classList.add('invalid');
    if (!n.querySelector('.ferr')) { var m = document.createElement('div'); m.className = 'ferr'; m.setAttribute('role', 'alert'); n.appendChild(m); }
    n.querySelector('.ferr').textContent = msg;
    return n;
  }
  function unmark(n) { n.classList.remove('invalid'); var m = n.querySelector('.ferr'); if (m) m.remove(); }
  function clearMarks() { form.querySelectorAll('.invalid').forEach(unmark); }
  // As soon as someone fixes a highlighted field, its highlight goes away.
  function onFix(e) { var n = e.target.closest && e.target.closest('[data-f]'); if (n && n.classList.contains('invalid')) unmark(n); }
  form.addEventListener('input', onFix); form.addEventListener('change', onFix);

  function validate() {
    clearMarks();
    var errs = [], ids = [];
    def.sections.forEach(function (s) { s.fields.forEach(function (f) {
      if (f.type === 'note' || !C.visible(f, get)) return;
      var v = get(f.id);
      if (f.required && !v) { errs.push(label(s, f) + ' is required'); ids.push(f.id); mark(f.id, f.type === 'yesno' || f.type === 'check' || f.type === 'select' ? 'Please choose an option' : 'This field is required'); }
      else if (f.type === 'email' && v && !EMAIL.test(v)) { errs.push(label(s, f) + ': invalid email address'); ids.push(f.id); mark(f.id, 'Please enter a valid email address'); }
    }); });
    (def.requireOneOf || []).forEach(function (r) {
      if (!r.ids.some(function (i) { return get(i); })) { errs.push(r.message); r.ids.forEach(function (i) { ids.push(i); mark(i, 'Please provide at least one of these emails'); }); }
    });
    return { errs: errs, ids: ids };
  }
  function showErrors(list, ids) {
    var b = $('#errors', form);
    var n = (ids || []).length;
    b.innerHTML = '<strong>' + (n ? 'Some required information is missing.' : 'Please check the following:') + '</strong> ' +
      (n ? 'Your other answers have been kept – just complete the ' + (n === 1 ? 'field' : n + ' fields') + ' highlighted in red.' : '') +
      '<ul>' + list.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>';
    b.classList.remove('hidden');
    var first = n ? $('.invalid', form) : null;
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var i = first.querySelector('input,textarea,select'); if (i) { try { i.focus({ preventScroll: true }); } catch (x) { i.focus(); } }
    } else { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); $('#errors', form).classList.add('hidden');
    var v = validate(); if (v.errs.length) return showErrors(v.errs, v.ids);
    var btn = $('#submit', form), txt = btn.textContent; btn.disabled = true; btn.textContent = 'SENDING…';
    fetch(API + '/api/submit/' + def.id, { method: 'POST', body: new FormData(form) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, errors: ['Unexpected response from the server.'] }; }); })
      .then(function (d) {
        if (d.ok) {
          var done = document.getElementById('form-done'); if (d.ref) { var r = done.querySelector('.ref'); if (r) r.textContent = d.ref; }
          form.classList.add('hidden'); var intro = document.getElementById('form-intro'); intro && intro.classList.add('hidden');
          done.classList.remove('hidden'); done.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          clearMarks();
          (d.fields || []).forEach(function (id) { mark(id, 'Please check this field'); });
          showErrors(d.errors || ['Something went wrong.'], d.fields);
        }
      })
      .catch(function () { showErrors(['We could not reach the server. Please try again, or call 07775 507073 / email info@bc-compliance.co.uk.']); })
      .then(function () { btn.disabled = false; btn.textContent = txt; });
  });
})();
