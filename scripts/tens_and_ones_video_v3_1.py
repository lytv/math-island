from __future__ import annotations

import importlib.util
import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_PATH = Path('/Users/mac/tools/math-island/scripts/make_ten_first_video.py')
spec = importlib.util.spec_from_file_location('make_ten_first_video_base', BASE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f'Could not load base renderer from {BASE_PATH}')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

WIDTH = 1280
HEIGHT = 720
FPS = 12
DURATION = 46.728
TOTAL_FRAMES = math.ceil(DURATION * FPS)

ROOT = Path('/Users/mac/tools/math-island')
OUTPUT_DIR = ROOT / 'dist/video'
FRAMES_DIR = OUTPUT_DIR / 'frames/tens-and-ones-v3_1'
SILENT_VIDEO = OUTPUT_DIR / 'math-island-tens-and-ones-v3_1-silent.mp4'
FINAL_VIDEO = OUTPUT_DIR / 'math-island-tens-and-ones-v3_1.mp4'
AUDIO = OUTPUT_DIR / 'tens-and-ones-v3_1-narration-synced.mp3'

FONT_HEAD = '/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf'
FONT_BODY = '/System/Library/Fonts/Supplemental/Arial.ttf'

SKY_TOP = (168, 226, 243)
SKY_BOTTOM = (230, 246, 252)
OCEAN = (109, 204, 217)
OCEAN_DEEP = (71, 171, 208)
SAND = (240, 217, 160)
SAND_LIGHT = (247, 233, 192)
GRASS = (131, 201, 150)
GRASS_LIGHT = (190, 226, 160)
INK = (121, 79, 39)
SUBINK = (114, 93, 66)
WHITE = (253, 253, 245)
PARCHMENT = (240, 232, 216)
MINT = (25, 200, 185)
TEAL = (111, 196, 236)
GOLD = (245, 195, 28)
CORAL = (229, 146, 102)
ANSWER = (236, 118, 141)
BERRY = (177, 125, 238)
LEAF = (125, 195, 149)
SHADOW = (61, 52, 40, 28)

SCENES = [
    (0.0, 6.0),
    (6.0, 12.0),
    (12.0, 19.5),
    (19.5, 26.0),
    (26.0, 33.5),
    (33.5, 40.0),
    (40.0, DURATION),
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


def load_font(size: int, heading: bool = False):
    return ImageFont.truetype(FONT_HEAD if heading else FONT_BODY, size=size)


def text_bbox(draw: ImageDraw.ImageDraw, text: str, font) -> tuple[float, float]:
    l, t, r, b = draw.textbbox((0, 0), text, font=font)
    return float(r - l), float(b - t)


def draw_centered_text(draw: ImageDraw.ImageDraw, center: tuple[float, float], text: str, font, fill, shadow: bool = False):
    w, h = text_bbox(draw, text, font)
    x = center[0] - w / 2
    y = center[1] - h / 2
    if shadow:
        draw.text((x + 3, y + 3), text, font=font, fill=(0, 0, 0, 44))
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


def island_shadow(draw: ImageDraw.ImageDraw, box, radius=26, shadow_offset=(0, 8), shadow_fill=SHADOW):
    x1, y1, x2, y2 = box
    sx, sy = shadow_offset
    draw.rounded_rectangle((x1 + sx, y1 + sy, x2 + sx, y2 + sy), radius=radius, fill=shadow_fill)


def draw_wood_card(draw: ImageDraw.ImageDraw, box, fill=(253, 253, 245, 235), outline=(232, 226, 214, 255), radius=28):
    island_shadow(draw, box, radius=radius, shadow_offset=(0, 10), shadow_fill=(61, 52, 40, 32))
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=3)
    draw.rounded_rectangle((x1 + 8, y1 + 7, x2 - 8, y1 + 18), radius=14, fill=(255, 255, 255, 85))


def draw_star_sticker(draw: ImageDraw.ImageDraw, x: float, y: float, r: float, fill=(247, 205, 103)):
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((x + math.cos(ang) * rr, y + math.sin(ang) * rr))
    draw.polygon(pts, fill=fill, outline=(255, 242, 210, 255))


