# Audio assets

These are **placeholder SFX** generated locally via ffmpeg sine-wave synthesis. They are functional but unpolished.

For a better experience, replace with CC0 / royalty-free sounds:

- **Pixabay**: https://pixabay.com/sound-effects/ (search "correct", "wrong", "celebrate", "click", "unlock")
- **Freesound** (CC0 filter): https://freesound.org/search/?q=success&f=license:%22Creative+Commons+0%22

Required filenames (kept as-is by `src/lib/audio.ts`):

| File | Purpose | Suggested replacement |
|---|---|---|
| `correct.mp3` | Right answer ding | Short pleasant chime, 0.2–0.4s |
| `wrong.mp3` | Wrong answer buzz | Soft "uh-oh", not harsh, 0.2–0.4s |
| `celebrate.mp3` | 2★/3★ session end | Fanfare/sparkle, 0.5–1.0s |
| `click.mp3` | Tap/select | UI tick, <0.1s |
| `unlock.mp3` | New skill unlocked | Magic chime, 0.3–0.5s |

Keep each file under 50 KB. After replacing, no code changes needed — `audio.ts` reads from `/audio/<name>.mp3`.
