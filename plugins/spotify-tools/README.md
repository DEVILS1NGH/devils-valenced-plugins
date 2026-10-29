# Spotify Tools

A Valenced plugin that adds a Listen Along button to Spotify activity cards, plus Spotify invite, song-link, and album-link options.

## Current version: 1.0.4

- Uses Discord's native Listen Along `play`/`sync` controls first, matching NexxUtils' original behavior.
- Keeps tracking the other listener across song changes instead of starting one track and following your own album queue.
- Preserves the playback/synchronization fixes and the original MarkLong Valenced invite implementation.
- Keeps song and album link options.
- Does not include the temporary send-failure diagnostic code from 1.0.5.

## Credits

- **MarkLong0467**: original Valenced port and distribution. https://github.com/MarkLong0467/EskimoPlugins
- **nexpid**: original Revenge Listen Along implementation and approach. https://github.com/nexpid/RevengePlugins
- **DEVILS1NGH**: playback/synchronization fixes and community packaging.

This uses the separate plugin ID `devils.spotify-tools`, so it can coexist with the original `marklong.spotify-tools`.

## Install

In Valenced, add the repository URL shown in the root README. The plugin is distributed through the repository's generated `gh-pages/index.json` catalog.
