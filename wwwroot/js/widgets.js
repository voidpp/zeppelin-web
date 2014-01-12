	
function widget(p_args)
{
	var m_cont = div({class: 'widget'});
	m_cont.args = def(p_args, {});
	if(m_cont.args.css)
		$(m_cont).css(m_cont.args.css);

	return m_cont;
}

function currentSongInfoWidget(p_args)
{
	var m_cont = widget(p_args).addClass('current_song_info');

	var m_sampleRate = td('42');
	var m_compRate = td('na');
	var m_codec = td('mp3');
	
	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(!Map.checkTree(g_env.storage, ['queue','file', p_data.current]))
			return;

		var file = g_env.storage.queue.file[p_data.current];
		m_sampleRate.set(parseInt(file.sampling_rate/1000));
		m_compRate.set('na');
		m_codec.set(g_descriptors.codecs[file.codec].title);
	});
	
	return m_cont.add(table({cellpadding: 0, cellspacing: 0},
		tr(m_codec, td('codec')),
		tr(m_compRate, td('kbps')),
		tr(m_sampleRate , td('khz'))
	));
}

function indicator()
{
	var m_cont = canvas({class: 'indicator'});

	m_cont.getIconRect = function()
	{
		var s = this.getSize();
		var padding = 1;
		return {x: padding, y: padding, w: s.w-padding*2, h: s.h-padding*2};
	}
	
	m_cont.initDrawer = function()
	{
		var size = this.getSize();
		this.width = size.w; //canvas needs this property...
		this.height = size.h;
		var ctx = this.getContext("2d");
		ctx.fillStyle = $(this).css('color');
		this.setBlur(ctx);
		return ctx;
	}
	
	m_cont.setBlur = function(p_ctx)
	{
		var blur = $(this).css('text-shadow');
		if(blur == 'none') 
			return;
		var blurProps = blur.split(' '); //ECMA is a bitch...
		var distance = parseInt(blurProps.last());
		var color = blurProps.slice(0,blurProps.length-3).join(' ');
		p_ctx.shadowColor = color;
		p_ctx.shadowBlur = distance;
		return this;
	}

	return m_cont;
}

function playerStatusWidget(p_args)
{
	var m_cont = widget(p_args).addClass('player_status');
	var m_state = 0;
	var m_play = indicator();
	var m_pause = indicator();
	var m_stop = indicator().addClass('active');
	var m_states = [m_stop, m_play, m_pause];

	m_play.drawIndicator = function()
	{
		var rect = this.getIconRect();
		var ctx = this.initDrawer();
		ctx.beginPath();
		ctx.moveTo(rect.x+rect.w*0.15, rect.y);
		ctx.lineTo(rect.x+rect.w*0.85, rect.y+rect.h/2);
		ctx.lineTo(rect.x+rect.w*0.15, rect.y+rect.h);
		ctx.closePath();
		ctx.fill();
		return this;
	}

	m_stop.drawIndicator = function()
	{
		var rect = this.getIconRect();
		var ctx = this.initDrawer();
		ctx.fillRect(rect.x+rect.w*0.1,rect.y+rect.h*0.1,rect.w*0.8,rect.h*0.8);
		return this;
	}
	
	m_pause.drawIndicator = function()
	{
		var rect = this.getIconRect();
		var ctx = this.initDrawer();
		ctx.fillRect(rect.x+rect.w*0.15,rect.y+rect.h*0.05,rect.w*0.25,rect.h*0.9);
		ctx.fillRect(rect.x+rect.w*0.60,rect.y+rect.h*0.05,rect.w*0.25,rect.h*0.9);
		return this;
	}	
	
	g_env.eventMgr.subscribe('onZeppelinBuilt', function() {	
		m_play.drawIndicator();
		m_stop.drawIndicator();
		m_pause.drawIndicator();
	});

	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(m_state == p_data.state)
			return;

		m_states[m_state].removeClass('active');
		m_states[p_data.state].addClass('active');

		m_states[m_state].drawIndicator();
		m_states[p_data.state].drawIndicator();

		m_state = p_data.state;
	});

	return m_cont.add(table({cellpadding:0, cellspacing:0}, tr(td(m_play)), tr(td(m_pause)), tr(td(m_stop))));
}

