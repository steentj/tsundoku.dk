# Copilot Project Instructions

This repo is a Hugo-based static site for tsundoku.dk. Content (books) is data-driven from a single JSON file and rendered via Hugo templates with a thin layer of client-side JS for filtering, sorting, and UI state.

## Architecture at a glance
- Static Site Generator: Hugo (extended). Key entry points:
  - `layouts/_default/baseof.html` wraps pages; includes partials, CSS/JS.
  - `layouts/index.html` is the homepage.
  - Library lives at `content/library/_index.md` rendered by `layouts/library/list.html`.
  - Blog section under `content/posts/` with templates in `layouts/posts/`.
- Data flow:
  - Books live in `data/books.json`. Hugo exposes it as `.Site.Data.books`.
  - `layouts/library/list.html` embeds the JSON as a `<script type="application/json" id="books-data">` block.
  - `static/js/library.js` reads this block, then filters/sorts and renders cards/list in the browser. No server-side write.
- Assets:
  - Styles in `static/css/main.css` (CSS variables, light/dark).
  - JS in `static/js/` (theme toggle + library logic).
  - Images served from `static/images/`; reference in JSON as `images/<file>`.

## Conventions and patterns
- Data is the single source of truth: edit `data/books.json`; don’t embed book data in Markdown.
- IDs/slugs are required; slugs must be URL-friendly (kebab-case).
- Status values: `not-started` | `reading` | `finished`. If `finished`, `finished_at` (YYYY-MM-DD) is required.
- Types: `physical-new` | `physical-used` | `ebook` | `audiobook`.
- Missing cover images should use `images/placeholder.png`.
- Client state (view: cards/list and sort choice) persists in `localStorage`.

## Developer workflows
- Install Hugo Extended (macOS):
  - `brew install hugo` or `brew install --cask hugo-extended`; verify via `hugo version` (should show extended).
- Run dev server: `hugo server -D` (livereload).
- Build: `hugo --minify` outputs to `public/`.
- Edit books:
  1) Update `data/books.json` (keep schema).
  2) Place covers in `static/images/` and reference via `images/<file>`.
- JSON validation: GitHub Action validates `data/books.json` against `schema/books.schema.json`.

## Files to know
- `hugo.toml` — site config (baseURL, sitemap, minify).
- `data/books.json` — book entries.
- `schema/books.schema.json` — JSON Schema (draft-07) for CI validation.
- `layouts/library/list.html` — library page + filters UI + embeds data JSON.
- `static/js/library.js` — client logic for filters, sorting by title/author, view toggle, modal.
- `static/js/theme.js` — theme toggle (light/dark) with `data-theme` on `<html>`.
- `static/css/main.css` — base styles, grid, badges, modal.
- `.github/workflows/build.yml` — CI: validate+build; deploy step is a placeholder.

## How to extend safely
- Adding fields to books: update both `schema/books.schema.json` and the UI in `library.js`/templates.
- Adding new filters/sorts: extend the filters form in `layouts/library/list.html` and update matching/sort in `static/js/library.js`.
- Per-book pages (optional): create a `content/books/<slug>.md` and look up details from `.Site.Data.books` by slug, or implement data-driven pages pattern.

## Gotchas
- Ensure Hugo Extended is used; SCSS or some features require it, and CI expects extended.
- Paths under `static/` are served from site root; reference images as `images/...` (no leading `/static`).
- If you change the structure of `books.json`, CI will fail until `schema` is updated.

