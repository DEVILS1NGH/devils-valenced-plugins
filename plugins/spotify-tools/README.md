# Spotify Tools

A Valenced plugin that adds a Listen Along button to Spotify activity cards, plus Spotify invite, song-link, and album-link options.

## Current version: 1.0.3

- Keeps the Listen Along playback and synchronization fix.
- Restores the original MarkLong Valenced invite implementation.
- Includes the song and album link options.
- Does not include the temporary send-failure diagnostic code added in 1.0.4 and 1.0.5.

## Credits

- **MarkLong0467**: original Valenced port and distribution. https://github.com/MarkLong0467/EskimoPlugins
- **nexpid**: original Revenge Listen Along implementation and approach. https://github.com/nexpid/RevengePlugins
- **DEVILS1NGH**: playback/synchronization fix and community packaging.

This uses the separate plugin ID `devils.spotify-tools`, so it can coexist with the original `marklong.spotify-tools`.

## Install

In Valenced, add the repository URL shown in the root README. The plugin is distributed through the repository's generated `gh-pages/index.json` catalog.
