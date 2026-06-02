"""Math Island "Tens and Ones" V4 — animated, image-based renderer.

Follows the V3 storyboard (scripts/tens_and_ones_video_v3.py) but instead of
drawing flat vector art it uses the 7 finished GPT illustrations in
scripts/assets/tens-and-ones-v4/ (scene1.png .. scene7.png) as full-frame art,
with:
  - Ken Burns FILL motion (each 3:2 image cropped to 16:9, slow pan/zoom),
  - smooth crossfades between scenes,
  - a per-scene animated FX overlay (sparkles, glow rings, pop-in count
    badges 1..5, a drawn-on dotted path, a star burst on the 15 reveal),
  - edge-tts narration whose spoken length drives each scene's dwell time.

The art already carries every number/label, so overlays add MOTION only and
never re-print baked-in text.

Env notes (see project memory): dist/ is auto-cleaned between turns, so source
art lives under scripts/assets/. System python is PEP-668 locked, so narration
uses the edge-tts CLI (not the python module).
"""
from __future__ import annotations

import math
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

# ---------------------------------------------------------------------------
# Paths / config
# ---------------------------------------------------------------------------
ROOT = Path('/Users/mac/tools/math-island')
IMAGES_DIR = ROOT / 'scripts/assets/tens-and-ones-v4'
OUTPUT_DIR = ROOT / 'dist/video'
FRAMES_DIR = OUTPUT_DIR / 'frames/tens-and-ones-v4'
SILENT_VIDEO = OUTPUT_DIR / 'math-island-tens-and-ones-v4-silent.mp4'
FINAL_VIDEO = OUTPUT_DIR / 'math-island-tens-and-ones-v4.mp4'
NARRATION = OUTPUT_DIR / 'tens-and-ones-v4-narration.mp3'

EDGE_TTS = '/Users/mac/miniconda3/bin/edge-tts'
VOICE = 'en-US-AriaNeural'
RATE = '-5%'
PITCH = '+10Hz'

WIDTH, HEIGHT = 1280, 720
FPS = 30
TRANSITION = 18          # crossfade frames (~0.6s)
TARGET_AR = WIDTH / HEIGHT

LEAD_IN = 0.6            # silence before a line starts within its scene
TAIL = 1.2              # breathing room after a line
MIN_DWELL = 4.2         # floor on scene duration (seconds)

# Palette (mirrors the V3 renderer)
MINT = (25, 200, 185)
GOLD = (245, 195, 28)
ANSWER = (236, 118, 141)

# Narration: one line per scene (verbatim from the V3 spec).
NARRATION_LINES = [
    "Let's build a number on Math Island. What number is 1 ten and 5 ones?",
    "This full bundle is one ten. One ten means ten.",
    "These are the extra ones. Let's count. One, two, three, four, five.",
    "So we have ten and five more. Ten plus five.",
    "Ten plus five is fifteen. So one ten and five ones is fifteen.",
    "The ten stays the same. Only the ones change. "
    "One ten and two ones is twelve. One ten and eight ones is eighteen.",
    "Your turn. What number is one ten and three ones?",
]

# Ken Burns per scene: (scale_start, scale_end, cx0, cy0, cx1, cy1)
# scale = fraction of source width used (smaller = more zoom-in);
# cx/cy = pan center as fraction of allowable range (0.5 = middle).
KEN_BURNS = [
    (1.00, 0.90, 0.50, 0.42, 0.50, 0.32),  # S1 push in toward the question card
    (0.96, 0.84, 0.34, 0.52, 0.28, 0.52),  # S2 push into the left bundle
    (0.92, 0.86, 0.62, 0.55, 0.74, 0.55),  # S3 drift right across the 5 ones
    (0.86, 0.96, 0.50, 0.55, 0.50, 0.42),  # S4 pull back toward center equation
    (0.84, 0.98, 0.50, 0.45, 0.50, 0.45),  # S5 gentle pull back from the 15
    (0.92, 0.88, 0.32, 0.55, 0.70, 0.55),  # S6 pan across the two cards
    (0.98, 0.88, 0.50, 0.50, 0.50, 0.42),  # S7 push into the answer bubble
]


# ---------------------------------------------------------------------------
# Small animation primitives (mirrors make_ten_first_video.py)
# ---------------------------------------------------------------------------
def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def ease(x: float) -> float:
    x = clamp(x)
    return x * x * (3 - 2 * x)


def lerp(a: float, b: float, p: float) -> float:
    return a + (b - a) * p


def rgba(rgb, a: int = 255):
    return (rgb[0], rgb[1], rgb[2], a)