function currentPositionNumWidget(p_args)
{
	var m_cont = widget(p_args).addClass('current_num');
	var m_disp = div({class: 'display'});
	var m_back = div({class: 'background'}, '88:88:88');
	
	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(!Map.checkTree(g_env.storage, ['queue','file', p_data.current]))
			return;

		m_disp.set(formatTime(p_data.position));
	});
	
	return m_cont.add(m_back, m_disp);
}

function currentSongWidget(p_args)
{
	var m_cont = widget(p_args).addClass('current_song');
	var m_text = div({class: 'display'});
	var m_back = div({class: 'background'}).html(Array(60).join('&#x2589;'));
	
	var m_fid = 0;
	
	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(!Map.checkTree(g_env.storage, ['queue','file', p_data.current]))
			return;

		if(m_fid == p_data.current)
			return;
		
		m_fid = p_data.current;
			
		var file = g_env.storage.queue.file[p_data.current];
		
		var t = m_text;
		
		m_text.set(file.title + ' (' + formatTime(file.length) + ')');
		
		$(t).autoScroll({
			duration: 5000, 
			wait: 500
		});
	});
	
	return m_cont.add(m_back, m_text);
}

function currentPositionBarWidget(p_args)
{
	var m_cont = widget(p_args).addClass('current_position');
	var m_slider = div({class: 'slider'});
	var m_max = 1000;
	var m_file = {};
	
	$(m_slider).slider({
		orientation: "horizontal",
		range: "min",
		min: 0,
		max: m_max,
		value: 0,
		stop: function(event, ui) {
			//g_env.rpc.request.send('player_set_position', {position: (ui.value/m_max) * m_file.length});
		}
	});

	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(!Map.checkTree(g_env.storage, ['queue','file', p_data.current]))
			return;

		m_file = g_env.storage.queue.file[p_data.current];
		$(m_slider).slider('value', (p_data.position / m_file.length) * m_max);
	});
	
	return m_cont.add(m_slider);
}

function controlWidget()
{
	var m_cont = widget().addClass('control');
	var m_play = rpcButton({img:'/pic/Play.png', command:'player_play'});
	var m_pause = rpcButton({img:'/pic/Pause.png', command:'player_pause'}).hide();
	var m_state = -1;
	
	m_cont.add(
		rpcButton({img:'/pic/Start.png', command:'player_prev'}),
		m_play,
		m_pause,
		rpcButton({img:'/pic/Stop.png', command:'player_stop'}),
		rpcButton({img:'/pic/End.png', command:'player_next'}) 
	);
	
	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(m_state == p_data.state)
			return;
		switch(p_data.state) {
			case 1:
				m_pause.show();
				m_play.hide();
				break;
			case 0:
			case 2:
				m_pause.hide();
				m_play.show();				
				break;
		}
		
		m_state = p_data.state;
	});	
	
	return m_cont;
}

function volumeWidget(p_args)
{
	var m_args = def(p_args, {});
	var m_cont = widget(m_args).addClass('volume');
	var m_slider = div({class: 'slider'});
	var m_icon = [img({src:'/pic/vol-none.png'}), img({src:'/pic/vol-med.png'}).hide(), img({src:'/pic/vol-full.png'}).hide()];
	var m_prevIcon = 0;
	var m_ranges = {
		0: [0,1],
		1: [1,50],
		2: [51,101]
	};
	var m_orientation = Map.def(m_args, 'orientation', 'vertical');
	
	var updateIcon = function(p_vol)
	{
		var idx = searchInRange(parseInt(p_vol), m_ranges);
		if(m_prevIcon == idx)
			return;
		
		m_icon[m_prevIcon].hide();
		m_icon[idx].show();
		m_prevIcon = idx;
	}
	
	$(m_slider).slider({
		orientation: m_orientation,
		range: "min",
		min: 0,
		max: 100,
		value: 0,
		stop: function(event, ui) {
			updateIcon(ui.value);
			g_env.rpc.request.send('player_set_volume', {level: ui.value});
		}
	});
	
	g_env.eventMgr.subscribe('onListItemUpdated', function() {
		if(m_orientation == 'vertical')
			$(m_slider).height($(m_cont).height() - $(m_icon).outerHeight());
		else
			$(m_slider).width($(m_cont).width() - $(m_icon).outerWidth());
	});

	g_env.data.mgr.subscribe('player_get_volume', function(p_data) {
		$(m_slider).slider('value', p_data);
		updateIcon(p_data);
	});

	g_env.data.mgr.subscribe('player_status', function(p_data) {
		//$(m_slider).slider('value', p_data.volume);
		updateIcon(p_data.volume);
	});
	
	
	return m_cont.add(m_icon, m_slider);
}

