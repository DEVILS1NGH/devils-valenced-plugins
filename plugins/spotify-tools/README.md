# Spotify Tools

A Valenced plugin that adds a Listen Along button to Spotify activity cards, plus Spotify invite, song-link, and album-link options.

## Current version: 1.0.7

- Uses Discord's native Listen Along `play`/`sync` controls first, matching NexxUtils' original behavior.
- Watches Discord presence updates and polls the followed listener's stored activity every three seconds while a follow is active.
- Re-syncs when the followed listener's Spotify track changes, including if a mobile client misses or delays the presence event.
- Re-reads the target activity from the presence store rather than reusing stale button props.
- Preserves the playback fixes, the original MarkLong Valenced invite flow, and song/album links.
- If the client does not expose Discord's native controls, the Web API fallback can start a track but cannot provide continuous tracking.

## Credits

- **MarkLong0467**: original Valenced port and distribution. https://github.com/MarkLong0467/EskimoPlugins
- **nexpid**: original Revenge Listen Along implementation and approach. https://github.com/nexpid/RevengePlugins
- **DEVILS1NGH**: playback/synchronization fixes and community packaging.

This uses the separate plugin ID `devils.spotify-tools`, so it can coexist with the original `marklong.spotify-tools`.

## Install

In Valenced, add the repository URL shown in the root README. The plugin is distributed through the repository's generated `gh-pages/index.json` catalog.
