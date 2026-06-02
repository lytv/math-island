# Math Island production spec: Make 10 First

Project root: /Users/mac/tools/math-island
Output target: /Users/mac/tools/math-island/dist/video/math-island-make-ten-first.mp4
Aspect ratio: 16:9
Resolution: 1280x720
Frame rate: 12 fps
Target duration: 37.8 seconds
Narration track: /Users/mac/.hermes/audio_cache/tts_20260601_095348.mp3

## Production decision
Primary intent was a Manim-style explainer, but the local environment does not currently have `manim` installed. To deliver a real finished artifact now, production will use a custom Python + Pillow frame renderer plus ffmpeg for encoding and audio muxing. The visual treatment still follows the manim-video planning principles:
- geometry and objects before symbols
- large readable typography
- one concept per scene
- clear pauses after reveals
- cohesive palette

## Asset plan
No external art is required.

Generated visual primitives:
- sky gradient
- island hill shapes
- shell counters as colored circles with soft highlights
- equation cards
- challenge badge
- caption ribbon

Fonts:
- Headings and numerals: /System/Library/Fonts/Supplemental/Trebuchet MS.ttf
- Secondary/captions fallback: /System/Library/Fonts/Supplemental/Arial.ttf

## Timing map
1. 0.0-5.0  Hook
2. 5.0-10.0 Eight needs two more
3. 10.0-15.0 Split five into two and three
4. 15.0-21.0 Move two and make ten
5. 21.0-26.0 Solve: ten plus three is thirteen
6. 26.0-34.0 Transfer examples: 9+6 and 7+8
7. 34.0-37.8 Child challenge: 8+6

## Animation rules
- Motions use simple ease-in-out interpolation
- The pair of transferred shells must visibly detach, move, and snap into the row of 10
- Captions never exceed one short sentence
- Equations appear only after the object grouping is legible
- Final challenge holds for at least 2.5 seconds

## Color system
Background:
- Sky top: #9ED8FF
- Sky bottom: #EAF8FF
- Sand: #F6E7B2
- Hill green: #8BCF9B

Math objects:
- Left starting group: #58C4DD
- Transfer pair: #2EC4B6
- Left completed ten: #FFD166
- Leftover three: #FF8C69
- Final answer: #FF5D73

Text:
- Dark ink: #29414F
- White card: #FFFDF7
- Soft shadow: rgba(0,0,0,0.12)

## Rendering pipeline
1. Python script generates numbered PNG frames into `dist/video/frames/make-ten-first/`
2. ffmpeg encodes PNG sequence to H.264 MP4
3. ffmpeg muxes narration audio and trims to shortest stream
4. Verify duration and file existence with ffprobe

## Output files
- Storyboard: /Users/mac/tools/math-island/docs/video/make-ten-first-storyboard.md
- Production spec: /Users/mac/tools/math-island/docs/video/make-ten-first-production-spec.md
- Renderer script: /Users/mac/tools/math-island/scripts/make_ten_first_video.py
- Frames dir: /Users/mac/tools/math-island/dist/video/frames/make-ten-first/
- Final mp4: /Users/mac/tools/math-island/dist/video/math-island-make-ten-first.mp4

## Verification checklist
- Final mp4 exists
- Video opens and has non-zero duration
- Narration is present
- The transfer from 5 -> 2 + 3 is clearly visible
- The equation 8 + 5 = 13 is displayed
- The challenge frame 8 + 6 = ? is visible at the end
