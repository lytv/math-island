"""Math Island slideshow video from finished scene artwork.

Takes the 6 completed 2560x1440 scene illustrations in dist/video/images/
(1.png .. 6.png) and assembles a 1080p video with a gentle Ken Burns
zoom/pan on each scene and smooth crossfades between scenes, then muxes the
existing narration track. No external AI services.
"""
from __future__ import annotations

import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path('/Users/mac/tools/math-island')
IMAGES_DIR = ROOT / 'dist/video/images'
OUTPUT_DIR = ROOT / 'dist/video'
FRAMES_DIR = OUTPUT_DIR / 'frames/island-slideshow'
SILENT_VIDEO = OUTPUT_DIR / 'math-island-make-ten-first-slideshow-silent.mp4'
FINAL_VIDEO = OUTPUT_DIR / 'math-island-make-ten-first-slideshow.mp4'
AUDIO = Path('/Users/mac/.hermes/audio_cache/tts_20260601_095348.mp3')

FPS = 30
OUT_W, OUT_H = 1920, 1080
TRANSITION = 18  # frames of crossfade (~0.6s)

# (image, seconds, Ken Burns: scale_start, scale_end, cx0, cy0, cx1, cy1)
# scale = fraction of the source used (smaller = more zoom-in).
# cx/cy = center as fraction of allowable pan range (0.5 = middle).
SCENES = [
    ('1.png', 6.0, 1.00, 0.90, 0.50, 0.58, 0.50, 0.44),  # push in to 8+5=?
    ('2.png', 6.0, 0.92, 1.00, 0.40, 0.50, 0.60, 0.50),  # pull back across ten-frame
    ('3.png', 6.0, 1.00, 0.90, 0.42, 0.50, 0.60, 0.50),  # drift toward 5=2+3 sign
    ('4.png', 7.0, 1.00, 0.90, 0.50, 0.60, 0.50, 0.42),  # rise toward "Make 10 first!"
    ('5.png', 6.0, 0.90, 1.00, 0.55, 0.50, 0.50, 0.50),  # pull back from the 13
    ('6.png', 9.0, 0.98, 0.92, 0.40, 0.50, 0.60, 0.50),  # pan across the two puzzle cards
]


def ease(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def lerp(a: float, b: float, p: float) -> float:
    return a + (b - a) * p


def load_sources() -> list[Image.Image]:
    imgs = []
    for s in SCENES:
        im = Image.open(IMAGES_DIR / s[0]).convert('RGB')
        imgs.append(im)
    return imgs


def render_scene_frame(src: Image.Image, scene, j: int, nf: int) -> Image.Image:
    _, _, s0, s1, cx0, cy0, cx1, cy1 = scene
    sw, sh = src.size
    p = ease(j / max(1, nf - 1))
    scale = lerp(s0, s1, p)
    cxf = lerp(cx0, cx1, p)
    cyf = lerp(cy0, cy1, p)

    crop_w = scale * sw
    crop_h = scale * sh
    # allowable center range so the crop stays inside the image
    cx = lerp(crop_w / 2, sw - crop_w / 2, cxf)
    cy = lerp(crop_h / 2, sh - crop_h / 2, cyf)

    left = cx - crop_w / 2
    top = cy - crop_h / 2
    box = (left, top, left + crop_w, top + crop_h)
    frame = src.resize((OUT_W, OUT_H), Image.LANCZOS, box=box)
    return frame


def main():
    if FRAMES_DIR.exists():
        shutil.rmtree(FRAMES_DIR)
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)

    sources = load_sources()
    n = len(SCENES)
    frame_counts = [int(round(SCENES[i][1] * FPS)) for i in range(n)]

    def sf(i: int, j: int) -> Image.Image:
        return render_scene_frame(sources[i], SCENES[i], j, frame_counts[i])

    out_idx = 0

    def emit(img: Image.Image):
        nonlocal out_idx
        img.save(FRAMES_DIR / f'frame_{out_idx:05d}.png')
        out_idx += 1

    buffer: list[Image.Image] = []
    for i in range(n):
        nf = frame_counts[i]
        if i == 0:
            for j in range(0, nf - TRANSITION):
                emit(sf(i, j))
            buffer = [sf(i, j) for j in range(nf - TRANSITION, nf)]
        else:
            # crossfade previous tail with this scene's head
            for k in range(TRANSITION):
                a = (k + 1) / (TRANSITION + 1)
                emit(Image.blend(buffer[k], sf(i, k), a))
            end_straight = nf if i == n - 1 else nf - TRANSITION
            for j in range(TRANSITION, end_straight):
                emit(sf(i, j))
            if i < n - 1:
                buffer = [sf(i, j) for j in range(nf - TRANSITION, nf)]
        print(f'Scene {i + 1}/{n} composed, total frames so far: {out_idx}')

    total = out_idx
    print(f'Total frames: {total}  (~{total / FPS:.1f}s)')

    subprocess.run([
        'ffmpeg', '-y', '-framerate', str(FPS), '-i', str(FRAMES_DIR / 'frame_%05d.png'),
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', str(SILENT_VIDEO)
    ], check=True)

    if AUDIO.exists():
        subprocess.run([
            'ffmpeg', '-y', '-i', str(SILENT_VIDEO), '-i', str(AUDIO),
            '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', str(FINAL_VIDEO)
        ], check=True)
    else:
        print(f'WARNING: audio missing at {AUDIO}; final = silent')
        shutil.copyfile(SILENT_VIDEO, FINAL_VIDEO)

    print(f'Final video: {FINAL_VIDEO}')


if __name__ == '__main__':
    main()