def draw_sparkles(draw, centers, color=(255, 244, 180), scale=1.0, alpha=220):
    for x, y in centers:
        s = 10 * scale
        draw.line((x - s, y, x + s, y), fill=rgba(color, alpha), width=2)
        draw.line((x, y - s, x, y + s), fill=rgba(color, alpha), width=2)
        draw.ellipse((x - 3, y - 3, x + 3, y + 3), fill=rgba(color, min(255, alpha + 35)))


def draw_star(draw, x, y, r, fill=(247, 205, 103), alpha=255):
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((x + math.cos(ang) * rr, y + math.sin(ang) * rr))
    draw.polygon(pts, fill=rgba(fill, alpha), outline=(255, 242, 210, alpha))


def glow_ring(draw, box, color, alpha, width=6):
    draw.rounded_rectangle(box, radius=40, outline=rgba(color, alpha), width=width)


# ---------------------------------------------------------------------------
# Ken Burns FILL: crop the 3:2 source to a 16:9 window, pan/zoom, resize.
# ---------------------------------------------------------------------------
def kenburns_frame(src: Image.Image, kb, j: int, nf: int) -> Image.Image:
    s0, s1, cx0, cy0, cx1, cy1 = kb
    sw, sh = src.size
    p = ease(j / max(1, nf - 1))
    scale = lerp(s0, s1, p)

    crop_w = scale * sw
    crop_h = crop_w / TARGET_AR
    if crop_h > sh:                      # never exceed source height
        crop_h = sh
        crop_w = crop_h * TARGET_AR

    cxf = lerp(cx0, cx1, p)
    cyf = lerp(cy0, cy1, p)
    cx = lerp(crop_w / 2, sw - crop_w / 2, cxf)
    cy = lerp(crop_h / 2, sh - crop_h / 2, cyf)

    left = cx - crop_w / 2
    top = cy - crop_h / 2
    box = (left, top, left + crop_w, top + crop_h)
    return src.resize((WIDTH, HEIGHT), Image.LANCZOS, box=box)


# ---------------------------------------------------------------------------
# Per-scene animated FX overlays.
#
# Drawn in SOURCE-image space (1536x1024) and composited onto the art BEFORE
# the Ken Burns crop, so the effects stay locked to the artwork as the camera
# pans/zooms. Anchors below were read off the actual illustrations.
#
# Rule: the art already carries every number/label, so overlays add MOTION
# only. Where the art bakes in content (scene 3's 1..5, scene 4's arrows),
# the overlay highlights/animates that content instead of reprinting it.
# ---------------------------------------------------------------------------
def _overlay(size):
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    return layer, ImageDraw.Draw(layer, 'RGBA')


def _halo(d, center, r, color, alpha):
    x, y = center
    d.ellipse((x - r, y - r, x + r, y + r), outline=rgba(color, alpha), width=6)
    d.ellipse((x - r - 8, y - r - 8, x + r + 8, y + r + 8), outline=rgba(color, alpha // 2), width=4)


def fx_scene1(size, p):
    layer, d = _overlay(size)
    tw = (math.sin(p * math.pi * 2) + 1) / 2
    # gentle sparkles flanking the title sign and hinting at the two groups
    draw_sparkles(d, [(620, 150), (930, 150), (1180, 300)],
                  color=(255, 240, 170), scale=0.7 + 0.3 * tw, alpha=150 + int(60 * tw))
    draw_sparkles(d, [(360, 670), (1110, 660)],
                  color=(255, 235, 175), scale=0.6 + 0.3 * (1 - tw), alpha=120 + int(60 * tw))
    return layer


def fx_scene2(size, p):
    layer, d = _overlay(size)
    glow = 0.5 + 0.5 * math.sin(p * math.pi * 4)
    a = int(70 + 130 * glow)
    glow_ring(d, (233, 348, 760, 705), GOLD, a, width=8)        # ring around the ten crate
    draw_sparkles(d, [(460, 250), (300, 660), (720, 400)],
                  color=(255, 231, 150), scale=0.7 + 0.4 * glow, alpha=a)
    return layer


def fx_scene3(size, p):
    layer, d = _overlay(size)
    # Counting pointer: light up the baked-in numbers 1..5 in sequence.
    nums = [(602, 410), (755, 410), (909, 405), (1062, 410), (1229, 474)]
    active = clamp(p / 0.9) * 5.0
    for i, (x, y) in enumerate(nums):
        prog = active - i
        if prog <= 0:
            continue
        if prog < 1:                      # currently counting this one
            pop = ease(prog)
            _halo(d, (x, y), 30 + 10 * pop, MINT, int(230 * pop))
            draw_sparkles(d, [(x, y)], color=(200, 255, 240),
                          scale=0.6 + 0.5 * pop, alpha=int(220 * pop))
        else:                              # already counted — steady soft glow
            _halo(d, (x, y), 28, MINT, 90)
    return layer


def fx_scene4(size, p):
    layer, d = _overlay(size)
    # A glowing spark rides each baked dashed path up to the empty answer box,
    # which pulses to invite the answer.
    box = (942, 150, 1205, 312)
    pe = ease(p)
    left = [(486, 640), (760, 470), (1010, 330)]
    right = [(1062, 650), (1080, 470), (1090, 330)]

    def along(pts, t):
        seg = t * (len(pts) - 1)
        i = min(len(pts) - 2, int(seg))
        f = seg - i
        return (lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f))

    for path in (left, right):
        sx, sy = along(path, pe)
        draw_sparkles(d, [(sx, sy)], color=(120, 230, 220), scale=1.0, alpha=230)
    invite = 0.5 + 0.5 * math.sin(p * math.pi * 4)
    glow_ring(d, box, MINT, int(80 + 130 * invite), width=7)
    return layer


def fx_scene5(size, p):
    layer, d = _overlay(size)
    # Celebration around the baked "15" plaque: pulsing ring + radiating sparkles.
    cx, cy = 768, 461
    burst = ease(clamp(p / 0.4))
    pulse = 0.6 + 0.4 * math.sin(p * math.pi * 5)
    a = int(110 + 110 * pulse)
    rx, ry = 300 * (0.85 + 0.15 * pulse), 200 * (0.85 + 0.15 * pulse)
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=rgba(ANSWER, a), width=7)
    for k in range(12):
        ang = k * math.pi / 6
        rr = 250 + 130 * burst
        sx, sy = cx + math.cos(ang) * rr, cy + math.sin(ang) * rr * 0.72
        draw_sparkles(d, [(sx, sy)], color=(255, 232, 150),
                      scale=0.7 + 0.5 * burst, alpha=int(200 * burst))
    draw_star(d, cx + 300, cy - 210, 26 + 10 * pulse, fill=(247, 205, 103), alpha=int(220 * burst))
    draw_star(d, cx - 320, cy - 170, 20 + 8 * pulse, fill=(130, 213, 187), alpha=int(220 * burst))
    return layer


