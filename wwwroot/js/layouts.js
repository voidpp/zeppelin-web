
var Layouts = {
	main: {
		type: 'desktop',
		settings: {
			lists: {
				swipe_anim: 200,
				scroll_anim: 500,
			},
		},
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

			var lib1 = libraryWidget({type: 'artists', desc: p_zeppelin.libraryTypes});
			var lib2 = libraryWidget({type: 'albums', desc: p_zeppelin.libraryTypes});
			var lib3 = libraryWidget({type: 'directories', desc: p_zeppelin.libraryTypes});
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
	mobile_default: {
		type: 'mobile',
		orientation: 'portrait',
		styles: ['css/dark-mobile.css'],
		settings: {
			lists: {
				swipe_anim: 0,
				scroll_anim: 0,
			},
		},
		render: function(p_zeppelin) {
			var windowSize = getClientSize();

			var player = div({class: 'player'});

			var mainHeight = windowSize.h * 0.25;
			var playerWidth = windowSize.w;

			var main = panel({style:'text-align: center;'},
						playerStatusWidget().css({marginRight: 5, width: mainHeight*0.05}),
						currentPositionNumWidget().css({marginRight: 10, height: mainHeight*0.4}),br(),
						currentSongWidget().css({height: mainHeight*0.1, width: '100%'}), br(),
						currentPositionBarWidget().css({width: '100%', paddingTop: 5, paddingBottom: 5}),
						controlWidget().css({height: mainHeight*0.3})
					).css({width: playerWidth, height: mainHeight});

			var lib1 = libraryWidget({type: 'artists', desc: p_zeppelin.libraryTypes});
			var lib2 = libraryWidget({type: 'albums', desc: p_zeppelin.libraryTypes});
			var lib3 = libraryWidget({type: 'directories', desc: p_zeppelin.libraryTypes});
			var playlist = playlistWidget();
			var queue = queueWidget();

			var tabbedWidgets = clTabulable({
				settings: p_zeppelin.clientSettings,
				id: 'tab1',
				pages: [
					{title: 'Queue', container: queue},
					{title: p_zeppelin.libraryTypes.artists.title, container: lib1},
					{title: p_zeppelin.libraryTypes.albums.title, container: lib2},
					{title: p_zeppelin.libraryTypes.directories.title, container: lib3},
					{title: 'Playlists', container: playlist}
				],
				onShowPage: function(p_idx, p_page) {
					if(p_page.container.eventMgr)
						p_page.container.eventMgr.notify('onDomReady');
				},
			}).css({padding: 0, width: playerWidth, height: windowSize.h*0.74});

			g_env.eventMgr.subscribe('onZeppelinBuilt', function() {
				queue.eventMgr.notify('onDomReady');
				tabbedWidgets.updateLayout();
			});

			player.add(configIconWidget({
				zeppelin: p_zeppelin,
				panelCss: {
					width: windowSize.w-20,
					height: windowSize.h-80
				}
			}).css({
				position: 'fixed',
				top: 10,
				right: 10,
				height: 48,
				zIndex: 100
			}));

			return player.add(main, panel(tabbedWidgets));
		}
	}
}