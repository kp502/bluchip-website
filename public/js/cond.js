// Tiny condition evaluator shared (by copy) between server validation and the browser form renderer.
// get(id) returns a string ('' if empty; 'Yes' for ticked checkboxes).
function test(c, get) {
  if (c.any) return c.any.some(x => test(x, get));
  if (c.all) return c.all.every(x => test(x, get));
  const v = get(c.id);
  if ('is' in c) return v === c.is;
  if ('checked' in c) return !!v === c.checked;
  if ('gte' in c) return parseFloat(v) >= c.gte;
  return false;
}
function visible(f, get) {
  if (f.showIf && !test(f.showIf, get)) return false;
  if (f.hideIf && test(f.hideIf, get)) return false;
  return true;
}
if (typeof module !== 'undefined') module.exports = { test, visible };
if (typeof window !== 'undefined') window.Cond = { test, visible };
