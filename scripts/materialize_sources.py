#!/usr/bin/env python3
"""Verify that the editable Spotify Tools source is present before publishing."""
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[1]
target = root / "plugins" / "spotify-tools" / "index.js"
expected = "fe888ded40829e6c6a5b62186ee87d10d567318a71fd03453a07e536e90bb261"

if not target.is_file():
    raise SystemExit("Missing plugins/spotify-tools/index.js; restore the editable source before publishing.")
actual = hashlib.sha256(target.read_bytes()).hexdigest()
if actual != expected:
    raise SystemExit(f"Spotify Tools source checksum mismatch: {actual}")
print(f"Spotify Tools source verified ({target.stat().st_size} bytes, SHA-256 {actual}).")
