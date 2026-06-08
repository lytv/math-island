"""
Generate prompt MP3s using edge-tts with configurable voice settings.

Defaults:
- Voice: en-US-AriaNeural
- Rate: -5%
- Pitch: +10Hz

Examples:
  python3 scripts/generate_speech.py --show-settings
  python3 scripts/generate_speech.py --voice en-US-JennyNeural --rate=-8% --pitch=+6Hz --save-settings --preview-text "Let’s count to ten together!"
  python3 scripts/generate_speech.py --force
"""

import argparse
import asyncio
import glob
import hashlib
import importlib
import json
import os
import sys
from pathlib import Path

ROOT_DIR = Path("/Users/mac/tools/math-island")
SKILLS_DIR = ROOT_DIR / "src/content/skills"
OUTPUT_DIR = ROOT_DIR / "public/audio/speech"
MANIFEST_PATH = ROOT_DIR / "src/lib/speech-manifest.json"
SETTINGS_PATH = ROOT_DIR / "scripts/speech_settings.json"
LAST_RUN_SETTINGS_PATH = OUTPUT_DIR / ".last_used_tts_settings.json"

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
                settings[key] = stored[key]
    return settings


def save_settings(settings):
    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with SETTINGS_PATH.open("w") as f:
        json.dump(settings, f, indent=2)
        f.write("\n")


def save_last_run_settings(settings):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with LAST_RUN_SETTINGS_PATH.open("w") as f:
        json.dump(settings, f, indent=2)
        f.write("\n")


def load_last_run_settings():
    if not LAST_RUN_SETTINGS_PATH.exists():
        return None
    with LAST_RUN_SETTINGS_PATH.open() as f:
        return json.load(f)


def normalize_settings(settings):
    return {
        "voice": settings["voice"].strip(),
        "rate": settings["rate"].strip(),
        "pitch": settings["pitch"].strip(),
    }


def validate_settings(settings):
    for key in ("voice", "rate", "pitch"):
        value = settings.get(key)
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{key} must be a non-empty string")

    if not settings["rate"].endswith("%"):
        raise ValueError("rate must look like -5% or +10%")

    if not settings["pitch"].lower().endswith("hz"):
        raise ValueError("pitch must look like +10Hz or -5Hz")


async def generate_one(edge_tts, text, filename, settings, force=False, output_path=None):
    """Generate a single MP3 file."""
    path = Path(output_path) if output_path else OUTPUT_DIR / filename
    if path.exists() and not force:
        print(f"  SKIP (exists): {path.name}")
        return True
    try:
        comm = edge_tts.Communicate(
            text,
            settings["voice"],
            rate=settings["rate"],
            pitch=settings["pitch"],
        )
        await comm.save(str(path))
        print(f"  OK: {path.name}")
        return True
    except Exception as e:
        print(f"  FAIL: {path.name} — {e}")
        return False


def prompt_to_filename(prompt):
    """Create a stable filename from prompt text."""
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


def print_settings(settings, label="Current TTS settings"):
    print(label)
    print(f"  voice: {settings['voice']}")
    print(f"  rate:  {settings['rate']}")
    print(f"  pitch: {settings['pitch']}")
    print(f"  settings file: {SETTINGS_PATH}")


def warn_if_settings_changed(settings, force):
    previous = load_last_run_settings()
    if previous and previous != settings and not force:
        print("WARNING: TTS settings changed since the last full audio generation.")
        print("Existing MP3 files may still use the older voice settings.")
        print("Run again with --force to regenerate files using the new settings.")
        print()


def import_edge_tts():
    try:
        return importlib.import_module("edge_tts")
    except ImportError:
        print("edge_tts is not installed for this Python interpreter.")
        print("Install it first, for example: python3 -m pip install edge-tts")
        return None


