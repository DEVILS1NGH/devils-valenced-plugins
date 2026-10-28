# Devil's Valenced Plugins

A community-maintained repository of plugins for [Valenced](https://github.com/).

**Maintainer:** [DEVILS1NGH](https://github.com/DEVILS1NGH)

## Install

Add this repository in Valenced under **Settings → Plugins → Advanced → Repository URL**:

```text
https://raw.githubusercontent.com/DEVILS1NGH/devils-valenced-plugins/gh-pages/index.json
```

After adding it, open the plugin browser to install or update a plugin. The URL stays the same as new versions are published.

## Available plugins

| Plugin | ID | Current version | Description |
| --- | --- | --- | --- |
| Spotify Tools | `devils.spotify-tools` | 1.0.0 | Listen Along playback/synchronization fix, plus Spotify invite, song link, and album link options. |

The published catalog on `gh-pages` is generated from the manifests and versioned ZIPs. Do not edit `gh-pages/index.json` manually; the publishing workflow regenerates it.

## Repository layout

```text
.
├── .github/workflows/publish.yml  # validates, packages, and publishes on push
├── plugins/
│   └── spotify-tools/
│       ├── index.js               # plugin entry point
│       ├── manifest.json          # Valenced metadata and dependencies
│       └── README.md              # plugin-specific notes and credits
├── scripts/
│   ├── materialize_sources.py     # source/manifest preflight validation
│   └── publish_repository.py      # ZIP packaging and index generation
├── repo.config.json               # repository name, description, channel overrides
├── TEMPLATE.md                    # how to add a plugin
└── CONTRIBUTING.md                # release and contribution rules
```

- **`main`** contains editable source, manifests, documentation, and publishing tooling.
- **`gh-pages`** contains the generated `index.json` and versioned downloadable ZIPs under `pool/`.

## Add or update a plugin

Read [TEMPLATE.md](./TEMPLATE.md) for the plugin layout and [CONTRIBUTING.md](./CONTRIBUTING.md) for release rules.

In short: create a directory under `plugins/`, include a valid `manifest.json` and entry point, then push to `main`. GitHub Actions validates the source, builds the versioned ZIP, calculates its SHA-256 and size, and updates the catalog.

**Published versions are immutable.** If you change plugin code or package contents, bump the version in that plugin's manifest. The publisher intentionally fails instead of silently replacing an existing version with different contents.

## Credits and provenance

- **MarkLong0467**: original Valenced port and distribution, including the source repository at [EskimoPlugins](https://github.com/MarkLong0467/EskimoPlugins).
- **nexpid**: original Revenge plugin implementation/approach, credited in the plugin metadata where applicable; see [RevengePlugins](https://github.com/nexpid/RevengePlugins).
- **DEVILS1NGH**: changes in this repository, including the Spotify Tools playback fix and community packaging.

Credits identify upstream work; they do not imply that each upstream contributor authored every part of this repository. Plugin-specific notices are kept with the plugin where appropriate.

## Licensing

The root [LICENSE](./LICENSE) is GPL-3.0. Third-party plugins and portions of code may have additional attribution or licence conditions. Check the relevant plugin's source and notices before reusing it; see [CONTRIBUTING.md](./CONTRIBUTING.md).
