# 🏝️ Math Island

A 1st-grade math practice web app for a 5-6 year-old, built with [animal-island-ui](https://github.com/guokaigdg/animal-island-ui). English content following Common Core 1st Grade Math. Frontend-only, no backend, no auth — open the URL and play.

## Status: **Phase 1–4 complete** ✅

All 12 skills + all 4 quiz types + audio + streak + review + deploy config shipped.

## Features

- **🗺️ Island map** with 12 skills as buildings, connected by paths
- **Locked / unlocked / current (pulsing) / mastered (with stars)** node states
- **4 quiz types**:
  - Multiple choice (with countable visuals or math expressions)
  - Tap-to-count (collision-free scattered items)
  - Drag-to-match (`@dnd-kit` for iPad touch reliability)
  - Number line (PointerEvents, snap-to-step, keyboard arrows)
- **Audio**: Howler SFX (correct / wrong / celebrate / click / unlock) + Web Speech API TTS reads prompts aloud
- **Stars**: 1-3 stars per session based on accuracy + time
- **XP**: 10 per correct answer + 25 per star
- **🔥 Streak**: daily-play tracker with animated toast on streak grow
- **💡 Review CTA**: surface mastered skills that need refresh (stale > 7 days OR best-accuracy < 80%)
- **🎉 Confetti** on 3-star or new-skill-unlock
- **Settings**: SFX/TTS toggles, English voice picker, reset all
- **Responsive**: iPad portrait to desktop 1440px
- **Persisted** to `localStorage` (no backend)
- **Animal Crossing aesthetic** via `animal-island-ui` (warm parchment, pill buttons, mint teal, organic shapes, Nunito font)

## Run

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm test:run # 65 unit + integration tests
pnpm build    # production build → dist/
```

## Deploy

Pre-configured for Vercel:

```bash
# Option A — Vercel CLI
npx vercel

# Option B — git push to GitHub then connect repo to vercel.com
```

`vercel.json` ships with:
- SPA rewrite (all non-asset routes → `index.html`)
- 1-year immutable cache on `/audio/*` and `/assets/*`

## Stack

- **React 18 + TypeScript strict + Vite 7**
- **React Router 6** (4 routes: island, skill, result, settings)
- **Zustand 5** with `persist` middleware (versioned schema)
- **Framer Motion** for spring animations
- **Howler** for SFX, **canvas-confetti** for celebrations
- **@dnd-kit/core** for accessible drag-and-drop
- **animal-island-ui** for theme + components (Button, Modal, Switch, Cursor, etc.)
- **Vitest + Testing Library** with **65 tests**

## Folder structure

```
src/
├── App.tsx                     # router + cursor + audio prime
├── main.tsx                    # bootstrap + style import
├── components/
│   ├── IslandMap/              # SVG island + skill nodes + connections
│   ├── Layout/                 # TopBar (XP / streak / mute / settings)
│   ├── Quiz/                   # 4 question types + renderer + progress + feedback
│   └── shared/                 # CountableSet (emoji renderer)
├── content/
│   ├── skills.ts               # 12-skill registry
│   ├── skills/*.json           # 12 per-skill question pools (~320 questions)
│   └── content.test.ts         # registry + per-question validator
├── lib/
│   ├── audio.ts                # Howler SFX preload + play
│   ├── speech.ts               # Web Speech TTS wrapper
│   ├── starsCalculator.ts      # accuracy + time → 1/2/3 stars
│   ├── questionGenerator.ts    # shuffle pool → session of 10
│   ├── reviewSuggestion.ts     # surface skills needing review
│   └── *.test.ts
├── routes/
│   ├── IslandHome.tsx
│   ├── SkillSession.tsx        # 10-question orchestrator
│   ├── SessionResult.tsx       # stars + confetti + streak toast + review CTA
│   └── Settings.tsx
├── store/
│   ├── progress.ts             # Zustand persisted store
│   └── progress.test.ts
├── styles/                     # globals + animations.css
└── types/                      # Question, Skill, Progress (TS discriminated unions)
```

## Curriculum (Common Core 1st Grade)

| # | Skill | CC Standard | Quiz types |
|---|---|---|---|
| 1 | Count to 10 | K.CC.A.1 | MC + tap-to-count |
| 2 | Count to 20 | 1.NBT.A.1 | MC + tap-to-count |
| 3 | Number Names 0–20 | K.CC.A.3 | MC |
| 4 | Compare Numbers | 1.NBT.B.3 | MC + number-line |
| 5 | Add within 5 | 1.OA.C.6 | MC |
| 6 | Add within 10 | 1.OA.C.6 | MC + drag-to-match + tap-to-count |
| 7 | Subtract within 5 | 1.OA.C.6 | MC + drag-to-match + tap-to-count |
| 8 | Subtract within 10 | 1.OA.C.6 | MC + drag-to-match + tap-to-count |
| 9 | Add within 20 | 1.OA.C.6 | MC + number-line + drag-to-match |
| 10 | Subtract within 20 | 1.OA.C.6 | MC + number-line + drag-to-match |
| 11 | Number Patterns | 1.OA.D.8 | MC + number-line + drag-to-match |
| 12 | Tens and Ones | 1.NBT.B.2 | MC + drag-to-match + number-line |

**~320 questions total** across all skills.

## Notes & follow-up

- **Audio files** in `public/audio/*.mp3` are functional ffmpeg-generated placeholders. Swap with CC0 sounds (Pixabay, freesound) for production polish. See `public/audio/README.md`.
- **Bundle** ships ~3.8MB main JS + ~1MB CSS (most of which is the animal-island-ui font CSS with Japanese + Chinese fonts pre-embedded). Vendor chunks split (react / framer / dnd / audio). To shrink further, lazy-import `animal-island-ui/style` or trim fonts at the lib level.
- **iPad QA**: drag-to-match uses `TouchSensor` with 80ms delay and 6px tolerance for reliable Safari iOS behavior. Test on a real device before shipping to the child.
- **Phase 5** (parent dashboard, custom worksheets, multi-child, cloud sync) deferred until usage validates the need.

## Plan

Implementation plan: `../animal-island-ui/docs/plans/2026-05-28-feat-math-island-1st-grade-app-plan.md`.
