"""
Generate ONLY the praise MP3s using the same voice settings as
generate_speech.py. Doesn't touch the manifest (which already maps
each praise line to its filename) and skips files that already exist.

Run:  .venv-tts/bin/python scripts/generate_praise.py
"""
import asyncio
import hashlib
import os
import sys

OUTPUT_DIR = "/Users/mac/tools/math-island/public/audio/speech"
VOICE = "en-US-AriaNeural"
RATE = "-5%"
PITCH = "+10Hz"

PRAISE_LINES = [
    "Great job!",
    "Way to go!",
    "Awesome!",
    "You're a star!",
    "Fantastic!",
    "Nicely done!",
]


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


async def generate_one(edge_tts, text: str, filename: str) -> bool:
    path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(path):
        print(f"  SKIP (exists): {filename}")
        return True
    try:
        comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
        await comm.save(path)
        print(f"  OK: {filename}  ({text!r})")
        return True
    except Exception as e:
        print(f"  FAIL: {filename} — {e}")
        return False


async def main() -> None:
    import edge_tts

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Generating {len(PRAISE_LINES)} praise lines into {OUTPUT_DIR}")

    tasks = [
        generate_one(edge_tts, line, prompt_to_filename(line))
        for line in PRAISE_LINES
    ]
    results = await asyncio.gather(*tasks)
    ok = sum(1 for r in results if r)
    fail = len(results) - ok
    print(f"\nDone: {ok} ok, {fail} fail")
    if fail:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