def draw_sparkles(draw: ImageDraw.ImageDraw, centers, color=(255, 244, 180), scale=1.0):
    for x, y in centers:
        s = 10 * scale
        draw.line((x - s, y, x + s, y), fill=rgba(color, 220), width=2)
        draw.line((x, y - s, x, y + s), fill=rgba(color, 220), width=2)
        draw.ellipse((x - 3, y - 3, x + 3, y + 3), fill=rgba(color, 255))


def draw_flower(draw: ImageDraw.ImageDraw, x: float, y: float, scale: float = 1.0):
    petal_colors = [(248, 166, 178), (130, 213, 187), (247, 205, 103)]
    r = 7 * scale
    for dx, dy, c in [(-8, 0, petal_colors[0]), (8, 0, petal_colors[1]), (0, -8, petal_colors[2]), (0, 8, petal_colors[0])]:
        draw.ellipse((x + dx - r, y + dy - r, x + dx + r, y + dy + r), fill=rgba(c, 240), outline=(255, 255, 255, 160), width=1)
    draw.ellipse((x - 5 * scale, y - 5 * scale, x + 5 * scale, y + 5 * scale), fill=(255, 243, 181, 255))


def draw_palm(draw: ImageDraw.ImageDraw, x: float, y: float, scale: float = 1.0):
    trunk = [(x, y), (x + 8 * scale, y - 30 * scale), (x + 14 * scale, y - 55 * scale)]
    draw.line(trunk, fill=(154, 131, 90, 255), width=max(2, int(6 * scale)))
    topx, topy = trunk[-1]
    for ang in [-70, -35, 0, 35, 70]:
        dx = 28 * scale * math.cos(math.radians(ang))
        dy = 20 * scale * math.sin(math.radians(ang))
        draw.ellipse((topx + dx - 16 * scale, topy + dy - 7 * scale, topx + dx + 16 * scale, topy + dy + 7 * scale), fill=(138, 198, 138, 255), outline=(95, 163, 119, 255), width=1)


def draw_path_pebbles(draw: ImageDraw.ImageDraw, points):
    for i, (x, y) in enumerate(points):
        w = 22 + (i % 2) * 8
        h = 12 + ((i + 1) % 2) * 6
        draw.ellipse((x - w, y - h, x + w, y + h), fill=(232, 226, 214, 220), outline=(212, 185, 122, 180), width=2)


def draw_background(img: Image.Image):
    px = img.load()
    if px is None:
        raise RuntimeError('Failed to access pixel buffer')
    for y in range(HEIGHT):
        p = y / HEIGHT
        color = mix(SKY_TOP, SKY_BOTTOM, p)
        for x in range(WIDTH):
            px[x, y] = color
    draw = ImageDraw.Draw(img, 'RGBA')

    draw.ellipse((950, 70, 1110, 230), fill=(255, 241, 170, 185))
    draw.ellipse((970, 90, 1090, 210), fill=(255, 248, 197, 185))

    draw.rectangle((0, 525, WIDTH, 610), fill=(143, 214, 220, 140))
    for y in [548, 568, 588]:
        for x in range(30, WIDTH, 120):
            draw.arc((x, y, x + 55, y + 18), start=0, end=180, fill=(255, 255, 255, 150), width=2)

    draw.pieslice((60, 355, 760, 980), 180, 360, fill=GRASS_LIGHT, outline=(95, 163, 119, 120))
    draw.pieslice((560, 405, 1235, 930), 180, 360, fill=GRASS)
    draw.rectangle((0, 590, WIDTH, HEIGHT), fill=SAND)
    draw.ellipse((170, 518, 1110, 690), fill=(246, 231, 178, 175), outline=(212, 185, 122, 120), width=4)

    pebbles = [(280, 605), (355, 598), (430, 610), (505, 600), (580, 612), (655, 603), (730, 612), (805, 600), (880, 609), (955, 600)]
    draw_path_pebbles(draw, pebbles)

    draw_palm(draw, 135, 568, 1.0)
    draw_palm(draw, 1100, 560, 1.05)
    draw_flower(draw, 210, 612, 1.1)
    draw_flower(draw, 1030, 616, 1.0)
    draw_flower(draw, 1140, 620, 0.85)
    draw_star_sticker(draw, 126, 646, 16, fill=(130, 213, 187))
    draw_star_sticker(draw, 1156, 642, 16, fill=(247, 205, 103))


