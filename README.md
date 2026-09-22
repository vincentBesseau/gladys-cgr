# gladys-cgr

[![Latest version](https://img.shields.io/github/v/tag/vincentBesseau/gladys-cgr?label=version)](https://github.com/vincentBesseau/gladys-cgr/tags)
[![CI](https://github.com/vincentBesseau/gladys-cgr/actions/workflows/ci.yml/badge.svg)](https://github.com/vincentBesseau/gladys-cgr/actions/workflows/ci.yml)
[![Docker pulls](https://ghcr-badge.elias.eu.org/shield/vincentBesseau/gladys-cgr/gladys-cgr)](https://github.com/vincentBesseau/gladys-cgr/pkgs/container/gladys-cgr)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://www.apache.org/licenses/LICENSE-2.0)
[![Gladys](https://img.shields.io/badge/gladys-%3E%3D5.1.1-6f42c1)](https://gladysassistant.com)

CGR cinema integration for [Gladys Assistant](https://gladysassistant.com):
movies currently playing at your CGR cinema, as a dashboard widget, with a
scene trigger for when a new film joins the program (Gladys core
capabilities — dashboard widgets and scene triggers declared by external
integrations, [#3109](https://github.com/GladysAssistant/Gladys/pull/3109)
and [#3110](https://github.com/GladysAssistant/Gladys/pull/3110) — `provider`
external-integration type).

## Why this is cleaner than gladys-ugc

Same bar as the sibling [`gladys-ugc`](https://github.com/vincentBesseau/gladys-ugc)
and [`gladys-pathe`](https://github.com/vincentBesseau/gladys-pathe)
integrations — no paid API, no credential extracted from a decompiled app,
no bypass of anti-bot protection — but CGR's own site (`cgrcinemas.fr`)
turned out to expose a first-party **JSON** API instead of only rendered
HTML:

- `GET /api/gatsby-source-boxofficeapi/schedule?from=...&to=...&theaters={"id":"P0905","timeZone":"Europe/Paris"}`
  returns every session for a cinema, grouped by film and date, with a full
  ISO `startsAt` (unlike UGC's bare `"HH:MM"` — no past-session filtering
  guesswork needed here).
- `GET /api/gatsby-source-boxofficeapi/movies?ids=X&ids=Y` returns each
  film's title, poster, synopsis, release date **and trailer** in a single
  call — no HTML to parse, no extra per-film request.

Both verified live with a plain, cookie-less HTTP client (no auth, no
session). The theater IDs look AlloCiné-shaped (`P0905`, `W8010`, `B0261`) —
CGR's site is built on a shared French cinema-data platform (the same one
that also backs AlloCiné) — but what matters for the risk assessment is
where and how it's served: **first-party, on `cgrcinemas.fr`, to any
visitor, no authentication** — not an app secret reused to bypass access
control.

## What it does

- Configure one CGR cinema (its ID, e.g. `P0905`).
- A **now_playing** dashboard widget renders the films playing there today,
  each with its poster, trailer link, booking link and showtimes.
- A **new_film** scene trigger fires when a film not seen on a previous
  check appears in the program, with its title, release date, today's
  showtimes and booking link exposed as scene variables — the diffing
  against a persisted baseline lives in the integration itself (`/data`),
  polled twice a day.
- A **Find my cinema** action searches a hand-maintained static list of CGR
  cinemas (there is no dynamic "select" field type in Gladys for anything
  other than devices — see `docs/fr.md` / `docs/en.md`). The list comes from
  `cgrcinemas.fr`'s own public sitemap, which conveniently embeds each
  theater's ID right in its URL slug (`/theaters/p0905-cgr-brignais-lyon/`).
  Left empty, it returns the 5 cinemas nearest the Gladys house
  (`location: true` in the manifest, `gladys.getHouses()`) instead of
  dumping the full ~70-cinema list — falls back to the full list when no
  house has a location set.

## Development

```bash
npm install
npm test
npm run lint
npm run format:check
```

Conventions: ESM, native `fetch` (no HTTP client dependency), `node --test`
(no test framework dependency) — matching `gladys-ugc` and the user's other
integrations. No HTML-parsing dependency needed here: CGR's API is JSON
end to end.

### Refreshing the cinema list

`src/cgr/cinemas.json` is a hand-maintained snapshot of CGR's theater list.
To refresh it: fetch `https://www.cgrcinemas.fr/sitemap-index.xml`, follow
the `sitemap-0.xml` it points to, and extract every `<loc>` under
`/theaters/` — each slug is `<id>-<name-words-separated-by-dashes>` (e.g.
`p0905-cgr-brignais-lyon` → id `P0905`), so no extra request per theater is
needed just to rebuild the id/name list.

Each entry also carries `address`/`postalCode`/`city`/`latitude`/`longitude`
(used by `nearestCinemas()` in `src/cgr/cinemas.js`), extracted from the
`MovieTheater` JSON-LD block (`<script type="application/ld+json">`) that
each theater's own page (`/theaters/<slug>/`) already embeds for SEO —
first-party and precise, no third-party geocoding needed here (unlike
`gladys-ugc`, whose cinema list has no such structured data).

## Related integrations

Same chain-by-chain approach, one repo per cinema chain:

- [`gladys-ugc`](https://github.com/vincentBesseau/gladys-ugc) — UGC
- [`gladys-pathe`](https://github.com/vincentBesseau/gladys-pathe) — Pathé

For any other cinema — independent art-house theaters included — see
[`gladys-allocine`](https://github.com/vincentBesseau/gladys-allocine),
which covers every French cinema through AlloCiné's own site.

## Publishing checklist

- [x] `gladys_version` in `gladys-assistant-integration.json` set to
      `>=5.1.1`, the first Gladys release with the core capabilities this
      integration needs (dashboard widgets and scene triggers declared by
      external integrations, [#3109](https://github.com/GladysAssistant/Gladys/pull/3109)
      / [#3110](https://github.com/GladysAssistant/Gladys/pull/3110), both merged).
- [x] SDK dependency on the official, published `@gladysassistant/integration-sdk`
      (no fork).
- [x] Add a `cover.png` (referenced by `cover_image` in the manifest) — 800x534, under 150 KB.
- [x] Run **Release** (GitHub Actions) to cut `v1.0.0` and publish the image
      to `ghcr.io/vincentbesseau/gladys-cgr`.

## License

Apache-2.0
