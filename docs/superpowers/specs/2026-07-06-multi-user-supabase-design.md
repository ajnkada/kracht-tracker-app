# Multi-user Kracht-tracker met Supabase — ontwerp (spec)

**Datum:** 2026-07-06
**Branch:** `multi-user` (naast single-user `master`, die live blijft op GitHub Pages)
**Status:** ontwerp goedgekeurd op hoofdlijnen

## Doel

De single-user, lokale Kracht-tracker uitbreiden naar een multi-user app: gebruikers
loggen in, hebben eigen (centraal bewaarde) data, en een admin beheert gebruikers en
entries. Kleinschalig: de gebruiker + een handjevol bekenden.

## Vastgelegde keuzes

| Onderwerp | Keuze |
|---|---|
| Schaal | Handjevol gebruikers (admin + enkele sporters) |
| Login | Magic link (inloglink via e-mail, geen wachtwoord) |
| Backend | Supabase (Postgres + Auth), gratis tier, EU-regio |
| Registratie | Open sign-up UIT; admin nodigt gebruikers uit via Supabase-dashboard |
| Frontend hosting | Blijft GitHub Pages (statisch), praat via HTTPS met Supabase |
| Aanpak | Aparte branch; `master` (single-user) blijft ongewijzigd live |

## Architectuur

- Frontend (bestaande UI, grafieken, reken-logica) blijft statisch op GitHub Pages.
- Supabase levert authenticatie en database. De frontend gebruikt de publieke
  **anon key** (veilig in client; data beschermd door Row-Level Security).
- Geen zelf-gehoste server, geen tunnels (conform security-regel).

## Datamodel (Postgres)

- `profiles` — 1-op-1 met `auth.users`. Velden: `id` (uuid, FK auth.users), `email`,
  `naam`, `rol` ('gebruiker' | 'admin'), `created_at`. Wordt automatisch aangemaakt
  bij registratie (trigger op auth.users).
- `exercises` — `id`, `user_id` (FK auth.users), `naam`, `spiergroepen` (text[]),
  `type` ('reps' | 'tijd'), `doel` (numeric, nullable), `created_at`.
- `sessions` — `id`, `user_id`, `datum` (date), `oefeningen` (jsonb: dezelfde vorm als
  nu — `[{ exerciseId, sets: [...] }]`), `created_at`. JSONB houdt de reken-logica
  herbruikbaar.

## Beveiliging (Row-Level Security)

- RLS aan op alle tabellen.
- Standaardbeleid: een gebruiker mag alleen rijen waar `user_id = auth.uid()`
  lezen/schrijven/verwijderen.
- Admin-beleid: wie in `profiles` rol 'admin' heeft, mag ALLE rijen lezen/wijzigen/
  verwijderen (via een `is_admin()`-hulpfunctie, security definer).
- `profiles`: iedereen leest alleen eigen profiel; admin leest/muteert alle profielen.

## Auth-flow

- Inlogscherm vraagt e-mail → Supabase stuurt magic link → redirect terug naar de
  GitHub Pages-URL → sessie actief. Redirect-URL in Supabase instellen op de
  Pages-URL.
- Sessie wordt door de Supabase-client bewaard; bij herbezoek automatisch ingelogd.
- Uitloggen-knop.

## Wat verandert in de frontend

- Inlogscherm vóór de app; daarna de bekende tabs.
- Opslag-laag van `localStorage` → async Supabase-queries
  (`laadOefeningen`/`bewaarSessies` etc. worden async).
- Admin-scherm (alleen voor rol 'admin'): gebruikers en hun entries inzien/verwijderen.
- Optioneel: eenmalige import van bestaande localStorage-data naar het cloud-account.

## Wat de gebruiker (admin) eenmalig doet

1. Supabase-account + project aanmaken (EU-regio); project-URL + anon key doorgeven.
2. Schema + RLS-policies installeren (SQL uit dit project in de Supabase SQL-editor).
3. Zichzelf tot admin maken; eerste gebruikers uitnodigen via het dashboard.

## Fasering (elk met verificatie)

1. **Supabase-project + schema/RLS** — project aangemaakt, tabellen + policies staan.
2. **Auth** — inlogscherm + magic link + sessie/uitloggen; login werkt end-to-end.
3. **Data-laag** — localStorage vervangen door Supabase; data persisteert per gebruiker.
4. **Admin-scherm** — gebruikers + entries beheren/verwijderen.
5. **Afronding** — optionele data-import, deploy-keuze (aparte URL of vervang master).

## Privacy / verantwoordelijkheid

- Persoonlijke (gezondheids-nabije) data van meerdere personen wordt centraal
  opgeslagen. Aandachtspunten: EU-regio, minimale dataverzameling, duidelijke
  toestemming, en admin-toegang bewust en beperkt houden.

## Bewust (nog) buiten scope

- Wachtwoord-login, sociale login.
- Zelf-gebouwde admin-gebruikersaanmaak (gebeurt via Supabase-dashboard-invite,
  zodat er geen service-role-sleutel in de frontend hoeft).
- Realtime samenwerken, team-/groepsfuncties, export.
