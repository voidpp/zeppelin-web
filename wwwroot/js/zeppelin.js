
function LoadLibrary(p_onLoaded)
{
	var start = (new Date()).getTime();

	var m_loadCnt = Map.size(g_descriptors.library);

	var parse = function()
	{
		var parseStart = (new Date()).getTime();

		for(var a = 0; a < g_env.library.data.files.length; ++a) {
			var file = g_env.library.data.files[a];
			if(file.album_id) {
				var album = g_env.library.data.albums[g_env.library.idToIdxMap.albums[file.album_id]];
				if(!(album.files instanceof Array))
					album.files = [];
				album.files.push(file);
			}

			var directory = g_env.library.data.directories[g_env.library.idToIdxMap.directories[file.directory_id]];
			if(!(directory.items instanceof Array))
				directory.items = [];
			directory.items.push(file);
		}
		for(var a = 0; a < g_env.library.data.albums.length; ++a) {
			var album = g_env.library.data.albums[a];
			if(!album.artist_id)
				continue;
			var artist = g_env.library.data.artists[g_env.library.idToIdxMap.artists[album.artist_id]];
			if(!(artist.albums instanceof Array))
				artist.albums = [];
			artist.albums.push(album);
		}
		for(var a = 0; a < g_env.library.data.directories.length; ++a) {
			var dir = g_env.library.data.directories[a];
			if(!dir.parent_id)
				continue;
			var parent_dir = g_env.library.data.directories[g_env.library.idToIdxMap.directories[dir.parent_id]];
			if(!(parent_dir.items instanceof Array))
				parent_dir.items = [];
			parent_dir.items.push(dir);
		}

		var end = (new Date()).getTime();

		console.debug('Library loaded and parsed. (Times: full: ' + (end - start) + ' ms, parse: ' + (end - parseStart) + ' ms)');

		p_onLoaded();
	}

	foreach(g_descriptors.library, function(desc, name) {
		g_env.library.data[desc.nodeName] = [];
		g_env.library.idToIdxMap[desc.nodeName] = {};
		g_env.rpc.request.send(desc.getter, {id: []}, function(res) {
			foreach(res, function(data) {
				data.type = name;
				var len = g_env.library.data[desc.nodeName].push(data);
				g_env.library.idToIdxMap[desc.nodeName][data.id] = len-1;
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
					sorting: ['name']
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

	g_env.data.mgr.subscribe(['player_queue_album', 'player_queue_file', 'player_queue_remove', 'player_queue_directory'], function() {
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
	var openEditor = function(p_data, p_onSuccess)
	{
		var artists = Map.mine(g_env.storage.library.artist, 'name');
		var albums = Map.mine(g_env.storage.library.album, 'name');
		artists.sort(strcmp);
		albums.sort(strcmp);

		var form = {
			params: {
				class: 'sForm'
			},
			fields: {
				id: {name: 'id', type: 'hidden', value: p_data.id},
				artist: {name: "artist", type: "text", label: "Artist", value: p_data.artist, list: artists},
				album: {name: "album", type: "text", label: "Album", value: p_data.album, list: albums},
				title: {name: "title", type: "text", label: "Title", value: p_data.title},
				year: {name: "year", type: "number", label: "Year", value: p_data.year},
				track_index: {name: "track_index", type: "number", label: "Track", value: p_data.track_index},
			},
			submit: {
				type: "submit",
				value: "Submit"
			},
			errors:[]
		}

		formDialog({
			title: 'Edit metadata for file ' + p_data.name,
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

	var loadMetaData = function()
	{
		g_env.rpc.request.send('library_get_metadata', {id: p_fileId}, function(p_data) {
			openEditor(p_data, p_onSuccess);
		});
	}

	if(g_env.storage.library.file.hasOwnProperty(p_fileId)) {
		var data = g_env.storage.library.file[p_fileId];

		if(!g_env.storage.library.artist.hasOwnProperty(data.artist_id) || !g_env.storage.library.album.hasOwnProperty(data.album_id)) {
			loadMetaData()
			return;
		}

		data.artist = g_env.storage.library.artist[data.artist_id].name;
		data.album = g_env.storage.library.album[data.album_id].name;
		openEditor(data, p_onSuccess);
	} else
		loadMetaData();
}
