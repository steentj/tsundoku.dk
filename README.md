# tsundoku.dk

Personal book library website. Static, read-only. Data lives in `boeger.json`.

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
| `id` | string | ✓ | Unique, e.g. `bk-0006` |
| `slug` | string | ✓ | URL-friendly title |
| `title` | string | ✓ | |
| `isbn` | string | | Digits only or with dashes |
| `authors` | array | ✓ | List of author names |
| `type` | string | | `fiktion` · `faglitteratur` · `poesi` · `andet` |
| `format` | string | | `physical` · `ebook` · `audiobook` |
| `acquisition` | string | | `new` · `used` · `gift` · `library` |
| `description` | string | | Short description of the book |
| `purchase_reason` | string | | Why you bought it |
| `status` | string | ✓ | `bought` · `reading` · `finished` · `abandoned` |
| `bought_date` | string | | `YYYY-MM-DD` |
| `reading_started` | string | | `YYYY-MM-DD` |
| `finished_at` | string | | `YYYY-MM-DD` |
| `review_text` | string | | Free-text review |
| `rating` | number | | 1–5 |
| `tags` | array | | List of tags |
| `cover_image` | string | | Path relative to site root, e.g. `images/my-book.jpg` |

### Cover images

Place cover images in the `images/` folder and set `cover_image` to the relative path.
Missing images fall back to `images/placeholder.png`.

## Deployment (when ready)

1. Create account at [statichost.eu](https://statichost.eu)
2. Add site on [builder.statichost.eu](https://builder.statichost.eu) — no build command, output dir `.`
3. Add GitHub webhook: `POST https://builder.statichost.eu/YOUR_SITE_NAME` on push to `main`
4. Add domain `tsundoku.dk` in dashboard + point DNS A record to statichost.eu
