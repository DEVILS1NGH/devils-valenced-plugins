# Spotify Tools (DEVILS1NGH fork)

A Valenced plugin that adds a Listen Along button next to Spotify activity cards and Spotify message options.

## Credits

- **MarkLong0467**: original Valenced port and distribution. https://github.com/MarkLong0467/EskimoPlugins
- **nexpid**: original Revenge Listen Along implementation and approach. https://github.com/nexpid/RevengePlugins
- **DEVILS1NGH**: playback fix and community packaging.

This uses the separate plugin ID `devils.spotify-tools`, so it can coexist with the original `marklong.spotify-tools`.

## Install

In Valenced, add the repository URL shown in the root README. The repository publishes versioned ZIPs through `gh-pages/pool/` and records their SHA-256 hashes in `gh-pages/index.json`.

## Version 1.0.1

The invite button now uses the live `SpotifyStore.getActivity()` payload, matching the original Revenge implementation, and calls the Discord message action creator with the original four-argument `activityAction` contract. It also listens for `MESSAGE_SEND_FAILED` so the plugin no longer reports an invite as sent when Discord rejects it.
