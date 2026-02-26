# Technical Specification: Qur'on Hifz Challenge — "Become a Hafiz" Page

## 1. Overview & Goal

Build a dedicated, beautifully designed page where users can memorize the Qur'an surah by surah, track their progress across all 30 juz, learn proven memorization methods, and earn XP for every surah they memorize. This page must be the most spiritually refined, visually stunning, and functionally complete page in the entire app — befitting the sacredness of the Qur'an.

**Route:** `/quran-hifz`
**UI Language:** Uzbek
**XP:** Awarded per surah memorized
**Persistence:** `localStorage` key: `quran_hifz_progress`

---

## 2. File Structure

```
src/pages/QuranHifz/
├── QuranHifz.jsx                  # Main page container
├── QuranHifz.css                  # All styles for this page
└── components/
    ├── HifzHeader.jsx             # Hero section: circular progress + stats
    ├── JuzGrid.jsx                # 30-juz card grid
    ├── SurahList.jsx              # Surah list inside an expanded juz
    ├── SurahCard.jsx              # Individual surah row/card
    ├── SurahDetailPanel.jsx       # Side panel shown when surah is clicked
    ├── MethodsModal.jsx           # Full-screen memorization methods modal
    ├── VideoModal.jsx             # YouTube embed modal per surah
    ├── MilestonePopup.jsx         # Popup at 10 / 30 / 60 / 114 surahs
    └── HifzStats.jsx              # Statistics section at bottom
```

```
src/utils/
└── quranData.js                   # All static Qur'an data (surahs + juzs)
```

---

## 3. Data Model

### 3.1 `quranData.js` — Static Data File

```js
export const SURAHS = [
  {
    id: 1,
    nameAr: "الفاتحة",
    nameUz: "Fotiha",
    nameTranslit: "Al-Fatiha",
    juz: 1,
    ayahCount: 7,
    type: "Makkiy",       // "Makkiy" | "Madaniy"
    difficulty: 1,        // 1 = Easy | 2 = Medium | 3 = Hard
    xp: 50,
    tips: "The most recited surah in Islam. Recited 17 times daily in prayer.",
    youtubeId: "..."      // YouTube video ID for this surah's lesson
  },
  // ... all 114 surahs
];

export const JUZS = [
  {
    id: 1,
    name: "Alif Lam Mim",
    surahIds: [1, 2],
    ayahRange: "1:1 – 2:141"
  },
  // ... all 30 juzs
];
```

**XP Scale by difficulty:**
- Easy (difficulty: 1) → 50 XP
- Medium (difficulty: 2) → 100 XP
- Hard (difficulty: 3) → 200 XP

### 3.2 `localStorage` Schema — `quran_hifz_progress`

```js
{
  userId: "string",
  memorizedSurahs: [1, 7, 36],         // Array of memorized surah IDs
  startedAt: "2024-03-01",
  lastActivity: "2024-03-15",
  milestonesSeen: [10],                 // Which milestone popups have been shown
  totalXpEarned: 1150                   // XP earned from this challenge only
}
```

---

## 4. XP Integration with AuthContext

When the user clicks "I Memorized This!" on a surah:
1. Add surah ID to `memorizedSurahs` in `quran_hifz_progress`
2. Call `addXp(surah.xp)` from `AuthContext`
3. Trigger confetti + sound (reuse existing `sound.js` helpers)
4. Check milestone thresholds → show `MilestonePopup` if triggered

Undo action:
1. Remove surah ID from `memorizedSurahs`
2. Call `removeXp(surah.xp)` from `AuthContext` (add this method if not present)
3. No confetti on undo

---

## 5. UI Sections — Detailed Breakdown

### 5.1 Page Background & Atmosphere

The page should feel like opening an ancient illuminated manuscript. Use:
- A soft radial gradient background using the app's existing CSS variables
- Subtle geometric Islamic pattern overlay (SVG, very low opacity: 0.04)
- Gold accent color (`--color-gold`) used for all key highlights
- Arabic calligraphy font (`Amiri`) for all Arabic text
- Smooth entrance animations on scroll using `IntersectionObserver`

### 5.2 `HifzHeader` — Hero Section

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│   بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ                       │
│                                                          │
│          🌙  Hofiz bo'l                                  │
│     "Qur'onni yodlaganlar — Allohning xalqi"            │
│                                                          │
│        [Circular Ring: 23 / 114]                         │
│         Surahlar yodlandi                                │
│                                                          │
│  ✦ 1,150 XP    ✦ 7 kun streak    ✦ Juz 3 da            │
│                                                          │
│  Overall progress bar ━━━━━━━━━━░░░░░░░░░░ 20%          │
│                                                          │
│  [📖 Yodlash usullari]      [🎯 Keyingi surah]          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

