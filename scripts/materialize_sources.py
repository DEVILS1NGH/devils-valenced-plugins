#!/usr/bin/env python3
"""Decode the initial compressed source snapshot into its normal editable JS file."""
from pathlib import Path
import base64, gzip, hashlib

root = Path(__file__).resolve().parents[1]
encoded = root / ".sources" / "spotify-tools-index.js.gz.b64"
target = root / "plugins" / "spotify-tools" / "index.js"
expected = "fe888ded40829e6c6a5b62186ee87d10d567318a71fd03453a07e536e90bb261"

if encoded.exists():
    text = "".join(encoded.read_text(encoding="ascii").split())
    source = None
    try:
        source = gzip.decompress(base64.b64decode(text, validate=True))
    except Exception:
        # One character was accidentally duplicated in the initial transfer. Repair only if
        # deleting exactly one character yields the expected SHA-256 source; never guess silently.
        if len(text) % 4 == 1:
            for i in range(len(text)):
                candidate = text[:i] + text[i + 1:]
                try:
                    decoded = gzip.decompress(base64.b64decode(candidate, validate=True))
                except Exception:
                    continue
                if hashlib.sha256(decoded).hexdigest() == expected:
                    source = decoded
                    print(f"Repaired one surplus character in source bootstrap at offset {i}.")
                    break
    if source is None:
        raise SystemExit("Could not decode Spotify Tools source bootstrap safely.")
    actual = hashlib.sha256(source).hexdigest()
    if actual != expected:
        raise SystemExit(f"Spotify Tools source bootstrap checksum mismatch: {actual}")
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists() or target.read_bytes() != source:
        target.write_bytes(source)
        print(f"Materialized {target.relative_to(root)} ({len(source)} bytes)")
    else:
        print("Spotify Tools source is already materialized.")
