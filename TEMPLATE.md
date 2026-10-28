# Plugin template and layout

This repository is a small, JavaScript-only Valenced plugin repository with automated packaging. Each plugin lives in its own directory under `plugins/` and is published as a versioned ZIP.

## Directory layout

```text
plugins/
└── example-plugin/
    ├── index.js
    ├── manifest.json
    ├── README.md
    └── LICENSE                 # optional; use when the plugin has its own licence/notice
```

The publisher packages `manifest.json` and the files in the plugin directory, excluding README files. It also adds the root `LICENSE` to the ZIP. Keep any plugin-specific licence and attribution notices in the plugin directory so they are included in the archive.

## Manifest

Start from this shape and replace the example values:

```json
{
  "format": 1,
  "id": "yourname.example-plugin",
  "name": "Example Plugin",
  "description": "A concise description of what the plugin does.",
  "author": "Your Name (https://github.com/yourname \"GitHub\")",
  "version": "1.0.0",
  "dependencies": {
    "valenced.api": {
      "version": ">=1 <2"
    },
    "discord": {
      "version": "*"
    }
  },
  "dist": {
    "script": "index.js"
  }
}
```

Manifest requirements:
- `format` must be `1`.
- `id` must be unique across this repository and should remain stable after release.
- `version` must use the Valenced version format accepted by the publisher, such as `1.0.0` or `1.1.0-beta1`.
- `dist.script` must point to a file inside that plugin's directory.
- Declare every dependency the plugin requires. Do not assume the host provides an undeclared plugin dependency.

## Release workflow

1. Create `plugins/<plugin-folder>/manifest.json` and its entry point.
2. Add a plugin README with purpose, installation notes if needed, and upstream credits.
3. Check licensing and preserve upstream notices before publishing derivative code.
4. Push the change to `main`.
5. GitHub Actions validates and packages the plugin, then updates `gh-pages/index.json` and `gh-pages/pool/<id>@<version>.zip`.

Do not edit generated catalog files on `gh-pages` by hand.

## Versioning and immutability

Once a version is published, its ZIP is immutable. To change the code, increase the version in `manifest.json`. If a published ZIP already exists with different contents, publishing deliberately fails rather than overwriting it.

## Adding native plugins

The current publisher targets JavaScript-only plugins with `dist.script`. Native Android/Dex packaging is **not implemented** in this repository yet. Do not add a `dist.android` manifest and assume it will work. Supporting native plugins requires extending the build and archive validation to compile and include the native artifact.