- Circular SVG progress ring, animated on mount
- Motivational quote from hadith about Qur'an memorization (rotate daily from a list of 10 quotes stored in `quranData.js`)
- "Next surah" button jumps to the first un-memorized surah

### 5.3 `JuzGrid` — 30 Juz Cards

3-column responsive grid (2-col on tablet, 1-col on mobile).

Each `JuzCard` shows:
```
┌─────────────────┐
│   JUZ 1         │
│  Alif Lam Mim   │
│                 │
│  ████████░░ 70% │
│  7 / 10 surah   │
└─────────────────┘
```

**Card states:**
| State | Visual |
|---|---|
| Not started | Dim, grey border, lock icon |
| In progress | Gold border, progress bar, active glow |
| Completed | Gold fill, ✅ checkmark, "Barakalloh!" label, shimmer animation |

Clicking a juz card expands it (accordion) to reveal the surah list below, or navigates to a focused view on mobile.

### 5.4 `SurahList` & `SurahCard`

A list of all surahs within the selected juz. Each row:

```
 ✅  1   الفاتحة   Al-Fatiha    7 oyat  • Oson   • +50 XP   [✓ Yodladim]
 ○   2   البقرة    Al-Baqara  286 oyat  • Qiyin  • +200 XP  [Boshlash]
```

