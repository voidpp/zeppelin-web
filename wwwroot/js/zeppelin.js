
/*
	library_get_artists
*/

function ZeppelinClient()
{
	var main = div({class: 'panel', style:'padding: 10px; width: 700px'},
				playerStatusWidget({css: {marginRight: 10}}),
				currentPositionNumWidget({css: {marginRight: 10}}), 
				currentSongInfoWidget(), br(),
				currentSongWidget({css: {width: 680}}), br(),
				currentPositionBarWidget({css: {width: '100%', paddingTop: 5, paddingBottom: 5}}), br(),	
				controlWidget(),
				volumeWidget({orientation: 'horizontal', css: {width: 150, padding: 5}})
			);

	$(main).draggable()/*.resizable()*/;
			
	var player = div({class: 'player'},
			main, br(),
			queueWidget({css: {width: 340, height: 500}}),
			libraryWidget({css: {width: 340, height: 500}})
		);
			
	body().add(player);
	
	$(player).center();

	g_env.eventMgr.notify('onload');
	
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