
function LoadLibrary(p_onLoaded)
{
	var start = (new Date()).getTime();

	var m_loadCnt = Map.size(Library.types);

	var parse = function()
	{
		var parseStart = (new Date()).getTime();

		foreach(Library.types, function(type) {
			type.parse();
		});

		var end = (new Date()).getTime();

		console.debug('Library loaded and parsed. (Times: full: ' + (end - start) + ' ms, parse: ' + (end - parseStart) + ' ms)');

		p_onLoaded();
	}

	foreach(Library.types, function(desc, name) {
		Library.data[desc.nodeName] = [];
		Library.idToIdxMap[desc.nodeName] = {};
		g_env.rpc.request.send(desc.getter, {id: []}, function(res) {
			foreach(res, function(data) {
				data.type = name;
				var len = Library.data[desc.nodeName].push(data);
				Library.idToIdxMap[desc.nodeName][data.id] = len-1;
			});
			if(!--m_loadCnt)
				parse();
		});
	});
}

function ZeppelinClient()
{
	var zeppelin = {
		clientSettings: new CookieClientSettings(),
		libraryTypes: {
			albums: {
				title: 'Albums',
				name: 'albums',
				lists: {
					grouping: {limit: g_config.library.letter_grouping.albums, name: 'name'},
					sorting: ['name']
				}
			},
			artists: {
				title: 'Artists',
				name: 'artists',
				lists: {
					grouping: {limit: g_config.library.letter_grouping.artists, name: 'name'},
					sorting: ['name']
				}
			},
			directories: {
				title: 'Folders',
				name: 'directories',
				lists: {
					grouping: {limit: '', name: ''},
					sorting: ['type','name']
				},
				root_filter: {
					parent_id: function(item) {
						return item.parent_id != 0;
					}
				},
			},
		}
	}

	var windowSize = getClientSize();
	var browserType = isMobileBrowser() ? 'mobile' : 'desktop';
	var orientation = windowSize.w > windowSize.h ? 'landscape' : 'portrait';
	var layout = false;

	foreach(Layouts, function(desc, name) {
		if(desc.type != browserType)
			return;
		if(desc.hasOwnProperty('orientation') && desc.orientation != orientation)
			return;

		layout = desc;
		return false;
	});

	if(layout === false) {
		clMessageBox('Not found any layout!', 'Error');
		return;
	}

	g_env.settings = layout.settings;

	var player = layout.render(zeppelin);

	if(layout.styles) {
		var loadingCnt = layout.styles;
		var sheetLoaded = function()
		{
			if(--loadingCnt > 0)
				return;

			build(player);
		}

		foreach(layout.styles, function(style) {
			var sheet = link({rel: 'stylesheet', type: 'text/css', href: style});
			head().add(sheet);
			$(sheet).load(sheetLoaded);
		});
	}

	var build = function(p_player)
	{
		body().set(div({class: 'player'}, p_player));

		g_env.eventMgr.notify('onZeppelinBuilt');

		$('.ui-slider-range-min').addClass('custom-slider-value');

		g_env.data.request('player_queue_get');

		g_env.zeppelinAgent.subscribe('queue-changed', function(){
			g_env.data.request('player_queue_get');
		});

		g_env.data.mgr.subscribe('player_queue_get', function(p_data) {
			g_env.queueStorage.setData(p_data);
		});

		g_env.zeppelinAgent.subscribe('song-changed', function(p_data) {

			var item = g_env.queueStorage.getItem(p_data.index);

			if(item === false)
				return false;

			if(item.type != 'file') {
				console.error("This item type (", item.type, ") is insane!", item);
				return false;
			}

			try {
				var file = Library.get('file', item.id);
				g_env.eventMgr.notify('onSongChanged', file);
			} catch(ex) {
				g_env.eventMgr.notify('onSongCleared');
			}
		});

        g_env.player = {
			status: false
		};

        g_env.zeppelinAgent.subscribe(['started','stopped', 'paused'], function(data) {
            g_env.player.status = data.event;
        });

		PlayerPositionRefresher();
	}

	if(!layout.styles)
		build(player);
}

function WebsocketAgent(p_args)
{
	new WebsocketClient({
		host: p_args.host,
		callback: function(r) {
			p_args.notifier.notify(r.event, r);
		}
	});

	//needed for initial data request
	g_env.eventMgr.subscribe('onQueueReceived', function() {
		new RPCAgentBackend({
			notifier: p_args.notifier,
			requesters: [new RPCOneShotRequester({rpc: p_args.rpc, desc: p_args.request_desc})]
		});
	});
}

function RPCOneShotRequester(p_args)
{
	var m_rpc = p_args.rpc;

	this.start = function(p_callback)
	{
		//start timers
		foreach(p_args.desc, function(desc, cmd) {
			m_rpc.request.send(cmd, {}, function(data) {
				p_callback(cmd, data);
			});
		});
	}
}

function RPCIntervalRequester(p_args)
{
	var m_rpc = p_args.rpc;

	this.start = function(p_callback)
	{
		//start timers
		foreach(p_args.desc, function(desc, cmd) {
			setInterval(function() {
				m_rpc.request.send(cmd, {}, function(data) {
					p_callback(cmd, data);
				});
			}, desc.interval);
		});
	}
}

