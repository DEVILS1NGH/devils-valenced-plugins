# Contributing

Thanks for improving the repository. Keep changes small, traceable, and compatible with Valenced's repository format.

## Before opening a change

- Keep each plugin in its own directory under `plugins/`.
- Keep the manifest ID stable and unique.
- Bump the plugin version whenever the published ZIP contents change.
- Preserve upstream copyright, licence, and attribution notices.
- Document meaningful behavior changes in the plugin's README.
- Never put tokens, credentials, or private user data in source files or workflow logs.

## Licensing and attribution

Do not assume that a credit line alone satisfies an upstream licence. Before copying or adapting a plugin, inspect the upstream repository and the relevant source-file headers/notices. Keep required notices with the plugin and in its published ZIP.

The root `LICENSE` is GPL-3.0 for the repository's GPL-covered material. Individual plugins may have additional or different third-party notices. Do not relicense someone else's work or claim authorship of upstream code. If the provenance or licence of a component is unclear, resolve that before publishing it.

## Release checklist

- [ ] `manifest.json` parses and has `format: 1`, a stable ID, a version, and a valid `dist.script`.
- [ ] The script path resolves to a file inside the plugin directory.
- [ ] All required dependencies are declared.
- [ ] Upstream credits and licence notices are preserved.
- [ ] Version is bumped if the ZIP's contents change.
- [ ] The GitHub Actions publish workflow succeeds.
- [ ] The generated catalog points to the expected ZIP and its SHA-256/size match the artifact.

The `gh-pages` branch is generated output. Make source changes on `main` and let the workflow publish them.