def draw_title(draw: ImageDraw.ImageDraw, text: str, y: int = 14):
    box = (455, y, 825, y + 44)
    draw_wood_card(draw, box, fill=(250, 248, 242, 225), outline=(212, 196, 168, 255), radius=22)
    font = load_font(22, heading=True)
    draw_centered_text(draw, (640, y + 21), text, font, INK)


def draw_caption(draw: ImageDraw.ImageDraw, text: str):
    font = load_font(31)
    lines = wrap_text(draw, text, font, 910)
    line_h = text_bbox(draw, 'Ag', font)[1] + 8
    box_h = 24 + line_h * len(lines)
    box = (145, 620 - box_h, 1135, 620)
    draw_wood_card(draw, box, fill=(253, 253, 245, 228), outline=(232, 226, 214, 255), radius=28)
    y = box[1] + 12
    for line in lines:
        draw_centered_text(draw, (640, y + line_h / 2 - 1), line, font, INK)
        y += line_h


def draw_equation(draw: ImageDraw.ImageDraw, text: str, center=(640, 118), color=None, scale: float = 1.0):
    color = color or INK
    box = (center[0] - 228 * scale, center[1] - 46 * scale, center[0] + 228 * scale, center[1] + 48 * scale)
    draw_wood_card(draw, box, fill=(253, 253, 245, 245), outline=(232, 226, 214, 255), radius=int(30 * scale))
    draw.rounded_rectangle((box[0] + 10, box[1] + 8, box[2] - 10, box[1] + 20), radius=16, fill=(255, 255, 255, 88))
    font = load_font(int(60 * scale), heading=True)
    draw_centered_text(draw, center, text, font, color)


def draw_small_badge(draw: ImageDraw.ImageDraw, center, text: str, fill, text_fill=(255, 255, 255)):
    x, y = center
    draw.rounded_rectangle((x - 26, y - 20, x + 26, y + 20), radius=16, fill=rgba(fill, 240), outline=(255, 255, 255, 160), width=2)
    draw_centered_text(draw, center, text, load_font(24, heading=True), text_fill)


def draw_shell_token(draw: ImageDraw.ImageDraw, x: float, y: float, r: float, color, alpha: int = 255):
    draw.ellipse((x - r + 3, y - r + 8, x + r + 3, y + r + 8), fill=(61, 52, 40, 18))
    draw.ellipse((x - r, y - r, x + r, y + r), fill=rgba(color, alpha), outline=(255, 255, 255, min(alpha, 180)), width=3)
    ridge = max(1, int(r * 0.12))
    for dx in [-0.35, 0, 0.35]:
        draw.line((x + dx * r, y - r * 0.48, x + dx * r, y + r * 0.46), fill=(255, 255, 255, 56), width=ridge)
    draw.ellipse((x - r * 0.56, y - r * 0.54, x - r * 0.12, y - r * 0.12), fill=(255, 255, 255, int(alpha * 0.5)))


def bundle_positions(x: float, y: float, scale: float = 1.0) -> list[tuple[float, float]]:
    pts = []
    dx = 34 * scale
    dy = 38 * scale
    for row in range(2):
        for col in range(5):
            pts.append((x + col * dx, y + row * dy))
    return pts


def ones_positions(x: float, y: float, count: int, arc: float = 0.0) -> list[tuple[float, float]]:
    pts = []
    dx = 58
    for i in range(count):
        px = x + i * dx
        py = y + math.sin(i * 0.9 + arc) * 10
        pts.append((px, py))
    return pts


