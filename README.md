# 🏝️ Math Island

A 1st-grade math practice web app for a 5-6 year-old, built with [animal-island-ui](https://github.com/guokaigdg/animal-island-ui). English content following Common Core 1st Grade Math. Frontend-only, no backend, no auth — open the URL and play.

## Status

**Phase 1 — Foundation scaffolded** ✅

- Project + tooling (Vite + React 18 + TypeScript strict)
- Zustand-persisted progress store with XP, streak, mastery
- Type-safe quiz schema (multiple-choice / tap-to-count / drag-to-match / number-line)
- Skill registry (12 Common Core skills with prereq graph)
- Sample content: `count-to-10` skill with 32 questions
- Audio + Web Speech helpers (SFX via Howler, TTS via SpeechSynthesis)
- Stars calculator + question generator with unit tests
- App routes: `/` (island map), `/skill/:id`, `/result`, `/settings`
- Placeholder geometric island map (SVG) with locked / unlocked / current / mastered states
- Top bar with XP, streak, mute toggle, settings
- 19 tests passing

**Next:** quiz engine (multiple-choice + tap-to-count components), result screen, audio assets.

## Run

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm test:run # unit tests
pnpm build    # production build
```

## Stack

- React 18, TypeScript strict, Vite 7
- React Router 6
- Zustand 5 (persisted to `localStorage`)
- Framer Motion (animations)
- Howler (SFX)
- canvas-confetti (celebration)
- `animal-island-ui` (component library)
- Vitest + Testing Library

## Folder structure

```
src/
├── App.tsx                     # router + cursor + top bar
├── main.tsx                    # bootstrap + style import
├── components/
│   ├── IslandMap/              # SVG island + skill nodes
│   ├── Layout/                 # TopBar
│   ├── Quiz/                   # (next sprint)
│   └── shared/
├── content/
│   ├── skills.ts               # 12-skill registry
│   └── skills/*.json           # per-skill question pools
├── lib/                        # audio, speech, stars, question gen
├── routes/                     # IslandHome, SkillSession, Result, Settings
├── store/                      # Zustand progress store + tests
├── styles/                     # globals + keyframes
└── types/                      # Question, Skill, Progress
```

## Curriculum

12 skills mapped to Common Core 1st Grade Math standards. See `src/content/skills.ts`.

## Plan

Full implementation plan: `../animal-island-ui/docs/plans/2026-05-28-feat-math-island-1st-grade-app-plan.md`.
