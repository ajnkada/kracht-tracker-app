import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/\/\/ ===== LOGIC START =====([\s\S]*?)\/\/ ===== LOGIC END =====/);
if (!match) throw new Error('LOGIC-blok niet gevonden in index.html');

const sandbox = { module: { exports: {} } };
const exportRegel = '\nmodule.exports = { geschatte1RM, besteSet1RM, progressieVoorOefening, vorigeSet, formatKg };';
// In latere taken zijn deze functies gedefinieerd; nu vangen we de ReferenceError op.
let L = {};
try {
  vm.runInNewContext(match[1] + exportRegel, sandbox);
  L = sandbox.module.exports;
} catch (e) {
  L = {};
}
export { L };

const bijna = (a, b) => Math.abs(a - b) < 1e-6;

test('geschatte1RM: 30 kg x 10 reps = 40', () => {
  assert.ok(bijna(L.geschatte1RM(30, 10), 40));
});

test('geschatte1RM: 30 kg x 12 reps = 42', () => {
  assert.ok(bijna(L.geschatte1RM(30, 12), 42));
});

test('geschatte1RM: 1 herhaling geeft precies het gewicht', () => {
  assert.ok(bijna(L.geschatte1RM(100, 1), 100));
});

test('besteSet1RM: kiest de set met de hoogste geschatte 1RM', () => {
  const sets = [ { kg: 30, reps: 10 }, { kg: 35, reps: 5 } ];
  assert.ok(bijna(L.besteSet1RM(sets), 35 * (1 + 5 / 30)));
});

test('besteSet1RM: lege set-lijst geeft 0', () => {
  assert.equal(L.besteSet1RM([]), 0);
});
