"""
Generate ONLY the praise MP3s using the current speech settings from
scripts/speech_settings.json.

Examples:
  /Users/mac/tools/math-island/.venv/bin/python scripts/generate_praise.py
  /Users/mac/tools/math-island/.venv/bin/python scripts/generate_praise.py --force
"""

import argparse
import asyncio
import hashlib
import importlib
import json
import sys
from pathlib import Path

ROOT_DIR = Path("/Users/mac/tools/math-island")
OUTPUT_DIR = ROOT_DIR / "public/audio/speech"
SETTINGS_PATH = ROOT_DIR / "scripts/speech_settings.json"

DEFAULT_SETTINGS = {
    "voice": "en-US-AriaNeural",
    "rate": "-5%",
    "pitch": "+10Hz",
}

PRAISE_LINES = [
    "Great job!",
    "Way to go!",
    "Awesome!",
    "You're a star!",
    "Fantastic!",
    "Nicely done!",
]


def load_settings():
    settings = DEFAULT_SETTINGS.copy()
    if SETTINGS_PATH.exists():
        with SETTINGS_PATH.open() as f:
            stored = json.load(f)
        for key in DEFAULT_SETTINGS:
            if key in stored and stored[key]:
                settings[key] = str(stored[key]).strip()
    return settings


def validate_settings(settings):
    for key in ("voice", "rate", "pitch"):
        value = settings.get(key)
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{key} must be a non-empty string")
    if not settings["rate"].endswith("%"):
        raise ValueError("rate must look like -5% or +10%")
    if not settings["pitch"].lower().endswith("hz"):
        raise ValueError("pitch must look like +10Hz or -5Hz")


def prompt_to_filename(prompt: str) -> str:
    h = hashlib.sha256(prompt.encode()).hexdigest()[:12]
    safe = (
        prompt.lower()
        .replace(" ", "-")
        .replace("?", "")
        .replace(",", "")
        .replace(":", "")
        .replace("—", "-")[:40]
    )
    safe = "".join(c for c in safe if c.isalnum() or c == "-").strip("-")
    return f"{safe}-{h}.mp3"


async def generate_one(edge_tts, text: str, filename: str, settings, force: bool) -> bool:
    path = OUTPUT_DIR / filename
    if path.exists() and not force:
        print(f"  SKIP (exists): {filename}")
        return True
    try:
        comm = edge_tts.Communicate(
            text,
            settings["voice"],
            rate=settings["rate"],
            pitch=settings["pitch"],
        )
        await comm.save(str(path))
        print(f"  OK: {filename}  ({text!r})")
        return True
    except Exception as e:
        print(f"  FAIL: {filename} — {e}")
        return False


def import_edge_tts():
    try:
        return importlib.import_module("edge_tts")
    except ImportError:
        print("edge_tts is not installed for this Python interpreter.")
        print("Use /Users/mac/tools/math-island/.venv/bin/python to run this script.")
        return None


async def main() -> int:
    parser = argparse.ArgumentParser(description="Generate only the praise MP3 files.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate praise files even if they already exist.",
    )
    args = parser.parse_args()

    settings = load_settings()
    try:
        validate_settings(settings)
    except ValueError as e:
        print(f"Invalid TTS settings: {e}")
        return 2

    edge_tts = import_edge_tts()
    if edge_tts is None:
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Generating {len(PRAISE_LINES)} praise lines into {OUTPUT_DIR}")
    print(f"Using settings: voice={settings['voice']} rate={settings['rate']} pitch={settings['pitch']}")

    tasks = [
        generate_one(edge_tts, line, prompt_to_filename(line), settings, args.force)
        for line in PRAISE_LINES
    ]
    results = await asyncio.gather(*tasks)
    ok = sum(1 for r in results if r)
    fail = len(results) - ok
    print(f"\nDone: {ok} ok, {fail} fail")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
