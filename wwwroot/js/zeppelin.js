
function ZeppelinClient()
{
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
		pos: 'top',
		pages: [
			{title: libraryTypes.artists.title, container: libraryWidget({desc: libraryTypes.artists}), default: true},
			{title: libraryTypes.albums.title, container: libraryWidget({desc: libraryTypes.albums})},
			{title: 'Folders', container: directoryBrowserWidget()},
		]
	}).addClass('panel').css({width: 340, height: 500});

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

	g_env.data.mgr.subscribe('player_queue_album', function() {
		g_env.data.request('player_queue_get');
	});
	g_env.data.mgr.subscribe('player_queue_file', function() {
		g_env.data.request('player_queue_get');
	});
	g_env.data.mgr.subscribe('player_queue_remove', function() {
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

function MetaDataEditor(p_fileId, p_onSuccess)
{
	var data = g_env.storage.library.file[p_fileId];

	var form = {
		params: {
			class: 'sForm'
		},
		fields: { 
			id: {name: 'id', type: 'hidden', value: p_fileId},
			artist: {name: "artist", type: "text", label: "Artist", value: Map.get(g_env.storage.library, ['artist', data.artist_id, 'name'], '')},
			album: {name: "album", type: "text", label: "Album", value: Map.get(g_env.storage.library, ['album', data.album_id, 'name'], '')},
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