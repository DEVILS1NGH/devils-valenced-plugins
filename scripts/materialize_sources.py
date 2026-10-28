#!/usr/bin/env python3
"""Check that plugin source files are present before packaging."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
plugin_dirs = root / "plugins"
if not plugin_dirs.is_dir():
    raise SystemExit("Missing plugins/ directory.")

manifests = list(plugin_dirs.glob("*/manifest.json"))
if not manifests:
    raise SystemExit("No plugin manifests found under plugins/.")

for manifest in manifests:
    plugin_dir = manifest.parent
    script = __import__("json").loads(manifest.read_text(encoding="utf-8")).get("dist", {}).get("script")
    if not script:
        continue
    source = (plugin_dir / script).resolve()
    if plugin_dir.resolve() not in source.parents or not source.is_file():
        raise SystemExit(f"Missing or invalid JS entry declared by {manifest.relative_to(root)}: {script}")
    print(f"Source ready: {source.relative_to(root)} ({source.stat().st_size} bytes)")

print(f"Validated {len(manifests)} plugin manifest(s).")