function RPCAgentBackend(p_args)
{
	var PlayerStatusStateParser = function(p_stateNum, p_eventName)
	{
		var m_currState = -1;

		this.request = 'player_status';

		this.parse = function(data)
		{
			var state = data.state === p_stateNum;
			if(m_currState === state)
				return false;
			m_currState = state;
			if(!m_currState)
				return false;
			return {event: p_eventName};
		}
	}

	var PlayerStatusCommonParser = function(p_sourceName, p_eventName, p_targetName)
	{
		var m_value = false;
		var m_targetName = def(p_targetName, p_sourceName);

		this.request = 'player_status';

		this.parse = function(data)
		{
			if(equal(m_value, data[p_sourceName]))
				return false;
			m_value = data[p_sourceName];
			var event = {event: p_eventName};
			event[m_targetName] = m_value;
			return event;
		}
	}

	var LibraryStatusParser = function(p_source, p_event, p_transitionDirection)
	{
		var m_value = false;

		this.request = 'library_get_status';

		this.parse = function(data)
		{
			var oldvar = m_value;
			m_value = data[p_source];

			if(data[p_source] == oldvar)
				return false;

			if(data[p_source] - oldvar != p_transitionDirection)
				return false;

			return {event: p_event};
		}
	}

	var m_events = [
		new PlayerStatusStateParser(1, 'started'),
		new PlayerStatusStateParser(0, 'stopped'),
		new PlayerStatusStateParser(2, 'paused'),
		new PlayerStatusCommonParser('index', 'song-changed'),
		new PlayerStatusCommonParser('volume', 'volume-changed', 'level'),
		new PlayerStatusCommonParser('position', 'position-changed'),
		{
			request: '_player_queue_change',
			parse: function(data) {
				//if the agent received a "_player_queue_change" event from the requester means the queue was changed
				return {event: 'queue-changed'};
			}
		},
		new LibraryStatusParser('metaparser_running', 'metaparser-started',  1),
		new LibraryStatusParser('metaparser_running', 'metaparser-stopped', -1),
		new LibraryStatusParser('scanner_running', 'scanner-started',  1),
		new LibraryStatusParser('scanner_running', 'scanner-stopped', -1)
	]

	var onTrigger = function(request, data)
	{
		foreach(m_events, function(desc) {
			if(desc.request != request)
				return;

			var event = desc.parse(data);
			if(event === false)
				return;

			p_args.notifier.notify(event.event, event);
		});
	}

	foreach(p_args.requesters, function(req) {
		req.start(onTrigger);
	});
}

function PlayerPositionRefresher(p_args)
{
	var m_args = def(p_args, {});
	var m_timerId = 0;
	var m_interval = Map.def(m_args, 'interval', 200);
	var m_position = -1;
	var m_time = 0;

	var onTimer = function()
	{
		var time = new Date().getTime();
		m_position += (time - m_time)/1000;
		m_time = time;
		sendEvent();
	}

	var sendEvent = function()
	{
		if(m_position == -1) {
			console.debug('The playerPosition is uninitalized. pos:', m_position, '. Pos change event will not sent');
			return;
		}

		g_env.eventMgr.notify('onPositionChanged', m_position);
	}

	var stopTimer = function()
	{
		clearInterval(m_timerId);
	}

	var startTimer = function()
	{
		m_time = new Date().getTime()
		m_timerId = setInterval(onTimer, m_interval);
	}

	g_env.zeppelinAgent.subscribe('started', function() {
		startTimer();
		sendEvent();

	}).subscribe('paused', function() {
		stopTimer();

	}).subscribe('stopped', function() {
		stopTimer();
		m_position = 0;
		sendEvent();

	}).subscribe('position-changed', function(event) {
		m_position = event.position;
		sendEvent();

	}).subscribe('song-changed', function(p_data) {
		m_position = 0;
		sendEvent();

	});
}

function CookieClientSettings()
{
	this.set = function(p_key, p_val)
	{
		cookieData(p_key, p_val);
	}

	this.get = function(p_key, p_default)
	{
		var val = cookieData(p_key);
		return val == null ? p_default : val;
	}
}

function MetaDataEditor(p_fileId, p_onSuccess)
{
	var data = Library.get('file', p_fileId);
	var artists = Map.mine(Library.data.artists, 'name');
	var albums = Map.mine(Library.data.albums, 'name');
	artists.sort(strcmp);
	albums.sort(strcmp);

	var form = {
		params: {
			class: 'sForm'
		},
		fields: {
			id: {name: 'id', type: 'hidden', value: data.id},
			artist: {name: "artist", type: "text", label: "Artist", value: Library.get('artist', data.artist_id).name, list: artists},
			album: {name: "album", type: "text", label: "Album", value: Library.get('album', data.album_id).name, list: albums},
			title: {name: "title", type: "text", label: "Title", value: data.title},
			year: {name: "year", type: "number", label: "Year", value: data.year},
			track_index: {name: "track_index", type: "number", label: "Track", value: data.track_index},
		},
		submit: {
			type: "submit",
			value: "Submit"
		},
		errors:[]
	}

	formDialog({
		title: 'Edit metadata for file ' + data.name,
		skeleton: form,
		onsubmit: function(formData, dlg) {
			formData.id = parseInt(formData.id);
			formData.year = parseInt(formData.year);
			formData.track_index = parseInt(formData.track_index);

			g_env.rpc.request.send('library_update_metadata', formData, function() {
				if(p_onSuccess)
					p_onSuccess(formData);
			});
			dlg.close();
		}
	});
}
