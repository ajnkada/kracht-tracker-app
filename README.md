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
