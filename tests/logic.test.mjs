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

const sessiesVb = [
  { id: 's1', datum: '2026-07-01', oefeningen: [ { exerciseId: 'e1', sets: [ { kg: 30, reps: 10 } ] } ] },
  { id: 's2', datum: '2026-07-03', oefeningen: [ { exerciseId: 'e1', sets: [ { kg: 30, reps: 12 } ] } ] },
  { id: 's3', datum: '2026-07-05', oefeningen: [ { exerciseId: 'e2', sets: [ { kg: 50, reps: 5 } ] } ] },
];

test('progressie: één punt per sessie met deze oefening, op datum gesorteerd', () => {
  const punten = L.progressieVoorOefening(sessiesVb, 'e1');
  assert.equal(punten.length, 2);
  assert.equal(punten[0].datum, '2026-07-01');
  assert.ok(bijna(punten[0].e1rm, 40));
  assert.ok(bijna(punten[1].e1rm, 42));
});

test('progressie: eerste punt en elk nieuw record zijn een PR', () => {
  const punten = L.progressieVoorOefening(sessiesVb, 'e1');
  assert.equal(punten[0].isPR, true);
  assert.equal(punten[1].isPR, true);
});

test('progressie: lager dan vorige max is geen PR', () => {
  const s = [
    { id: 'a', datum: '2026-07-01', oefeningen: [ { exerciseId: 'e1', sets: [ { kg: 30, reps: 12 } ] } ] },
    { id: 'b', datum: '2026-07-02', oefeningen: [ { exerciseId: 'e1', sets: [ { kg: 30, reps: 8 } ] } ] },
  ];
  const punten = L.progressieVoorOefening(s, 'e1');
  assert.equal(punten[1].isPR, false);
});

test('progressie: onbekende oefening geeft lege lijst', () => {
  assert.deepEqual(L.progressieVoorOefening(sessiesVb, 'bestaat-niet'), []);
});

test('vorigeSet: laatste set uit meest recente eerdere sessie', () => {
  const s = L.vorigeSet(sessiesVb, 'e1', '2026-07-05');
  assert.deepEqual(s, { kg: 30, reps: 12 });
});

test('vorigeSet: kijkt alleen naar sessies vóór de huidige datum', () => {
  const s = L.vorigeSet(sessiesVb, 'e1', '2026-07-02');
  assert.deepEqual(s, { kg: 30, reps: 10 });
});

test('vorigeSet: geen eerdere sessie geeft null', () => {
  const s = L.vorigeSet(sessiesVb, 'e1', '2026-07-01');
  assert.equal(s, null);
});

test('formatKg: hele getallen zonder decimaal', () => {
  assert.equal(L.formatKg(42), '42');
  assert.equal(L.formatKg(40), '40');
});

test('formatKg: één decimaal met Nederlandse komma', () => {
  assert.equal(L.formatKg(40.8333), '40,8');
});

test('formatKg: rondt floating-point ruis weg', () => {
  assert.equal(L.formatKg(39.99999999), '40');
});