var MusicTree = {
	item: function(p_data)
	{
		var cont = div({class: 'music_item'});

		if(p_data.hasOwnProperty('id'))
			cont.p('dbId', p_data.id);

		if(p_data.image && p_data.name) {
			cont.add(table({cellspacing: 0, cellpadding: 0, class: 'face'}, tr(
					td({class: 'image'}, div({style: 'position: relative'},img({src: p_data.image}), p_data.label ? div({class: 'label'}, p_data.label) : null)),
					td({class: 'content'}, div({class: 'name'}, p_data.name), br(), div({class: 'desc'}, p_data.desc))
				))
			);
			
			if(p_data.menu && p_data.menu.length) {
				cont.oncontextmenu = function() {
					var contextMenu = new clMenu({
						destroyAfterHide: true, 
						link_handler: function(p_href) {
							g_env.data.request(p_href.cmd, p_href.params);
						}
					});
					foreach(p_data.menu, function(m) {
						contextMenu.appendItem(m);
					});
					contextMenu.popup();
					return false;
				}
			}
		}

		return cont;
	},
	listItem: function(p_data, p_itemProcess, p_boxingName, p_sortName)
	{
		if(p_sortName) {
			sortNames = p_sortName instanceof Array ? p_sortName : [p_sortName];
			p_data.list.sort(function(a, b){
				var res = 0;
				foreach(sortNames, function(name) {
					res = g_descriptors.sortMethods[typeof a[name]](a[name],b[name]);
					if(res != 0)
						return false;
				});
				return res;
			});
		}

		var limit = g_config.music_lists.letter_tags_display_limit;
		
		return p_data.list.length > limit ? this.listItemBoxed(p_data, p_itemProcess, p_boxingName) : this.listItemMixed(p_data, p_itemProcess);
	},
	listItemBase: function()
	{
		var m_cont = div({class: 'music_list'});
		
		m_cont.search = function(p_items, p_val)
		{
			var val = p_val.toLowerCase();

			foreach(p_items, function(desc) {
				if(!p_val.length) {
					desc.container.show();
					return;
				}
				var found = foreach(desc.data, function(value, key) {
					if(!(typeof value == 'string'))
						return;
					if(value.toLowerCase().indexOf(val) != -1)
						return false;
				}) === false;
				desc.container.show(found);
			});		
		}
		
		return m_cont;
	},	
	listItemMixed: function(p_data, p_itemProcess)
	{
		var m_cont = this.listItemBase();
		var m_items = [];

		foreach(p_data.list, function(item) {
			var cont = p_itemProcess(item);
			m_items.push({data: item, container: cont});
			m_cont.add(cont);
		});
		
		$(m_cont).mCustomScrollbar({
			contentTouchScroll: true,
			autoHideScrollbar: true,
			mouseWheelPixels: 200,
			advanced: {
				updateOnContentResize: true
			}
		});
		
		m_cont.onQuickSearch = function(p_val)
		{
			this.search(m_items, p_val);
		}
		
		m_cont.updateLayout = function() {};
		
		return m_cont;
	},
	listItemBoxed: function(p_data, p_itemProcess, p_boxingName)
	{
		var m_tagCont = div({class: 'tags'});
		var m_list = div({class: 'list'});
		var m_cont = this.listItemBase().add(m_tagCont, m_list);
		var m_tags = {};
		var m_letters = {};
		var m_currBoxLetter = -1;
		var m_css = {};

		foreach(p_data.list, function(item) {
			var letter = item[p_boxingName][0];
			if(!letter)
				return;
				
			letter = letter.toUpperCase();
			
			if(letter == ' ')
				return;
			
			if(!m_letters.hasOwnProperty(letter)) {
				m_letters[letter] = {
					count: 0,
					cont: null,
					items: []
				};
			}
			m_letters[letter].count++;
			m_letters[letter].items.push({data: item});
		});

		var generateBox = function(p_desc) 
		{
			p_desc.cont = div().hide();
			
			m_list.add(p_desc.cont);
		
			foreach(p_desc.items, function(item) {
				item.container = p_itemProcess(item.data);
				p_desc.cont.add(item.container);
			});
			
			$(p_desc.cont).css(m_css).mCustomScrollbar({
				contentTouchScroll: true,
				autoHideScrollbar: true,
				mouseWheelPixels: 200,
				advanced: {
					updateOnContentResize: true
				}
			});
		}
		
		var lettersArr = Map.keys(m_letters);
		
		lettersArr.sort();
		
		foreach(lettersArr, function(letter) {
			var tagCont = div(letter, {class: 'letter', onclick: function() {
				hideBox(m_currBoxLetter);
				showBox(letter);
			}});
		
			m_tags[letter] = tagCont;
		
			m_tagCont.add(tagCont);
		});
		
		var hideBox = function(p_letter)
		{
			m_letters[p_letter].cont.hide();
			m_tags[p_letter].removeClass('active');
		}
		
		var showBox = function(p_letter) 
		{
			var desc = m_letters[p_letter];

			if(!desc.cont)
				generateBox(desc);
			
			desc.cont.show();	
			m_tags[p_letter].addClass('active');
			m_currBoxLetter = p_letter;

			m_cont.onQuickSearch('');
			if(m_cont.setQuickSearchValue)
				m_cont.setQuickSearchValue('');
		}

		m_cont.onQuickSearch = function(p_val)
		{		
			var desc = m_letters[m_currBoxLetter];
			this.search(desc.items, p_val);
		}

		m_cont.updateLayout = function() 
		{
			m_css = {
				width: $(m_cont).width() - $(m_tagCont).width(),
				height: $(m_cont).height(),
				overflow: 'hidden'
			};

			$(m_list).css(m_css);
			$(m_tagCont).height($(m_cont).height());
			
			for(var l in m_letters) {
				if(m_letters[l].cont)
					$(m_letters[l].cont).css(m_css);
			}
		}

		$(m_tagCont).bind('mousewheel',function(ev, delta) {
			var scrollTop = $(this).scrollTop();
			$(this).scrollTop(scrollTop-Math.round(delta*50));
		});

		if(lettersArr.length)
			showBox(lettersArr[0]);		

		return m_cont;
	},
	container: function(p_args) 
	{
		var m_cont = widget(p_args).addClass('music_container');
		var m_menuBar = div({class: 'menubar'});
		var m_breadcrumbs = div({class: 'breadcrumbs'});
		var m_header = div({class: 'header'}, m_menuBar, m_breadcrumbs);
		var m_nodesCont = div({class: 'nodes'});
		var m_nodes = {};
		var m_path = [];
		var m_quickSearch = null;

		foreach(p_args.rpc_menu, function(menu) {
			m_menuBar.add(clButton({label: menu.title, callback: function() { 
				g_env.data.request(menu.cmd);
				if(menu.callback)
					menu.callback();
			}, class: 'miniButton3D'}), ' ');
		});
		
		if(Map.def(p_args, 'quick_search', false)) 
		{
			m_quickSearch = quickSearchField({minLimit: 0, placeholder: 'Filter', class: 'tiny', wait: 0, callback: function(val) {
				if(!m_path.length)
					return;
				var id = m_path.last().id;
				if(!m_nodes.hasOwnProperty(id))
					return;
			
				m_nodes[id].quickSearchValue = val;
				m_nodes[id].container.onQuickSearch(val);
			}});
			m_menuBar.add(m_quickSearch);
		}
		
		//$(m_cont).draggable({handle: m_header});
		//$(m_cont).resizable({alsoResize: '.music_list'});

		m_cont.reset = function()
		{
			m_nodes = {};
			m_path = [];
			m_nodesCont.clear();
			this.updateBreadcrumbs();
		}
		
		m_cont.updateQuickSearchField = function(p_id)
		{
			if(m_quickSearch)
				m_quickSearch.setValue(m_nodes[p_id].quickSearchValue);
		}

		m_cont.switchNextNode = function(p_id) 
		{
			if(!m_nodes.hasOwnProperty(p_id))
				return;		
		
			var node = m_nodes[p_id];
			var cont = $(node.container);
			cont.show();
			cont.css('marginLeft', 0);
			
			if(m_path.length)
				this.hideNode(m_path.last().id);
			
			m_path.push({id: p_id, title: node.title});
			this.updateBreadcrumbs();
			this.updateQuickSearchField(p_id);
		}

		m_cont.switchPrevNode = function(p_id)
		{
			if(!m_path.length)
				return;

			var idx = -1;
			foreach(m_path, function(part, i) {
				if(part.id == p_id) {
					idx = parseInt(i);
					return false;
				}
			});
			
			if(idx < 0)
				return;
			
			var curr = m_path.last();
			if(curr.id == p_id)
				return;
			
			var cont = $(m_nodes[p_id].container);
			cont.show();
			
			cont.animate({
					marginLeft: 0
				}, 200, 'swing', function() {
					m_nodes[curr.id].container.hide();
				});	

			m_path.splice(idx+1, m_path.length);
			
			this.updateBreadcrumbs();
			this.updateQuickSearchField(p_id);
		}

		m_cont.hideNode = function(p_id) 
		{
			if(!m_nodes.hasOwnProperty(p_id))
				return;
			
			var cont = $(m_nodes[p_id].container);
				
			cont.animate({
					marginLeft: -1 * cont.outerWidth()
				}, 200, 'swing', function() {
					cont.hide();
				});
		}

		m_cont.hasNode = function(p_id) 
		{
			return m_nodes.hasOwnProperty(p_id);
		}

		m_cont.updateBreadcrumbs = function() 
		{
			var parts = [];
			foreach(m_path, function(part) {
				parts.push(clTextButton({label: part.title, onclick: function() {
					m_cont.switchPrevNode(part.id);
				}}));
			});
			$(m_breadcrumbs.set(parts.quilt(' > '))).autoScroll();
			g_env.eventMgr.notify('onListItemUpdated');
		}

		m_cont.back = function() 
		{

		}

		m_cont.addNode = function(p_desc) 
		{
			m_nodesCont.add(p_desc.container);
			
			$(m_nodesCont).width($(m_nodesCont).width() + $(p_desc.container).width());

			var h = $(m_header).outerHeight(true);
			
			var updateLayout = function() {
				$(p_desc.container).css({
					width: p_args.css.width,
					height: p_args.css.height - $(m_header).outerHeight(true),
					overflow: 'hidden'
				});
				
				p_desc.container.updateLayout();
			}
			
			if(h < 10) { //the element is not the part of the DOM
				g_env.eventMgr.subscribe(['onZeppelinBuilt', 'onListItemUpdated'], function() {
					updateLayout();
				});
			}

			updateLayout();
			
			p_desc.quickSearchValue = '';
			p_desc.container.setQuickSearchValue = function(p_val)
			{
				p_desc.quickSearchValue = p_val;
				m_quickSearch.setValue(p_val);
			}

			m_nodes[p_desc.id] = p_desc;
		}
		
		return m_cont.add(m_header, m_nodesCont);
	}
}

