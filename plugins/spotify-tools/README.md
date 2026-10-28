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

## Version 1.0.3

Restored the Spotify invite function to the original MarkLong Valenced implementation (`mySpotifyActivity()` plus `sendMessage(..., { activityAction: { activity, type: 3 } })`). The Listen Along playback/synchronization code is unchanged in this release.

## Version 1.0.5 diagnostic build

This version preserves the original MarkLong invite send path and the existing Listen Along play/sync implementation. It adds a one-shot listener for Discord's `MESSAGE_SEND_FAILED` event and logs a sanitized activity snapshot plus structured error fields to the client console. If the event provides an error code or reason, the plugin shows it in a toast. It does not log the raw event payload or Spotify access tokens.
