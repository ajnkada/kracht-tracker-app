import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/\/\/ ===== LOGIC START =====([\s\S]*?)\/\/ ===== LOGIC END =====/);
if (!match) throw new Error('LOGIC-blok niet gevonden in index.html');

const sandbox = { module: { exports: {} } };
const exportRegel = '\nmodule.exports = { geschatte1RM, besteSet1RM, progressieVoorOefening, vorigeSet, formatKg, recordsVoorOefening, isNieuwePR, isNieuwGewichtPR, besteTijd, progressieTijdVoorOefening, recordsTijdVoorOefening, isNieuweTijdPR, formatTijd };';
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

test('geschatte1RM: bekend Epley-geval 60 kg x 5 reps = 70', () => {
  assert.ok(bijna(L.geschatte1RM(60, 5), 70));
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

test('progressie: isGewichtPR markeert een nieuw zwaarste-gewicht-record', () => {
  const s = [
    { id: 'a', datum: '2026-07-01', oefeningen: [ { exerciseId: 'e1', sets: [ { kg: 40, reps: 5 } ] } ] },
    { id: 'b', datum: '2026-07-02', oefeningen: [ { exerciseId: 'e1', sets: [ { kg: 40, reps: 8 } ] } ] },
    { id: 'c', datum: '2026-07-03', oefeningen: [ { exerciseId: 'e1', sets: [ { kg: 45, reps: 5 } ] } ] },
  ];
  const p = L.progressieVoorOefening(s, 'e1');
  assert.equal(p[0].isGewichtPR, true);
  assert.equal(p[1].isGewichtPR, false);
  assert.equal(p[2].isGewichtPR, true);
});

test('progressie: gewicht = zwaarste kg van de sessie', () => {
  const s = [ { id: 'a', datum: '2026-07-01', oefeningen: [ { exerciseId: 'e1', sets: [ { kg: 30, reps: 10 }, { kg: 35, reps: 5 } ] } ] } ];
  const punten = L.progressieVoorOefening(s, 'e1');
  assert.equal(punten[0].gewicht, 35);
});

test('progressie: onbekende oefening geeft lege lijst', () => {
  // .length i.p.v. deepEqual([]): de functie draait in een aparte vm-realm,
  // waardoor een leeg array niet reference-equal is aan [] uit dit proces.
  assert.equal(L.progressieVoorOefening(sessiesVb, 'bestaat-niet').length, 0);
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

test('records: beste 1RM en zwaarste gewicht met datum', () => {
  const r = L.recordsVoorOefening(sessiesVb, 'e1');
  assert.ok(bijna(r.beste1rm, 42));       // 30x12 sessie 2026-07-03
  assert.equal(r.beste1rmDatum, '2026-07-03');
  assert.equal(r.besteGewicht, 30);
  assert.equal(r.besteGewichtDatum, '2026-07-01');
});

test('records: onbekende oefening geeft null', () => {
  assert.equal(L.recordsVoorOefening(sessiesVb, 'bestaat-niet'), null);
});

test('isNieuwePR: hoger dan alle bestaande sets is een PR', () => {
  assert.equal(L.isNieuwePR(sessiesVb, 'e1', 43), true);
});

test('isNieuwePR: niet hoger dan bestaande is geen PR', () => {
  assert.equal(L.isNieuwePR(sessiesVb, 'e1', 41), false);
});

test('isNieuwePR: eerste set ooit (geen eerdere) is geen PR', () => {
  assert.equal(L.isNieuwePR(sessiesVb, 'nieuw-id', 50), false);
});

test('isNieuwGewichtPR: zwaarder dan bestaand is een PR', () => {
  assert.equal(L.isNieuwGewichtPR(sessiesVb, 'e1', 35), true);
});

test('isNieuwGewichtPR: niet zwaarder is geen PR', () => {
  assert.equal(L.isNieuwGewichtPR(sessiesVb, 'e1', 30), false);
});

test('isNieuwGewichtPR: eerste gewicht-set ooit is geen PR', () => {
  assert.equal(L.isNieuwGewichtPR(sessiesVb, 'nieuw-id', 100), false);
});

const tijdSessies = [
  { id: 't1', datum: '2026-07-01', oefeningen: [ { exerciseId: 'p1', sets: [ { seconden: 30 }, { seconden: 40 } ] } ] },
  { id: 't2', datum: '2026-07-03', oefeningen: [ { exerciseId: 'p1', sets: [ { seconden: 50 } ] } ] },
];

test('besteTijd: langste hold van de sessie', () => {
  assert.equal(L.besteTijd([ { seconden: 30 }, { seconden: 45 } ]), 45);
});

test('besteTijd: lege set-lijst geeft 0', () => {
  assert.equal(L.besteTijd([]), 0);
});

test('progressieTijd: punten met seconden, op datum, met PR', () => {
  const p = L.progressieTijdVoorOefening(tijdSessies, 'p1');
  assert.equal(p.length, 2);
  assert.equal(p[0].seconden, 40);
  assert.equal(p[1].seconden, 50);
  assert.equal(p[0].isPR, true);
  assert.equal(p[1].isPR, true);
});

test('recordsTijd: beste tijd met datum', () => {
  const r = L.recordsTijdVoorOefening(tijdSessies, 'p1');
  assert.equal(r.besteTijd, 50);
  assert.equal(r.besteTijdDatum, '2026-07-03');
});

test('recordsTijd: onbekende oefening geeft null', () => {
  assert.equal(L.recordsTijdVoorOefening(tijdSessies, 'x'), null);
});

test('isNieuweTijdPR: langer dan bestaand is een PR', () => {
  assert.equal(L.isNieuweTijdPR(tijdSessies, 'p1', 60), true);
});

test('isNieuweTijdPR: niet langer is geen PR', () => {
  assert.equal(L.isNieuweTijdPR(tijdSessies, 'p1', 45), false);
});

test('isNieuweTijdPR: eerste tijd-set ooit is geen PR', () => {
  assert.equal(L.isNieuweTijdPR(tijdSessies, 'nieuw', 99), false);
});

test('formatTijd: onder de minuut in seconden', () => {
  assert.equal(L.formatTijd(45), '45s');
});

test('formatTijd: vanaf een minuut als m:ss', () => {
  assert.equal(L.formatTijd(90), '1:30');
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