function queueWidget(p_args)
{
	var m_args = def(p_args, {});
	m_args.rpc_menu = [
		{title: 'clear', cmd: 'player_queue_remove_all', callback: function() { g_env.data.request('player_queue_get'); }},
	];	
	var m_cont = MusicTree.container(m_args).addClass('queue panel');

	var m_renderers = {	
		playlist: function(p_data)
		{
			return div();
		},	
		album: function(p_data) 
		{
			var item = MusicTree.item({
				id: p_data.id,
				name: p_data.name,
				desc: p_data.files.length + " songs",
				image: '/pic/default_album.png',
				menu: [{title: 'Remove', href: {cmd: 'player_queue_remove', params: {index: p_data.index}}}]
			}).addClass('album');
			
			item.onclick = function() {
				var aid = 'album_'+p_data.id;
			
				if(!m_cont.hasNode(aid)) {
					var list = MusicTree.listItem({list: p_data.files}, m_renderers.file, 'name');
					m_cont.addNode({title: p_data.name, id: aid, container: list});
				}
				m_cont.switchNextNode(aid);
			}
			
			return item;
		},	
		file: function(p_data)
		{
			var item = MusicTree.item({
				id: p_data.id,
				name: p_data.title,
				desc: formatTime(p_data.length),
				image: '/pic/default_song.png',
				label: g_descriptors.codecs[p_data.codec].title,
				menu: [{title: 'Remove', href: {cmd: 'player_queue_remove', params: {index: p_data.index}}}]
			}).addClass('file');
			
			item.onclick = function() {
				g_env.rpc.request.send('player_goto', {index: p_data.index});
			}
			return item;
		}
	}

	var m_types = {
		0: {
			name: 'playlist',
			sub: '',
		},
		1: {
			name: 'album',
			sub: 'files'
		},
		2: {
			name: 'file'
		}
	};

	var m_lastfid = 0;
	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(p_data.current == m_lastfid)
			return;
		m_lastfid = p_data.current;
		// öööö
	});
	
	var cache = function(p_data, p_index) {
		var idx = 0;
		foreach(p_data, function(item) {
			item.index = clone(p_index);
			item.index.push(idx++);
			var type = m_types[item.type];
			g_env.storage.queue[type.name][item.id] = item;
			if(type.sub)
				cache(item[type.sub], item.index);
		});
	}

	g_env.data.mgr.subscribe('player_queue_get', function(p_data) {
		m_cont.reset();

		cache(p_data, []);	
		
		var list = MusicTree.listItem({list: p_data}, function(item) {
			return m_renderers[m_types[item.type].name](item);
		}, 'name').addClass('playlist');
		
		m_cont.addNode({title: 'Queue', id: -1, container: list});
		m_cont.switchNextNode(-1);

		g_env.eventMgr.notify('onListItemUpdated');
	});
	
	return m_cont;
}