def draw_ten_hut(draw: ImageDraw.ImageDraw, x: float, y: float, scale: float = 1.0):
    w = 110 * scale
    h = 90 * scale
    draw.rounded_rectangle((x, y, x + w, y + h), radius=int(18 * scale), fill=(234, 198, 135, 255), outline=(174, 131, 83, 255), width=3)
    draw.polygon([(x - 12 * scale, y + 20 * scale), (x + w / 2, y - 34 * scale), (x + w + 12 * scale, y + 20 * scale)], fill=(196, 104, 84, 255), outline=(159, 82, 65, 255))
    draw.rounded_rectangle((x + 38 * scale, y + 38 * scale, x + 72 * scale, y + h), radius=int(10 * scale), fill=(181, 130, 88, 255), outline=(150, 110, 75, 255), width=2)
    draw.ellipse((x + 75 * scale, y + 16 * scale, x + 92 * scale, y + 33 * scale), fill=(255, 243, 181, 220))


def draw_ten_bundle(draw: ImageDraw.ImageDraw, x: float, y: float, scale: float = 1.0, glow: float = 0.0, dim: bool = False):
    crate = (x - 28 * scale, y - 28 * scale, x + 178 * scale, y + 118 * scale)
    fill = (245, 231, 198, 255 if not dim else 220)
    outline = (194, 157, 109, 255)
    draw_wood_card(draw, crate, fill=fill, outline=outline, radius=int(24 * scale))
    draw.rounded_rectangle((x - 12 * scale, y + 58 * scale, x + 162 * scale, y + 78 * scale), radius=int(9 * scale), fill=(205, 166, 121, 180))
    if glow > 0:
        a = int(90 + 80 * glow)
        draw.rounded_rectangle((crate[0] - 10, crate[1] - 10, crate[2] + 10, crate[3] + 10), radius=int(28 * scale), outline=(255, 225, 138, a), width=5)
    for tx, ty in bundle_positions(x, y, scale):
        token_color = mix(TEAL, GOLD, 0.45)
        draw_shell_token(draw, tx, ty, 12 * scale, token_color, alpha=180 if dim else 255)
    draw_small_badge(draw, (x + 156 * scale, y - 6 * scale), '10', GOLD, text_fill=INK)


def draw_loose_ones(draw: ImageDraw.ImageDraw, x: float, y: float, count: int, highlight_count: int = 0, pulse: float = 0.0, dim: bool = False):
    pts = ones_positions(x, y, count, arc=pulse * math.pi)
    for idx, (px, py) in enumerate(pts):
        color = CORAL if idx >= highlight_count else MINT
        bounce = math.sin((pulse + idx * 0.08) * math.pi) * 6 if idx < highlight_count else 0
        alpha = 195 if dim else 255
        draw_shell_token(draw, px, py - bounce, 22, color, alpha=alpha)
    return pts


def draw_scene_common(draw: ImageDraw.ImageDraw):
    draw_title(draw, 'Math Island • Tens and Ones')
    draw_star_sticker(draw, 80, 68, 10, fill=(130, 213, 187))
    draw_star_sticker(draw, 1172, 64, 10, fill=(247, 205, 103))
    draw_ten_hut(draw, 110, 470, 1.0)
    sign = (90, 420, 230, 458)
    draw_wood_card(draw, sign, fill=(253, 253, 245, 220), outline=(212, 196, 168, 255), radius=20)
    draw_centered_text(draw, (160, 440), 'Tens Hut', load_font(22, heading=True), INK)


def draw_question_box(draw: ImageDraw.ImageDraw, title: str, subtitle: str | None = None, answer_color=None):
    draw_equation(draw, title, center=(640, 120), color=answer_color or INK, scale=1.0)
    if subtitle:
        box = (448, 166, 832, 214)
        draw_wood_card(draw, box, fill=(250, 248, 242, 215), outline=(232, 226, 214, 255), radius=22)
        draw_centered_text(draw, (640, 190), subtitle, load_font(26), SUBINK)


