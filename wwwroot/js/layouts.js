
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

			var tabbedWidgets = clTabulable({
				settings: p_zeppelin.clientSettings,
				id: 'tab1',
				pages: [
					{title: p_zeppelin.libraryTypes.artists.title, container: libraryWidget({desc: p_zeppelin.libraryTypes.artists})},
					{title: p_zeppelin.libraryTypes.albums.title, container: libraryWidget({desc: p_zeppelin.libraryTypes.albums})},
					{title: 'Folders', container: directoryBrowserWidget()},
					{title: 'Stats', container: statisticsWidget()},
				],
				onShowPage: function(p_idx, p_page) {
					if(p_page.container.eventMgr)
						p_page.container.eventMgr.notify('onLayoutChanged');
				},
			}).css({width: 340, height: 500});

			var queue = panel(queueWidget().css({width: 340, height: 500}));
			var player = table({cellpadding:0, cellspacing: 0},
						tr(td({colspan: 2}, main)),
						tr(td(queue), td(panel(tabbedWidgets))));

			g_env.eventMgr.subscribe('onZeppelinBuilt', function() {

				var windowSize = getClientSize();

				var diff = $(player).outerHeight() - windowSize.h;

				if(diff > 0) {
					queue.css({height: $(queue).height() - diff});
					tabbedWidgets.css({height: $(tabbedWidgets).height() - diff});
				}

				tabbedWidgets.updateLayout();
			});

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