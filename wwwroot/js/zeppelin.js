
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
					grouping: {limit: g_config.music_lists.letter_grouping.albums, name: 'name'},
					sorting: ['name']
				}
			},
			artists: {
				title: 'Artists',
				name: 'artists',
				lists: {
					grouping: {limit: g_config.music_lists.letter_grouping.artists, name: 'name'},
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

	var player = layout.render(zeppelin);

	body().set(div({class: 'player'}, player));

	g_env.eventMgr.notify('onZeppelinBuilt');

	$('.ui-slider-range-min').addClass('custom-slider-value');

	g_env.data.request('player_queue_get');
	g_env.data.request('player_get_volume');

	g_env.data.mgr.subscribe(['player_queue_album', 'player_queue_file', 'player_queue_remove', 'player_queue_directory', 'player_queue_playlist'], function() {
		g_env.data.request('player_queue_get');
	});

	var getStatus = function() {
		g_env.data.request('player_status');
	};

	var m_statusTimerId = 0;

	window.onblur = function()
	{
		if(m_statusTimerId)
			clearTimeout(m_statusTimerId);
	}

	window.onfocus = function()
	{
		getStatus();
		if(m_statusTimerId)
			clearTimeout(m_statusTimerId);

		m_statusTimerId = setInterval(getStatus, 500);
	}

	window.onfocus(); //because the wonderful chrome does not send an onfocus event after onload...
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
