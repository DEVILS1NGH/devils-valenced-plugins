#!/usr/bin/env python3
"""One-time bootstrap from chunked compressed source to a normal editable JS file."""
from pathlib import Path
import base64, gzip, hashlib, shutil

root = Path(__file__).resolve().parents[1]
target = root / "plugins" / "spotify-tools" / "index.js"
transfer = root / ".source-transfer"
bootstrap = root / ".sources"
expected_source = "fe888ded40829e6c6a5b62186ee87d10d567318a71fd03453a07e536e90bb261"
expected_chunks = [
    "afd79b54d22478c5f6100b346c3c30f8b3532b52566c10e42b0b1021d849f679",
    "a4bf18dad01e7c4301eff0dd1f14430ab5a72a940e4b4ae17e9b740055f25031",
    "a70ac17409f0ea4676ee854e0a90cf9d899416767e5657d805a1215802b2a9dc",
    "0d36d79dbe683ea6b9e7d4e76c584932d93905fcefb07120918c0f9d73c54f43",
    "9c8cc4a08b062064c2466a93c141924a2b2826428bcff418f224f523e3856506",
    "c0277daf97f35eb0d3bc973eec7f092c61e38353095f4fbebf1a86738b7dfc11",
]

if target.is_file() and not transfer.exists():
    print("Plugin source already exists; leaving editable source untouched.")
elif transfer.exists():
    pieces = []
    for i, expected in enumerate(expected_chunks):
        part_path = transfer / f"{i:02d}.txt"
        if not part_path.is_file():
            raise SystemExit(f"Missing source transfer chunk: {part_path.name}")
        piece = part_path.read_text(encoding="ascii").strip()
        actual = hashlib.sha256(piece.encode("ascii")).hexdigest()
        if actual != expected:
            raise SystemExit(f"Source chunk {i:02d} checksum mismatch: {actual}")
        pieces.append(piece)
    source = gzip.decompress(base64.b64decode("".join(pieces), validate=True))
    actual_source = hashlib.sha256(source).hexdigest()
    if actual_source != expected_source:
        raise SystemExit(f"Materialized source checksum mismatch: {actual_source}")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(source)
    print(f"Materialized editable source: {target.relative_to(root)} ({len(source)} bytes)")
    # Remove one-time transfer payloads; keep only readable JS in the actual repository.
    shutil.rmtree(transfer)
    if bootstrap.exists():
        shutil.rmtree(bootstrap)
else:
    raise SystemExit("Plugin source is missing, and no one-time source transfer is available.")
