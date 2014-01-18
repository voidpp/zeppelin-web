
function ZeppelinClient()
{
	var clientSettings = new CookieClientSettings();

	//cache the library
	g_env.data.mgr.subscribe('library_get_artists', function(p_list) {
		foreach(p_list, function(data) {
			g_env.storage.library.artist[data.id] = data;
		});
	});

	g_env.data.mgr.subscribe('library_get_albums', function(p_list) {
		foreach(p_list, function(data) {
			g_env.storage.library.album[data.id] = data;
		});
	});

	g_env.data.mgr.subscribe('library_get_files_of_album', function(p_list) {
		foreach(p_list, function(data) {
			g_env.storage.library.file[data.id] = data;
		});
	});

	var libraryTypes = {
		albums: {
			title: 'Albums',
			cmd: 'library_get_albums',
			root_renderer: 'album',
			lists: {
				grouping: {limit: g_config.music_lists.letter_grouping.albums, name: 'name'},
				sorting: ['name', 'songs']
			}
		},
		artists: {
			title: 'Artists',
			cmd: 'library_get_artists',
			root_renderer: 'artist',
			lists: {
				grouping: {limit: g_config.music_lists.letter_grouping.artists, name: 'name'},
				sorting: ['name', 'albums']
			}
		}
	}

	var main = div({class: 'panel', style:'padding: 10px; width: 680px'},
				playerStatusWidget().css({marginRight: 5}),
				currentPositionNumWidget().css({marginRight: 10}),
				currentSongInfoWidget(), br(),
				currentSongWidget().css({width: '100%'}), br(),
				currentPositionBarWidget().css({width: '100%', paddingTop: 5, paddingBottom: 5}), br(),
				controlWidget(),
				volumeWidget({orientation: 'horizontal'}).css({width: 150, padding: 5})
			);

	//$(main).draggable()/*.resizable()*/;

	var tabbedWidgets = clTabulable({
		settings: clientSettings,
		id: 'tab1',
		pages: [
			{title: libraryTypes.artists.title, container: libraryWidget({desc: libraryTypes.artists})},
			{title: libraryTypes.albums.title, container: libraryWidget({desc: libraryTypes.albums})},
			{title: 'Folders', container: directoryBrowserWidget()},
		]
	}).addClass('panel').css({width: 340, height: 500});

	var openedTab = clientSettings.get('tab1');
	tabbedWidgets.showPage(openedTab === null ? 0 : openedTab);

	var queue = queueWidget().css({width: 340, height: 500}).addClass('panel');
	var player = table({cellpadding:0, cellspacing: 0},
				tr(td({colspan: 2}, main)),
				tr(td(queue), td(tabbedWidgets)));

	body().add(div({class: 'player'}, player));

	var windowSize = getClientSize();

	var diff = $(player).outerHeight() - windowSize.h;

	if(diff > 0) {
		queue.css({height: $(queue).height() - diff});
		tabbedWidgets.css({height: $(tabbedWidgets).height() - diff});
	}

	tabbedWidgets.updateLayout();

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

	this.get = function(p_key)
	{
		return cookieData(p_key);
	}
}

function MetaDataEditor(p_fileId, p_onSuccess)
{
	var openEditor = function(p_data, p_onSuccess)
	{
		var artists = Map.mine(g_env.storage.library.artist, 'name');
		var albums = Map.mine(g_env.storage.library.album, 'name');

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
