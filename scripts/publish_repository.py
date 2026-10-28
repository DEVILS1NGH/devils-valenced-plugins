#!/usr/bin/env python3
"""Package JS-only Valenced plugins and regenerate a verifiable repository index."""
from __future__ import annotations
import argparse, hashlib, json, re, tempfile, zipfile
from pathlib import Path

def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def version_key(version: str):
    m = re.fullmatch(r"(\d+(?:\.\d+)*)(?:-([a-z0-9]+))?", version)
    if not m:
        raise ValueError(f"Invalid plugin version: {version!r}")
    return (tuple(map(int, m.group(1).split("."))), 0 if m.group(2) else 1, m.group(2) or "")

def digest(path: Path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def make_archive(plugin_dir: Path, manifest: dict, dest: Path, license_path: Path):
    script = manifest.get("dist", {}).get("script")
    if not script:
        raise ValueError(f"{plugin_dir}: expected a JS plugin manifest with dist.script")
    entry = (plugin_dir / script).resolve()
    if not entry.is_file() or plugin_dir.resolve() not in entry.parents:
        raise ValueError(f"{plugin_dir}: missing or unsafe script path {script!r}")
    files = {"manifest.json": (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode()}
    for p in plugin_dir.rglob("*"):
        if not p.is_file() or p.name == "manifest.json" or p.name.lower().startswith("readme"):
            continue
        rel = p.relative_to(plugin_dir).as_posix()
        files[rel] = p.read_bytes()
    if license_path.is_file():
        files["LICENSE"] = license_path.read_bytes()
    dest.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name, data in sorted(files.items(), key=lambda item: (item[0] != "manifest.json", item[0])):
            z.writestr(name, data)

def archive_manifest(path: Path):
    with zipfile.ZipFile(path) as z:
        m = json.loads(z.read("manifest.json").decode("utf-8"))
    expected = f"{m.get('id')}@{m.get('version')}.zip"
    if path.name != expected:
        raise ValueError(f"{path.name!r} does not match its embedded manifest; expected {expected!r}")
    return m

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", type=Path, default=Path("plugins"))
    ap.add_argument("--pool-dir", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--config", type=Path, default=Path("repo.config.json"))
    ap.add_argument("--repository", required=True)
    ap.add_argument("--branch", default="gh-pages")
    args = ap.parse_args()
    config = read_json(args.config) if args.config.exists() else {}
    license_path = Path("LICENSE")
    args.pool_dir.mkdir(parents=True, exist_ok=True)
    for directory in sorted(p for p in args.source.iterdir() if p.is_dir()):
        manifest_path = directory / "manifest.json"
        if not manifest_path.exists():
            continue
        manifest = read_json(manifest_path)
        if manifest.get("format") != 1 or not manifest.get("id") or not manifest.get("version"):
            raise ValueError(f"{manifest_path}: format 1, id, and version are required")
        version_key(manifest["version"])
        name = f"{manifest['id']}@{manifest['version']}.zip"
        dest = args.pool_dir / name
        with tempfile.TemporaryDirectory() as td:
            candidate = Path(td) / name
            make_archive(directory, manifest, candidate, license_path)
            if dest.exists():
                with zipfile.ZipFile(dest) as old, zipfile.ZipFile(candidate) as new:
                    old_files = {n: old.read(n) for n in old.namelist()}
                    new_files = {n: new.read(n) for n in new.namelist()}
                if old_files != new_files:
                    raise ValueError(f"{name} is already published and immutable; bump the manifest version")
            else:
                dest.write_bytes(candidate.read_bytes())
    plugins = {}
    for archive in sorted(args.pool_dir.glob("*.zip")):
        manifest = archive_manifest(archive)
        pid, version = manifest["id"], manifest["version"]
        if pid not in plugins:
            plugins[pid] = {
                "name": manifest.get("name", pid),
                "description": manifest.get("description", ""),
                "author": manifest.get("author", ""),
                "channels": {},
                "versions": {}
            }
            if manifest.get("contributors"):
                plugins[pid]["contributors"] = manifest["contributors"]
        plugins[pid]["versions"][version] = {
            "url": f"https://raw.githubusercontent.com/{args.repository}/{args.branch}/pool/{archive.name}",
            "sha256": digest(archive),
            "size": archive.stat().st_size,
            "dependencies": manifest.get("dependencies", {})
        }
    for pid, item in plugins.items():
        versions = sorted(item["versions"], key=version_key)
        stable = [v for v in versions if "-" not in v]
        if stable:
            item["channels"]["latest"] = stable[-1]
        if versions and (not stable or versions[-1] != stable[-1]):
            item["channels"]["beta"] = versions[-1]
        for channel, version in (config.get("channels", {}) or {}).get(pid, {}).items():
            if version not in item["versions"]:
                raise ValueError(f"channel override {pid}/{channel} references missing version {version}")
            item["channels"][channel] = version
    index = {
        "format": 1,
        "name": config.get("name", args.repository.split("/")[-1]),
        "description": config.get("description", ""),
        "plugins": plugins
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Indexed {len(plugins)} plugin(s) from {len(list(args.pool_dir.glob('*.zip')))} artifact(s).")

if __name__ == "__main__":
    main()
