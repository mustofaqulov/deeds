# Repository Guidelines

## Project Structure & Module Organization
- `src/main.jsx` bootstraps React; `src/App.jsx` defines routing and providers.
- `src/pages/<PageName>/` holds route screens (example: `src/pages/Qibla/Qibla.jsx`).
- `src/components/<Feature>/` holds reusable UI pieces.
- `src/context/` stores React context providers (Auth, Theme).
- `src/utils/` stores shared helpers and static data (example: `quranData.js`).
- `src/assets/` holds bundled assets; `public/` holds static files copied as-is.
- `quran.json` is the Quran dataset used by utilities.
- `dist/` is the production build output.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server with HMR.
- `npm run build` creates a production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint (flat config).

## Coding Style & Naming Conventions
- React 19 + React Router, ESM modules, function components and hooks.
- Indentation: 2 spaces; use semicolons and single quotes (see `src/App.jsx`).
- Component/page folders and files use `PascalCase` (example: `src/pages/Calendar/Calendar.jsx`).
- Keep component CSS next to components; global styles live in `src/index.css`.
- Lint rules live in `eslint.config.js`; fix lint before PRs.

## Testing Guidelines
- No automated tests are configured.
- Validate changes manually in the browser and run `npm run lint`.
- If you add tests, add scripts in `package.json` and document how to run them.

## Commit & Pull Request Guidelines
- Git history is not available in this workspace (no `.git`), so no established commit convention is visible.
- Use concise Conventional Commit subjects (example: `feat: add streak badge`).
- PRs should include a summary, manual test steps, and screenshots for UI changes.
- Call out any changes to data shape or `localStorage` keys in the PR description.

## Security & Configuration Tips
- Client-only app; user data persists in `localStorage` (see `src/context/AuthContext.jsx`).
- Do not store secrets in repo. Use `.env` with Vite `VITE_`-prefixed keys when needed.
