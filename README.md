# gladys-cgr

CGR cinema integration for [Gladys Assistant](https://gladysassistant.com):
movies currently playing at your CGR cinema, shown in the "Upcoming
Releases" widget (Gladys core contract B.19, `movies` external-integration
type).

## Why this is cleaner than gladys-ugc

Same bar as the sibling `gladys-ugc` integration — no paid API, no
credential extracted from a decompiled app, no bypass of anti-bot
protection — but CGR's own site (`cgrcinemas.fr`) turned out to expose a
first-party **JSON** API instead of only rendered HTML:

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
- `movies.getUpcoming` returns the films playing there today, each with its
  showtimes (`movie.showtimes`, Gladys core B.19) and trailer.
- A **Find my cinema** action searches a hand-maintained static list of CGR
  cinemas (there is no dynamic "select" field type in Gladys for anything
  other than devices — see `docs/fr.md` / `docs/en.md`). The list comes from
  `cgrcinemas.fr`'s own public sitemap, which conveniently embeds each
  theater's ID right in its URL slug (`/theaters/p0905-cgr-brignais-lyon/`).

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

### SDK dependency (temporary)

`onMoviesGetUpcoming` and `getHouses()` were added to the official SDK in
[GladysAssistant/integration-sdk-js#32](https://github.com/GladysAssistant/integration-sdk-js/pull/32),
not yet merged/published. `package.json` points
`@gladysassistant/integration-sdk` at that branch directly:

```json
"@gladysassistant/integration-sdk": "github:vincentBesseau/integration-sdk-js#feature/movies-type"
```

Switch this back to a published `^x.y.z` version once that PR is merged and
released.

### Refreshing the cinema list

`src/cgr/cinemas.json` is a hand-maintained snapshot of CGR's theater list.
To refresh it: fetch `https://www.cgrcinemas.fr/sitemap-index.xml`, follow
the `sitemap-0.xml` it points to, and extract every `<loc>` under
`/theaters/` — each slug is `<id>-<name-words-separated-by-dashes>` (e.g.
`p0905-cgr-brignais-lyon` → id `P0905`), so no extra request per theater is
needed just to rebuild this list.

## Publishing checklist

- [ ] `gladys_version` in `gladys-assistant-integration.json` is a
      placeholder (`>=4.90.0`) — set it to the actual Gladys release that
      ships the `movies` integration type (Gladys core PR
      [GladysAssistant/Gladys#3061](https://github.com/GladysAssistant/Gladys/pull/3061))
      once it is released.
- [ ] Swap the SDK dependency to a published version (see above).
- [ ] Add a `cover.png` (referenced by `cover_image` in the manifest).
- [ ] Run **Release** (GitHub Actions) once ready to cut `v0.1.0` and publish
      the image to `ghcr.io/vincentbesseau/gladys-cgr`.

## License

Apache-2.0
