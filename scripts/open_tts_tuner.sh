#!/bin/bash
set -euo pipefail
cd /Users/mac/tools/math-island
if ! curl -fsS http://127.0.0.1:8765/api/settings >/dev/null 2>&1; then
  nohup /Users/mac/tools/math-island/.venv/bin/python /Users/mac/tools/math-island/scripts/tts_tuner_server.py >/tmp/tts_tuner_server.log 2>&1 &
  sleep 1
fi
open http://127.0.0.1:8765