def fx_scene6(size, p):
    layer, d = _overlay(size)
    # Alternate the highlight between the two example cards ("only ones change").
    phase = (math.sin(p * math.pi * 3) + 1) / 2
    glow_ring(d, (141, 243, 742, 768), MINT, int(160 * phase), width=8)
    glow_ring(d, (806, 243, 1395, 768), (177, 125, 238), int(160 * (1 - phase)), width=8)
    return layer


def fx_scene7(size, p):
    layer, d = _overlay(size)
    # Pulsing invite around the baked "?" answer bubble.
    pulse = (math.sin(p * math.pi * 5) + 1) / 2
    a = int(100 + 120 * pulse)
    glow_ring(d, (560, 448, 968, 748), ANSWER, a, width=8)
    draw_sparkles(d, [(540, 470), (985, 500), (768, 760)],
                  color=(248, 196, 170), scale=0.7 + 0.4 * pulse, alpha=a)
    return layer


FX = [fx_scene1, fx_scene2, fx_scene3, fx_scene4, fx_scene5, fx_scene6, fx_scene7]


# ---------------------------------------------------------------------------
# Narration (edge-tts CLI) + speech-derived scene timing
# ---------------------------------------------------------------------------
def run(cmd, **kw):
    print('RUN:', ' '.join(str(c) for c in cmd))
    return subprocess.run(cmd, check=True, **kw)


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
         '-of', 'csv=p=0', str(path)],
        check=True, capture_output=True, text=True).stdout.strip()
    return float(out)


def synth_line(text: str, out: Path):
    run([EDGE_TTS, '--voice', VOICE, f'--rate={RATE}', f'--pitch={PITCH}',
         '--text', text, '--write-media', str(out)], capture_output=True, text=True)


def synth_lines(work: Path) -> list[tuple[Path, float]]:
    """Synthesize every narration line; return (mp3 path, spoken seconds)."""
    out = []
    for i, line in enumerate(NARRATION_LINES):
        mp3 = work / f'line_{i}.mp3'
        synth_line(line, mp3)
        spoken = ffprobe_duration(mp3)
        out.append((mp3, spoken))
        print(f'  line {i + 1}: spoken {spoken:.2f}s')
    return out


def frame_counts_for(spokens: list[float]) -> list[int]:
    """Scene dwell = max(MIN_DWELL, lead + spoken + tail); in whole frames."""
    counts = []
    for spoken in spokens:
        dwell = max(MIN_DWELL, LEAD_IN + spoken + TAIL)
        counts.append(max(TRANSITION + 2, int(round(dwell * FPS))))
    return counts


