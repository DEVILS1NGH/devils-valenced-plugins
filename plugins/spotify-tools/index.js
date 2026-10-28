(function (exports) {
	/*
	 * Spotify Tools for Valenced: Listen Along plus Spotify invite/song/album send options.
	 * Based on nexpid's NexxUtils for Revenge (CC BY 4.0), then ported to Valenced by MarkLong0467.
	 * Modified on 2026-10-29. This modified build remains under GPL-3.0.
 * Patched: only select the real play+sync action module, never fall back to a second playback
	 * mechanism after an internal playback action has begun, and always clean up/fallback the one-shot
	 * player-state listener so sync is not silently skipped on clients that omit the expected event.
	 * Keep `(function` as the first thing in this file: Valenced loads it as `return <file>`.
	 */
	var TOAST = 'ESKIMO_SPOTIFY_TOOLS'
	var defaults = {
		listenAlong: true,
		sendInvite: true,
		sendSongLink: true,
		sendAlbumLink: true,
		plusMenu: true,
	}

	var storage
	var spotifyActions
	var PLUS_LABELS = { Camera: 1, Photos: 1, Poll: 1, Files: 1, Apps: 1 }

	function finders() { return valenced.modules.finders }
	function store(name) { return valenced.discord.flux.Stores[name] }
	function toast(text) {
		try { valenced.discord.actions.ToastActionCreators.open(TOAST, { text: String(text) }) } catch (e) {}
	}
	function enabled(key) {
		var s = storage && storage.cache
		return !s || s[key] !== false
	}
	function h(type, props) {
		var children = Array.prototype.slice.call(arguments, 2)
		var rt = valenced.react.ReactJSXRuntime
		var p = Object.assign({}, props)
		var key = p.key
		delete p.key
		if (children.length === 1) p.children = children[0]
		else if (children.length > 1) p.children = children
		return (children.length > 1 ? rt.jsxs : rt.jsx)(type, p, key)
	}

	/* Wait for the player-state event, but don't wait forever: some Android builds update Spotify
	 * through the protocol without emitting this particular Flux event. The guarded timeout still
	 * performs one sync, and the listener is removed either way. */
	/** Runs only after Discord actually reports a Spotify player-state change. */
	function onceAfterPlayerState(callback) {
		var off
		var done = false
		function finish(payload) {
			if (!done) {
				done = true
				if (off) { try { off() } catch (e) {} }
				// Dispatch hooks run before stores finish processing; defer sync until this tick ends.
				setTimeout(callback, 0)
			}
			return payload
		}
		off = valenced.discord.flux.onFluxEventDispatched('SPOTIFY_PLAYER_STATE', finish)
		return function cancel() {
			if (done) return
			done = true
			if (off) { try { off() } catch (e) {} }
		}
	}

	function findIcon(names) {
		for (var i = 0; i < names.length; i++) {
			var icon = valenced.utils.discord.lookupGeneratedIconComponent(names[i])
			if (icon) return icon
		}
	}

	function patchComponent(module, key, decorate, cleanup) {
		var value = module[key]
		var patch = function (obj, k, getProps) {
			cleanup(valenced.patcher.instead(obj, k, function (args, original) {
				var ret = Reflect.apply(original, this, args)
				try { return decorate(ret, getProps.call(this, args)) } catch (e) { return ret }
			}))
		}
		var fromThis = function () { return this.props }
		var fromArgs = function (args) { return args[0] }
		if (typeof value === 'function') {
			if (value.prototype && typeof value.prototype.render === 'function') patch(value.prototype, 'render', fromThis)
			else patch(module, key, fromArgs)
			return true
		}
		if (value && typeof value === 'object') {
			if (typeof value.type === 'function') {
				if (value.type.prototype && typeof value.type.prototype.render === 'function') patch(value.type.prototype, 'render', fromThis)
				else patch(value, 'type', fromArgs)
				return true
			}
			if (typeof value.render === 'function') { patch(value, 'render', fromArgs); return true }
		}
		return false
	}

	function mySpotifyActivity() {
		var spotify = store('SpotifyStore')
		var own = spotify && spotify.getActivity && spotify.getActivity()
		if (own && own.party && own.party.id) return own
		try {
			var self = store('UserStore').getCurrentUser()
			var presence = store('PresenceStore')
			var list = (self && presence && presence.getActivities && presence.getActivities(self.id)) || []
			for (var i = 0; i < list.length; i++) {
				var a = list[i]
				if (a && a.type === 2 && (a.name === 'Spotify' || String(a.id || '').indexOf('spotify') === 0 || String((a.party && a.party.id) || '').indexOf('spotify:') === 0)) return a
			}
		} catch (e) {}
		return own
	}
	function userIdOf(activity) {
		var id = activity && activity.party && activity.party.id
		return typeof id === 'string' && id.indexOf(':') > 0 ? id.split(':')[1] : undefined
	}
	function currentTrack() {
		var spotify = store('SpotifyStore')
		var track = spotify && spotify.getTrack && spotify.getTrack()
		var activity = mySpotifyActivity()
		var meta = (activity && activity.metadata) || {}
		var albumId = (track && track.album && track.album.id) || meta.album_id
		if (!albumId && typeof meta.context_uri === 'string') {
			var m = /^spotify:album:(\w+)/.exec(meta.context_uri)
			if (m) albumId = m[1]
		}
		return { trackId: (track && track.id) || (activity && activity.sync_id), albumId: albumId }
	}

	function disabledReason(activity, userId) {
		var self = store('UserStore') && store('UserStore').getCurrentUser()
		var mine = mySpotifyActivity()
		if (self && self.id === userId) return 'Listen along with someone else, not yourself.'
		if (mine && mine.party && activity && activity.party && mine.party.id === activity.party.id) return "You're already along for this ride."
		return false
	}

	function rest() {
		var f = finders()
		return f.lookupModule(f.filters.withProps('get', 'post', 'patch'))[0] || f.lookupModule(f.filters.withProps('HTTPResponseError', 'get'))[0]
	}

	/**
	 * The Spotify sign-in Discord holds for you. Prefer the active socket token, then request a token
	 * for the linked account if Discord exposes one. The device id is only a fallback: the Web API's
	 * device list is the authoritative source for the active Spotify device.
	 */
	async function spotifyAccess() {
		var sd
		try {
			var spotify = store('SpotifyStore')
			sd = spotify && spotify.getActiveSocketAndDevice && spotify.getActiveSocketAndDevice()
		} catch (e) {}
		var socket = sd && (sd.socket || sd)
		var token = socket && socket.accessToken
		var accountId = socket && socket.accountId
		var http
		try { http = rest() } catch (e) {}
		if (!token && http && http.get) {
			try {
				if (!accountId) {
					var list = await http.get({ url: '/users/@me/connections' })
					var connections = (list && list.body) || []
					var linked = Array.isArray(connections) && connections.find(function (c) { return c && c.type === 'spotify' && !c.revoked })
					accountId = linked && linked.id
				}
				if (accountId) {
					var res = await http.get({ url: '/users/@me/connections/spotify/' + accountId + '/access-token' })
					token = res && res.body && res.body.access_token
				}
			} catch (e) {}
		}
		return { token: token, deviceId: sd && sd.device && sd.device.id }
	}

	/** Returns the active Spotify Connect device, not an arbitrary inactive device. */
	async function pickDevice(token) {
		try {
			var res = await fetch('https://api.spotify.com/v1/me/player/devices', { headers: { Authorization: 'Bearer ' + token } })
			if (!res.ok) return undefined
			var body = await res.json()
			var devices = ((body && body.devices) || []).filter(function (d) { return d && !d.is_restricted })
			var active = devices.find(function (d) { return d.is_active })
			return active && active.id
		} catch (e) {
			return undefined
		}
	}

	function asAlbumUri(value) {
		if (typeof value !== 'string') return undefined
		var m = /^(?:spotify:album:|https?:\/\/(?:open\.)?spotify\.com\/album\/)([A-Za-z0-9]+)/.exec(value)
		if (m) return 'spotify:album:' + m[1]
		if (/^[A-Za-z0-9]{10,}$/.test(value)) return 'spotify:album:' + value
		return undefined
	}

	/** Prefer the album context already present in the Spotify activity. */
	function albumUriFromActivity(activity) {
		var meta = (activity && activity.metadata) || {}
		var album = meta.album && typeof meta.album === 'object' ? meta.album : {}
		var candidates = [meta.album_uri, meta.albumUri, meta.context_uri, album.uri, album.id, meta.album_id, meta.albumId]
		for (var i = 0; i < candidates.length; i++) {
			var uri = asAlbumUri(candidates[i])
			if (uri) return uri
		}
		return undefined
	}

	/**
	 * Resolve the track's album. Spotify's recent player bug can accept a bare `uris` track command,
	 * stop the current song, and still play nothing. Starting the album and offsetting to the track is
	 * the tested workaround; if we cannot resolve an album, do not send the destructive bare-track call.
	 */
	async function resolveAlbumUri(token, activity, trackId) {
		var fromActivity = albumUriFromActivity(activity)
		if (fromActivity) return fromActivity
		try {
			var res = await fetch('https://api.spotify.com/v1/tracks/' + encodeURIComponent(trackId), {
				headers: { Authorization: 'Bearer ' + token },
			})
			if (!res.ok) return undefined
			var track = await res.json()
			var album = track && track.album
			return album && (asAlbumUri(album.uri) || asAlbumUri(album.id))
		} catch (e) {
			return undefined
		}
	}

	/**
	 * Returns true/false if it sent a Web API playback command, or null if the API route is unavailable
	 * and the caller should use Discord's native play/sync actions instead.
	 */
	async function playThroughSpotify(activity) {
		var commandStarted = false
		try {
			var access = await spotifyAccess()
			if (!access.token) return null
			var rawTrackId = activity && activity.sync_id
			var trackId = typeof rawTrackId === 'string' ? rawTrackId.replace(/^spotify:track:/, '') : ''
			if (!/^[A-Za-z0-9]{10,}$/.test(trackId)) return null
			var albumUri = await resolveAlbumUri(access.token, activity, trackId)
			if (!albumUri) return null
			var deviceId = await pickDevice(access.token)
			if (!deviceId) deviceId = access.deviceId
			if (!deviceId) return null

			// Resolve the album before calculating the position so lookup latency does not create extra drift.
			var start = activity.timestamps && Number(activity.timestamps.start)
			var position = start ? Math.max(0, Date.now() - start) : 0
			var url = 'https://api.spotify.com/v1/me/player/play?device_id=' + encodeURIComponent(deviceId)
			commandStarted = true
			var res = await fetch(url, {
				method: 'PUT',
				headers: { Authorization: 'Bearer ' + access.token, 'Content-Type': 'application/json' },
				body: JSON.stringify({ context_uri: albumUri, offset: { uri: 'spotify:track:' + trackId }, position_ms: position }),
			})
			if (!res.ok) {
				var why = { 401: 'Spotify sign-in expired. Open Spotify and try again.', 403: 'Spotify Premium or playback permission is required to listen along.', 404: 'Spotify could not find the active playback device. Open Spotify and play a song first.', 429: 'Spotify is busy. Try again in a moment.' }[res.status]
				throw new Error(why || 'Spotify said no (' + res.status + ').')
			}
			toast('Listening along')
			return true
		} catch (e) {
			if (!commandStarted) return null
			toast(String((e && e.message) || e))
			return false
		}
	}

	function isSpotifyActions(candidate) {
		return !!candidate && typeof candidate.play === 'function' && typeof candidate.sync === 'function'
	}
	function findSpotifyActions() {
		if (isSpotifyActions(spotifyActions)) return spotifyActions
		try {
			var f = finders()
			var result = f.lookupModule(f.filters.withProps('play', 'sync')) || []
			if (!Array.isArray(result)) result = [result]
			for (var i = 0; i < result.length; i++) if (isSpotifyActions(result[i])) return result[i]
		} catch (e) {}
		return undefined
	}
	function actionSucceeded(result) {
		return Promise.resolve(result).then(function () { toast('Listening along'); return true }, function (e) {
			toast('Spotify could not sync: ' + String((e && e.message) || e))
			return false
		})
	}
	function listenWithDiscordActions(actions, activity, userId) {
		if (!actions) {
			toast('Could not find Discord Spotify controls. Make sure Spotify is linked to Discord and open Spotify first.')
			return false
		}
		var spotify = store('SpotifyStore')
		var mine = spotify && spotify.getActivity && spotify.getActivity()
		if (mine) {
			try { return actionSucceeded(actions.sync(activity, userId)) }
			catch (e) {
				toast('Discord Spotify sync failed: ' + String((e && e.message) || e))
				return false
			}
		}
		var cancelSync = onceAfterPlayerState(function () {
			try { actionSucceeded(actions.sync(activity, userId)) }
			catch (e) { toast('Discord Spotify sync failed: ' + String((e && e.message) || e)) }
		})
		try {
			var started = actions.play(activity, userId)
			return Promise.resolve(started).then(function () { return true }, function (e) {
				cancelSync()
				toast('Discord could not start Spotify playback: ' + String((e && e.message) || e))
				return false
			})
		} catch (e) {
			cancelSync()
			toast('Discord could not start Spotify playback: ' + String((e && e.message) || e))
			return false
		}
	}

	function listen(reason, activity, userId) {
		if (typeof reason === 'string') { toast(reason); return false }
		var actions = findSpotifyActions()
		// Spotify's bare-track Web API command is currently known to stop playback without starting
		// the requested song on affected clients. Try the album-context workaround before Discord's
		// native action path; never issue the bare-track request.
		return playThroughSpotify(activity).then(function (apiResult) {
			if (apiResult !== null) return apiResult
			return listenWithDiscordActions(actions, activity, userId)
		}, function (e) {
			toast('Listen along failed: ' + String((e && e.message) || e))
			return false
		})
	}

	function ListenButton(props) {
		var React = valenced.react.React
		var Design = valenced.discord.design.Design
		var RN = valenced.react.ReactNative
		var tick = React.useState(0)
		var loadingState = React.useState(false)
		React.useEffect(function () {
			return valenced.discord.flux.onFluxEventDispatched('SPOTIFY_PLAYER_STATE', function (payload) {
				setTimeout(function () { tick[1](function (n) { return n + 1 }) }, 0)
				return payload
			})
		}, [])
		var activity = props.activity
		var userId = userIdOf(activity)
		var reason = userId ? disabledReason(activity, userId) : 'No listener found'
		var loading = loadingState[0] && !reason
		var Icon = findIcon(['UserPlayIcon', 'MusicIcon', 'PlayIcon'])
		var press = function () {
			if (loading) return
			var started = listen(reason, activity, userId)
			if (started) {
				loadingState[1](true)
				var done = function () { loadingState[1](false) }
				Promise.resolve(started).then(function () { setTimeout(done, 2500) }, done)
				setTimeout(done, 15000)
			}
		}
		var control = Icon
			? h(Design.IconButton, { size: 'md', variant: 'secondary', loading: loading, icon: h(Icon, { size: 'sm' }), accessibilityLabel: 'Listen along', onPress: press, style: reason ? { opacity: 0.5 } : undefined })
			: h(Design.Button, { size: 'md', variant: 'secondary', text: 'Along', loading: loading, onPress: press })
		return h(RN.View, { style: { flexDirection: 'row', flex: 1, alignItems: 'stretch' } },
			h(RN.View, { style: { paddingRight: 6 } }, control),
			h(RN.View, { style: { flex: 1, minWidth: 0 } }, props.button))
	}
	function activityFrom(props) {
		if (!props) return undefined
		if (userIdOf(props.activity)) return props.activity
		if (userIdOf(props)) return props
		if (props.party && userIdOf(props.party)) return props.party
	}
	function decorateListen(ret, props) {
		if (!ret || !enabled('listenAlong')) return ret
		var activity = activityFrom(props)
		return activity ? h(ListenButton, { button: ret, activity: activity }) : ret
	}

	function sendMessage(message, clearDraft, options) {
		var f = finders()
		var messages = f.lookupModule(f.filters.withProps('sendMessage', 'revealMessage'))[0]
		var channel = store('SelectedChannelStore').getChannelId()
		if (!messages || !channel) { toast('Open a chat first, then try again.'); return false }
		messages.sendMessage(channel, Object.assign({ tts: false, invalidEmojis: [], validNonShortcutEmojis: [] }, message(channel)), clearDraft, options || {})
		return channel
	}
	function sendInvite() {
		// Keep the known-good MarkLong call path. This build adds diagnostics only; it does not
		// change the activityAction payload or the Listen Along playback/sync functions.
		var activity = mySpotifyActivity()
		if (!activity || !activity.party || !activity.party.id) return toast('Play something on Spotify first.')
		var draft = store('DraftStore')
		var channel = store('SelectedChannelStore').getChannelId()
		if (!channel) return toast('Open a chat or channel first.')
		var completed = false
		var unsubscribe
		var timeout
		function cleanup() {
			if (timeout) clearTimeout(timeout)
			if (unsubscribe) { try { unsubscribe() } catch (e) {} }
		}
		function activitySnapshot() {
			return {
				keys: Object.keys(activity),
				type: activity.type,
				name: activity.name,
				application_id: activity.application_id || activity.applicationId || null,
				sync_id: activity.sync_id || null,
				party: activity.party ? { id: activity.party.id || null, keys: Object.keys(activity.party) } : null,
				metadataKeys: activity.metadata ? Object.keys(activity.metadata) : [],
				timestamps: activity.timestamps || null,
				secretsKeys: activity.secrets ? Object.keys(activity.secrets) : [],
			}
		}
		function summarizeFailure(payload) {
			var found = []
			var seen = []
			function walk(value, path, depth) {
				if (!value || typeof value !== 'object' || depth > 4 || seen.indexOf(value) >= 0) return
				seen.push(value)
				Object.keys(value).forEach(function (key) {
					var v = value[key]
					var p = path ? path + '.' + key : key
					if (/^(code|status|statusCode|httpStatus|errorCode|reason|detail|messageType|type|name|operation|endpoint|retryAfter|nonce)$/i.test(key) &&
						(typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
						found.push(p + '=' + String(v).slice(0, 70))
					}
					if (/^(error|errors|response|body|data|message|reason|details|cause|payload|apiError)$/i.test(key) && v && typeof v === 'object') {
						walk(v, p, depth + 1)
					}
				})
			}
		walk(payload, '', 0)
		if (found.length) return found.slice(0, 6).join('; ')
		return 'event keys=' + (payload && typeof payload === 'object' ? Object.keys(payload).join(',') : typeof payload)
	}
		function reportFailure(payload) {
			if (completed) return payload
			var failedChannel = payload && (payload.channelId || payload.channel_id || (payload.channel && payload.channel.id) ||
				(payload.message && (payload.message.channel_id || payload.message.channelId)))
			if (failedChannel && String(failedChannel) !== String(channel)) return payload
			completed = true
			cleanup()
			var summary = summarizeFailure(payload)
			try { console.warn('[Devils Spotify Tools] MESSAGE_SEND_FAILED', summary, activitySnapshot(), payload) } catch (e) {}
			toast('Invite failed: ' + summary.slice(0, 145))
			return payload
		}
		// Listen before sending so the server rejection payload can be captured.
		unsubscribe = valenced.discord.flux.onFluxEventDispatched('MESSAGE_SEND_FAILED', reportFailure)
		try {
			try { console.info('[Devils Spotify Tools] Invite activity snapshot', activitySnapshot()) } catch (e) {}
			timeout = setTimeout(function () {
				if (completed) return
				completed = true
				cleanup()
				toast('No send-error details captured. If Clyde appears, send the screenshot; this client did not expose the failure payload.')
			}, 12000)
			var sentChannel = sendMessage(
				function (id) { return { content: (draft && draft.getDraft(id, 0)) || '' } },
				true,
				{ activityAction: { activity: activity, type: 3 } },
			)
			if (!sentChannel) {
				completed = true
				cleanup()
				return
			}
			var f = finders()
			var drafts = f.lookupModule(f.filters.withProps('clearDraft'))[0]
			if (drafts) drafts.clearDraft(channel, 0)
			if (!completed) toast('Invite submitted. Waiting for Discord response.')
		} catch (e) {
			completed = true
			cleanup()
			toast('Invite action threw: ' + String((e && e.message) || e))
		}
	}
	function sendSongLink() {
		var t = currentTrack()
		if (!t.trackId) return toast('Play something on Spotify first.')
		if (sendMessage(function () { return { content: 'https://open.spotify.com/track/' + t.trackId } }, false)) toast('Song link sent')
	}
	function sendAlbumLink() {
		var t = currentTrack()
		if (!t.trackId) return toast('Play something on Spotify first.')
		if (!t.albumId) return toast('Could not find the album for this song.')
		if (sendMessage(function () { return { content: 'https://open.spotify.com/album/' + t.albumId } }, false)) toast('Album link sent')
	}

	var OPTIONS = [
		{ setting: 'sendInvite', label: 'Send listen along', run: function () { sendInvite() } },
		{ setting: 'sendSongLink', label: 'Send song link', run: function () { sendSongLink() } },
		{ setting: 'sendAlbumLink', label: 'Send playing album', run: function () { sendAlbumLink() } },
	]
	function wantedOptions() { return OPTIONS.filter(function (option) { return enabled(option.setting) }) }
	var assetNames = new Map()
	function iconName(item) {
		if (!item || typeof item !== 'object') return ''
		var src = item.iconSource
		if (typeof src === 'number') {
			if (assetNames.has(src)) return assetNames.get(src)
			var name = ''
			try { var a = valenced.assets.AssetsRegistry.getAssetByID(src); name = (a && a.name) || '' } catch (e) {}
			assetNames.set(src, name)
			return name
		}
		var Component = item.IconComponent
		return (Component && (Component.displayName || Component.name)) || ''
	}
	var PLUS_ICONS = [/camera/i, /image|photo|picture|gallery/i, /poll/i, /paperclip|attach|file|document/i, /\bapps?\b|sparkle|robot|bot/i]
	function plusScore(items) {
		var found = {}
		var strong = false
		items.forEach(function (item) {
			var name = iconName(item)
			if (!name) return
			PLUS_ICONS.forEach(function (re, i) { if (re.test(name)) { found[i] = true; if (i === 0 || i === 2) strong = true } })
		})
		return strong ? Object.keys(found).length : 0
	}
	function countLabels(list, labels) {
		var hits = 0
		for (var i = 0; i < list.length; i++) {
			var label = list[i] && typeof list[i] === 'object' && list[i].label
			if (typeof label === 'string' && labels[label] === 1) hits++
		}
		return hits
	}
	function decorateItems(result, items) {
		if (!enabled('plusMenu')) return result
		if (countLabels(items, PLUS_LABELS) < 2 && plusScore(items) < 3) return result
		var wanted = wantedOptions()
		if (!wanted.length) return result
		for (var i = 0; i < items.length; i++) if (items[i] && OPTIONS.some(function (option) { return option.label === items[i].label })) return result
		var template = items.find(function (item) { return item && typeof item.label === 'string' })
		if (!template) return result
		var Icon = findIcon(['SpotifyNeutralIcon', 'MusicIcon', 'PlayIcon'])
		var assetId = valenced.assets.getAssetIdByName('ic_spotify_white_16px')
		var extra = wanted.map(function (option) {
			var lastPress = 0
			var press = function () {
				if (Date.now() - lastPress < 1500) return
				lastPress = Date.now()
				try { valenced.discord.actions.ActionSheetActionCreators.hideAllActionSheets() } catch (e) {}
				setTimeout(option.run, 0)
			}
			var item = Object.assign({}, template, { label: option.label })
			;['id', 'key', 'testID', 'nativeID', 'index', 'state'].forEach(function (name) { delete item[name] })
			;['action', 'onPress', 'onSelect', 'onClick', 'callback', 'handler'].forEach(function (name) { if (name in template || name === 'action') item[name] = press })
			if (assetId != null) item.iconSource = assetId
			else delete item.iconSource
			if ('IconComponent' in template || Icon) { if (Icon) item.IconComponent = Icon; else delete item.IconComponent }
			return item
		})
		return valenced.react.React.cloneElement(result, { items: items.concat(extra) })
	}
	function decorateMenu(result) {
		try {
			var props = result && result.props
			if (!props) return result
			if (Array.isArray(props.items) && props.items.length >= 2 && props.items.length <= 24) return decorateItems(result, props.items)
			return result
		} catch (e) { return result }
	}
	function installMenuHook(cleanup) {
		var f = finders()
		var runtime = f.lookupModule(f.filters.withProps('jsx', 'jsxs'))[0] || valenced.react.ReactJSXRuntime
		;['jsx', 'jsxs'].forEach(function (name) {
			if (runtime && typeof runtime[name] === 'function') cleanup(valenced.patcher.after(runtime, name, decorateMenu))
		})
	}

	function SettingsComponent(props) {
		var Design = valenced.discord.design.Design
		var RN = valenced.react.ReactNative
		var json = props.api.jsonStorage
		storage = json
		var settings = Object.assign({}, defaults, json.use())
		function toggle(key, label, subLabel) {
			return h(Design.TableSwitchRow, { key: key, label: label, subLabel: subLabel, value: settings[key] !== false, onValueChange: function (value) { var patch = {}; patch[key] = value; json.set(patch) } })
		}
		return h(RN.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 38 } },
			h(Design.Stack, { style: { paddingVertical: 24, paddingHorizontal: 12 }, spacing: 24 },
				h(Design.TableRowGroup, { title: 'Listen along' }, toggle('listenAlong', 'Listen along button', "Adds a button next to Play on Spotify on other people's Spotify activity")),
				h(Design.TableRowGroup, { title: 'Send options' },
					toggle('sendInvite', 'Send listen along', 'The invite card for the song you are playing'),
					toggle('sendSongLink', 'Send song link', 'A link to the song you are playing'),
					toggle('sendAlbumLink', 'Send playing album', 'A link to the album you are playing')),
				h(Design.TableRowGroup, { title: 'Where it shows up' }, toggle('plusMenu', '+ menu', 'Adds the send options to the menu you get when you tap + next to the message box')),
				h(Design.TableRowGroup, { title: 'About' },
					h(Design.TableRow, { key: 'needs', label: 'Before you start', subLabel: 'Spotify must be linked to Discord. Listening along needs Spotify Premium and Spotify open on your phone.' }),
					h(Design.TableRow, { key: 'credit', label: 'Credit', subLabel: "Based on nexpid's NexxUtils for Revenge." }))))
	}

	Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
	exports.default = plugin({
		jsonStorage: { load: true, default: defaults },
		SettingsComponent: SettingsComponent,
		start: function (api) {
			var cleanup = api.cleanup
			storage = api.jsonStorage
			var f = finders()
			;['SpotifyPlayButton', 'PlayOnSpotifyButton'].forEach(function (name) {
				cleanup(f.getModules(f.filters.withProps(name), function (module) { patchComponent(module, name, decorateListen, cleanup) }))
			})
			// Only cache a module that actually exposes BOTH Spotify operations. The previous build
			// also cached any `sync` + `pause` module, which could shadow the real module and make the
			// button invoke the wrong control (or `play` on an object without a play method).
			cleanup(f.getModules(f.filters.withProps('play', 'sync'), function (module) {
				if (!spotifyActions && isSpotifyActions(module)) spotifyActions = module
			}))
			cleanup(function () { spotifyActions = undefined })
			try { installMenuHook(cleanup) } catch (e) {}
		},
	})
	return exports
})({})
