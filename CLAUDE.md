# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Conventions

Do **not** add a `Co-Authored-By` trailer (or any Claude/AI attribution) to commit messages. Keep commit messages clean — subject + body only.

## Project Overview

English Patio is the institutional website for an English language school (focused on children and teenagers), built with React 18, TypeScript, Vite, and Tailwind CSS. Beyond marketing pages, it contains a full **online enrollment system** that fills a contract PDF in the browser and submits it to a Google Apps Script backend.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite, default http://localhost:5173)
npm run build        # Type-check (tsc) + production build to dist/
npm run lint         # ESLint, --max-warnings 0 (warnings fail the build)
npm run preview      # Serve the production build locally
```

**Deployment is automatic via Vercel** on every push (SPA routing handled by `vercel.json`, which rewrites all paths to `index.html`). No manual deploy command is needed.

There is no test runner configured. `npm run build` runs `tsc` first, so type errors block the build. `lint` is strict (zero warnings allowed).

## Routing & Base Path

Routes live in `src/routes/index.tsx` using `createBrowserRouter`. `RootLayout` wraps every route with `ScrollToTop` (scrolls to top on navigation) and a persistent `WhatsAppButton`.

Active routes:
- `/` — `Home`
- `/metodologia` — `Methodology`
- `/vacation-classes` — `VacationClasses`
- `/matriculas` — `Enrollment` (the enrollment system)

`Infrastructure` (`/infraestrutura`) is built but currently commented out in both the router and `Navbar`. Some older docs/components still reference legacy paths (`/nossas-aulas`, `/foco-e-acao`) — the routes above are authoritative.

**Base path is `/`** (see `vite.config.ts`). The app is deployed to Vercel, which builds and publishes automatically on every push (`vercel.json` rewrites all paths to `index.html` for SPA routing). Use `import.meta.env.BASE_URL` when constructing paths to public assets (e.g. `contrato.pdf`).

Note: `.github/workflows/deploy.yml` (a leftover GitHub Pages action that pushes `dist/` to `gh-pages`) and the `gh-pages` devDependency are obsolete — Vercel is the live deploy.

## Enrollment System (the core non-trivial subsystem)

The enrollment flow is the most complex part of the codebase. It lives in `src/pages/Enrollment.tsx` (~1600 lines, a multi-step wizard) backed by a services + validators + types layer.

**End-to-end flow:**
1. User fills the multi-step form in `Enrollment.tsx`. Field shapes are defined by `FormData` in `src/types/enrollment.ts` (students, legal/second/financial responsibles, address, schedule, authorizations).
2. CEP autocomplete: on CEP entry, `fetchAddress` (`src/services/cepService.ts`) queries **four** CEP APIs in parallel (ViaCEP, BrasilAPI v2, OpenCep, ApiCEP) via `Promise.allSettled`, normalizes their differing response shapes, and returns the first hit. It distinguishes "CEP not found" (needs ≥2 APIs confirming) from "all APIs down" from **"outside Goiás"** — enrollment is restricted to addresses in the state of GO (`state !== 'GO'` → rejected). Address fields remain manually editable as a fallback.
3. On submit, `fillContractPDF` (`src/services/pdfService.ts`) loads `public/contrato.pdf` and stamps text onto it with `pdf-lib` using **absolute X/Y coordinates** (origin = bottom-left). It writes contractor data on page 1, the class-format checkbox on page 2, and image-authorization + signature date on page 4. The coordinates are hand-calibrated to the 2026 contract layout — if `contrato.pdf` changes, these offsets must be re-measured.
4. `submitEnrollment` (`src/services/enrollmentService.ts`) base64-encodes the PDF and POSTs `{ formData, pdfBase64, timestamp }` to `VITE_GOOGLE_APPS_SCRIPT_URL`. **The request uses `mode: 'no-cors'`** (required for Apps Script), so the response is opaque and success is assumed when no network error is thrown — real failures (validation, quota) are invisible to the client.
5. The Apps Script backend (`docs/google-apps-script/Code.gs`) receives the payload, emails the contract, and logs to a Google Sheet (template at `docs/planilha-modelo-matriculas.csv`).

**Legacy:** `src/services/emailService.ts` (EmailJS direct send) is the previous backend, superseded by the Apps Script flow. `docs/CONTRATO_MATRICULA.md` documents that older EmailJS path and is partly outdated. Treat `enrollmentService.ts` + `Code.gs` as the current backend.

**Validation** lives in `src/utils/validators.ts` (pure functions, no deps): `isValidCPF` (full check-digit validation), `isValidCEP`, `isValidEmail`, `isValidPhone` (11 digits, 3rd digit must be `9`), `isValidFullName` (≥2 significant parts, ignoring Brazilian connectors `e/de/da/do/dos/das`), and birth-date rules (`isValidStudentBirthDate` ≤20 yrs, `isValidResponsibleBirthDate` ≥18 yrs). Reusable strings in `ErrorMessages`. Input masks use `react-input-mask`.

## Path Aliases

Configured in both `vite.config.ts` and `tsconfig.json` (keep them in sync):

```
@/ → src/      @components/ → src/components/   @pages/ → src/pages/
@types/ → src/types/   @services/ → src/services/   @utils/ → src/utils/   @assets/ → src/assets/
```

## Styling System

Tailwind with custom tokens in `tailwind.config.js`:
- **Colors**: `primary` `#1E3765` (+`primary.light` `#2F539A`), `secondary`/`accent` `#F5B700` (+`.light` `#FFE17A`), `background` `#FFFFFF` (+`.light` `#F8F9FA`).
- **Fonts**: `font-sans` → 'Comic Neue', `font-heading` → 'Fredoka One'.

