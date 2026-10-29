# Spotify Tools

A Valenced plugin that adds a Listen Along button to Spotify activity cards, plus Spotify invite, song-link, and album-link options.

## Current version: 1.0.10

- Uses Discord's native `play()` and `sync()` actions for Listen Along.
- Watches Discord presence updates and polls the followed listener's activity every second.
- Also observes updated Spotify activity-card props, so it does not rely solely on the possibly stale PresenceStore result.
- When a new track is detected, shows a transition toast and repeats Discord's native play → player-state → sync handshake.
- Includes a guarded 1.2-second fallback for clients that update playback without emitting `SPOTIFY_PLAYER_STATE`.
- Does not use Spotify Web API playback to recover track changes; it preserves Discord's native Listen Along relationship instead.
- Preserves the original MarkLong Valenced invite flow, song/album links, and existing playback fixes.

## Diagnostic behavior

A toast reading `Track changed: … Rejoining Listen Along.` confirms that the current client detected the remote activity change and attempted a native rejoin. If that toast never appears at the next song, the client did not expose a changed activity to either watcher.

## Known limitation

Recovery still requires Discord to expose the followed person's updated Spotify activity and accept the native play/sync actions. Discord's own Spotify FAQ describes Listen Along as a native integration and documents known mobile/crossfade limitations.

## Credits

- **MarkLong0467**: original Valenced port and distribution. https://github.com/MarkLong0467/EskimoPlugins
- **nexpid**: original Revenge Listen Along implementation and approach. https://github.com/nexpid/RevengePlugins
- **DEVILS1NGH**: playback/synchronization fixes and community packaging.

This uses the separate plugin ID `devils.spotify-tools`, so it can coexist with the original `marklong.spotify-tools`.

## Install

In Valenced, add the repository URL shown in the root README. The plugin is distributed through the repository's generated `gh-pages/index.json` catalog.
