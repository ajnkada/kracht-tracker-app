# Kracht-tracker — ontwerp (spec)

**Datum:** 2026-07-05
**Status:** goedgekeurd door gebruiker (initiële scope)
**Werktitel:** Kracht-tracker

## Doel

Een telefoon-first web-app waarin je per sportsessie oefeningen logt (sets ×
herhalingen × gewicht) en per oefening je **geschatte kracht** ziet groeien.
Focus: de gebruiker moet visueel zien dat hij écht stappen maakt, ook wanneer
het gewicht gelijk blijft maar de herhalingen toenemen.

**Hoofddoel gebruiker:** sterker worden + vooruitgang zien.

## Vastgelegde keuzes

| Onderwerp | Keuze |
|---|---|
| Apparaat | Telefoon-first (werkt ook op desktop) |
| Oefeningen toevoegen | Kiezen uit startlijst **én** eigen oefeningen toevoegen |
| Opslag | Lokaal op apparaat (`localStorage`), geen account |
| Hoofd-progressiemaat | Geschatte 1RM-lijn (Epley) |
| Extra maat | Volume als tweede tabblad (later; niet in v1-kern) |
| Geschiedenis-scherm | Niet in v1 — grafiek per oefening volstaat |
| Eenheid | Alleen kg |
| Vorige sessie tonen | Ja — grijze "vorige: X kg × Y" bij het loggen |
| Techniek | Eén zelfstandig `index.html` (vanilla JS, geen build) |

## Architectuur

- **Eén `index.html`** met inline CSS + vanilla JavaScript. Geen build-stap,
  geen externe libraries, geen afhankelijkheden.
- **Opslag:** `localStorage` (werkt offline, geen account).
- **Grafieken:** met de hand getekende SVG-lijngrafieken (geen chart-library).
- **PWA:** een klein `manifest` (+ optioneel service worker) zodat de app op het
  telefoon-startscherm gezet kan worden en offline werkt.
- **Projectlocatie:** `C:\Users\Alex\Documents\kracht-tracker` — bewust buiten de
  Obsidian-vault zodat Obsidian de code niet indexeert.

## Datamodel (localStorage, JSON)

```
exercises: [ { id, naam } ]
sessions:  [ { id, datum, oefeningen: [ { exerciseId, sets: [ { kg, reps } ] } ] } ]
```

- `id`: uniek (bijv. timestamp/random string).
- `datum`: ISO-datum (YYYY-MM-DD). v1 logt alleen op "vandaag".
- Een sessie voor vandaag ontstaat zodra je vandaag iets logt.

## Schermen (3 tabbladen, onderbalk altijd zichtbaar)

### 📋 Vandaag (loggen)
- Toont de sessie van vandaag.
- Per oefening kun je sets toevoegen: gewicht (kg) × herhalingen.
- Bij elke oefening staat grijs **"vorige: 30 kg × 10"** — de laatste set uit de
  meest recente eerdere sessie die deze oefening bevatte. Helpt beslissen of je
  moet ophogen.
- Knop **"+ Oefening toevoegen"** kiest uit de oefeningenlijst.

### 💪 Oefeningen (beheren)
- Beheer je oefeningenlijst.
- **Startlijst** met bekende oefeningen (o.a. bankdrukken, squat, deadlift,
  schouderpers) waar je uit kunt kiezen.
- Eigen oefeningen toevoegen en verwijderen.

### 📈 Voortgang (grafieken)
- Kies een oefening.
- Geschatte kracht groot in beeld (bijv. `102 kg`, `▲ +7 kg`).
- **1RM-lijngrafiek** over de sessies heen, met **PR-badges** 🏅.
- Tellers: aantal sessies, aantal PR's.

## Groei-berekening

- **Geschatte 1RM per set (Epley):** `kg × (1 + reps / 30)`.
- **Per oefening per sessie:** neem de **beste set** (hoogste geschatte 1RM) →
  dat is het punt op de grafiek.
- **PR-detectie:** een sessie is een PR zodra zijn beste 1RM hoger is dan alle
  vorige sessies van die oefening → badge 🏅.
- Voorbeeld ter validatie: 30 kg × 10 → 40,0 kg; 30 kg × 12 → 42,0 kg (+5%).

## Preview & lancering

- **Nu (preview):** deelbare preview-link + lokaal/telefoon openen.
- **Later (lancering):** `git init` → GitHub → **GitHub Pages** aanzetten →
  live URL. Statische hosting, **geen tunnels** (conform security-regel).

## Kwaliteit / testen

- Reken-functies (`geschatte1RM`, PR-detectie, "beste set") als losse, pure,
  testbare functies met een paar controle-waarden (o.a. het 30×10 / 30×12
  voorbeeld).
- Verder handmatige verificatie in de browser: loggen → grafiek klopt → PR
  verschijnt op het juiste moment.

## Bewust buiten scope (v1) — YAGNI

- Cloud-synchronisatie / accounts.
- Apart geschiedenis-scherm met alle sessies op datum.
- Pond/lbs-omschakelaar.
- Volume-tabblad (kan later; berekening is al voorbereid in het datamodel).
- Sessies op een andere datum dan vandaag loggen/bewerken.

## Toevoegingen na het v1-ontwerp (2026-07-05)

Na goedkeuring en bouw toegevoegd op verzoek:

1. **Spiergroep per oefening.** Elke oefening heeft een `spiergroep`-veld
   (Bicep, Tricep, Borst, Rug, Schouders, Benen, Buik, Onderarmen). De startlijst
   is toegewezen; bij een eigen oefening kies je de groep in een keuzelijst. De
   groep verschijnt als badge in de Oefeningen- en Vandaag-tab. `migreerSpiergroepen()`
   vult de groep aan voor oefeningen die van vóór deze feature stammen.
2. **Tweede grafieklijn: werkelijk gewicht.** `progressieVoorOefening` geeft nu
   ook `gewicht` (het zwaarste kg van die sessie). De Voortgang-grafiek tekent die
   als tweede lijn (blauw, gestippeld) op dezelfde kg-as als de 1RM-lijn, met legenda.
   De gouden PR-stippen blijven op de 1RM-lijn.
3. **Records-tabblad.** Vierde tab (🏅 Records) met per oefening het beste 1RM en
   het zwaarste gewicht, elk met datum (pure helper `recordsVoorOefening`).
4. **PR-viering.** Bij het loggen van een set die een nieuw 1RM-record zet
   (pure helper `isNieuwePR`) verschijnt een banner + confetti + trilsignaal.
   Vuurt niet op de allereerste set of op een niet-record set.
5. **Rustklok.** Start automatisch (90 s) na elke gelogde set, met +30 s / stop,
   trillen en een korte piep op 0. Eigen vast DOM-element zodat re-renders het
   niet resetten.
6. **Targets (doel).** Per oefening een doel-`doel1rm` (geschatte 1RM). Getoond als
   groene streeplijn in de grafiek plus een %-vordering; instelbaar op de Voortgang-tab.