def layout(counts: list[int]) -> tuple[list[int], int]:
    """Map scenes to output-frame offsets, accounting for crossfade overlap.

    Each crossfade reuses TRANSITION frames shared by two scenes, so the final
    video is shorter than sum(dwell). Returns (scene_start_frames, total_frames).
    """
    starts, out, n = [], 0, len(counts)
    for i, nf in enumerate(counts):
        if i == 0:
            starts.append(0)
            out += nf - TRANSITION
        else:
            starts.append(out)                 # incoming crossfade begins here
            end_straight = nf if i == n - 1 else nf - TRANSITION
            out += TRANSITION + (end_straight - TRANSITION)
    return starts, out


def build_audio(lines: list[tuple[Path, float]], starts: list[int], total_frames: int):
    """Place each line at its scene's real start time (+lead-in) and mix to one
    track exactly as long as the video, so audio/video never drift."""
    total_s = total_frames / FPS
    inputs, filt, labels = [], [], []
    for i, (mp3, _spoken) in enumerate(lines):
        inputs += ['-i', str(mp3)]
        delay_ms = int(round((starts[i] / FPS + LEAD_IN) * 1000))
        filt.append(f'[{i}:a]adelay={delay_ms}:all=1[a{i}]')
        labels.append(f'[a{i}]')
    filt.append(f'{"".join(labels)}amix=inputs={len(lines)}:normalize=0:'
                f'dropout_transition=0[m];[m]apad[out]')
    NARRATION.parent.mkdir(parents=True, exist_ok=True)
    run(['ffmpeg', '-y', *inputs, '-filter_complex', ';'.join(filt),
         '-map', '[out]', '-t', f'{total_s:.3f}',
         '-c:a', 'libmp3lame', '-q:a', '4', str(NARRATION)],
        capture_output=True, text=True)
    print(f'Narration: {NARRATION} ({ffprobe_duration(NARRATION):.2f}s, '
          f'video {total_s:.2f}s)')


# ---------------------------------------------------------------------------
# Compose one finished frame (Ken Burns base + FX overlay)
# ---------------------------------------------------------------------------
def compose(src: Image.Image, kb, fx, j: int, nf: int) -> Image.Image:
    p = j / max(1, nf - 1)
    overlay = fx(src.size, p)                       # source-space FX, locked to art
    art = Image.alpha_composite(src.convert('RGBA'), overlay)
    return kenburns_frame(art, kb, j, nf).convert('RGB')


def render(frame_counts: list[int]):
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)

    sources = [Image.open(IMAGES_DIR / f'scene{i + 1}.png').convert('RGB') for i in range(7)]

    def sf(i, j):
        return compose(sources[i], KEN_BURNS[i], FX[i], j, frame_counts[i])

    out_idx = 0

    def emit(img):
        nonlocal out_idx
        img.save(FRAMES_DIR / f'frame_{out_idx:05d}.png')
        out_idx += 1

    n = 7
    buffer: list[Image.Image] = []
    for i in range(n):
        nf = frame_counts[i]
        if i == 0:
            for j in range(0, nf - TRANSITION):
                emit(sf(i, j))
            buffer = [sf(i, j) for j in range(nf - TRANSITION, nf)]
        else:
            for k in range(TRANSITION):
                a = (k + 1) / (TRANSITION + 1)
                emit(Image.blend(buffer[k], sf(i, k), a))
            end_straight = nf if i == n - 1 else nf - TRANSITION
            for j in range(TRANSITION, end_straight):
                emit(sf(i, j))
            if i < n - 1:
                buffer = [sf(i, j) for j in range(nf - TRANSITION, nf)]
        print(f'Scene {i + 1}/{n} done — {out_idx} frames so far')
    print(f'Total frames: {out_idx}  (~{out_idx / FPS:.1f}s)')


def encode():
    run(['ffmpeg', '-y', '-framerate', str(FPS), '-i', str(FRAMES_DIR / 'frame_%05d.png'),
         '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium',
         str(SILENT_VIDEO)])
    run(['ffmpeg', '-y', '-i', str(SILENT_VIDEO), '-i', str(NARRATION),
         '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', str(FINAL_VIDEO)])


def main():
    for i in range(7):
        p = IMAGES_DIR / f'scene{i + 1}.png'
        if not p.exists():
            raise FileNotFoundError(f'Missing source art: {p}')
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='narration-v4-') as td:
        lines = synth_lines(Path(td))
        counts = frame_counts_for([s for _, s in lines])
        starts, total_frames = layout(counts)
        for i, nf in enumerate(counts):
            print(f'  scene {i + 1}: {nf} frames, starts at frame {starts[i]} '
                  f'({starts[i] / FPS:.2f}s)')
        build_audio(lines, starts, total_frames)
        render(counts)
    encode()
    print(f'Final video: {FINAL_VIDEO}')


if __name__ == '__main__':
    main()
