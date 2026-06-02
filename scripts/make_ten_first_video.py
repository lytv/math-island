from __future__ import annotations

import math
import os
import shutil
import subprocess
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont

WIDTH = 1280
HEIGHT = 720
FPS = 12
DURATION = 37.752
TOTAL_FRAMES = math.ceil(DURATION * FPS)

ROOT = Path('/Users/mac/tools/math-island')
FRAMES_DIR = ROOT / 'dist/video/frames/make-ten-first'
OUTPUT_DIR = ROOT / 'dist/video'
SILENT_VIDEO = OUTPUT_DIR / 'math-island-make-ten-first-silent.mp4'
FINAL_VIDEO = OUTPUT_DIR / 'math-island-make-ten-first.mp4'
AUDIO = Path('/Users/mac/.hermes/audio_cache/tts_20260601_095348.mp3')

FONT_HEAD = '/System/Library/Fonts/Supplemental/Trebuchet MS.ttf'
FONT_BODY = '/System/Library/Fonts/Supplemental/Arial.ttf'

SKY_TOP = (158, 216, 255)
SKY_BOTTOM = (234, 248, 255)
SAND = (246, 231, 178)
HILL = (139, 207, 155)
INK = (41, 65, 79)
WHITE = (255, 253, 247)
LEFT = (88, 196, 221)
TRANSFER = (46, 196, 182)
TEN = (255, 209, 102)
LEFTOVER = (255, 140, 105)
ANSWER = (255, 93, 115)
PALE = (222, 237, 243)
SHADOW = (0, 0, 0, 35)

SCENES = [
    (0.0, 5.0),
    (5.0, 10.0),
    (10.0, 15.0),
    (15.0, 21.0),
    (21.0, 26.0),
    (26.0, 34.0),
    (34.0, DURATION),
]


def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def ease(x: float) -> float:
    x = clamp(x)
    return x * x * (3 - 2 * x)


def scene_progress(t: float, idx: int) -> float:
    start, end = SCENES[idx]
    return clamp((t - start) / (end - start))


def lerp(a: float, b: float, p: float) -> float:
    return a + (b - a) * p


def mix(c1: tuple[int, int, int], c2: tuple[int, int, int], p: float) -> tuple[int, int, int]:
    p = clamp(p)
    return (
        int(lerp(c1[0], c2[0], p)),
        int(lerp(c1[1], c2[1], p)),
        int(lerp(c1[2], c2[2], p)),
    )


def rgba(rgb: tuple[int, int, int], a: int = 255) -> tuple[int, int, int, int]:
    return rgb + (a,)


def load_font(size: int, heading: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_HEAD if heading else FONT_BODY, size=size)


