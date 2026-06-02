from __future__ import annotations

import importlib.util
import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_PATH = Path('/Users/mac/tools/math-island/scripts/make_ten_first_video.py')
spec = importlib.util.spec_from_file_location('make_ten_first_video_base', BASE_PATH)
base = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(base)

ROOT = Path('/Users/mac/tools/math-island')
OUTPUT_DIR = ROOT / 'dist/video'
FRAMES_DIR = OUTPUT_DIR / 'frames/make-ten-first-v2'
SILENT_VIDEO = OUTPUT_DIR / 'math-island-make-ten-first-v2-silent.mp4'
FINAL_VIDEO = OUTPUT_DIR / 'math-island-make-ten-first-v2.mp4'
AUDIO = Path('/Users/mac/.hermes/audio_cache/tts_20260601_095348.mp3')

# Themed fonts
base.FONT_HEAD = '/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf'
base.FONT_BODY = '/System/Library/Fonts/Supplemental/Arial.ttf'

# Themed colors from animal-island-ui + Math Island
base.SKY_TOP = (170, 224, 240)
base.SKY_BOTTOM = (230, 246, 252)
base.SAND = (240, 216, 160)
base.HILL = (125, 195, 149)
base.INK = (121, 79, 39)
base.WHITE = (253, 253, 245)
base.LEFT = (111, 196, 236)
base.TRANSFER = (25, 200, 185)
base.TEN = (245, 195, 28)
base.LEFTOVER = (229, 146, 102)
base.ANSWER = (248, 166, 178)
base.PALE = (232, 226, 214)
base.SHADOW = (61, 52, 40, 26)

base.FRAMES_DIR = FRAMES_DIR
base.OUTPUT_DIR = OUTPUT_DIR
base.SILENT_VIDEO = SILENT_VIDEO
base.FINAL_VIDEO = FINAL_VIDEO
base.AUDIO = AUDIO


def rgba(rgb: tuple[int, int, int], a: int = 255):
    return rgb + (a,)


def island_shadow(draw: ImageDraw.ImageDraw, box, radius=26, shadow_offset=(0, 8), shadow_fill=(61, 52, 40, 28)):
    x1, y1, x2, y2 = box
    sx, sy = shadow_offset
    draw.rounded_rectangle((x1 + sx, y1 + sy, x2 + sx, y2 + sy), radius=radius, fill=shadow_fill)


def draw_wood_card(draw: ImageDraw.ImageDraw, box, fill=(253, 253, 245, 235), outline=(232, 226, 214, 255), radius=28):
    island_shadow(draw, box, radius=radius, shadow_offset=(0, 10), shadow_fill=(61, 52, 40, 32))
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=3)
    draw.rounded_rectangle((x1 + 8, y1 + 7, x2 - 8, y1 + 18), radius=14, fill=(255, 255, 255, 85))


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


def draw_path_pebbles(draw: ImageDraw.ImageDraw, points):
    for i, (x, y) in enumerate(points):
        w = 22 + (i % 2) * 8
        h = 12 + ((i + 1) % 2) * 6
        draw.ellipse((x - w, y - h, x + w, y + h), fill=(232, 226, 214, 220), outline=(212, 185, 122, 180), width=2)


def v2_gradient_background(img: Image.Image):
    base.draw_gradient_background(img)
    draw = ImageDraw.Draw(img, 'RGBA')

    # shoreline/ocean band
    draw.rectangle((0, 525, base.WIDTH, 610), fill=(143, 214, 220, 140))
    for y in [548, 568, 588]:
        for x in range(30, base.WIDTH, 120):
            draw.arc((x, y, x + 55, y + 18), start=0, end=180, fill=(255, 255, 255, 150), width=2)

    # island blob inspired by app map
    draw.pieslice((80, 360, 760, 960), 180, 360, fill=(188, 226, 154, 255), outline=(95, 163, 119, 120))
    draw.pieslice((560, 410, 1220, 920), 180, 360, fill=(125, 195, 149, 240))
    draw.rectangle((0, 590, base.WIDTH, base.HEIGHT), fill=(240, 217, 160, 255))
    draw.ellipse((170, 518, 1110, 690), fill=(246, 231, 178, 170), outline=(212, 185, 122, 120), width=4)

    # sandy path
    pebbles = [(280, 605), (355, 598), (430, 610), (505, 600), (580, 612), (655, 603), (730, 612), (805, 600), (880, 609), (955, 600)]
    draw_path_pebbles(draw, pebbles)

    # decorations
    draw_palm(draw, 135, 568, 1.0)
    draw_palm(draw, 1100, 560, 1.05)
    draw_flower(draw, 210, 612, 1.1)
    draw_flower(draw, 1030, 616, 1.0)
    draw_flower(draw, 1140, 620, 0.85)
    draw_star_sticker(draw, 126, 646, 16, fill=(130, 213, 187))
    draw_star_sticker(draw, 1156, 642, 16, fill=(247, 205, 103))