def draw_example_panel(draw: ImageDraw.ImageDraw, box, top_text: str, bottom_text: str, ones_count: int, accent):
    draw_wood_card(draw, box, fill=(253, 253, 245, 236), outline=(212, 196, 168, 255), radius=30)
    x1, y1, x2, y2 = box
    draw.rounded_rectangle((x1 + 16, y1 + 18, x2 - 16, y1 + 72), radius=18, fill=rgba(accent, 42), outline=rgba(accent, 120), width=2)
    draw_centered_text(draw, ((x1 + x2) / 2, y1 + 46), top_text, load_font(34, heading=True), INK)
    draw_centered_text(draw, ((x1 + x2) / 2, y1 + 110), 'same 1 ten', load_font(22), accent)
    draw_centered_text(draw, ((x1 + x2) / 2, y1 + 168), bottom_text, load_font(34, heading=True), accent)
    draw_ten_bundle(draw, x1 + 56, y1 + 208, scale=0.55)
    start_x = x1 + 196
    for idx, (px, py) in enumerate(ones_positions(start_x, y2 - 50, ones_count, 0.0)):
        draw_shell_token(draw, px, py, 12, CORAL if idx < ones_count else PARCHMENT)


def draw_scene1(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 0)
    draw_scene_common(draw)
    draw_question_box(draw, '1 ten and 5 ones = ?', 'What number are we building today?')
    draw_ten_bundle(draw, 282, 300, scale=1.1)
    draw_loose_ones(draw, 760, 340, 5, pulse=p * 0.25)
    draw_centered_text(draw, (404, 454), '1 ten', load_font(30, heading=True), MINT)
    draw_centered_text(draw, (880, 454), '5 ones', load_font(30, heading=True), CORAL)
    draw_caption(draw, 'Let’s build a number on Math Island.')


def draw_scene2(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 1)
    draw_scene_common(draw)
    draw_question_box(draw, '1 ten', 'One ten means 10')
    glow = 0.5 + 0.5 * math.sin(p * math.pi * 4)
    draw_ten_bundle(draw, 330, 280, scale=1.28, glow=glow)
    draw_loose_ones(draw, 840, 350, 5, dim=True)
    draw_small_badge(draw, (472, 455), '10', GOLD, text_fill=INK)
    draw_sparkles(draw, [(510, 255), (310, 260)], color=(255, 231, 150), scale=0.9)
    draw_caption(draw, 'This full bundle is one ten. One ten means ten.')


def draw_scene3(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 2)
    draw_scene_common(draw)
    draw_question_box(draw, '5 ones', 'Let’s count the extra ones')
    draw_ten_bundle(draw, 250, 312, scale=0.92, dim=True)
    highlight = min(5, max(1, int(math.floor(p * 5.2)) + 1))
    pts = draw_loose_ones(draw, 648, 344, 5, highlight_count=highlight, pulse=p)
    for i, (px, py) in enumerate(pts):
        if i < highlight:
            draw_small_badge(draw, (px, py - 44), str(i + 1), MINT)
    label_box = (810, 430, 1010, 476)
    draw_wood_card(draw, label_box, fill=(253, 253, 245, 220), outline=(212, 196, 168, 255), radius=18)
    draw_centered_text(draw, (910, 452), '5 ones', load_font(26, heading=True), CORAL)
    draw_caption(draw, 'These are the extra ones. One, two, three, four, five.')


def draw_scene4(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 3)
    draw_scene_common(draw)
    eq = '10 + 5 = ?'
    draw_question_box(draw, eq, 'Put the parts together')
    left_shift = lerp(282, 220, ease(p))
    right_shift = lerp(760, 780, ease(p))
    draw_ten_bundle(draw, left_shift, 325, scale=0.95)
    pts = draw_loose_ones(draw, right_shift, 350, 5, pulse=p * 0.3)
    draw.line((560, 345, 722, 345), fill=(214, 182, 124, 180), width=5)
    draw_path_pebbles(draw, [(585, 345), (630, 343), (675, 345)])
    draw_small_badge(draw, (300, 470), '10', GOLD, text_fill=INK)
    draw_small_badge(draw, (892, 470), '5', CORAL)
    draw_caption(draw, 'So we have ten and five more. Ten plus five.')


