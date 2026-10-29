# Spotify Tools

A Valenced plugin that adds a Listen Along button to Spotify activity cards, plus Spotify invite, song-link, and album-link options.

## Current version: 1.0.8

- Uses Discord's native Listen Along `play`/`sync` controls for the initial join.
- Watches Discord presence updates and polls the followed listener's stored activity every three seconds.
- When a new remote track is detected, explicitly starts that track at the reported position through Spotify's Web API, using album context to avoid the known bare-track playback issue.
- Falls back to Discord's native sync path if the Spotify playback API cannot complete the track-change recovery.
- Preserves the original MarkLong Valenced invite flow, song/album links, and the existing playback fixes.

## Known limitation

Recovery depends on Discord exposing the followed listener's new Spotify activity. If Discord's presence stays stale or stops updating, no plugin can know which track to follow until that activity refreshes.

## Credits

- **MarkLong0467**: original Valenced port and distribution. https://github.com/MarkLong0467/EskimoPlugins
- **nexpid**: original Revenge Listen Along implementation and approach. https://github.com/nexpid/RevengePlugins
- **DEVILS1NGH**: playback/synchronization fixes and community packaging.

This uses the separate plugin ID `devils.spotify-tools`, so it can coexist with the original `marklong.spotify-tools`.

## Install

In Valenced, add the repository URL shown in the root README. The plugin is distributed through the repository's generated `gh-pages/index.json` catalog.
