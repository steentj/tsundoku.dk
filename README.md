# tsundoku.dk

Personal book library website for [tsundoku.dk](https://tsundoku.dk). Static, read-only. Data lives in `boeger.json`.

## Features

- Grid and list view toggle
- Filter by reading status (all, bought, reading, finished, abandoned)
- Filter by genre (fiction, non-fiction, biography, poetry)
- Sort by added order (by id), title, author, or rating
- Search by title, author, ISBN, or tag
- Detail modal with full book information
- Danish/English language toggle (Danish default)
- Preferences (language, view mode) saved in localStorage

## Run locally

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080)

## Adding or editing books

Edit `boeger.json`. The site is read-only — all changes happen by editing the JSON file directly.

### Book fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | Unique, e.g. `bk-0001` |
| `slug` | string | ✓ | URL-friendly title |
| `title` | string | ✓ | |
| `isbn` | string | | Digits only |
| `authors` | array | ✓ | List of author names |
| `genre` | string | | `fiction` · `non-fiction` · `biography` · `poetry` |
| `language` | string | | Language code, e.g. `da` |
| `format` | string | | `physical` · `ebook` · `audiobook` |
| `acquisition` | string | | `new` · `used` |
| `purchase_reason` | string | | Why you bought it |
| `status` | string | ✓ | `bought` · `reading` · `finished` · `abandoned` |
| `bought_date` | string | | `YYYY-MM-DD` |
| `reading_started` | string | | `YYYY-MM-DD` |
| `finished_at` | string | | `YYYY-MM-DD` |
| `review_text` | string | | Free-text review |
| `rating` | number | | 1–5 |
| `tags` | array | | List of tags |
| `cover_image` | string | | Filename only, e.g. `bk-0001-UUID.jpg` — file must be in `images/` |

### Cover images

Place cover images in the `images/` folder and set `cover_image` to just the filename (not the full path).
Missing images fall back to `images/placeholder.png`.

## Deployment

The site is hosted on [statichost.eu](https://statichost.eu) (free plan) and deployed automatically on push to `main`.

To set up from scratch:
1. Create account at [statichost.eu](https://statichost.eu)
2. Add site on [builder.statichost.eu](https://builder.statichost.eu) — no build command, output dir `.`
3. Add GitHub webhook: `POST https://builder.statichost.eu/YOUR_SITE_NAME` on push to `main`
4. Add domain `tsundoku.dk` in dashboard + point DNS A record to statichost.eu