def draw_scene5(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 4)
    draw_scene_common(draw)
    solved = p > 0.22
    draw_question_box(draw, '10 + 5 = 15' if solved else '10 + 5 = ?', None, answer_color=ANSWER if solved else INK)
    draw_ten_bundle(draw, 214, 320, scale=0.88)
    draw_loose_ones(draw, 650, 346, 5, pulse=p * 0.2)
    plaque = (915, 250, 1135, 372)
    draw_wood_card(draw, plaque, fill=(255, 245, 248, 236), outline=(255, 220, 228, 255), radius=28)
    draw_centered_text(draw, (1025, 312), '15', load_font(72, heading=True), ANSWER, shadow=True)
    draw_centered_text(draw, (1025, 390), '1 ten + 5 ones', load_font(24), SUBINK)
    pulse = 0.6 + 0.4 * math.sin(p * math.pi * 5)
    draw_sparkles(draw, [(900, 290), (1135, 260), (1085, 390)], color=(255, 235, 164), scale=0.7 + pulse * 0.4)
    draw_star_sticker(draw, 1136, 230, 18, fill=(247, 205, 103))
    draw_caption(draw, 'Ten plus five is fifteen. So 1 ten and 5 ones is 15.')


def draw_scene6(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 5)
    draw_scene_common(draw)
    draw_centered_text(draw, (640, 118), 'The ten stays the same!', load_font(40, heading=True), INK)
    left_box = (120, 180, 590, 500)
    right_box = (690, 180, 1160, 500)
    draw_example_panel(draw, left_box, '1 ten + 2 ones', '12', 2, MINT)
    draw_example_panel(draw, right_box, '1 ten + 8 ones', '18', 8, BERRY)
    glow = int(180 + 60 * math.sin(p * math.pi * 4))
    draw.rounded_rectangle((408, 525, 872, 595), radius=28, fill=(255, 255, 255, 220), outline=(255, 209, 102, glow), width=4)
    draw_centered_text(draw, (640, 560), 'Only the ones change', load_font(34, heading=True), GOLD)
    draw_caption(draw, 'One ten and two ones is twelve. One ten and eight ones is eighteen.')


def draw_scene7(draw: ImageDraw.ImageDraw, t: float):
    p = scene_progress(t, 6)
    draw_scene_common(draw)
    pulse = 1.0 + 0.04 * math.sin(p * math.pi * 6)
    draw_question_box(draw, 'Your turn: 1 ten and 3 ones = ?', 'Can you build the next teen number?')
    draw_ten_bundle(draw, 255, 318, scale=0.95)
    draw_loose_ones(draw, 760, 352, 3, pulse=p * 0.5)
    bubble_box = (515 - 118 * pulse, 250 - 42 * pulse, 765 + 118 * pulse, 250 + 42 * pulse)
    draw_wood_card(draw, bubble_box, fill=(255, 255, 255, 226), outline=(255, 227, 235, 255), radius=28)
    draw_centered_text(draw, (640, 250), 'What number is it?', load_font(32, heading=True), ANSWER)
    draw_sparkles(draw, [(492, 245), (788, 246)], color=(248, 166, 178), scale=0.65 + pulse * 0.25)
    draw_caption(draw, 'Your turn. What number is 1 ten and 3 ones?')


def render_frame(frame_idx: int):
    t = frame_idx / FPS
    img = Image.new('RGB', (WIDTH, HEIGHT), SKY_TOP)
    draw_background(img)
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

    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay, 'RGBA')
    od.rectangle((0, 0, WIDTH, HEIGHT), fill=(255, 255, 255, 0))
    od.ellipse((-150, -80, 1430, 900), fill=(255, 255, 255, 0), outline=None)
    overlay = overlay.filter(ImageFilter.GaussianBlur(20))
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')

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
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', str(SILENT_VIDEO)
    ])
    run([
        'ffmpeg', '-y', '-i', str(SILENT_VIDEO), '-i', str(AUDIO), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', str(FINAL_VIDEO)
    ])


def main():
    if not AUDIO.exists():
        raise FileNotFoundError(f'Audio file not found: {AUDIO}')
    ensure_dirs()
    for frame_idx in range(TOTAL_FRAMES):
        render_frame(frame_idx)
        if frame_idx % 24 == 0:
            print(f'Rendered {frame_idx + 1}/{TOTAL_FRAMES}')
    encode_video()
    print(f'Final video: {FINAL_VIDEO}')


if __name__ == '__main__':
    main()