async def run_preview(settings, preview_text, preview_output, force=False):
    edge_tts = import_edge_tts()
    if edge_tts is None:
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if preview_output:
        out_path = Path(preview_output)
    else:
        out_path = OUTPUT_DIR / "_preview.mp3"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    ok = await generate_one(
        edge_tts,
        preview_text,
        out_path.name,
        settings,
        force=force,
        output_path=out_path,
    )
    if ok:
        print(f"Preview generated at: {out_path}")
        return 0
    return 1


async def run_full_generation(settings, force=False):
    edge_tts = import_edge_tts()
    if edge_tts is None:
        return 1

    # Collect all unique prompts
    all_prompts = set()
    for fpath in sorted(glob.glob(str(SKILLS_DIR / "*.json"))):
        with open(fpath) as f:
            data = json.load(f)
        for q in data["questions"]:
            all_prompts.add(q["prompt"])

    # Include spoken praise lines so they get pre-rendered too.
    all_prompts.update(PRAISE_LINES)

    prompts = sorted(all_prompts)
    print(f"Total unique prompts: {len(prompts)}")

    # Create output dir
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Build manifest: prompt → filename
    manifest = {p: prompt_to_filename(p) for p in prompts}

    # Write manifest immediately so speech.ts can reference it
    with MANIFEST_PATH.open("w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    print(f"Manifest written: {MANIFEST_PATH} ({len(manifest)} entries)")

    warn_if_settings_changed(settings, force)

    total = len(prompts)
    ok = 0
    fail = 0

    # Process in smaller batches to avoid rate limits
    batch_size = 20
    for i in range(0, total, batch_size):
        batch = prompts[i:i + batch_size]
        tasks = []
        for p in batch:
            filename = manifest[p]
            tasks.append(generate_one(edge_tts, p, filename, settings, force=force))

        results = await asyncio.gather(*tasks)
        ok += sum(1 for r in results if r)
        fail += sum(1 for r in results if not r)
        print(f"  Progress: {i + len(batch)}/{total} — {ok} ok, {fail} fail")

        if i + batch_size < total:
            await asyncio.sleep(1)

    print(f"\nDone: {ok} generated, {fail} failed, {total} total")

    if fail == 0:
        save_last_run_settings(settings)

    return 1 if fail > 0 else 0


def build_arg_parser():
    parser = argparse.ArgumentParser(
        description="Generate Math Island speech audio with configurable edge-tts voice settings."
    )
    parser.add_argument("--voice", help="Voice name, for example en-US-AriaNeural")
    parser.add_argument("--rate", help="Speech rate, for example minus 5 percent")
    parser.add_argument("--pitch", help="Speech pitch, for example +10Hz")
    parser.add_argument(
        "--save-settings",
        action="store_true",
        help="Save the provided voice/rate/pitch values to scripts/speech_settings.json",
    )
    parser.add_argument(
        "--show-settings",
        action="store_true",
        help="Print the effective voice settings and exit",
    )
    parser.add_argument(
        "--preview-text",
        help="Generate one preview MP3 with the current settings instead of the full batch",
    )
    parser.add_argument(
        "--preview-output",
        help="Output path for preview MP3. Defaults to public/audio/speech/_preview.mp3",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate files even if they already exist",
    )
    return parser


def resolve_settings(args):
    settings = load_settings()
    if args.voice:
        settings["voice"] = args.voice
    if args.rate:
        settings["rate"] = args.rate
    if args.pitch:
        settings["pitch"] = args.pitch
    settings = normalize_settings(settings)
    validate_settings(settings)
    return settings


async def main():
    parser = build_arg_parser()
    args = parser.parse_args()

    try:
        settings = resolve_settings(args)
    except ValueError as e:
        print(f"Invalid TTS settings: {e}")
        return 2

    if args.save_settings:
        save_settings(settings)
        print_settings(settings, label="Saved TTS settings")
        print()

    if args.show_settings:
        print_settings(settings)
        return 0

    if args.preview_text:
        return await run_preview(settings, args.preview_text, args.preview_output, force=args.force)

    print_settings(settings)
    print()
    return await run_full_generation(settings, force=args.force)


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
