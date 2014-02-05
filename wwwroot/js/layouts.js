
var Layouts = {
	main: {
		type: 'desktop',
		render: function(p_zeppelin) {

			var main = panel(
						playerStatusWidget().css({marginRight: 5, width: 8}),
						currentPositionNumWidget().css({marginRight: 10, height: 42}),
						currentSongInfoWidget(), br(),
						currentSongWidget().css({height: 20, width: '100%'}), br(),
						currentPositionBarWidget().css({width: '100%', paddingTop: 5, paddingBottom: 5}),
						div(
							controlWidget().css({height: 32}),
							volumeWidget({orientation: 'horizontal'}).css({width: 150, margin: 8})
						)
					).css({padding: 10, width: 680});

			var lib1 = libraryWidget({desc: p_zeppelin.libraryTypes.artists});
			var lib2 = libraryWidget({desc: p_zeppelin.libraryTypes.albums});
			var lib3 = libraryWidget({desc: p_zeppelin.libraryTypes.directories});
			var playlist = playlistWidget();

			var tabbedWidgets = clTabulable({
				settings: p_zeppelin.clientSettings,
				id: 'tab1',
				pages: [
					{title: p_zeppelin.libraryTypes.artists.title, container: lib1},
					{title: p_zeppelin.libraryTypes.albums.title, container: lib2},
					{title: p_zeppelin.libraryTypes.directories.title, container: lib3},
					{title: 'Playlists', container: playlist},
					{title: 'Stats', container: statisticsWidget()},
				],
				onShowPage: function(p_idx, p_page) {
					if(p_page.container.eventMgr)
						p_page.container.eventMgr.notify('onDomReady');
				},
			}).css({width: 340, height: 500});

			var queue = queueWidget().css({width: 340, height: 500});
			var player = table({cellpadding:0, cellspacing: 0},
						tr(td({colspan: 2}, main)),
						tr(td(panel(queue)), td(panel(tabbedWidgets))));

			g_env.eventMgr.subscribe('onZeppelinBuilt', function() {

				queue.eventMgr.notify('onDomReady');

				var windowSize = getClientSize();

				var diff = $(player).outerHeight() - windowSize.h;

				if(diff > 0) {
					queue.css({height: $(queue).height() - diff});
					tabbedWidgets.css({height: $(tabbedWidgets).height() - diff});
				}

				tabbedWidgets.updateLayout();
			});

			player.add(configIconWidget({
				zeppelin: p_zeppelin,
				panelCss: {
					width: 300,
					height: 300
				}
			}).css({
				position: 'fixed',
				top: 10,
				right: 10,
				height: 48
			}));

			return player;
		}
	},
	mob1: {
		type: 'mobile',
		orientation: 'portrait',
		render: function(t) {
			return Layouts.main.render(t);
			//return playerStatusWidget().css({marginRight: 5, width: 100});
		}
	}
}