def v2_draw_card(draw: ImageDraw.ImageDraw, box, fill=None, outline=None, radius: int = 28):
    if fill is None:
        fill = (253, 253, 245, 236)
    if outline is None:
        outline = (232, 226, 214, 255)
    draw_wood_card(draw, box, fill=fill, outline=outline, radius=radius)


def v2_draw_title(draw: ImageDraw.ImageDraw, text: str, y: int = 14):
    box = (455, y, 825, y + 44)
    draw_wood_card(draw, box, fill=(250, 248, 242, 225), outline=(212, 196, 168, 255), radius=22)
    font = ImageFont.truetype(base.FONT_HEAD, 22)
    base.draw_centered_text(draw, (640, y + 21), text, font, base.INK)


def v2_draw_equation(draw: ImageDraw.ImageDraw, text: str, center=(640, 118), color=None, scale: float = 1.0):
    color = color or base.INK
    box = (center[0] - 228 * scale, center[1] - 46 * scale, center[0] + 228 * scale, center[1] + 48 * scale)
    draw_wood_card(draw, box, fill=(253, 253, 245, 245), outline=(232, 226, 214, 255), radius=int(30 * scale))
    draw.rounded_rectangle((box[0] + 10, box[1] + 8, box[2] - 10, box[1] + 20), radius=16, fill=(255, 255, 255, 88))
    font = ImageFont.truetype(base.FONT_HEAD, int(60 * scale))
    base.draw_centered_text(draw, center, text, font, color)


def v2_draw_caption(draw: ImageDraw.ImageDraw, text: str):
    font = ImageFont.truetype(base.FONT_BODY, 31)
    lines = base.wrap_text(draw, text, font, 910)
    line_h = base.text_bbox(draw, 'Ag', font)[1] + 8
    box_h = 24 + line_h * len(lines)
    box = (145, 620 - box_h, 1135, 620)
    draw_wood_card(draw, box, fill=(253, 253, 245, 228), outline=(232, 226, 214, 255), radius=28)
    y = box[1] + 12
    for line in lines:
        base.draw_centered_text(draw, (640, y + line_h / 2 - 1), line, font, base.INK)
        y += line_h


def v2_draw_shell(draw: ImageDraw.ImageDraw, x: float, y: float, r: float, color, alpha: int = 255, outline=None):
    # soft shadow
    draw.ellipse((x - r + 3, y - r + 8, x + r + 3, y + r + 8), fill=(61, 52, 40, 18))
    # outer token
    draw.ellipse((x - r, y - r, x + r, y + r), fill=rgba(color, alpha), outline=outline or (255, 255, 255, min(alpha, 180)), width=3)
    # shell ridges
    ridge = max(1, int(r * 0.12))
    for dx in [-0.35, 0, 0.35]:
        draw.line((x + dx * r, y - r * 0.48, x + dx * r, y + r * 0.46), fill=(255, 255, 255, 56), width=ridge)
    # top highlight
    draw.ellipse((x - r * 0.56, y - r * 0.54, x - r * 0.12, y - r * 0.12), fill=(255, 255, 255, int(alpha * 0.5)))


def v2_draw_scene_common(draw: ImageDraw.ImageDraw):
    v2_draw_title(draw, 'Math Island • Make 10 First')
    draw_star_sticker(draw, 80, 68, 10, fill=(130, 213, 187))
    draw_star_sticker(draw, 1172, 64, 10, fill=(247, 205, 103))


