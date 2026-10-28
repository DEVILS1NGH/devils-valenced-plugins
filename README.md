# Devil's Valenced Plugins

Community plugin repository maintained by [DEVILS1NGH](https://github.com/DEVILS1NGH).

## Add this repository in Valenced

`https://raw.githubusercontent.com/DEVILS1NGH/devils-valenced-plugins/gh-pages/index.json`

Once published, this index lets Valenced browse, install, and update plugins directly.

## Current plugin

- **Spotify Tools** (`devils.spotify-tools`) v1.0.0: Listen Along playback/synchronization fix, Spotify invite, song link, and album link options.

## Credits

- **MarkLong0467**: original Valenced port and distribution: https://github.com/MarkLong0467/EskimoPlugins
- **nexpid**: original Revenge implementation: https://github.com/nexpid/RevengePlugins
- **DEVILS1NGH**: playback fix and community packaging.

## Repository structure

- `main`: source code, plugin manifests, workflows, and publishing tooling.
- `gh-pages`: the generated `index.json` and versioned ZIPs in `pool/`.

Each plugin must keep its source and bundled artifact in sync. The catalog's SHA-256 and byte size must match the exact downloadable ZIP.