function libraryWidget(p_args)
{
	var m_args = def(p_args, {});
	
	m_args.rpc_menu = [
		{title: 'Scan', cmd: 'library_scan'},
		{title: 'Refresh', cmd: 'library_get_artists'}
	];
	m_args.quick_search = true;
	var m_cont = MusicTree.container(m_args).addClass('library panel');
	
	var m_renderers = {	
		artist: function(p_data)
		{
			g_env.storage.library.artist[p_data.id] = p_data;
			var item = MusicTree.item({
				id: p_data.id,
				name: p_data.id == -1 ? 'unknown' : p_data.name,
				desc: p_data.albums + ' albums',
				image: '/pic/default_artist.png'
			}).addClass('artist');

			item.onclick = function() {
				var aid = 'artist_'+p_data.id;

				if(m_cont.hasNode(aid)) 
					m_cont.switchNextNode(aid);
				else{
					g_env.rpc.request.send('library_get_albums_by_artist', {artist_id: p_data.id}, function(data) {
						var list = MusicTree.listItem({list: data}, m_renderers.album, 'name', ['name', 'songs']);
						m_cont.addNode({title: p_data.name, id: aid, container: list});
						m_cont.switchNextNode(aid);
					});
				}
			}

			return item;
		},	
		album: function(p_data) 
		{
			g_env.storage.library.album[p_data.id] = p_data;
			var item = MusicTree.item({
				id: p_data.id,
				name: p_data.name,
				desc: p_data.songs + ' songs',
				image: '/pic/default_album.png',
				menu: [{title: 'Add to queue', href: {cmd: 'player_queue_album', params: {id: p_data.id}}}]
			}).addClass('album');
			
			item.onclick = function() {
				var aid = 'album_'+p_data.id;
			
				if(m_cont.hasNode(aid)) 
					m_cont.switchNextNode(aid);
				else{
					g_env.rpc.request.send('library_get_files_of_album', {album_id: p_data.id}, function(data) {
						var list = MusicTree.listItem({list: data}, m_renderers.file, 'name', ['track_index', 'name']);
						m_cont.addNode({title: p_data.name, id: aid, container: list});
						m_cont.switchNextNode(aid);
					});
				}
			}

			return item;
		},	
		file: function(p_data)
		{
			g_env.storage.library.file[p_data.id] = p_data;
			var item = MusicTree.item({
				id: p_data.id,
				name: p_data.title,
				desc: formatTime(p_data.length),
				image: '/pic/default_song.png',
				label: g_descriptors.codecs[p_data.codec].title,
				menu: [
					{title: 'Add to queue', href: {cmd: 'player_queue_file', params: {id: p_data.id}}},
					{title: 'Edit metadata', callback: function() { MetaDataEditor(p_data.id); }}
				]
			}).addClass('file');
			return item;
		}
	}
	
	g_env.data.request('library_get_artists');
	
	g_env.data.mgr.subscribe('library_get_artists', function(p_data) {
		m_cont.reset();
		var list = MusicTree.listItem({list: p_data}, m_renderers.artist, 'name', ['name', 'albums']);
		m_cont.addNode({title: 'Artists', id: -1, container: list});
		m_cont.switchNextNode(-1);
		g_env.eventMgr.notify('onListItemUpdated');
	});

	g_env.eventMgr.subscribe('send_library_get_artists', function() {
		m_cont.reset();
	});
	
	return m_cont;
}

