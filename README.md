# tsundoku.dk

Et minimalistisk, statisk site som viser mit bogbibliotek, bygget med Hugo.

## Forudsætninger
- macOS med Homebrew

## Installation af Hugo Extended (macOS)

```zsh
brew install hugo
# Verificér at du har extended version (output bør indeholde extended)
hugo version
```

Hvis din Homebrew ikke installerer extended-varianten, så brug cask:

```zsh
brew install --cask hugo-extended
hugo version
```

## Kør lokalt

```zsh
hugo server -D
```

- Åbn http://localhost:1313
- Redigér filer; serveren livereloader automatisk.

## Struktur
- `data/books.json` — Single source of truth for bøgerne
- `schema/books.schema.json` — JSON Schema der validerer `books.json`
- `content/library/_index.md` — Bibliotekssiden (renderer data)
- `content/posts/` — Indlæg i Markdown
- `static/` — CSS, JS, billeder (serves som root)
- `layouts/` — Hugo templates

## Arbejdsgang for bøger
1. Redigér `data/books.json` (tilføj/ret bogposter).
2. Læg eventuelle cover-billeder i `static/images/` og referér i JSON som `images/<filnavn>`.
3. Kør `hugo server` for at teste lokalt.
4. Commit og push når klar.

Datamodel (felter):
- `id` (string), `slug` (url-venlig), `title` (string), `authors` (string[])
- `type`: `physical-new` | `physical-used` | `ebook` | `audiobook`
- `purchase_reason` (string)
- `status`: `not-started` | `reading` | `finished`
- `finished_at` (YYYY-MM-DD, kræves når `status` = `finished`)
- `review_text` (string, valgfri), `rating` (1-5, valgfri)
- `tags` (string[], valgfri), `cover_image` (string, valgfri), `notes` (valgfri)

## Filtrering og sortering
- Filtre: Titel (fritekst), Forfatter (fritekst), Type (dropdown), Status (dropdown)
- Sortering: Titel eller første forfatter (A→Å)
- Visning: Toggle mellem kort og liste; valg gemmes i localStorage

## Build

```zsh
hugo --minify
```

Output i `public/` kan uploades til valgfri statisk host.

## CI (valgfrit)
GitHub Actions workflow (`.github/workflows/build.yml`) validerer `data/books.json` mod schema og bygger sitet. Deploy-step er placeholder og kan erstattes med statichost.eu’s officielle Action, når du er klar.

## Fejlsøgning
- Får du fejl med Hugo: `hugo version` skal vise `(extended)` i output.
- Billeder vises ikke: tjek at stien i JSON er relativ til `static/`, fx `images/placeholder.png`.
- Valideringsfejl i CI: se `schema/books.schema.json` og ret datafelter.
