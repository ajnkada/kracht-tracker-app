# Kracht-tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bouw een telefoon-first web-app (één zelfstandig `index.html`) waarin je per sportsessie oefeningen logt (sets × herhalingen × kg) en per oefening je geschatte kracht ziet groeien.

**Architecture:** Eén `index.html` met inline CSS en vanilla JavaScript, geen build-stap en geen externe libraries. De pure reken-functies staan in een gemarkeerd `// ===== LOGIC =====`-blok binnen dat bestand; een Node-test extraheert dat blok en test het geïsoleerd (test-first). Data wordt bewaard in `localStorage`. Grafieken zijn met de hand getekende SVG. Een PWA-manifest maakt "toevoegen aan startscherm" mogelijk.

**Tech Stack:** HTML + CSS + vanilla JavaScript (browser). Node.js ingebouwde testrunner (`node --test`, `node:test` + `node:assert` + `node:fs` + `node:vm`) — geen npm-dependencies.

---

## File Structure

| Bestand | Verantwoordelijkheid |
|---|---|
| `index.html` | De hele app: opmaak (inline CSS), UI-logica en de pure reken-kern (in een gemarkeerd LOGIC-blok). |
| `tests/logic.test.mjs` | Node-test die het LOGIC-blok uit `index.html` extraheert en de pure functies test. |
| `manifest.webmanifest` | PWA-manifest zodat de app op het telefoon-startscherm gezet kan worden. |
| `icon.svg` | App-icoon voor de PWA (inline SVG, geen binaire bestanden nodig). |
| `.gitignore` | Sluit rommel uit (bijv. `.superpowers/`, editor-bestanden). |
| `README.md` | Korte uitleg + hoe previewen + hoe naar GitHub Pages. |

### Vaste namen (gebruikt in alle taken — houd deze consistent)

**localStorage-sleutels:** `kt_exercises`, `kt_sessions`

**Pure logic-functies (in LOGIC-blok):**
`geschatte1RM(kg, reps)`, `besteSet1RM(sets)`, `progressieVoorOefening(sessies, exerciseId)`, `vorigeSet(sessies, exerciseId, huidigeDatum)`, `formatKg(x)`

**Store-functies:** `laadOefeningen()`, `bewaarOefeningen(arr)`, `laadSessies()`, `bewaarSessies(arr)`, `zaaiStartlijst()`, `nieuwId()`, `vandaagISO()`

**Sessie-helpers:** `huidigeSessie()`, `zorgVoorSessieVandaag()`

**Render/UI:** `toonTab(naam)`, `renderVandaag()`, `renderOefeningen()`, `renderVoortgang()`, `tekenGrafiek(punten)` en event-handlers `voegOefeningToe()`, `voegSetToe(exerciseId)`, `voegEigenOefeningToe()`, `verwijderOefening(id)`

**DOM-id's:** panels `#tab-vandaag`, `#tab-oefeningen`, `#tab-voortgang`; nav-knoppen met `data-tab`.

**Datamodel:**
```
exercise = { id: string, naam: string }
sessie   = { id: string, datum: "YYYY-MM-DD", oefeningen: [ { exerciseId, sets: [ { kg: number, reps: number } ] } ] }
```

---

## Task 1: Projectskelet — index.html shell, testharness, .gitignore

**Files:**
- Create: `index.html`
- Create: `tests/logic.test.mjs`
- Create: `.gitignore`

- [ ] **Step 1: Maak `.gitignore`**

Create `.gitignore`:

```
.superpowers/
.DS_Store
Thumbs.db
*.log
node_modules/
```

