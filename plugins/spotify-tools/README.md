# Spotify Tools

A Valenced plugin that adds a Listen Along button to Spotify activity cards, plus Spotify invite, song-link, and album-link options.

## Current version: 1.0.9

- Uses Discord's native `play()` and `sync()` actions for Listen Along.
- Watches Discord presence updates and polls the followed listener's stored activity every three seconds.
- On a remote track change, repeats Discord's native play → player-state → sync handshake to rejoin the listening session.
- Includes a guarded 1.2-second fallback for mobile clients that update playback without emitting `SPOTIFY_PLAYER_STATE`.
- Does not use Spotify Web API playback to recover a remote track change: that API can start playback on the local account but cannot establish Discord's native Listen Along relationship with another user.
- Preserves the original MarkLong Valenced invite flow, song/album links, and playback fixes.

## Known limitation

The recovery requires Discord to expose the followed person's updated Spotify activity and for Discord's native sync action to work. It cannot recover if Discord itself stops reporting the other listener's activity or rejects native Listen Along.

## Credits

- **MarkLong0467**: original Valenced port and distribution. https://github.com/MarkLong0467/EskimoPlugins
- **nexpid**: original Revenge Listen Along implementation and approach. https://github.com/nexpid/RevengePlugins
- **DEVILS1NGH**: playback/synchronization fixes and community packaging.

This uses the separate plugin ID `devils.spotify-tools`, so it can coexist with the original `marklong.spotify-tools`.

## Install

In Valenced, add the repository URL shown in the root README. The plugin is distributed through the repository's generated `gh-pages/index.json` catalog.