- Arabic name uses Amiri font, right-aligned
- Difficulty shown as colored badge: green (Oson), orange (O'rta), red (Qiyin)
- Memorized surahs show a gold checkmark and are slightly faded to indicate completion
- Clicking a row opens `SurahDetailPanel`

### 5.5 `SurahDetailPanel` — Side Panel / Bottom Sheet

Opens as a right-side panel on desktop, bottom sheet on mobile.

```
┌──────────────────────────────────┐
│  ✕                               │
│                                  │
│       الفاتحة                    │
│     Al-Fotiha                    │
│  7 oyat • Makkiy • Juz 1        │
│                                  │
│  ──────────────────────────────  │
│  💡 Yodlash maslahatlari         │
│                                  │
│  • Har namozda o'qiladi (17x)    │
│  • Avval ma'nosini o'rgan        │
│  • Audio bilan birga ayt         │
│                                  │
│  ──────────────────────────────  │
│  🎥 Video darslik                │
│  [YouTube thumbnail → play]      │
│                                  │
│  ──────────────────────────────  │
│                                  │
│  [✅ Yodladim! +50 XP]           │
│  [↩ Bekor qilish]  (if memorized)│
└──────────────────────────────────┘
```

### 5.6 `MethodsModal` — Memorization Methods

Full-screen modal triggered from the header button. Scrollable. Beautiful card layout.

#### 7 Memorization Methods to Include:

**1. Tikrār — Repetition Method**
- Listen to the surah 3–5 times from a trusted reciter
- Repeat each ayah aloud 7 times
- Before sleep, recite the full surah from memory
- Best for: Short surahs (Juz Amma)

**2. Silsila — Chain Method**
- Memorize ayah 1 → then ayah 2 → recite 1+2 together
- Add ayah 3 → recite 1+2+3 from start
- Continue chaining until the full surah
- Best for: Medium-length surahs

**3. Audio Immersion Method**
- Play a slow reciter on loop (recommended: Sheikh Husary)
- Repeat each ayah silently in your mind while listening
- After 10 listens, attempt to recite without audio
- Best for: Auditory learners

**4. Written Repetition (Kitābat)**
- Write the ayah by hand 3 times
- Cover it and write from memory
- Correct mistakes and repeat
- Best for: Visual learners

**5. Tafsir-First Method**
- Before memorizing, read the meaning in Uzbek
- Understand the story/message of the surah
- Meaning creates mental anchors for memorization
- Best for: Longer, narrative surahs (e.g., Al-Kahf, Yusuf)

**6. Sabaq-Sabqi-Manzil System** *(Classical Madrasah Method)*
- **Sabaq:** New portion memorized today
- **Sabqi:** Yesterday's portion — reviewed 3x
- **Manzil:** Last 7 days' portion — recited once fully
- Best for: Long-term retention and serious students

**7. Spaced Repetition (Modern)**
- Day 1: Memorize surah
- Day 2: Review
- Day 4: Review
- Day 8: Review
- Day 16: Review
- Use the app's built-in streak system to track review days
- Best for: Tech-savvy users, maintaining large hifz

Each method card shows: icon, name, description, difficulty level, and "best for" tag.

### 5.7 `VideoModal` — YouTube Embed

Triggered from `SurahDetailPanel` → "Video darslik" button.

- Embed `https://www.youtube-nocookie.com/embed/{youtubeId}`
- Privacy-enhanced mode (youtube-nocookie)
- Auto-play disabled by default
- Modal has surah name header
- Close button top-right

**Recommended YouTube channels to source video IDs from:**
- Nouman Ali Khan (tafsir + meaning)
- Mishary Rashid Alafasy (recitation)
- Uzbek channels: "Islom Nuri", "Hidoyat TV"

### 5.8 `MilestonePopup`

Triggered when memorized surah count crosses: **10, 30, 60, 114**

```
┌─────────────────────────────┐
│                             │
│          🏆                  │
│                             │
│   Tabriklaymiz!             │
│   30 ta Surah Yodlandingiz! │
│                             │
│   Siz endi "Hofiz Talabi"   │
│   darajasiga yetdingiz!     │
│                             │
│   +500 Bonus XP 🎉          │
│                             │
│        [Davom etish]        │
└─────────────────────────────┘
```

**Milestone definitions:**
| Surahs | Title (Uzbek) | Bonus XP |
|---|---|---|
| 10 | Boshlovchi Hofiz | +200 XP |
| 30 | Hofiz Talabi | +500 XP |
| 60 | Hofiz | +1000 XP |
| 114 | Hofizul Qur'on 🏅 | +3000 XP |

Confetti + level-up sound on milestone popup.

### 5.9 `HifzStats` — Statistics Panel

Bottom section of the page:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  114 / 114   │   6,236      │   30 / 30    │   23 kun     │
│  Surahlar    │   Oyatlar    │   Juzlar     │   Streak     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

Also include:
- A horizontal bar showing progress per juz (like a mini-map)
- "Eng qiyin surahlar" — list of 5 hardest surahs not yet memorized
- "So'nggi yodlangan" — last 3 memorized surahs with date

---

## 6. Visual Design Specifications

### Color Usage
```css
/* Use existing CSS variables */
--color-gold        /* Primary accent — borders, checkmarks, progress rings */
--color-bg          /* Page background */
--color-card-bg     /* Card backgrounds */
--color-text        /* Main text */
--color-text-muted  /* Secondary labels */
```

### Typography
```css
/* Arabic text */
font-family: 'Amiri', serif;
direction: rtl;
font-size: 1.6rem; /* surah names in list */
font-size: 2.4rem; /* surah name in detail panel */

/* Uzbek UI text */
font-family: existing app font;
```

### Animations
| Element | Animation |
|---|---|
| Page mount | Fade in + slide up (300ms) |
| Juz card expand | Smooth accordion (250ms ease) |
| Surah memorized | Gold flash + checkmark scale-in |
| Progress ring | Counter animation on mount |
| Milestone popup | Scale in from center + backdrop blur |
| Confetti | Reuse existing confetti utility |

### Islamic Geometric Pattern
SVG background pattern — very subtle, opacity 0.04. Use a 6-pointed star / arabesque pattern tiled across the page background.

---

## 7. Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| Desktop (>1024px) | 3-col juz grid, side panel for surah detail |
| Tablet (768–1024px) | 2-col juz grid, bottom sheet for detail |
| Mobile (<768px) | 1-col, full-screen surah detail, stacked stats |

---

## 8. Integration Checklist

- [ ] Add `/quran-hifz` route in `App.jsx`
- [ ] Add nav link in sidebar/navbar (icon: 📖 or mosque icon)
- [ ] `addXp()` called on surah memorization via `AuthContext`
- [ ] `removeXp()` method added to `AuthContext` if not present
- [ ] `sound.js` — play completion sound on memorization
- [ ] `sound.js` — play level-up sound on milestone
- [ ] Confetti triggered on memorization + milestone
- [ ] `quranData.js` created with all 114 surahs + 30 juzs
- [ ] `quran_hifz_progress` persisted to localStorage independently of main user object
- [ ] Page accessible only to authenticated users (redirect to `/login` if not)

---

## 9. Out of Scope (Future Features)

- Audio player built into the app (currently links to YouTube)
- AI-based memorization testing / quizzing
- Social features (compare progress with friends)
- Push notification reminders
- Offline audio caching

---

## 10. Definition of Done

- All 114 surahs listed with correct juz assignment, ayah count, and difficulty
- User can mark any surah as memorized and receive XP
- User can undo memorization
- Progress persists across sessions via localStorage
- Milestone popups appear exactly once per threshold
- All 7 memorization methods visible and readable
- YouTube videos embeddable per surah
- Page renders correctly on mobile, tablet, and desktop
- No console errors
- Visually consistent with the app's existing light/dark theme system
