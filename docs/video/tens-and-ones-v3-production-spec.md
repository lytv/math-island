# Math Island production spec V3: 1 Ten and 5 Ones

Project root: /Users/mac/tools/math-island
Concept focus: What number is 1 ten and 5 ones?
Skill source: /Users/mac/tools/math-island/src/content/skills/place-value.json
Skill registry: /Users/mac/tools/math-island/src/content/skills.ts
Primary output target: /Users/mac/tools/math-island/dist/video/math-island-tens-and-ones-v3.mp4
Suggested renderer path: /Users/mac/tools/math-island/scripts/tens_and_ones_video_v3.py
Suggested frame directory: /Users/mac/tools/math-island/dist/video/frames/tens-and-ones-v3/
Reference style docs:
- /Users/mac/tools/math-island/docs/video/make-ten-first-v2-storyboard.md
- /Users/mac/tools/math-island/docs/video/make-ten-first-v2-production-spec.md
Reference implementation/style cues:
- /Users/mac/tools/math-island/src/components/IslandMap/IslandMap.tsx
- /Users/mac/tools/math-island/src/components/IslandMap/SkillNode.tsx
- /Users/mac/tools/animal-island-ui/src/components/Button/button.module.less
- /Users/mac/tools/animal-island-ui/src/components/Card/card.module.less
- /Users/mac/tools/animal-island-ui/src/styles/variables.less
- /Users/mac/tools/animal-island-ui/src/styles/themes/default.less

Resolution: 1280x720
Frame rate: 12 fps
Target duration: 34 to 42 seconds
Audience: ages 5-6
Render stack: Python + Pillow + ffmpeg
Audio approach: short custom narration matched to scene timing; if narration is not recorded yet, render silent draft first and lock visuals before TTS

## V3 teaching goal
Teach that teen numbers are built from one group of ten plus some extra ones.

Single hero problem:
- What number is 1 ten and 5 ones?

Desired child takeaway:
- A ten is a full bundle of 10
- Ones are extra single items
- 1 ten + 5 ones = 15
- Teen numbers can be built, not just memorized

## Why this is the right V3 problem
This comes directly from the repo's place-value skill and is one of the strongest next concepts after make-10 addition.

Repo evidence:
- skill listed as "Tens and Ones" in /Users/mac/tools/math-island/src/content/skills.ts
- README lists skill 12 as "Tens and Ones"
- question pool includes:
  - "1 ten + 4 ones = ?"
  - "What number is 1 ten and 5 ones?"
  - "Which is bigger: 1 ten or 9 ones?"

Pedagogical reason:
- it introduces structure inside teen numbers
- it is concrete and highly visual
- it supports later addition/subtraction and place-value fluency
- it fits the Math Island world naturally through bundles and collectibles

## V3 design intent
V3 should feel even more like a true Math Island lesson than V2.

This time the world should not just be a pretty background. The island environment should actively support the concept:
- a "ten hut" or bundle station represents a complete ten
- a small beach area or shell trail represents loose ones
- a signboard or number plaque reveals the final teen number
- the math idea should feel like building something on the island

The emotional tone should be:
- calm
- cozy
- proud
- playful
- very readable

## Visual style direction
### Core aesthetic
Use the same Math Island / animal-island-ui language established in V2:
- radial ocean gradients
- rounded island shapes
- cream/parchment cards
- warm brown text
- mint/teal accents
- toy-like badges and shadows
- gentle sparkles, shells, flowers, and signboards

### Palette targets
Use these as guiding anchors, not rigid limits:
- mint/teal accent: #19c8b9
- warm brown text: #794f27
- secondary brown: #725d42
- cream card: #f8f8f0
- parchment card: #f0e8d8
- off-white highlight: #fdfdf5
- sandy beige: #e8d3a8 to #d9bf86
- ocean blues: soft cyan through deeper turquoise/blue
- answer accent: warm coral-pink or playful berry, used sparingly on the final number 15

### Typography
- Heading font: rounded, child-friendly, thick, same family direction as V2
- Body font: highly legible sans/rounded font
- Numbers must be oversized and instantly readable
- Avoid overly decorative lettering in instructional text

