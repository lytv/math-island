"""
Generate all prompt MP3s using edge-tts with matching voice settings.
Rate: -5% (matching speech.ts rate=0.95)
Pitch: +10Hz (matching speech.ts pitch=1.1)
Voice: en-US-AriaNeural (closest to 'Aria' preferred in speech.ts)
"""
import asyncio
import hashlib
import json
import os
import glob
import sys

SKILLS_DIR = "/Users/mac/tools/math-island/src/content/skills"
OUTPUT_DIR = "/Users/mac/tools/math-island/public/audio/speech"
MANIFEST_PATH = "/Users/mac/tools/math-island/src/lib/speech-manifest.json"

VOICE = "en-US-AriaNeural"
RATE = "-5%"
PITCH = "+10Hz"

async def generate_one(edge_tts, text, filename):
    """Generate a single MP3 file."""
    path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(path):
        print(f"  SKIP (exists): {filename}")
        return True
    try:
        comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
        await comm.save(path)
        print(f"  OK: {filename}")
        return True
    except Exception as e:
        print(f"  FAIL: {filename} — {e}")
        return False

def prompt_to_filename(prompt):
    """Create a stable filename from prompt text."""
    h = hashlib.sha256(prompt.encode()).hexdigest()[:12]
    safe = prompt.lower().replace(" ", "-").replace("?", "").replace(",", "").replace(":", "").replace("—", "-")[:40]
    safe = "".join(c for c in safe if c.isalnum() or c == "-").strip("-")
    return f"{safe}-{h}.mp3"

async def main():
    # Collect all unique prompts
    all_prompts = set()
    for fpath in sorted(glob.glob(f"{SKILLS_DIR}/*.json")):
        with open(fpath) as f:
            data = json.load(f)
        for q in data["questions"]:
            all_prompts.add(q["prompt"])
    
    prompts = sorted(all_prompts)
    print(f"Total unique prompts: {len(prompts)}")
    
    # Create output dir
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Build manifest: prompt → filename
    manifest = {}
    for p in prompts:
        manifest[p] = prompt_to_filename(p)
    
    # Write manifest immediately so speech.ts can reference it
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Manifest written: {MANIFEST_PATH} ({len(manifest)} entries)")
    
    # Generate all files
    import edge_tts
    total = len(prompts)
    ok = 0
    fail = 0
    
    # Process in smaller batches to avoid rate limits
    batch_size = 20
    for i in range(0, total, batch_size):
        batch = prompts[i:i+batch_size]
        tasks = []
        for p in batch:
            filename = manifest[p]
            tasks.append(generate_one(edge_tts, p, filename))
        
        results = await asyncio.gather(*tasks)
        ok += sum(1 for r in results if r)
        fail += sum(1 for r in results if not r)
        print(f"  Progress: {i+len(batch)}/{total} — {ok} ok, {fail} fail")
        
        if i + batch_size < total:
            await asyncio.sleep(1)  # brief pause between batches
    
    print(f"\nDone: {ok} generated, {fail} failed, {total} total")
    
    if fail > 0:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