def text_bbox(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> tuple[float, float]:
    l, t, r, b = draw.textbbox((0, 0), text, font=font)
    return float(r - l), float(b - t)


def draw_centered_text(draw: ImageDraw.ImageDraw, center: tuple[float, float], text: str, font, fill, shadow: bool = False):
    w, h = text_bbox(draw, text, font)
    x = center[0] - w / 2
    y = center[1] - h / 2
    if shadow:
        draw.text((x + 3, y + 3), text, font=font, fill=(0, 0, 0, 50))
    draw.text((x, y), text, font=font, fill=fill)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ''
    for word in words:
        candidate = word if not current else current + ' ' + word
        if text_bbox(draw, candidate, font)[0] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def rounded_rect(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=None, width: int = 2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_card(draw: ImageDraw.ImageDraw, box, fill=WHITE, outline=(255, 255, 255, 160), radius: int = 28):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle((x1 + 8, y1 + 10, x2 + 8, y2 + 10), radius=radius, fill=SHADOW)
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=3)


def draw_gradient_background(img: Image.Image):
    px = img.load()
    if px is None:
        raise RuntimeError('Failed to access pixel buffer')
    for y in range(HEIGHT):
        p = y / HEIGHT
        color = mix(SKY_TOP, SKY_BOTTOM, p)
        for x in range(WIDTH):
            px[x, y] = color
    draw = ImageDraw.Draw(img, 'RGBA')
    draw.ellipse((930, 65, 1110, 245), fill=(255, 242, 169, 180))
    draw.ellipse((950, 85, 1090, 225), fill=(255, 247, 190, 180))
    draw.pieslice((-100, 430, 760, 980), 180, 360, fill=HILL)
    draw.pieslice((520, 480, 1380, 980), 180, 360, fill=(127, 199, 146, 255))
    draw.rectangle((0, 590, WIDTH, HEIGHT), fill=SAND)
    for cx, cy, r, a in [(170, 120, 42, 130), (270, 95, 32, 120), (1090, 150, 36, 110), (1160, 135, 26, 90)]:
        draw.ellipse((cx - r, cy - r * 0.7, cx + r, cy + r * 0.7), fill=(255, 255, 255, a))


def shell_grid_positions(origin_x: int, origin_y: int, count: int, cols: int = 5, dx: int = 60, dy: int = 62) -> list[tuple[float, float]]:
    pts = []
    for i in range(count):
        row = i // cols
        col = i % cols
        pts.append((origin_x + col * dx, origin_y + row * dy))
    return pts


def draw_shell(draw: ImageDraw.ImageDraw, x: float, y: float, r: float, color, alpha: int = 255, outline: tuple[int, int, int] | None = None):
    x1, y1, x2, y2 = x - r, y - r, x + r, y + r
    draw.ellipse((x1 + 4, y1 + 6, x2 + 4, y2 + 6), fill=(0, 0, 0, 24))
    draw.ellipse((x1, y1, x2, y2), fill=rgba(color, alpha), outline=outline or rgba((255, 255, 255), min(alpha, 180)), width=3)
    draw.ellipse((x - r * 0.45, y - r * 0.45, x - r * 0.05, y - r * 0.05), fill=(255, 255, 255, int(alpha * 0.55)))


def draw_shell_outline(draw: ImageDraw.ImageDraw, x: float, y: float, r: float, color=(255, 255, 255, 160)):
    draw.ellipse((x - r, y - r, x + r, y + r), outline=color, width=4)


def draw_caption(draw: ImageDraw.ImageDraw, text: str):
    font = load_font(34)
    lines = wrap_text(draw, text, font, 900)
    line_h = text_bbox(draw, 'Ag', font)[1] + 8
    box_h = 26 + line_h * len(lines)
    box = (150, 620 - box_h, 1130, 620)
    draw_card(draw, box, fill=(255, 253, 247, 235), radius=24)
    y = box[1] + 14
    for line in lines:
        draw_centered_text(draw, (640, y + line_h / 2 - 2), line, font, INK)
        y += line_h


def draw_equation(draw: ImageDraw.ImageDraw, text: str, center=(640, 110), color=INK, scale: float = 1.0):
    font = load_font(int(58 * scale), heading=True)
    draw_card(draw, (center[0] - 220 * scale, center[1] - 45 * scale, center[0] + 220 * scale, center[1] + 45 * scale), fill=(255, 253, 247, 225), radius=int(24 * scale))
    draw_centered_text(draw, center, text, font, color, shadow=False)


def draw_title(draw: ImageDraw.ImageDraw, text: str, y: int = 18):
    font = load_font(24, heading=True)
    draw_card(draw, (460, y - 6, 820, y + 34), fill=(255, 255, 255, 200), radius=20)
    draw_centered_text(draw, (640, y + 12), text, font, INK)


def transfer_positions(progress: float):
    start_pair = [(860, 330), (920, 330)]
    end_pair = [(500, 330), (560, 330)]
    pts = []
    p = ease(progress)
    arc = math.sin(p * math.pi) * 60
    for (sx, sy), (ex, ey) in zip(start_pair, end_pair):
        x = lerp(sx, ex, p)
        y = lerp(sy, ey, p) - arc
        pts.append((x, y))
    return pts


def draw_scene_common(draw: ImageDraw.ImageDraw):
    draw_title(draw, 'Math Island • Make 10 First')


def draw_scene1(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 0)
    draw_scene_common(draw)
    eq_y = lerp(150, 120, ease(p))
    draw_equation(draw, '8 + 5 = ?', center=(640, eq_y), color=INK, scale=1.05)
    left_pts = shell_grid_positions(260, 300, 8, cols=4)
    right_pts = shell_grid_positions(820, 300, 5, cols=3)
    for x, y in left_pts:
        draw_shell(draw, x, y, 24, LEFT)
    for x, y in right_pts:
        draw_shell(draw, x, y, 24, LEFTOVER)
    draw_caption(draw, 'Eight plus five feels tricky at first.')


def draw_scene2(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 1)
    draw_scene_common(draw)
    draw_equation(draw, '8 + 5 = ?', center=(640, 120), color=INK, scale=1.05)
    left_pts = shell_grid_positions(260, 300, 8, cols=5)
    target_pts = shell_grid_positions(260, 300, 10, cols=5)
    for idx, (x, y) in enumerate(target_pts):
        if idx < 8:
            color = mix(LEFT, TEN, 0.2 + 0.25 * ease(p))
            draw_shell(draw, x, y, 24, color)
        else:
            glow = int(100 + 100 * abs(math.sin(p * math.pi * 2)))
            draw_shell_outline(draw, x, y, 24, color=(255, 215, 120, glow))
    draw_centered_text(draw, (640, 250), '8 needs 2 more', load_font(42, heading=True), TEN, shadow=True)
    draw_caption(draw, 'Eight is close to ten. It only needs two more.')


def draw_scene3(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 2)
    draw_scene_common(draw)
    draw_equation(draw, '5 = 2 + 3', center=(640, 120), color=INK, scale=1.0)
    left_pts = shell_grid_positions(250, 300, 8, cols=5)
    for x, y in left_pts:
        draw_shell(draw, x, y, 24, LEFT)
    pair = [(820 - 40 * ease(p), 300), (880 - 20 * ease(p), 300)]
    trio = [(960 + 15 * ease(p), 300), (1020 + 20 * ease(p), 300), (990 + 18 * ease(p), 360)]
    for x, y in pair:
        draw_shell(draw, x, y, 24, TRANSFER)
    for x, y in trio:
        draw_shell(draw, x, y, 24, LEFTOVER)
    draw_centered_text(draw, (640, 245), 'Split the 5', load_font(40, heading=True), INK)
    draw_caption(draw, 'Five can split into two and three.')


def draw_scene4(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 3)
    draw_scene_common(draw)
    eq_p = ease(clamp((p - 0.45) / 0.4))
    eq = '8 + 5' if eq_p < 0.5 else '8 + 2 + 3'
    draw_equation(draw, eq, center=(640, 120), color=INK, scale=1.0)
    ten_slots = shell_grid_positions(260, 300, 10, cols=5)
    trio = [(960, 300), (1020, 300), (990, 360)]
    moving = transfer_positions(clamp(p / 0.72))
    for idx, (x, y) in enumerate(ten_slots):
        if idx < 8:
            draw_shell(draw, x, y, 24, LEFT)
        elif p > 0.72:
            draw_shell(draw, x, y, 24, TEN)
        else:
            draw_shell_outline(draw, x, y, 24, color=(255, 221, 135, 160))
    for x, y in trio:
        draw_shell(draw, x, y, 24, LEFTOVER)
    show_moving = p < 0.78
    if show_moving:
        for x, y in moving:
            draw_shell(draw, x, y, 24, TRANSFER)
    else:
        for x, y in ten_slots[8:10]:
            draw_shell(draw, x, y, 24, TEN)
    if p > 0.74:
        draw_centered_text(draw, (640, 250), 'Make 10 first!', load_font(46, heading=True), TEN, shadow=True)
    draw_caption(draw, 'Move the two over. Now we made ten first.')


def draw_scene5(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 4)
    draw_scene_common(draw)
    eq = '10 + 3 = 13' if p > 0.35 else '8 + 2 + 3'
    draw_equation(draw, eq, center=(640, 120), color=ANSWER if p > 0.35 else INK, scale=1.04)
    ten_slots = shell_grid_positions(240, 300, 10, cols=5)
    trio = [(870, 320), (930, 320), (900, 380)]
    for x, y in ten_slots:
        draw_shell(draw, x, y, 24, TEN)
    for x, y in trio:
        draw_shell(draw, x, y, 24, LEFTOVER)
    badge_box = (950, 245, 1130, 345)
    draw_card(draw, badge_box, fill=(255, 245, 248, 235), radius=26)
    draw_centered_text(draw, (1040, 294), '13', load_font(58, heading=True), ANSWER)
    draw_caption(draw, 'Ten and three make thirteen.')


def draw_panel(draw: ImageDraw.ImageDraw, box, top_text: str, bottom_text: str, accent):
    draw_card(draw, box, fill=(255, 253, 247, 228), radius=26)
    x1, y1, x2, y2 = box
    draw_centered_text(draw, ((x1 + x2) / 2, y1 + 52), top_text, load_font(44, heading=True), INK)
    draw_centered_text(draw, ((x1 + x2) / 2, y1 + 110), '↓ make 10 first ↓', load_font(24), accent)
    draw_centered_text(draw, ((x1 + x2) / 2, y1 + 165), bottom_text, load_font(40, heading=True), accent)
    # decorative counters
    for i in range(5):
        draw_shell(draw, x1 + 65 + i * 38, y2 - 50, 14, accent if i < 3 else PALE)


def draw_scene6(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 5)
    draw_scene_common(draw)
    title = 'Use the same trick again!'
    draw_centered_text(draw, (640, 120), title, load_font(42, heading=True), INK)
    left_box = (120, 180, 590, 500)
    right_box = (690, 180, 1160, 500)
    draw_panel(draw, left_box, '9 + 6', '10 + 5 = 15', TRANSFER)
    draw_panel(draw, right_box, '7 + 8', '10 + 5 = 15', LEFTOVER)
    glow = int(180 + 60 * math.sin(p * math.pi * 4))
    draw.rounded_rectangle((430, 525, 850, 595), radius=28, fill=(255, 255, 255, 220), outline=(255, 209, 102, glow), width=4)
    draw_centered_text(draw, (640, 560), 'Make 10 first', load_font(36, heading=True), TEN)
    draw_caption(draw, 'Nine plus six and seven plus eight use the same idea.')


def draw_scene7(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 6)
    draw_scene_common(draw)
    draw_equation(draw, 'Your turn: 8 + 6 = ?', center=(640, 130), color=INK, scale=1.0)
    left_pts = shell_grid_positions(260, 310, 8, cols=5)
    right_pts = shell_grid_positions(860, 310, 6, cols=3)
    target_pts = shell_grid_positions(260, 310, 10, cols=5)
    for i, (x, y) in enumerate(target_pts):
        if i < 8:
            draw_shell(draw, x, y, 24, LEFT)
        else:
            draw_shell_outline(draw, x, y, 24, color=(255, 215, 120, 150))
    for x, y in right_pts:
        draw_shell(draw, x, y, 24, LEFTOVER)
    pulse = 1.0 + 0.06 * math.sin(p * math.pi * 6)
    bubble_box = (515 - 110 * pulse, 240 - 45 * pulse, 765 + 110 * pulse, 240 + 45 * pulse)
    draw_card(draw, bubble_box, fill=(255, 255, 255, 225), radius=28)
    draw_centered_text(draw, (640, 240), 'How many move?', load_font(34, heading=True), ANSWER)
    draw_caption(draw, 'Can you move enough shells to make ten first?')


def render_frame(frame_idx: int):
    t = frame_idx / FPS
    img = Image.new('RGB', (WIDTH, HEIGHT), SKY_TOP)
    draw_gradient_background(img)
    draw = ImageDraw.Draw(img, 'RGBA')

    if t < SCENES[1][0]:
        draw_scene1(draw, t)
    elif t < SCENES[2][0]:
        draw_scene2(draw, t)
    elif t < SCENES[3][0]:
        draw_scene3(draw, t)
    elif t < SCENES[4][0]:
        draw_scene4(draw, t)
    elif t < SCENES[5][0]:
        draw_scene5(draw, t)
    elif t < SCENES[6][0]:
        draw_scene6(draw, t)
    else:
        draw_scene7(draw, t)

    out = FRAMES_DIR / f'frame_{frame_idx:04d}.png'
    img.save(out)


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
        'ffmpeg', '-y', '-framerate', str(FPS), '-i', str(FRAMES_DIR / 'frame_%04d.png'),
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium',
        str(SILENT_VIDEO)
    ])
    run([
        'ffmpeg', '-y', '-i', str(SILENT_VIDEO), '-i', str(AUDIO),
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', str(FINAL_VIDEO)
    ])


def main():
    if not AUDIO.exists():
        raise FileNotFoundError(f'Audio file not found: {AUDIO}')
    ensure_dirs()
    for frame_idx in range(TOTAL_FRAMES):
        render_frame(frame_idx)
        if frame_idx % 24 == 0:
            print(f'Rendered {frame_idx+1}/{TOTAL_FRAMES}')
    encode_video()
    print(f'Final video: {FINAL_VIDEO}')


if __name__ == '__main__':
    main()
