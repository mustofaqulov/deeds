# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build → dist/
npm run preview   # Serve production build locally
npm run lint      # ESLint (flat config)
npm install       # Install dependencies
```

No test framework is configured.

## Architecture

**Tech Stack:** React 19, React Router DOM 7, Vite 7, CSS3 with CSS variables, localStorage for persistence. No backend — fully client-side.

**Entry points:** `src/main.jsx` → `src/App.jsx`

### Provider hierarchy

```
ThemeProvider (ThemeContext)
  └── AuthProvider (AuthContext)
        └── BrowserRouter → Routes
```

### Context

- **AuthContext** (`src/context/AuthContext.jsx`): All user data, login/register/logout, XP calculation, streak tracking. Reads/writes `ramadan_users` (all users array) and `ramadan_user` (current session) in localStorage.
- **ThemeContext** (`src/context/ThemeContext.jsx`): Light/dark/auto theme. Auto mode switches based on prayer time window (Saharlik/Iftor). Persists to `ramadan_theme` in localStorage.

### Pages (11 total, all in `src/pages/`)

`Dashboard`, `Calendar`, `Challenges`, `IftorSaharlik`, `Profile`, `QuranHadith`, `Tasbeh`, `Qibla`, `Videos`, `Auth/Login`, `Auth/Register`

Unauthenticated users are redirected to `/login`. Post-login, first-time users see the Onboarding flow before reaching Dashboard.

### Key utilities (`src/utils/`)

- **constants.js** — Level definitions (6 levels: Murid→Vali), preset challenges, Duas, Ayahs, Uzbek city list
- **helpers.js** — `calculateLevel(xp)`, `getRamadanDay()`, streak calculation, time formatting
- **sound.js** — Audio feedback for challenge completion, level-up, undo
- **quotes.js** / **videoData.js** — Static content

### Styling

Pure CSS with CSS variables for theming (`src/index.css` and per-component CSS files). No CSS framework.

- Light: gold `#D4920A`, bg `#FFF7E8`
- Dark: gold `#F5B731`, bg `#050D18`
- Arabic text uses Amiri font (RTL); UI language is Uzbek

### Data model (user object in localStorage)

```js
{
  id, name, email, password,  // password stored plaintext — no backend
  city, xp, heartPercent,
  activeChallenges: [],
  completedDays: { "YYYY-MM-DD": [challengeIds] },
  streak, longestStreak, dailyGoal,
  soundEnabled, onboardingDone, joinedAt
}
```

XP drives a 6-level progression system. `heartPercent` ("Qalb nuri") reflects daily commitment. Challenges can be completed/undone per day and trigger confetti + sound on completion.