### Shape language
- very rounded rectangles
- thick but soft outlines
- layered shadows
- circular or blob-like counters
- badge discs for tiny labels like "10" or "ones"

## Core visual metaphor
Represent the concept using island objects the child can visually group.

Preferred metaphor:
- 1 ten = one tied bundle of 10 shells or 10 sticks in a crate/basket
- 5 ones = five loose shells/stars/fruits beside it
- final number = the bundle plus the loose singles together make 15

Best option for V3:
- Use one "bundle crate" holding 10 shell tokens, clearly marked with a friendly badge: "10"
- Use 5 loose shell tokens to the right, separated enough to count at a glance
- Reveal the total by combining the visual groups under a large signboard: 15

Important rule:
The child must be able to distinguish "a full ten" from "single ones" immediately, before hearing the narration.

## Scene structure
Use a 7-scene structure similar in rhythm to V2, but tailored to place value.

### Scene 1 — Welcome to the Tens Hut
Time: 0.0s to 4.5s
Purpose:
- Introduce the island lesson and hero question
Visuals:
- ocean and island clearing
- small themed building or kiosk labeled "Tens Hut"
- title sign: Math Island
- main card: What number is 1 ten and 5 ones?
- one full bundle on left, five loose shells on right, but answer still hidden
Narration beat:
- Let's build a number on Math Island.
- What number is 1 ten and 5 ones?

### Scene 2 — Look at the ten
Time: 4.5s to 9.5s
Purpose:
- Make "one ten" concrete
Visuals:
- zoom focus or visual emphasis on the ten bundle
- soft pulse/glow on bundle badge labeled 10
- nearby mini caption: 1 ten means 10
- the five ones remain visible but dimmer
Narration beat:
- This full bundle is one ten.
- One ten means ten.

### Scene 3 — Count the ones
Time: 9.5s to 14.5s
Purpose:
- Make the extra ones concrete and countable
Visuals:
- the five loose items bounce in one by one or glow in count order
- tiny counting markers or sparkle taps: 1, 2, 3, 4, 5
- mini wooden label: 5 ones
Narration beat:
- These are the extra ones.
- Let's count them: 1, 2, 3, 4, 5.

### Scene 4 — Put the parts together
Time: 14.5s to 20.5s
Purpose:
- Show that the number is built from parts
Visuals:
- equation strip or signboard appears: 10 + 5 = ?
- the ten bundle slides left under the 10
- the five ones slide right under the 5
- island path or dotted guide line links both groups to the total box
Narration beat:
- So we have ten and five more.
- Ten plus five.

### Scene 5 — Reveal the teen number
Time: 20.5s to 26.5s
Purpose:
- Deliver the answer with delight and confidence
Visuals:
- big answer plaque flips or pops in: 15
- equation becomes 10 + 5 = 15
- the number 15 uses special accent color and gentle star burst
- small subtitle card: 1 ten and 5 ones is 15
Narration beat:
- Ten plus five is fifteen.
- So 1 ten and 5 ones is 15.

### Scene 6 — Fast transfer examples
Time: 26.5s to 34.0s
Purpose:
- Show the concept is reusable
Visuals:
- two mini lesson cards side by side like island stops
- card A: 1 ten + 2 ones = 12
- card B: 1 ten + 8 ones = 18
- same bundle icon reused to reinforce the rule
Narration beat:
- The ten stays the same.
- Only the ones change.
- One ten and two ones is twelve.
- One ten and eight ones is eighteen.

### Scene 7 — Your turn
Time: 34.0s to 38.0s
Purpose:
- Invite participation and prime the next lesson
Visuals:
- challenge signboard: Your turn: 1 ten and 3 ones = ?
- one bundle plus three loose shells shown clearly
- empty answer bubble with soft pulse
Narration beat:
- Your turn.
- What number is 1 ten and 3 ones?

## Storyboard quality bar
Every scene should satisfy all of these:
- the child can tell what to look at in under 1 second
- the math is always more prominent than decoration
- the distinction between tens and ones is never ambiguous
- the world feels like Math Island, not a generic math slide

## Motion language
Use soft, toy-like motion rather than fast transitions.

Preferred motion patterns:
- gentle pop-in for labels
- slight bounce for loose ones
- slow slide for grouping and equation alignment
- sparkle burst for the final answer only
- subtle pulsing glow for active focal objects