Custom component classes live in `src/index.css` (`.btn-primary`, `.btn-secondary`, `.card`, `.pattern-bg`, `.section-title`, `.glass-effect`, `.gradient-text`, navbar/menu animation classes). Additional keyframe animations in `src/styles/animations.css`.

## Images

Two image sources coexist:
- **Local**: `src/assets/` (logo, testimonials) — imported as modules.
- **Cloudinary**: `src/config/cloudinary.ts` exports `img(filename)` / `getCloudinaryUrl(path, opts)`, which build optimized URLs (auto format/quality, progressive, width) from cloud `dfvihcel2`. Prefer this for large gallery/infrastructure photos. `UNUSED_IMAGES.md` tracks assets pending cleanup; image-optimization notes are in `docs/OTIMIZACAO_IMAGENS.md`.

Display helpers: `OptimizedImage`, `ImageZoom`/`GlobalImageZoom`, and several gallery components (`MasonryGrid`, `PinterestGallery`, `FadeCarousel`, `StackedCards`, etc.).

## Modal System

`Modal.tsx` is the generic modal. It can be triggered directly via state or globally via a custom event:
```ts
window.dispatchEvent(new CustomEvent('showDevelopmentModal', { detail: { feature: 'Feature Name' } }))
```
`Navbar` listens for this event to show "in development" notices. Enrollment uses dedicated `ContractModal` and `PDFViewerModal`.

## Environment Variables

Vite env vars (prefix `VITE_`, see `.env.example`):
- `VITE_GOOGLE_APPS_SCRIPT_URL` — backend Web App URL for `submitEnrollment` (required for enrollment to work).
- Legacy EmailJS vars (`VITE_EMAILJS_*`) are only used by the superseded `emailService.ts`.

Setup guides: `docs/INSTRUCOES-CONFIGURACAO.md`, `docs/IMPLEMENTACAO_EMAIL_SHEETS.md`, `docs/EMAILJS_SETUP.md`.

## TypeScript / Lint Notes

Strict mode plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. Because `lint` runs with `--max-warnings 0` and `build` runs `tsc`, unused imports/vars will fail CI — clean them up as you go.