- [ ] **Step 2: Maak `index.html` met de shell, CSS en een leeg LOGIC-blok**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0f172a">
  <title>Kracht-tracker</title>
  <style>
    :root { --bg:#0f172a; --card:#1e293b; --line:#334155; --tekst:#e2e8f0; --grijs:#64748b; --accent:#38bdf8; --paars:#a78bfa; --goud:#fbbf24; --groen:#34d399; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--tekst); font-family: system-ui, -apple-system, sans-serif; padding-bottom: 72px; -webkit-tap-highlight-color: transparent; }
    .scherm { max-width: 480px; margin: 0 auto; padding: 16px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .sub { color: var(--grijs); font-size: 13px; }
    .kaart { background: var(--card); border-radius: 12px; padding: 14px; margin-bottom: 12px; }
    .rij { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    label.veld { display:flex; flex-direction:column; font-size:11px; color:var(--grijs); gap:4px; }
    input, select { background:#0b1220; border:1px solid var(--line); color:var(--tekst); border-radius:8px; padding:10px; font-size:16px; width:100%; }
    button { background: var(--accent); color:#06263a; border:none; border-radius:8px; padding:10px 14px; font-size:14px; font-weight:600; cursor:pointer; }
    button.ghost { background: transparent; color: var(--accent); border:1.5px dashed var(--line); width:100%; padding:12px; }
    button.mini { padding:8px 10px; font-size:13px; }
    button.gevaar { background: transparent; color:#f87171; border:none; }
    .grijs { color: var(--grijs); font-size:12px; }
    .stat { flex:1; background:var(--card); border-radius:10px; padding:10px; text-align:center; }
    .stat b { font-size:18px; }
    .stat span { font-size:10px; color:var(--grijs); }
    nav { position: fixed; bottom:0; left:0; right:0; background:#0b1220; border-top:1px solid var(--line); display:flex; }
    nav button { flex:1; background:transparent; color:var(--grijs); border:none; border-radius:0; padding:12px 4px; font-size:12px; }
    nav button.actief { color: var(--accent); }
    .verborgen { display:none; }
  </style>
</head>
<body>
  <main>
    <section id="tab-vandaag" class="scherm"></section>
    <section id="tab-oefeningen" class="scherm verborgen"></section>
    <section id="tab-voortgang" class="scherm verborgen"></section>
  </main>

  <nav>
    <button data-tab="vandaag" class="actief" onclick="toonTab('vandaag')">📋 Vandaag</button>
    <button data-tab="oefeningen" onclick="toonTab('oefeningen')">💪 Oefeningen</button>
    <button data-tab="voortgang" onclick="toonTab('voortgang')">📈 Voortgang</button>
  </nav>

  <script>
  // ===== LOGIC START =====
  // (pure reken-functies komen hier in latere taken)
  // ===== LOGIC END =====

  function toonTab(naam) {
    for (const s of document.querySelectorAll('main > section')) s.classList.add('verborgen');
    document.getElementById('tab-' + naam).classList.remove('verborgen');
    for (const b of document.querySelectorAll('nav button')) {
      b.classList.toggle('actief', b.dataset.tab === naam);
    }
    if (naam === 'vandaag') renderVandaag();
    if (naam === 'oefeningen') renderOefeningen();
    if (naam === 'voortgang') renderVoortgang();
  }

  // tijdelijke stubs zodat de app laadt zonder fouten; worden in latere taken vervangen
  function renderVandaag() { document.getElementById('tab-vandaag').innerHTML = '<h1>Vandaag</h1><p class="sub">nog te bouwen</p>'; }
  function renderOefeningen() { document.getElementById('tab-oefeningen').innerHTML = '<h1>Oefeningen</h1><p class="sub">nog te bouwen</p>'; }
  function renderVoortgang() { document.getElementById('tab-voortgang').innerHTML = '<h1>Voortgang</h1><p class="sub">nog te bouwen</p>'; }

  renderVandaag();
  </script>
</body>
</html>
```

- [ ] **Step 3: Maak de testharness `tests/logic.test.mjs`**

Deze extraheert het LOGIC-blok uit `index.html` en evalueert het geïsoleerd met `node:vm`. Bij deze eerste versie is het blok nog leeg, dus we testen alleen dat de extractie lukt.

Create `tests/logic.test.mjs`:

```js
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

test('LOGIC-blok is aanwezig en extraheerbaar', () => {
  assert.ok(match[1].length >= 0);
});
```

- [ ] **Step 4: Open `index.html` in de browser en controleer handmatig**

Dubbelklik `index.html` (of open `file:///C:/Users/Alex/Documents/kracht-tracker/index.html`).
Verwacht: donkere pagina, onderbalk met drie tabs, "Vandaag / nog te bouwen" zichtbaar, en tabs wisselen bij klikken. Geen fouten in de console (F12).

- [ ] **Step 5: Draai de test**

Run: `node --test`
Expected: 1 test passeert ("LOGIC-blok is aanwezig en extraheerbaar").

- [ ] **Step 6: Commit**

```bash
git add index.html tests/logic.test.mjs .gitignore
git commit -m "chore: projectskelet met tab-shell en testharness"
```

---

## Task 2: `geschatte1RM(kg, reps)` — Epley-formule (TDD)

**Files:**
- Modify: `index.html` (LOGIC-blok)
- Modify: `tests/logic.test.mjs`

- [ ] **Step 1: Schrijf de falende test**

Vervang in `tests/logic.test.mjs` het testblok onderaan (vanaf `test('LOGIC-blok ...')`) door onderstaande tests. Laat de import/extractie-code erboven ongewijzigd.

```js
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
```

- [ ] **Step 2: Draai de test en controleer dat hij faalt**

Run: `node --test`
Expected: FAIL — `L.geschatte1RM is not a function` (het LOGIC-blok is nog leeg).

- [ ] **Step 3: Schrijf de minimale implementatie**

Vervang in `index.html` de inhoud tussen de LOGIC-markers door:

```js
  // ===== LOGIC START =====
  // Geschatte 1RM volgens Epley: gewicht x (1 + reps/30)
  function geschatte1RM(kg, reps) {
    return kg * (1 + reps / 30);
  }
  // ===== LOGIC END =====
```

- [ ] **Step 4: Draai de test en controleer dat hij slaagt**

Run: `node --test`
Expected: PASS voor de drie `geschatte1RM`-tests.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/logic.test.mjs
git commit -m "feat: geschatte 1RM berekening (Epley)"
```

---

## Task 3: `besteSet1RM(sets)` — beste set van een sessie (TDD)

**Files:**
- Modify: `index.html` (LOGIC-blok)
- Modify: `tests/logic.test.mjs`

- [ ] **Step 1: Schrijf de falende test**

Voeg toe onderaan `tests/logic.test.mjs`:

```js
test('besteSet1RM: kiest de set met de hoogste geschatte 1RM', () => {
  const sets = [ { kg: 30, reps: 10 }, { kg: 35, reps: 5 } ];
  // 30x10 = 40 ; 35x5 = 35*(1+5/30) = 40.8333...
  assert.ok(bijna(L.besteSet1RM(sets), 35 * (1 + 5 / 30)));
});

test('besteSet1RM: lege set-lijst geeft 0', () => {
  assert.equal(L.besteSet1RM([]), 0);
});
```

- [ ] **Step 2: Draai de test en controleer dat hij faalt**

Run: `node --test`
Expected: FAIL — `L.besteSet1RM is not a function`.

- [ ] **Step 3: Schrijf de minimale implementatie**

Voeg in `index.html`, binnen het LOGIC-blok, ná `geschatte1RM` toe:

```js
  // Hoogste geschatte 1RM over alle sets van een oefening in één sessie
  function besteSet1RM(sets) {
    if (!sets || sets.length === 0) return 0;
    return Math.max(...sets.map(s => geschatte1RM(s.kg, s.reps)));
  }
```

- [ ] **Step 4: Draai de test en controleer dat hij slaagt**

Run: `node --test`
Expected: PASS voor beide `besteSet1RM`-tests.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/logic.test.mjs
git commit -m "feat: beste set (hoogste 1RM) per sessie"
```

---

## Task 4: `progressieVoorOefening(sessies, exerciseId)` — grafiekpunten + PR-detectie (TDD)

**Files:**
- Modify: `index.html` (LOGIC-blok)
- Modify: `tests/logic.test.mjs`

- [ ] **Step 1: Schrijf de falende test**

Voeg toe onderaan `tests/logic.test.mjs`:

```js
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
```

- [ ] **Step 2: Draai de test en controleer dat hij faalt**

Run: `node --test`
Expected: FAIL — `L.progressieVoorOefening is not a function`.

- [ ] **Step 3: Schrijf de minimale implementatie**

Voeg in `index.html`, binnen het LOGIC-blok, ná `besteSet1RM` toe:

```js
  // Grafiekpunten voor één oefening: [{ datum, e1rm, isPR }] op datum oplopend.
  // isPR = geschatte 1RM is strikt hoger dan alle eerdere sessies.
  function progressieVoorOefening(sessies, exerciseId) {
    const relevant = sessies
      .filter(s => s.oefeningen.some(o => o.exerciseId === exerciseId && o.sets.length > 0))
      .slice()
      .sort((a, b) => a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0);
    let max = -Infinity;
    const punten = [];
    for (const s of relevant) {
      const o = s.oefeningen.find(o => o.exerciseId === exerciseId);
      const e1rm = besteSet1RM(o.sets);
      const isPR = e1rm > max;
      if (isPR) max = e1rm;
      punten.push({ datum: s.datum, e1rm, isPR });
    }
    return punten;
  }
```

- [ ] **Step 4: Draai de test en controleer dat hij slaagt**

Run: `node --test`
Expected: PASS voor alle vier `progressie`-tests.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/logic.test.mjs
git commit -m "feat: progressiepunten en PR-detectie per oefening"
```

---

## Task 5: `vorigeSet(sessies, exerciseId, huidigeDatum)` — "vorige keer" (TDD)

**Files:**
- Modify: `index.html` (LOGIC-blok)
- Modify: `tests/logic.test.mjs`

- [ ] **Step 1: Schrijf de falende test**

Voeg toe onderaan `tests/logic.test.mjs`:

```js
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
```

- [ ] **Step 2: Draai de test en controleer dat hij faalt**

Run: `node --test`
Expected: FAIL — `L.vorigeSet is not a function`.

- [ ] **Step 3: Schrijf de minimale implementatie**

Voeg in `index.html`, binnen het LOGIC-blok, ná `progressieVoorOefening` toe:

```js
  // Laatste set van deze oefening uit de meest recente sessie vóór huidigeDatum, of null.
  function vorigeSet(sessies, exerciseId, huidigeDatum) {
    const eerder = sessies
      .filter(s => s.datum < huidigeDatum && s.oefeningen.some(o => o.exerciseId === exerciseId && o.sets.length > 0))
      .slice()
      .sort((a, b) => a.datum < b.datum ? 1 : a.datum > b.datum ? -1 : 0);
    if (eerder.length === 0) return null;
    const o = eerder[0].oefeningen.find(o => o.exerciseId === exerciseId);
    return o.sets[o.sets.length - 1];
  }
```

- [ ] **Step 4: Draai de test en controleer dat hij slaagt**

Run: `node --test`
Expected: PASS voor alle drie `vorigeSet`-tests.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/logic.test.mjs
git commit -m "feat: vorige-set opzoeken voor loggen"
```

---

## Task 6: `formatKg(x)` — nette weergave in kg (TDD)

**Files:**
- Modify: `index.html` (LOGIC-blok)
- Modify: `tests/logic.test.mjs`

- [ ] **Step 1: Schrijf de falende test**

Voeg toe onderaan `tests/logic.test.mjs`:

```js
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
```

- [ ] **Step 2: Draai de test en controleer dat hij faalt**

Run: `node --test`
Expected: FAIL — `L.formatKg is not a function`.

- [ ] **Step 3: Schrijf de minimale implementatie**

Voeg in `index.html`, binnen het LOGIC-blok, ná `vorigeSet` toe:

```js
  // Rond af op 1 decimaal, strip ",0" en gebruik Nederlandse komma.
  function formatKg(x) {
    const r = Math.round(x * 10) / 10;
    let s = r.toFixed(1);
    if (s.endsWith('.0')) s = s.slice(0, -2);
    return s.replace('.', ',');
  }
```

- [ ] **Step 4: Draai de test en controleer dat hij slaagt**

Run: `node --test`
Expected: PASS voor alle `formatKg`-tests. Draai `node --test` nogmaals: álle logic-tests (Task 2–6) groen.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/logic.test.mjs
git commit -m "feat: kg-formattering met Nederlandse komma"
```

---

## Task 7: Data-store en startlijst (localStorage)

**Files:**
- Modify: `index.html` (nieuw `<script>`-gedeelte ná het LOGIC-blok, vóór `toonTab`)

Deze functies raken de browser-`localStorage` en worden handmatig geverifieerd via de console.

- [ ] **Step 1: Voeg de store-functies toe**

Voeg in `index.html`, in het bestaande `<script>` direct ná `// ===== LOGIC END =====` en vóór `function toonTab`, toe:

```js
  // ---- Opslag (localStorage) ----
  const STARTLIJST = ['Bankdrukken','Squat','Deadlift','Schouderpers','Lat pulldown','Barbell row','Biceps curl','Triceps pushdown'];

  function nieuwId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function vandaagISO() {
    return new Date().toISOString().slice(0, 10);
  }
  function laadOefeningen() {
    return JSON.parse(localStorage.getItem('kt_exercises') || '[]');
  }
  function bewaarOefeningen(arr) {
    localStorage.setItem('kt_exercises', JSON.stringify(arr));
  }
  function laadSessies() {
    return JSON.parse(localStorage.getItem('kt_sessions') || '[]');
  }
  function bewaarSessies(arr) {
    localStorage.setItem('kt_sessions', JSON.stringify(arr));
  }
  function zaaiStartlijst() {
    if (laadOefeningen().length === 0) {
      bewaarOefeningen(STARTLIJST.map(naam => ({ id: nieuwId(), naam })));
    }
  }

  // ---- Sessie-helpers ----
  function huidigeSessie() {
    return laadSessies().find(s => s.datum === vandaagISO()) || null;
  }
  function zorgVoorSessieVandaag() {
    const sessies = laadSessies();
    let s = sessies.find(s => s.datum === vandaagISO());
    if (!s) {
      s = { id: nieuwId(), datum: vandaagISO(), oefeningen: [] };
      sessies.push(s);
      bewaarSessies(sessies);
    }
    return s;
  }
```

- [ ] **Step 2: Roep `zaaiStartlijst()` aan bij het opstarten**

In `index.html`, vervang de laatste regel `renderVandaag();` (onderaan het script) door:

```js
  zaaiStartlijst();
  renderVandaag();
```

- [ ] **Step 3: Verifieer handmatig in de browser-console**

Herlaad `index.html`. Open de console (F12) en voer uit:

```js
laadOefeningen()
```

Expected: een array van 8 objecten `{id, naam}` met de startlijst (Bankdrukken, Squat, …). Voer daarna `zorgVoorSessieVandaag()` uit; expected: een object met de datum van vandaag en lege `oefeningen`. `laadSessies()` bevat nu die sessie.

- [ ] **Step 4: Bevestig dat de logic-tests nog groen zijn**

Run: `node --test`
Expected: alle bestaande tests passeren nog (de store-code zit buiten het LOGIC-blok en beïnvloedt de test-extractie niet).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: localStorage-store en startlijst met oefeningen"
```

---

## Task 8: Tab "Oefeningen" — lijst beheren

**Files:**
- Modify: `index.html` (vervang de `renderOefeningen`-stub; voeg handlers toe)

- [ ] **Step 1: Vervang de `renderOefeningen`-stub door de echte render**

In `index.html`, vervang de regel
`function renderOefeningen() { document.getElementById('tab-oefeningen').innerHTML = '<h1>Oefeningen</h1><p class="sub">nog te bouwen</p>'; }`
door:

```js
  function renderOefeningen() {
    const lijst = laadOefeningen();
    const items = lijst.map(o => `
      <div class="kaart rij">
        <span>💪 ${o.naam}</span>
        <button class="gevaar mini" onclick="verwijderOefening('${o.id}')">verwijderen</button>
      </div>`).join('');
    document.getElementById('tab-oefeningen').innerHTML = `
      <h1>Oefeningen</h1>
      <p class="sub">Kies bij "Vandaag" uit deze lijst, of voeg hier je eigen oefening toe.</p>
      <div style="margin:14px 0">
        <label class="veld">Nieuwe oefening
          <input id="nieuwe-oefening" placeholder="bijv. Romanian deadlift">
        </label>
        <button style="margin-top:8px;width:100%" onclick="voegEigenOefeningToe()">+ Oefening toevoegen</button>
      </div>
      ${items || '<p class="grijs">Nog geen oefeningen.</p>'}
    `;
  }

  function voegEigenOefeningToe() {
    const input = document.getElementById('nieuwe-oefening');
    const naam = input.value.trim();
    if (!naam) return;
    const lijst = laadOefeningen();
    lijst.push({ id: nieuwId(), naam });
    bewaarOefeningen(lijst);
    renderOefeningen();
  }

  function verwijderOefening(id) {
    bewaarOefeningen(laadOefeningen().filter(o => o.id !== id));
    renderOefeningen();
  }
```

- [ ] **Step 2: Verifieer handmatig in de browser**

Herlaad `index.html`, ga naar tab "Oefeningen".
Expected: de 8 startoefeningen staan er. Typ "Romanian deadlift", klik "+ Oefening toevoegen" → verschijnt onderaan. Klik "verwijderen" bij één oefening → verdwijnt. Herlaad de pagina → wijzigingen blijven bewaard (localStorage).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: oefeningen-tab met toevoegen en verwijderen"
```

---

## Task 9: Tab "Vandaag" — sessie loggen met "vorige keer"

**Files:**
- Modify: `index.html` (vervang de `renderVandaag`-stub; voeg handlers toe)

- [ ] **Step 1: Vervang de `renderVandaag`-stub door de echte render**

In `index.html`, vervang de regel
`function renderVandaag() { document.getElementById('tab-vandaag').innerHTML = '<h1>Vandaag</h1><p class="sub">nog te bouwen</p>'; }`
door:

```js
  function renderVandaag() {
    const sessie = huidigeSessie();
    const alleOef = laadOefeningen();
    const naamVan = id => (alleOef.find(o => o.id === id) || {}).naam || 'onbekend';
    const sessies = laadSessies();

    let kaarten = '';
    if (sessie && sessie.oefeningen.length > 0) {
      kaarten = sessie.oefeningen.map(o => {
        const vorige = vorigeSet(sessies, o.exerciseId, vandaagISO());
        const vorigeTekst = vorige ? `vorige: ${formatKg(vorige.kg)} kg × ${vorige.reps}` : 'geen eerdere data';
        const setRijen = o.sets.map((s, i) => `
          <div class="rij grijs" style="padding:3px 0">
            <span>Set ${i + 1}</span><span>${formatKg(s.kg)} kg × ${s.reps}</span>
          </div>`).join('');
        return `
          <div class="kaart">
            <div class="rij"><b>🏋️ ${naamVan(o.exerciseId)}</b><span class="grijs">${vorigeTekst}</span></div>
            ${setRijen}
            <div class="rij" style="margin-top:10px;gap:8px">
              <label class="veld" style="flex:1">kg<input id="kg-${o.exerciseId}" type="number" inputmode="decimal" step="0.5"></label>
              <label class="veld" style="flex:1">reps<input id="reps-${o.exerciseId}" type="number" inputmode="numeric"></label>
              <button class="mini" style="align-self:flex-end" onclick="voegSetToe('${o.exerciseId}')">+ set</button>
            </div>
          </div>`;
      }).join('');
    }

    const alGekozen = sessie ? sessie.oefeningen.map(o => o.exerciseId) : [];
    const opties = alleOef.filter(o => !alGekozen.includes(o.id))
      .map(o => `<option value="${o.id}">${o.naam}</option>`).join('');
    const picker = opties ? `
      <div class="rij" style="gap:8px;margin-top:8px">
        <select id="oefening-keuze" style="flex:1">${opties}</select>
        <button onclick="voegOefeningToe()">+ Oefening</button>
      </div>` : '<p class="grijs">Alle oefeningen zitten al in deze sessie.</p>';

    document.getElementById('tab-vandaag').innerHTML = `
      <h1>Vandaag</h1>
      <p class="sub">${new Date().toLocaleDateString('nl-NL', { weekday:'long', day:'numeric', month:'long' })}</p>
      <div style="margin-top:14px">${kaarten || '<p class="grijs">Nog niets gelogd vandaag. Voeg een oefening toe 👇</p>'}</div>
      ${picker}
    `;
  }

  function voegOefeningToe() {
    const keuze = document.getElementById('oefening-keuze');
    if (!keuze || !keuze.value) return;
    const sessie = zorgVoorSessieVandaag();
    const sessies = laadSessies();
    const s = sessies.find(x => x.id === sessie.id);
    if (!s.oefeningen.some(o => o.exerciseId === keuze.value)) {
      s.oefeningen.push({ exerciseId: keuze.value, sets: [] });
      bewaarSessies(sessies);
    }
    renderVandaag();
  }

  function voegSetToe(exerciseId) {
    const kg = parseFloat(document.getElementById('kg-' + exerciseId).value);
    const reps = parseInt(document.getElementById('reps-' + exerciseId).value, 10);
    if (!(kg > 0) || !(reps > 0)) return;
    const sessies = laadSessies();
    const s = sessies.find(x => x.datum === vandaagISO());
    const o = s.oefeningen.find(o => o.exerciseId === exerciseId);
    o.sets.push({ kg, reps });
    bewaarSessies(sessies);
    renderVandaag();
  }
```

- [ ] **Step 2: Verifieer handmatig in de browser**

Herlaad `index.html` op tab "Vandaag".
Expected: datum van vandaag + een keuzelijst met oefeningen. Kies "Bankdrukken", klik "+ Oefening" → er verschijnt een kaart met invoervelden kg/reps en de tekst "geen eerdere data". Vul `30` en `10` in, klik "+ set" → "Set 1 · 30 kg × 10" verschijnt. Voeg een tweede set toe. Herlaad de pagina → alles blijft bewaard.

- [ ] **Step 3: Test de "vorige keer"-weergave handmatig**

In de console, simuleer een sessie van gisteren en herlaad:

```js
(() => { const s = laadSessies(); const gisteren = new Date(Date.now()-864e5).toISOString().slice(0,10);
  const bank = laadOefeningen().find(o => o.naam === 'Bankdrukken');
  s.push({ id: nieuwId(), datum: gisteren, oefeningen: [ { exerciseId: bank.id, sets: [ { kg: 30, reps: 10 } ] } ] });
  bewaarSessies(s); location.reload(); })();
```

Voeg daarna Bankdrukken toe aan de sessie van vandaag (als die er nog niet in zit).
Expected: op de Bankdrukken-kaart staat rechts "vorige: 30 kg × 10".

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: vandaag-tab met sets loggen en vorige-keer weergave"
```

---

## Task 10: Tab "Voortgang" — grafiek, headline, PR's

**Files:**
- Modify: `index.html` (vervang de `renderVoortgang`-stub; voeg `tekenGrafiek` en state toe)

- [ ] **Step 1: Voeg een state-variabele toe voor de gekozen oefening**

In `index.html`, direct ná `// ===== LOGIC END =====` (bij de andere UI-state), voeg toe:

```js
  let geselecteerdeOefeningId = null;
```

- [ ] **Step 2: Voeg `tekenGrafiek` toe en vervang de `renderVoortgang`-stub**

In `index.html`, vervang de regel
`function renderVoortgang() { document.getElementById('tab-voortgang').innerHTML = '<h1>Voortgang</h1><p class="sub">nog te bouwen</p>'; }`
door:

```js
  function tekenGrafiek(punten) {
    const w = 300, h = 130, pad = 18;
    if (punten.length === 0) return '';
    const vals = punten.map(p => p.e1rm);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = (max - min) || 1;
    const n = punten.length;
    const x = i => n === 1 ? w / 2 : pad + i * (w - 2 * pad) / (n - 1);
    const y = v => pad + (1 - (v - min) / range) * (h - 2 * pad);
    const lijn = `<polyline points="${punten.map((p,i) => `${x(i)},${y(p.e1rm)}`).join(' ')}" fill="none" stroke="#a78bfa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    const dots = punten.map((p,i) => `<circle cx="${x(i)}" cy="${y(p.e1rm)}" r="${p.isPR ? 5 : 3.5}" fill="${p.isPR ? '#fbbf24' : '#a78bfa'}"/>`).join('');
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" xmlns="http://www.w3.org/2000/svg">${lijn}${dots}</svg>`;
  }

  function renderVoortgang() {
    const oef = laadOefeningen();
    if (geselecteerdeOefeningId === null && oef.length > 0) geselecteerdeOefeningId = oef[0].id;
    const opties = oef.map(o => `<option value="${o.id}" ${o.id === geselecteerdeOefeningId ? 'selected' : ''}>${o.naam}</option>`).join('');
    const punten = geselecteerdeOefeningId ? progressieVoorOefening(laadSessies(), geselecteerdeOefeningId) : [];

    let inhoud;
    if (punten.length === 0) {
      inhoud = '<p class="grijs" style="margin-top:16px">Nog geen data voor deze oefening. Log eerst een set bij "Vandaag".</p>';
    } else {
      const laatste = punten[punten.length - 1].e1rm;
      const delta = punten.length >= 2 ? laatste - punten[punten.length - 2].e1rm : 0;
      const prs = punten.filter(p => p.isPR).length;
      const deltaTekst = delta > 0 ? `<span style="color:var(--groen)">▲ +${formatKg(delta)} kg</span>`
        : delta < 0 ? `<span style="color:#f87171">▼ ${formatKg(delta)} kg</span>`
        : '<span class="grijs">gelijk</span>';
      inhoud = `
        <div style="margin-top:12px">
          <div class="rij" style="justify-content:flex-start;gap:10px;align-items:baseline">
            <span style="font-size:30px;font-weight:800">${formatKg(laatste)}<span class="grijs" style="font-size:15px"> kg</span></span>
            ${deltaTekst}
          </div>
          <div class="grijs" style="margin-bottom:10px">geschatte kracht (1RM) · t.o.v. vorige sessie</div>
          ${tekenGrafiek(punten)}
          <div class="rij" style="gap:8px;margin-top:14px">
            <div class="stat"><b>${punten.length}</b><br><span>sessies</span></div>
            <div class="stat"><b>${prs}</b><br><span>PR's 🏅</span></div>
          </div>
        </div>`;
    }

    document.getElementById('tab-voortgang').innerHTML = `
      <h1>Voortgang</h1>
      <select onchange="geselecteerdeOefeningId=this.value; renderVoortgang()" style="margin-top:10px">${opties}</select>
      ${inhoud}
    `;
  }
```

- [ ] **Step 3: Verifieer handmatig in de browser**

Zorg dat je bij "Vandaag" minstens één oefening met een set hebt gelogd (en idealiter de gesimuleerde sessie van gisteren uit Task 9). Ga naar tab "Voortgang", kies "Bankdrukken".
Expected: een grote kg-waarde bovenaan, een delta (▲ groen als hoger dan vorige sessie), een stijgende SVG-lijn met een goud PR-punt, en tellers "sessies" en "PR's". Wissel de oefening in de keuzelijst → grafiek verandert mee. Een oefening zonder data toont de "nog geen data"-melding.

- [ ] **Step 4: Bevestig dat de logic-tests nog groen zijn**

Run: `node --test`
Expected: alle tests uit Task 2–6 passeren nog steeds.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: voortgang-tab met 1RM-grafiek, delta en PR-tellers"
```

---

## Task 11: PWA — manifest en icoon (toevoegen aan startscherm)

**Files:**
- Create: `manifest.webmanifest`
- Create: `icon.svg`
- Modify: `index.html` (`<head>`: manifest + apple meta)

- [ ] **Step 1: Maak `icon.svg`**

Create `icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0f172a"/>
  <rect x="96" y="232" width="320" height="48" rx="12" fill="#a78bfa"/>
  <rect x="72" y="196" width="56" height="120" rx="16" fill="#38bdf8"/>
  <rect x="384" y="196" width="56" height="120" rx="16" fill="#38bdf8"/>
  <polyline points="150,340 220,320 290,300 360,250" fill="none" stroke="#fbbf24" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 2: Maak `manifest.webmanifest`**

Create `manifest.webmanifest`:

```json
{
  "name": "Kracht-tracker",
  "short_name": "Kracht",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "./icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

- [ ] **Step 3: Koppel het manifest in `index.html`**

In `index.html`, voeg in de `<head>` direct ná de `<title>`-regel toe:

```html
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="icon.svg">
  <link rel="apple-touch-icon" href="icon.svg">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

- [ ] **Step 4: Verifieer handmatig**

Herlaad `index.html`. Open F12 → tabblad "Application" → "Manifest".
Expected: de naam "Kracht-tracker", theme-color en het icoon worden herkend, zonder fouten. (Volledige "installeren"-knop verschijnt pas bij hosting via https/GitHub Pages — dat is normaal.)

- [ ] **Step 5: Commit**

```bash
git add index.html manifest.webmanifest icon.svg
git commit -m "feat: PWA-manifest en icoon voor startscherm"
```

---

## Task 12: README en preview-instructies

**Files:**
- Create: `README.md`

- [ ] **Step 1: Maak `README.md`**

Create `README.md`:

```markdown
# Kracht-tracker

Telefoon-first web-app om per sportsessie oefeningen te loggen (sets × herhalingen × kg)
en per oefening je geschatte kracht (1RM) te zien groeien. Eén zelfstandig `index.html`,
geen build, data lokaal in de browser (`localStorage`).

## Lokaal bekijken

Dubbelklik `index.html`, of open het bestand in je browser. Werkt ook offline.

## Testen

De reken-kern (1RM, PR-detectie, vorige-set, formattering) is getest:

    node --test

## Online zetten (GitHub Pages)

1. Maak een GitHub-repository en push deze map.
2. Repository → Settings → Pages → Source: branch `main`, map `/root`.
3. Na een minuut staat de app op de getoonde URL. Op je telefoon: open die URL en
   kies "Toevoegen aan startscherm" voor een app-achtige ervaring.

## Structuur

- `index.html` — de hele app (opmaak, UI, reken-kern in het `LOGIC`-blok)
- `tests/logic.test.mjs` — Node-tests voor de reken-kern
- `manifest.webmanifest`, `icon.svg` — PWA
- `docs/superpowers/` — ontwerp-spec en dit plan
```

- [ ] **Step 2: Draai alle tests een laatste keer**

Run: `node --test`
Expected: alle tests groen.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README met preview- en GitHub Pages-instructies"
```

---

## Zelf-review (uitgevoerd bij het schrijven)

- **Spec-dekking:** loggen van sets/reps/kg (Task 9) ✓; startlijst + eigen oefeningen (Task 7, 8) ✓; lokale opslag (Task 7) ✓; 1RM-hoofdgrafiek + PR-badges (Task 4, 10) ✓; "vorige keer" (Task 5, 9) ✓; telefoon-first + PWA (Task 1 viewport, Task 11) ✓; kg-only (overal) ✓; geen geschiedenis-scherm / geen accounts (bewust weggelaten) ✓; test-first reken-kern (Task 2–6) ✓; GitHub Pages-pad (Task 12) ✓.
- **Placeholder-scan:** geen TBD/TODO; elke stap bevat volledige code.
- **Type-consistentie:** functienamen, localStorage-sleutels (`kt_exercises`, `kt_sessions`), datamodel (`{id, naam}`, `{exerciseId, sets:[{kg,reps}]}`) en DOM-id's (`kg-<id>`, `reps-<id>`, `oefening-keuze`) zijn gelijk in alle taken.
- **Volume-tabblad:** bewust buiten scope (spec: "later"); datamodel ondersteunt het al.
```
