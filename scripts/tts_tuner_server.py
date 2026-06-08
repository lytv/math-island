#!/usr/bin/env python3
import json
import shlex
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path('/Users/mac/tools/math-island')
SCRIPT = ROOT / 'scripts/generate_speech.py'
SETTINGS = ROOT / 'scripts/speech_settings.json'
HTML = ROOT / 'scripts/tts_settings_tool.html'
PYTHON = ROOT / '.venv/bin/python'
HOST = '127.0.0.1'
PORT = 8765

DEFAULT_SETTINGS = {
    'voice': 'en-US-AriaNeural',
    'rate': '-5%',
    'pitch': '+10Hz',
}


def load_settings():
    if SETTINGS.exists():
        try:
            data = json.loads(SETTINGS.read_text())
            return {
                'voice': data.get('voice', DEFAULT_SETTINGS['voice']),
                'rate': data.get('rate', DEFAULT_SETTINGS['rate']),
                'pitch': data.get('pitch', DEFAULT_SETTINGS['pitch']),
            }
        except Exception:
            pass
    return DEFAULT_SETTINGS.copy()


def validate_settings(payload):
    voice = str(payload.get('voice', '')).strip()
    rate = str(payload.get('rate', '')).strip()
    pitch = str(payload.get('pitch', '')).strip()
    preview_text = str(payload.get('preview_text', '')).strip()

    if not voice:
        raise ValueError('voice is required')
    if not rate.endswith('%'):
        raise ValueError('rate must end with %')
    if not pitch.lower().endswith('hz'):
        raise ValueError('pitch must end with Hz')

    return {
        'voice': voice,
        'rate': rate,
        'pitch': pitch,
        'preview_text': preview_text,
    }


def build_command(action, settings):
    base = [
        str(PYTHON),
        str(SCRIPT),
        '--voice', settings['voice'],
        f"--rate={settings['rate']}",
        f"--pitch={settings['pitch']}",
    ]
    if action == 'preview':
        preview_text = settings['preview_text'] or 'Let’s count together.'
        return base + ['--preview-text', preview_text, '--force']
    if action == 'save':
        return base + ['--save-settings', '--show-settings']
    if action == 'rebuild':
        return [str(PYTHON), str(SCRIPT), '--force']
    raise ValueError(f'Unknown action: {action}')


def run_command(command):
    proc = subprocess.run(
        command,
        cwd=str(ROOT),
        capture_output=True,
        text=True,
    )
    return {
        'command': ' '.join(shlex.quote(part) for part in command),
        'exit_code': proc.returncode,
        'stdout': proc.stdout,
        'stderr': proc.stderr,
        'ok': proc.returncode == 0,
    }


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, text, status=200):
        body = text.encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ('/', '/index.html'):
            self._send_html(HTML.read_text())
            return
        if self.path == '/api/settings':
            self._send_json({'settings': load_settings(), 'host': HOST, 'port': PORT})
            return
        self._send_json({'error': 'Not found'}, status=404)

    def do_POST(self):
        if self.path not in ('/api/preview', '/api/save', '/api/rebuild'):
            self._send_json({'error': 'Not found'}, status=404)
            return

        try:
            length = int(self.headers.get('Content-Length', '0'))
            raw = self.rfile.read(length) if length else b'{}'
            payload = json.loads(raw.decode('utf-8') or '{}')
            settings = validate_settings(payload)
            action = self.path.split('/')[-1]
            result = run_command(build_command(action, settings))
            self._send_json(result, status=200 if result['ok'] else 500)
        except ValueError as exc:
            self._send_json({'error': str(exc)}, status=400)
        except Exception as exc:
            self._send_json({'error': f'Internal server error: {exc}'}, status=500)

    def log_message(self, format, *args):
        return


if __name__ == '__main__':
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f'TTS tuner server running at http://{HOST}:{PORT}')
    server.serve_forever()
