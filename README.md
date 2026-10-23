# Folio

**Write beautifully. Organize effortlessly.**

Folio is a SaaS document editor: create documents from scratch or from templates, format them with
familiar word-processor tools, save automatically, and export real **PDF** and **DOCX** files.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS · Radix UI (shadcn-style components) · Lucide ·
**Tiptap** editor · Framer Motion · Next API routes · MongoDB + Mongoose · `pdf-lib` · `docx`.

---

## Run it (one step)

You need **Node.js 18.18+** and a **MongoDB** you can reach (local, Docker, or Atlas, see below).

| OS | Command |
| --- | --- |
| macOS / Linux | `./start.sh` |
| Windows | `start.bat` |

The launcher creates `.env.local` (with a freshly generated `AUTH_SECRET`), installs dependencies on the
first run, and starts the dev server at <http://localhost:3000>.

- No MongoDB yet? `./start.sh --docker` (or `start.bat --docker`) starts one with Docker Compose first.
- Production build: `./start.sh --prod` (or `start.bat --prod`).

Manual equivalent:

```bash
npm run setup      # creates .env.local with a generated AUTH_SECRET
npm install
npm run dev
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string. Default: `mongodb://127.0.0.1:27017/folio` |
| `AUTH_SECRET` | yes | Signs session cookies, 32+ characters. `npm run setup` generates one. |
| `NEXT_PUBLIC_APP_URL` | no | Public URL of the app. |

Secrets are read only on the server. Nothing in `src/components` or other client code touches them.

## Database setup

There is nothing to migrate. Mongoose creates the `users` and `documents` collections and their indexes
the first time the app connects. Pick one:

1. **Docker:** `docker compose up -d` (uses `docker-compose.yml`), then keep the default `MONGODB_URI`.
2. **Local MongoDB:** install MongoDB Community, start `mongod`, keep the default `MONGODB_URI`.
3. **MongoDB Atlas:** create a free cluster, allow your IP, and paste the `mongodb+srv://…` string into
   `MONGODB_URI` in `.env.local`.

## What's inside

- **Editor** (`src/components/editor`, `src/lib/editor`): Tiptap with bold, italic, underline, strike, text colour,
  highlight (palettes + custom colour + reset), font family, size and weight, paragraph styles (Normal, Title,
  Subtitle, H1–H4, Quote, Code block), alignment, line and paragraph spacing, indentation, bulleted / numbered /
  nested / task lists, links, images (upload, paste, drop, URL), tables (add / remove / merge / split), dividers,
  page breaks, clear formatting, word / character counts, reading time, page estimate, distraction-free mode,
  keyboard shortcuts, per-document page size, margins and page numbers.
- **Autosave** (`useAutosave.ts`): debounced, one request in flight, latest state always sent, retries with backoff,
  and "Saved" appears only after the server confirms the write.
- **Documents**: create, rename, duplicate, star, search, sort, recent, trash, restore, delete forever, empty trash.
- **Templates**: 10 real, editable templates in 5 categories (`src/lib/templates/data.ts`) with live previews.
- **Auth**: register / login / logout, bcrypt password hashing, signed HTTP-only session cookie (JWT), session
  invalidation on password change, rate limiting, route protection in middleware **and** on the server,
  ownership checks on every document query.
- **Exports** (`src/lib/export`): independent PDF and DOCX generators that read the stored Tiptap JSON.
- **Marketing site**: landing page with a live editor demo, FAQ, support / privacy / terms pages.

## Testing the exports

PDF and DOCX export are tested separately, with real formatted documents:

```bash
npm run test:exports   # exports every template + a "kitchen sink" document to PDF and DOCX and verifies them
npm run test:docs      # verifies the server-side document validator
npm test               # both
```

`test:exports` writes the files to `./export-test-output/` so you can open them in Word and a PDF viewer.
It checks, for example: valid PDF header and EOF, extracted PDF text, clickable link annotations, pagination of a
long document, a real ZIP-based DOCX, and the DOCX XML for headings, bold / italic / underline / strike, colours,
highlights, font size and family, hyperlinks, tables with merged cells, list numbering, alignment, images and page breaks.

## Project layout

```
src/app/                 routes: landing, auth, dashboard, editor, API
src/app/api/             auth, account, documents (CRUD, duplicate, export)
src/components/ui/       Button, Dialog, DropdownMenu, Popover, Tooltip, Input…
src/components/editor/   toolbar, menus, autosave hook, editor shell
src/components/app/      sidebar, document grid/list, templates, settings
src/lib/editor/          Tiptap extensions (font size, formatting, page break, image)
src/lib/export/          pdf.ts, docx.ts, images.ts, common.ts
src/lib/models/          Mongoose models
src/lib/templates/       template builders + data
src/lib/validation.ts    zod schemas        src/lib/doc-utils.ts   document sanitizer
scripts/                 setup + export / sanitizer tests
```

## Deploying

Works on any Node host. On Vercel, set `MONGODB_URI` and `AUTH_SECRET` as environment variables and use MongoDB Atlas.
Note: the login / export rate limiter is in-memory (per server instance). Swap `src/lib/auth/rate-limit.ts`
for Redis / Upstash if you run several instances.

## Known limits (honest list)

- **PDF fonts:** PDFs use the standard Helvetica / Times / Courier families (Arial, Calibri, Verdana → Helvetica;
  Georgia, Cambria, Times → Times; Courier New → Courier). Text is limited to Latin characters plus common
  punctuation; other scripts (for example Urdu or Arabic) show as `?` in PDFs. DOCX export keeps all text and the
  font *names*, so use DOCX for non-Latin documents until you embed a Unicode font in `pdf.ts`.
- **PDF tables:** merged cells across *rows* render as separate cells in PDF (column merges are preserved). DOCX keeps both.
- **Pages in the editor** are a continuous sheet with page-boundary lines. Exact page breaks are decided at export time,
  so the "pages" figure in the status bar is an estimate.
- **Images** are resized to ≤1600 px and stored inside the document (limit about 8 MB per document).
- No real-time collaboration, comments or version history yet.

## Build status

The export engines, the sanitizer and the shared modules were type-checked and exercised with the tests above.
The Next.js UI could not be compiled where this project was authored (no network, so dependencies could not be
installed). `npm run dev` does not type-check, so the app should start regardless, but run `npm run typecheck`
and `npm run build` once and fix anything TypeScript reports before deploying.
