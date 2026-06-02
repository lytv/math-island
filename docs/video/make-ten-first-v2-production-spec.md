# Math Island production spec V2: Make 10 First

Project root: /Users/mac/tools/math-island
Output target: /Users/mac/tools/math-island/dist/video/math-island-make-ten-first-v2.mp4
Base renderer: /Users/mac/tools/math-island/scripts/make_ten_first_video.py
V2 renderer: /Users/mac/tools/math-island/scripts/make_ten_first_video_v2.py
Narration track: /Users/mac/.hermes/audio_cache/tts_20260601_095348.mp3
Resolution: 1280x720
Frame rate: 12 fps
Target duration: 37.752 seconds

## V2 design intent
This version should feel more like the real Math Island app and animal-island-ui palette.

Reference cues pulled from the codebase:
- primary mint/teal: #19c8b9
- warm text brown: #794f27 / #725d42
- parchment/cream cards: #f8f8f0 / #f0e8d8 / #fdfdf5
- island map gradients: ocean blues + green island blob + sandy beige
- round, toy-like buttons/cards with thick borders and shadows

## Upgrade list over V1
- richer island background with shoreline, path, flowers, and palms
- more themed cards/signboards inspired by animal-island-ui button/card shapes
- friendlier rounded heading font
- shell counters styled to look more like collectible island tokens
- extra sparkles and landmark badges in transfer / answer / challenge scenes
- output saved as a separate V2 artifact

## Rendering strategy
Use the V1 renderer as a functional base, then theme the visuals by overriding:
- colors
- fonts
- card rendering
- title rendering
- shell styling
- background/environment drawing
- scene chrome and small decorative overlays

## Verification checklist
- final V2 MP4 exists
- duration remains ~37.752s
- video contains audio
- visual style is noticeably prettier and more island-like than V1
- math legibility remains strong in hook, make-10, and final challenge scenes
