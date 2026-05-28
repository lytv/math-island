# 🏝️ Math Island

A 1st-grade math practice web app for a 5-6 year-old, built with [animal-island-ui](https://github.com/guokaigdg/animal-island-ui). English content following Common Core 1st Grade Math. Frontend-only, no backend, no auth — open the URL and play.

## Status

**Phase 1 MVP — playable end-to-end** ✅

- Vite + React 18 + TypeScript strict + path alias `@/`
- Zustand-persisted progress store (XP, streak, mastery, settings)
- Type-safe quiz schema with 4 question types
- 12-skill Common Core registry with prereq graph
- **5 skills with 30+ questions each** (count-to-10, count-to-20, recognize-0-20, compare-numbers, add-within-5)
- Audio (Howler SFX) + Web Speech TTS with autoplay-prime gesture
- App routes: `/` (island map), `/skill/:id`, `/result`, `/settings`
- Placeholder SVG island map: locked / unlocked / current (pulsing) / mastered (with star count)
- Top bar: XP, streak, mute toggle, settings
- **Quiz engine**: MultipleChoiceQ + TapToCountQ + QuestionRenderer dispatch
- **ProgressBar** (10-dot tracker, color-coded), **FeedbackOverlay** (✓ green / ✗ red shake with reveal)
- **SkillSession** orchestrates 10-question session, dynamic-imports skill JSON, records to store
- **SessionResult**: animated 1-3 stars, accuracy/time/XP stats, canvas-confetti celebration, newly-unlocked-skill banner, Play again / Back CTAs
- **Content validator tests** ensure every multiple-choice has answer ∈ options
- **38 tests passing** (lib + store + content)

**Phase 2 — Add/Subtract within 10 + Drag-to-match** ✅

- 3 new skills (`add-within-10`, `subtract-within-5`, `subtract-within-10`) with 30+ questions each
- **DragToMatchQ** component (@dnd-kit/core + PointerSensor + TouchSensor for iPad)
- Draggable number tiles → drop on countable target groups; hover/filled visual feedback
- Validator covers drag-to-match (pairs ↔ counts agreement, indices in range)
- **47 tests passing**

**Next sprints:** audio MP3 assets, NumberLineQ + Phase 3 skills (add/subtract within 20), responsive QA on iPad Safari, deploy to Vercel.

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
