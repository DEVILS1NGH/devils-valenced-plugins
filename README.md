# Devil's Valenced Plugins

A community-maintained repository of plugins for [Valenced](https://github.com/).

**Maintainer:** [DEVILS1NGH](https://github.com/DEVILS1NGH)

## Install

Add this repository in Valenced under **Settings → Plugins → Advanced → Repository URL**:

```text
https://raw.githubusercontent.com/DEVILS1NGH/devils-valenced-plugins/gh-pages/index.json
```

After adding it, open the plugin browser to install the available plugin.

## Available plugins

| Plugin | ID | Current version | Description |
| --- | --- | --- | --- |
| Spotify Tools | `devils.spotify-tools` | 1.0.8 | Continuous Listen Along recovery at track changes, original invite flow, plus song and album links. |

The published catalog on `gh-pages` is generated from the plugin manifest and versioned ZIP in `pool/`.

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
├── TEMPLATE.md                   # how to add more plugins
└── CONTRIBUTING.md                # release and contribution rules
```

- **`main`** contains editable source, manifests, documentation, and publishing tooling.
- **`gh-pages`** contains the generated `index.json` and downloadable ZIPs under `pool/`.

## Add or update a plugin

Read [TEMPLATE.md](./TEMPLATE.md) and [CONTRIBUTING.md](./CONTRIBUTING.md) before adding or updating a plugin. The GitHub Actions workflow validates the source, builds versioned ZIPs, calculates their SHA-256 hashes, and updates the catalog.

Published versions are immutable. When changing plugin code or package contents, bump the version in the manifest. The publisher intentionally fails instead of silently replacing an existing version with different contents.

## Credits and provenance

- **MarkLong0467**: original Valenced port and distribution, including the source repository at [EskimoPlugins](https://github.com/MarkLong0467/EskimoPlugins).
- **nexpid**: original Revenge plugin implementation and approach, available in [RevengePlugins](https://github.com/nexpid/RevengePlugins).
- **DEVILS1NGH**: changes in this repository, including the Spotify Tools playback fix and community packaging.

Credits identify upstream work; they do not imply that every contributor authored every part of this repository. Plugin-specific notices are kept with the relevant plugin.

## Licensing

The root [LICENSE](./LICENSE) is GPL-3.0. Third-party plugins and portions of code may have additional or different licence conditions. Check the relevant source and notices before reusing them; see [CONTRIBUTING.md](./CONTRIBUTING.md).