Avoid:
- rapid camera movement
- cluttered particle effects
- too many simultaneous animations
- anything that makes the counting harder

## Environment details
Use environment details to frame the lesson, not compete with it.

Recommended recurring details:
- ocean gradient top band
- rounded green island blob or clearing
- sandy center lesson stage
- tiny flowers or shells near bottom corners
- one or two sticker stars in corners
- a dotted footpath between lesson objects
- one small building silhouette or hut for the tens area

Do not place heavy decorative details inside the core counting zone.

## Layout rules
### Primary composition
- left side: ten bundle / tens hut zone
- right side: loose ones zone
- center or upper center: question/answer card
- bottom edges: decorative details only

### Safe teaching area
Reserve a calm central band for:
- the hero question
- the 10 + 5 equation
- the final answer 15

### Readability rules
- numbers must remain readable on a laptop from several feet away
- no low-contrast text on detailed backgrounds
- counters must be countable without effort
- if a child might misread the bundle as random decoration, the design has failed

## Narration spec
Narration should be shorter and simpler than the make-10 video.

Target duration:
- 30 to 40 seconds total

Target voice qualities:
- warm
- patient
- bright
- not babyish

Draft narration outline:
1. Let's build a number on Math Island.
2. What number is 1 ten and 5 ones?
3. This full bundle is one ten.
4. One ten means ten.
5. These are the extra ones.
6. One, two, three, four, five.
7. So we have ten and five more.
8. Ten plus five is fifteen.
9. One ten and five ones is fifteen.
10. Your turn: what number is 1 ten and 3 ones?

If timing gets tight, compress lines 7-9 into one sentence.

## Renderer implementation plan
Suggested script responsibilities:
- shared background and island environment drawing
- reusable bundle-drawing function for a full ten
- reusable loose-ones drawing function
- reusable signboard/card function
- animation helpers for glow, bounce, and answer reveal
- per-scene render functions with stable frame counts

Recommended functions:
- draw_scene_common()
- draw_ten_bundle(draw, x, y, scale, badge=True)
- draw_loose_ones(draw, x, y, count, layout='arc')
- draw_signboard(...)
- draw_answer_plaque(...)
- render_scene_1(... ) through render_scene_7(...)

If building from V2 patterns, reuse the environment and card language, but do not force the add-within-20 visual logic onto this concept.

## Asset and object guidance
Preferred countable items:
- shells
- stars
- fruit tokens
- pebbles

Best recommendation:
- shells for ones
- shell crate or tied shell bundle for the ten

Avoid:
- emoji-dependent objects
- highly detailed icons that blur at small sizes
- mixed metaphor objects in the same equation unless deliberate

## Verification checklist
Before delivery, verify with real tool output:
- final MP4 exists at the target path
- frame sequence directory exists
- ffprobe confirms duration, resolution, frame rate, codecs
- sample frames extracted from:
  - Scene 1 hook
  - Scene 4 equation build
  - Scene 5 answer reveal
  - Scene 7 challenge
- visual review confirms:
  - ten bundle reads instantly as a grouped 10
  - five ones are easy to count
  - final 15 is visually dominant
  - no broken glyphs
  - no clutter in the teaching zone

## Deliverables
Minimum deliverables for the full V3 production pass:
- storyboard markdown file
- production spec markdown file
- renderer script
- final MP4
- 3 to 4 extracted review frames
- verification notes with actual ffprobe output

## Suggested filenames
- Storyboard: /Users/mac/tools/math-island/docs/video/tens-and-ones-v3-storyboard.md
- Production spec: /Users/mac/tools/math-island/docs/video/tens-and-ones-v3-production-spec.md
- Renderer: /Users/mac/tools/math-island/scripts/tens_and_ones_video_v3.py
- Final video: /Users/mac/tools/math-island/dist/video/math-island-tens-and-ones-v3.mp4

## Success criteria
This V3 is successful if:
- the video unmistakably belongs to the Math Island world
- a 5-6 year-old can visually understand the difference between a ten and ones
- the final answer 15 feels obvious and satisfying
- the transfer examples make the rule reusable
- the challenge frame naturally sets up a follow-up lesson or short series
