"""Make 10 First V2 — AI-background edition.

Reuses every math overlay (equations, shells, captions, panels) from
make_ten_first_video_v2.py, but replaces the hand-drawn island blobs with
AI-generated Math Island backgrounds (one per scene, from HF Z-Image Turbo).
A soft light scrim is laid over each background so the math stays readable.
"""
from __future__ import annotations

import importlib.util
import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path('/Users/mac/tools/math-island')
V2_PATH = ROOT / 'scripts/make_ten_first_video_v2.py'

spec = importlib.util.spec_from_file_location('make_ten_first_video_v2', V2_PATH)
v2 = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(v2)
base = v2.base  # the make_ten_first_video module

# --- Output paths (kept distinct from the programmatic v2 render) ---
OUTPUT_DIR = ROOT / 'dist/video'
FRAMES_DIR = OUTPUT_DIR / 'frames/make-ten-first-v2-ai'
SILENT_VIDEO = OUTPUT_DIR / 'math-island-make-ten-first-v2-ai-silent.mp4'
FINAL_VIDEO = OUTPUT_DIR / 'math-island-make-ten-first-v2-ai.mp4'
AI_DIR = OUTPUT_DIR / 'ai-frames'
AUDIO = base.AUDIO

# --- Background preparation ---------------------------------------------------

_SCRIM = None
_BG_CACHE: dict[int, Image.Image] = {}


def _scrim() -> Image.Image:
    """A soft top-to-bottom light wash that mutes the busy AI art so the
    math overlays read cleanly, without flattening the island charm."""
    global _SCRIM
    if _SCRIM is None:
        layer = Image.new('RGBA', (base.WIDTH, base.HEIGHT), (0, 0, 0, 0))
        px = layer.load()
        for y in range(base.HEIGHT):
            # stronger wash near the top where titles/equations live
            top = 96 * (1.0 - y / base.HEIGHT)
            a = int(46 + top)
            for x in range(base.WIDTH):
                px[x, y] = (255, 255, 250, a)
        _SCRIM = layer
    return _SCRIM


def _prepared_bg(scene_idx: int) -> Image.Image:
    """Load AI background for a scene (1-based), apply scrim + edge vignette."""
    if scene_idx in _BG_CACHE:
        return _BG_CACHE[scene_idx]
    path = AI_DIR / f'scene{scene_idx}_bg.png'
    bg = Image.open(path).convert('RGBA')
    if bg.size != (base.WIDTH, base.HEIGHT):
        bg = bg.resize((base.WIDTH, base.HEIGHT))
    bg = Image.alpha_composite(bg, _scrim())

    # gentle edge vignette to focus the eye on the math
    vig = Image.new('RGBA', (base.WIDTH, base.HEIGHT), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vig)
    vd.rectangle((0, 0, base.WIDTH, base.HEIGHT), fill=(40, 32, 20, 60))
    vd.ellipse((-120, -90, base.WIDTH + 120, base.HEIGHT + 120), fill=(0, 0, 0, 0))
    vig = vig.filter(ImageFilter.GaussianBlur(60))
    bg = Image.alpha_composite(bg, vig)

    _BG_CACHE[scene_idx] = bg
    return bg


def _scene_index(t: float) -> int:
    for i in range(1, len(base.SCENES)):
        if t < base.SCENES[i][0]:
            return i
    return len(base.SCENES)


# --- Frame render -------------------------------------------------------------


def render_frame_ai(frame_idx: int):
    t = frame_idx / base.FPS

    img = _prepared_bg(_scene_index(t)).copy()
    draw = ImageDraw.Draw(img, 'RGBA')

    # same overlay hooks the v2 scenes expect
    base.draw_card = v2.v2_draw_card
    base.draw_title = v2.v2_draw_title
    base.draw_caption = v2.v2_draw_caption
    base.draw_equation = v2.v2_draw_equation
    base.draw_shell = v2.v2_draw_shell
    base.draw_scene_common = v2.v2_draw_scene_common
    base.draw_panel = v2.v2_draw_panel

    if t < base.SCENES[1][0]:
        base.draw_scene1(draw, t)
    elif t < base.SCENES[2][0]:
        base.draw_scene2(draw, t)
        slots = base.shell_grid_positions(260, 300, 10, cols=5)
        v2.draw_sparkles(draw, [(slots[8][0], slots[8][1] - 40), (slots[9][0], slots[9][1] - 40)], color=(255, 236, 143), scale=0.9)
    elif t < base.SCENES[3][0]:
        base.draw_scene3(draw, t)
        v2.draw_star_sticker(draw, 930, 196, 20, fill=(130, 213, 187))
    elif t < base.SCENES[4][0]:
        base.draw_scene4(draw, t)
        v2.draw_path_pebbles(draw, [(700, 325), (650, 320), (600, 322), (550, 326)])
    elif t < base.SCENES[5][0]:
        base.draw_scene5(draw, t)
        v2.draw_star_sticker(draw, 1125, 226, 20, fill=(247, 205, 103))
        v2.draw_sparkles(draw, [(1090, 210), (1165, 255)], color=(255, 233, 160), scale=1.0)
    elif t < base.SCENES[6][0]:
        base.draw_scene6(draw, t)
    else:
        base.draw_scene7(draw, t)
        pulse = 0.5 + 0.5 * math.sin(base.scene_progress(t, 6) * math.pi * 6)
        v2.draw_sparkles(draw, [(786, 240), (490, 240)], color=(248, 166, 178), scale=0.5 + 0.5 * pulse)

    out = FRAMES_DIR / f'frame_{frame_idx:04d}.png'
    img.convert('RGB').save(out)


def ensure_dirs():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)


def run(cmd: list[str]):
    print('RUN:', ' '.join(cmd))
    subprocess.run(cmd, check=True)


def encode_video():
    run([
        'ffmpeg', '-y', '-framerate', str(base.FPS), '-i', str(FRAMES_DIR / 'frame_%04d.png'),
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', str(SILENT_VIDEO)
    ])
    if AUDIO.exists():
        run([
            'ffmpeg', '-y', '-i', str(SILENT_VIDEO), '-i', str(AUDIO),
            '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', str(FINAL_VIDEO)
        ])
    else:
        print(f'WARNING: audio not found at {AUDIO}; final = silent video')
        shutil.copyfile(SILENT_VIDEO, FINAL_VIDEO)


def main():
    missing = [i for i in range(1, 8) if not (AI_DIR / f'scene{i}_bg.png').exists()]
    if missing:
        raise FileNotFoundError(f'Missing AI backgrounds for scenes: {missing} in {AI_DIR}')
    ensure_dirs()
    for frame_idx in range(base.TOTAL_FRAMES):
        render_frame_ai(frame_idx)
        if frame_idx % 24 == 0:
            print(f'Rendered {frame_idx + 1}/{base.TOTAL_FRAMES}')
    encode_video()
    print(f'Final video: {FINAL_VIDEO}')


if __name__ == '__main__':
    main()