def v2_draw_panel(draw: ImageDraw.ImageDraw, box, top_text: str, bottom_text: str, accent):
    draw_wood_card(draw, box, fill=(253, 253, 245, 236), outline=(212, 196, 168, 255), radius=30)
    x1, y1, x2, y2 = box
    draw.rounded_rectangle((x1 + 16, y1 + 18, x2 - 16, y1 + 72), radius=18, fill=rgba(accent, 42), outline=rgba(accent, 120), width=2)
    base.draw_centered_text(draw, ((x1 + x2) / 2, y1 + 46), top_text, ImageFont.truetype(base.FONT_HEAD, 40), base.INK)
    base.draw_centered_text(draw, ((x1 + x2) / 2, y1 + 110), '↓ make 10 first ↓', ImageFont.truetype(base.FONT_BODY, 22), accent)
    base.draw_centered_text(draw, ((x1 + x2) / 2, y1 + 170), bottom_text, ImageFont.truetype(base.FONT_HEAD, 37), accent)
    # badge + shells
    badge_fill = (130, 213, 187) if accent == base.TRANSFER else (177, 125, 238)
    draw.rounded_rectangle((x1 + 22, y1 + 206, x1 + 74, y1 + 252), radius=16, fill=rgba(badge_fill, 235), outline=(255, 255, 255, 160), width=2)
    base.draw_centered_text(draw, (x1 + 48, y1 + 229), 'A' if accent == base.TRANSFER else 'B', ImageFont.truetype(base.FONT_HEAD, 24), (255, 255, 255))
    for i in range(5):
        v2_draw_shell(draw, x1 + 110 + i * 38, y2 - 42, 13, accent if i < 3 else base.PALE)


def render_frame_v2(frame_idx: int):
    t = frame_idx / base.FPS
    img = Image.new('RGB', (base.WIDTH, base.HEIGHT), base.SKY_TOP)
    v2_gradient_background(img)
    draw = ImageDraw.Draw(img, 'RGBA')

    # monkeypatch base drawing hooks for scene functions
    base.draw_card = v2_draw_card
    base.draw_title = v2_draw_title
    base.draw_caption = v2_draw_caption
    base.draw_equation = v2_draw_equation
    base.draw_shell = v2_draw_shell
    base.draw_scene_common = v2_draw_scene_common
    base.draw_panel = v2_draw_panel

    if t < base.SCENES[1][0]:
        base.draw_scene1(draw, t)
    elif t < base.SCENES[2][0]:
        base.draw_scene2(draw, t)
        # golden sparkles on missing spots
        slots = base.shell_grid_positions(260, 300, 10, cols=5)
        draw_sparkles(draw, [(slots[8][0], slots[8][1] - 40), (slots[9][0], slots[9][1] - 40)], color=(255, 236, 143), scale=0.9)
    elif t < base.SCENES[3][0]:
        base.draw_scene3(draw, t)
        draw_star_sticker(draw, 930, 196, 20, fill=(130, 213, 187))
    elif t < base.SCENES[4][0]:
        base.draw_scene4(draw, t)
        # dotted path for moving shells
        draw_path_pebbles(draw, [(700, 325), (650, 320), (600, 322), (550, 326)])
    elif t < base.SCENES[5][0]:
        base.draw_scene5(draw, t)
        draw_star_sticker(draw, 1125, 226, 20, fill=(247, 205, 103))
        draw_sparkles(draw, [(1090, 210), (1165, 255)], color=(255, 233, 160), scale=1.0)
    elif t < base.SCENES[6][0]:
        base.draw_scene6(draw, t)
    else:
        base.draw_scene7(draw, t)
        pulse = 0.5 + 0.5 * math.sin(base.scene_progress(t, 6) * math.pi * 6)
        draw_sparkles(draw, [(786, 240), (490, 240)], color=(248, 166, 178), scale=0.5 + 0.5 * pulse)

    # subtle vignette for polish
    overlay = Image.new('RGBA', (base.WIDTH, base.HEIGHT), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay, 'RGBA')
    od.rectangle((0, 0, base.WIDTH, base.HEIGHT), fill=(255, 255, 255, 0))
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
        'ffmpeg', '-y', '-framerate', str(base.FPS), '-i', str(FRAMES_DIR / 'frame_%04d.png'),
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', str(SILENT_VIDEO)
    ])
    run([
        'ffmpeg', '-y', '-i', str(SILENT_VIDEO), '-i', str(AUDIO), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', str(FINAL_VIDEO)
    ])


def main():
    if not AUDIO.exists():
        raise FileNotFoundError(f'Audio file not found: {AUDIO}')
    ensure_dirs()
    for frame_idx in range(base.TOTAL_FRAMES):
        render_frame_v2(frame_idx)
        if frame_idx % 24 == 0:
            print(f'Rendered {frame_idx + 1}/{base.TOTAL_FRAMES}')
    encode_video()
    print(f'Final video: {FINAL_VIDEO}')


if __name__ == '__main__':
    main()
