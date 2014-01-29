
registerHTML('panel', 'text', function() { var p = create_html('div', arguments, 'text'); p.addClass('panel'); return p; });

function widget(p_args)
{
	var m_cont = div({class: 'widget'});

	return m_cont;
}

function configPanel(p_confDesc, p_config)
{
	var m_cont = TreeViewer.container({}).addClass('config_panel');
	var m_confDesc = clone(p_confDesc);

	var m_fieldMaps = {
		string: {
			type: 'text',
		},
		number: {
			type: 'number',
		},
		boolean: {
			type: 'checkbox',
			encode: function(val) {
				return val ? 1 : 0;
			},
		},
	};

	var formatConfig = function(p_desc, p_conf)
	{
		foreach(p_desc, function(val, key) {
			if(val.hasOwnProperty('children')) {
				val.type = 'node';
				formatConfig(val.children, p_conf[key]);
			} else {
				val.type = 'leaf';
				val.value = p_conf[key];
			}
		});
	};

	formatConfig(m_confDesc, p_config);

	m_cont.renderers = {
		leaf: function(p_data) {
			var cont = div({class: 'leaf'});
			var desc = m_fieldMaps[typeof p_data.default];
			var inp = sField({type: desc.type, value: desc.encode ? desc.encode(p_data.value) : p_data.value});
			p_data.field = inp;
			return cont.add(p_data.title, br(), inp);
		},
		node: function(p_data) {
			var cont = div({class: 'node'}, p_data.title);

			TreeViewer.directOpenableHandler(cont, {
				parent: m_cont,
				id: randomString(5),
				name: p_data.title,
				type: p_data.type,
				items: p_data.children,
			});

			return cont;
		}
	}

	var list = TreeViewer.listItem({list: m_confDesc, parent: m_cont}, m_cont.renderers);

	m_cont.addNode({title: 'Config', id: -1, container: list}); //root
	m_cont.switchNextNode(-1);

	var saveToConfig = function(p_desc, p_conf)
	{
		foreach(p_desc, function(val, key) {
			if(val.hasOwnProperty('children')) {
				saveToConfig(val.children, p_conf[key]);
			} else {
				if(val.field)
					p_conf[key] = val.field.value;
			}
		});
	}

	m_cont.saveConfig = function(p_conf)
	{
		saveToConfig(m_confDesc, p_conf);
	}

	return m_cont;
}

function configIconWidget(p_args)
{
	var m_cont = widget(p_args).addClass('config');

	var m_button = clImageButton({img: '/pic/settings-256.png', onclick: function(){

		var panel = configPanel(Config.descriptor, g_config).css(p_args.panelCss);

		var dlg = new clDialog({
			caption: 'Configuration',
			content: panel,
			minwidth: 300,
			icon: clDialogGlobalIcon,
			buttons: {
				ok: {
					label: 'OK',
					keyCodes: [13]
				},
				cancel: {
					label: 'Cancel',
					keyCodes: [27]
				}
			},
			callback: function(code) {
				if(code == 'ok') {
					panel.saveConfig(g_config);
					Config.save(g_config);
					window.location.reload();
				}
			}
		});
		dlg.build();

		panel.eventMgr.notify('onDomReady');
		panel.eventMgr.notify('onListItemUpdated');

	}}).hide();

	g_env.eventMgr.subscribe('onZeppelinBuilt', function() {
		m_button.css({maxHeight: $(m_cont).height()}).show();
	});

	m_cont.add(m_button);
	return m_cont;
}

function statisticsWidget(p_args)
{
	var m_cont = widget(p_args).addClass('statistics');
	var m_table = table();
	m_cont.add(m_table);
	var m_dynData = {
		values: {},
		addSectionLabel: function(p_title) {
			m_table.add(tr(td({colspan: 2, class:'section'}, p_title)));
			return this;
		},
		addValue: function(p_title, p_name, p_initVal, p_formatter) {
			var val = td({class: 'value'}, def(p_initVal, ''));
			this.values[p_name] = {cont: val, formatter: def(p_formatter, null)};
			m_table.add(tr(td({class: 'title'}, p_title),val));
			return this;
		},
		setValue: function(p_name, p_val) {
			var desc = this.values[p_name];
			desc.cont.set(desc.formatter ? desc.formatter(p_val) : p_val);
			return this;
		},
		setMap: function(p_map) {
			for(var name in p_map) {
				this.setValue(name, p_map[name]);
			}
			return this;
		}
	}

	m_dynData.addSectionLabel('Library')
		.addValue('Number of artists', 'num_of_artists', 0)
		.addValue('Number of albums', 'num_of_albums', 0)
		.addValue('Number of songs', 'num_of_files', 0)
		.addValue('Sum of song length', 'sum_of_song_lengths', 0, formatTime)
		.addValue('Sum of file sizes', 'sum_of_file_sizes', 0, bytesToSize)

	g_env.rpc.request.send('library_get_statistics', {}, function(res){
		m_dynData.setMap(res);
	});

	return m_cont;
}

function currentSongInfoWidget(p_args)
{
	var m_cont = widget(p_args).addClass('current_song_info');

	var m_sampleRate = td();
	var m_compRate = td();
	var m_codec = td();

	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(!Map.checkTree(g_env.storage, ['queue','file', p_data.current])) {
			m_sampleRate.clear();
			m_compRate.clear();
			m_codec.clear();
			return;
		}

		var file = g_env.storage.queue.file[p_data.current];
		m_sampleRate.set(parseInt(file.sampling_rate/1000));
		m_compRate.set('na');
		m_codec.set(g_env.getCodec(file.codec).title);
	});

	return m_cont.add(table({cellpadding: 0, cellspacing: 0},
		tr(m_codec, td('codec')),
		tr(m_compRate, td('kbps')),
		tr(m_sampleRate , td('khz'))
	));
}

function customCSSDrawer(p_args)
{
	var m_cont = canvas();
	var m_shadow = 0;

	m_cont.setLayout = function(p_width, p_height, p_shadow)
	{
		m_cont.css({width: p_width + 2*p_shadow, height: p_height + 2*p_shadow, margin: -p_shadow});
		m_shadow = p_shadow;
	}

	m_cont.getShadowData = function()
	{
		if(m_shadow == 0)
			return false;
		var blur = $(this).css('text-shadow');
		if(blur == 'none')
			return false;
		var blurProps = blur.split(' '); //ECMA is a bitch...

		return {
			blur: m_shadow,
			color: blurProps.slice(0,blurProps.length-3).join(' '),
		};
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
		var shadowData = this.getShadowData();
		if(shadowData !== false)
			return this;
		p_ctx.shadowColor = shadowData.color;
		p_ctx.shadowBlur = shadowData.blur;
		return this;
	}

	m_cont.getRect = function()
	{
		var s = this.getSize();
		var padding = m_shadow;
		return {x: padding, y: padding, w: s.w-padding*2, h: s.h-padding*2};
	}

	m_cont.draw = function()
	{
		p_args.renderer(this.initDrawer(), this.getRect());
	}

	return m_cont;
}

function indicator(p_args)
{
	var m_cont = customCSSDrawer(p_args).addClass('indicator');

	return m_cont;
}

function playerStatusWidget(p_args)
{
	var m_cont = widget(p_args).addClass('player_status');
	var m_state = 0;
	var m_play = indicator({renderer: Graphics.drawers.music.play});
	var m_pause = indicator({renderer: Graphics.drawers.music.pause});
	var m_stop = indicator({renderer: Graphics.drawers.music.stop}).addClass('active');
	var m_states = [m_stop, m_play, m_pause];

	g_env.eventMgr.subscribe('onZeppelinBuilt', function() {
		var size = $(m_cont).width();
		m_cont.css({lineHeight: (size*1.2)+'px'});
		foreach(m_states, function(state) {
			state.setLayout(size, size, size*0.2);
			state.draw();
		});
	});

	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(m_state == p_data.state)
			return;

		m_states[m_state].removeClass('active');
		m_states[p_data.state].addClass('active');

		m_states[m_state].draw();
		m_states[p_data.state].draw();

		m_state = p_data.state;
	});

	return m_cont.add(m_play, m_pause, m_stop);
}

function currentPositionNumWidget(p_args)
{
	var m_cont = widget(p_args).addClass('current_num');
	var m_disp = div({class: 'display'});
	var m_back = div({class: 'background'}, '88:88:88');

	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(!Map.checkTree(g_env.storage, ['queue','file', p_data.current])) {
			m_disp.clear();
			return;
		}

		m_disp.set(formatTime(p_data.position));
	});

	g_env.eventMgr.subscribe('onZeppelinBuilt', function() {
		m_cont.css({fontSize: $(m_cont).height()});
	});

	return m_cont.add(m_back, m_disp);
}

function currentSongWidget(p_args)
{
	var m_cont = widget(p_args).addClass('current_song');
	var m_text = div({class: 'display'});
	var m_back = div({class: 'background'}).html(Array(100).join('&#x2589;'));

	var m_fid = 0;

	g_env.data.mgr.subscribe('player_status', function(p_data) {
		if(!Map.checkTree(g_env.storage, ['queue','file', p_data.current])){
			m_text.clear();
			m_fid = 0;
			return;
		}

		if(m_fid == p_data.current)
			return;

		m_fid = p_data.current;

		var file = g_env.storage.queue.file[p_data.current];

		m_text.set((file.title || file.name) + ' (' + formatTime(file.length) + ')');

		$(m_text).autoScroll({
			duration: 5000,
			wait: 500
		});
	});

	g_env.eventMgr.subscribe('onZeppelinBuilt', function() {
		var size = parseInt($(m_cont).height());
		m_cont.css({fontSize: size});
		//need to disable the previously configured height, because different browsers and operating systems rendering the fonts in different way, so the text may truncated or sg weird shit...
		$(m_cont).height('auto');
	});

	return m_cont.add(m_back, m_text);
}

function currentPositionBarWidget(p_args)
{
	var m_cont = widget(p_args).addClass('current_position').p('title', '00:00');
	var m_slider = div({class: 'slider'});
	var m_max = 1000;
	var m_file = {};
	var m_isDragging = false;

	var getRef = function(p_x)
	{
		return (p_x - $(m_cont).offset().left) / $(m_cont).innerWidth();
	}

	m_slider.disabled = function()
	{
		return $(m_slider).slider("option", "disabled");
	}

	$(m_slider).slider({
		orientation: "horizontal",
		range: "min",
		min: 0,
		max: m_max,
		value: 0,
		start: function(event, ui) {
			m_isDragging = true;
		},
		stop: function(event, ui) {
			g_env.rpc.request.send('player_seek', {seconds: Math.floor((ui.value/m_max) * m_file.length)}, function() {
				m_isDragging = false;
			});
		}
	});

	$(m_cont).click(function(ev) {
		if(m_slider.disabled())
			return;
		m_isDragging = true;
		var ref = getRef(ev.clientX);
		$(m_slider).slider('value', ref * m_max);
		g_env.rpc.request.send('player_seek', {seconds: Math.floor(ref * m_file.length)}, function() {
			m_isDragging = false;
		});
	}).tipsy({
		gravity: 's',
		delayOut: 1000,
		delayIn: 100,
		fade: true,
	}).mousemove(function(ev){
		if(m_slider.disabled())
			return;
		//update directly the tipsy inner container text
		$('.tipsy-inner').html(formatTime(Math.floor(getRef(ev.clientX) * m_file.length)));
		//update directly the pos of the tipsy outer cont
		$('.tipsy').css({left: ev.clientX - $('.tipsy').outerWidth()/2});
	});

	g_env.data.mgr.subscribe('player_status', function(p_data) {
		$(m_slider).slider(p_data.state ? "enable" : "disable");
		$(m_cont).tipsy(p_data.state ? "enable" : "disable");
		if(!Map.checkTree(g_env.storage, ['queue','file', p_data.current])) {
			$(m_slider).slider('value', 0);
			return;
		}

		m_file = g_env.storage.queue.file[p_data.current];
		if(!m_isDragging)
			$(m_slider).slider('value', (p_data.position / m_file.length) * m_max);
	});

	return m_cont.add(m_slider);
}

function controlButton(p_type)
{
	var m_cont = div({class: 'button'});

	var m_sizes = {
		 32: [0,32],
		 64: [32,64],
		128: [64,128],
		256: [128,256],
	}

	var m_layers = [
		img({class: 'base'}),
		img({class: 'down'}),
		img({class: 'icon'}),
		img({class: 'frame'}),
		img({class: 'highlight'})
	];

	m_cont.setSize = function(p_size) {
		var size = searchInRange(p_size, m_sizes);
		m_layers[0].add({src:'/pic/circ-buttons/' + size + '/common-base-up.png'}).css({maxHeight: p_size});
		m_layers[1].add({src:'/pic/circ-buttons/' + size + '/common-base-down.png'}).css({maxHeight: p_size});
		m_layers[2].add({src:'/pic/circ-buttons/' + size + '/' + p_type + '.png'}).css({maxHeight: p_size});
		m_layers[3].add({src:'/pic/circ-buttons/' + size + '/common-base-frame.png'}).css({maxHeight: p_size});
		m_layers[4].add({src:'/pic/circ-buttons/' + size + '/common-hl.png'}).css({maxHeight: p_size});
	}

	m_cont.add(m_layers);

	m_cont.onclick = function() {
		g_env.rpc.request.send('player_'+p_type);
	}

	return m_cont;
}

function controlWidget()
{
	var m_cont = widget().addClass('control');
	var m_play = controlButton('play');
	var m_pause = controlButton('pause').hide();
	var m_state = -1;

	m_cont.add(
		controlButton('prev'),
		m_play,
		m_pause,
		controlButton('stop'),
		controlButton('next')
	);

	g_env.eventMgr.subscribe('onZeppelinBuilt', function() {
		var h = $(m_cont).height();

		foreach(m_cont.childNodes, function(b) {
			if(!isElement(b))
				return; //f... chrome...
			b.css({maxHeight: h});
			b.setSize(h);
		});
	});

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
		2: [50,100]
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

	$(m_icon[0]).load(function() {
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
	types: {
		playlist: {
			cache_key: '',
		},
		album: {
			cache_key: 'files',
			getGrouping: function() { return {limit: g_config.music_lists.letter_grouping.songs, name: 'title'} }
		},
		file: {
		},
		dir: {
			cache_key: 'files',
			getGrouping: function() { return {limit: g_config.music_lists.letter_grouping.songs, name: 'title'} }
		}
	},
}

function queueWidget(p_args)
{
	var m_args = def(p_args, {});
	m_args.menubar = [
		{title: 'clear', cmd: 'player_queue_remove_all'},
	];
	var m_cont = TreeViewer.container(m_args).addClass('queue');
	var m_currentIndex = [];

	m_cont.renderers = {
		playlist: function(p_data)
		{
			return div();
		},
		album: function(p_data)
		{
			var item = TreeViewer.directOpenableItem({
				parent: m_cont,
				id: p_data.id,
				name: p_data.name,
				type: p_data.type,
				desc: p_data.files.length + " songs",
				items: p_data.files,
				image: '/pic/default_album.png',
				menu: [{title: 'Remove', href: {cmd: 'player_queue_remove', params: {index: p_data.index}}}]
			}, MusicTree.types[p_data.type]).addClass('album');

			return item;
		},
		file: function(p_data)
		{
			var item = TreeViewer.item({
				parent: m_cont,
				id: p_data.id,
				name: p_data.title || p_data.name,
				desc: formatTime(p_data.length),
				image: '/pic/default_song.png',
				label: g_env.getCodec(p_data.codec).title,
				menu: [
					{title: 'Remove', href: {cmd: 'player_queue_remove', params: {index: p_data.index}}},
					{title: 'Edit metadata', callback: function() { MetaDataEditor(p_data.id); }},
				]
			}).addClass('file');

			item.onclick = function() {
				g_env.rpc.request.send('player_goto', {index: p_data.index});
			}
			return item;
		},
		dir: function(p_data)
		{
			var item = TreeViewer.directOpenableItem({
				parent: m_cont,
				id: p_data.id,
				name: p_data.name,
				type: p_data.type,
				desc: p_data.files.length + " songs",
				items: p_data.files,
				image: '/pic/default_folder.png',
				menu: [{title: 'Remove', href: {cmd: 'player_queue_remove', params: {index: p_data.index}}}]
			}, MusicTree.types[p_data.type]).addClass('dir');

			return item;
		},
	}

	var calcNodePathForIndex = function(p_index)
	{
		if(!p_index.length)
			return [];

		var nodeIdList = [-1]; //root node
		foreach(p_index, function(index) {
			var node = m_cont.getNode(nodeIdList.last());
			if(node === false)
				return false;
			var item = node.container.getItem(index);
			if(item === false)
				return false;

			if(!item.container.generateList)
				return false;

			nodeIdList.push(item.container.generateList());
		});

		return nodeIdList;
	}

	var jumpToNode = function()
	{
		var nodeIdList = calcNodePathForIndex(m_currentIndex);

		if(!nodeIdList.length)
			return;

		//curr path
		var pathOfNodes = m_cont.getPathOfNodes();

		if(pathOfNodes === false)
			return;

		try {
			foreach(nodeIdList, function(nodeId, i) {
				if(nodeIdList.length-1 == i && nodeIdList.length < pathOfNodes.length) { //last && the new list is smaller than the current
					throw {prev: nodeId};
				}

				if(pathOfNodes.length <= i)
					throw {next: nodeIdList.last()};

				if(pathOfNodes[i] != nodeId)
					throw {next: nodeIdList.last(), prev: pathOfNodes[i-1]};
			});
		} catch (nodeIdObj) {

			if(nodeIdObj.prev)
				m_cont.switchPrevNode(nodeIdObj.prev);

			if(nodeIdObj.next)
				m_cont.switchNextNode(nodeIdObj.next);
		}

		var node = m_cont.getNode(nodeIdList.last());
		if(node === false)
			return;
		node.container.highlightItem(m_currentIndex.last());
	}

	var highlightCurrentItem = function()
	{
		var newNodePath = calcNodePathForIndex(m_currentIndex);

		if(!newNodePath.length)
			return;

		var currNodePath = m_cont.getPathOfNodes();

		if(currNodePath === false)
			return;

		foreach(currNodePath, function(nodeId) {
			var node = m_cont.getNode(nodeId);
			if(node !== false)
				node.container.resetHighlight();
		});

		foreach(newNodePath, function(nodeId, i) {
			var node = m_cont.getNode(nodeId);
			if(node === false)
				return;

			node.container.highlightItem(m_currentIndex[i]);
		});
	}

	var cache = function(p_data, p_index) {
		var idx = 0;
		foreach(p_data, function(item) {
			item.index = clone(p_index);
			item.index.push(idx++);
			var type = MusicTree.types[item.type];
			g_env.storage.queue[item.type][item.id] = item;
			if(type.cache_key)
				cache(item[type.cache_key], item.index);
		});
	}

	g_env.data.mgr.subscribe('player_queue_remove_all', function() {
		g_env.data.request('player_queue_get');
	});

	g_env.data.mgr.subscribe('player_queue_get', function(p_data) {
		m_cont.reset();

		cache(p_data, []);

		var list = TreeViewer.listItem({list: p_data, parent: m_cont}, function(item) {
			return m_cont.renderers[item.type](item);
		}).addClass('playlist');

		m_cont.addNode({title: 'Queue', id: -1, container: list}); //root
		m_cont.switchNextNode(-1);

		m_cont.eventMgr.notify('onListItemUpdated');
	});

	g_env.data.mgr.subscribe(['player_status', 'player_queue_get'], function(p_data) {
		if(p_data.index) {
			if(equal(p_data.index, m_currentIndex))
				return;
			m_currentIndex = p_data.index;
		}

		if(g_config.music_lists.queue.auto_jump)
			jumpToNode();

		highlightCurrentItem();
	});

	return m_cont;
}

function libraryWidget(p_args)
{
	var m_args = def(p_args, {});

	m_args.menubar = [
		{title: 'Scan', cmd: 'library_scan'},
		{title: 'Refresh', cmd: p_args.desc.cmd}
	];
	m_args.quick_search = true;
	var m_cont = TreeViewer.container(m_args).addClass('library');

	var m_renderers = {
		artist: function(p_data)
		{
			var item = TreeViewer.item({
				parent: m_cont,
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
						var list = TreeViewer.listItem({list: data, parent: m_cont}, m_renderers.album, {limit: g_config.music_lists.letter_grouping.albums, name: 'name'}, ['name', 'songs']);
						m_cont.addNode({title: p_data.name, id: aid, container: list});
						m_cont.switchNextNode(aid);
					});
				}
			}

			return item;
		},
		album: function(p_data)
		{
			var item = TreeViewer.item({
				parent: m_cont,
				id: p_data.id,
				name: p_data.name || 'unknown',
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
						var list = TreeViewer.listItem({list: data, parent: m_cont}, m_renderers.file, {limit: g_config.music_lists.letter_grouping.songs, name: 'title'}, ['track_index', 'title', 'name']);
						m_cont.addNode({title: p_data.name, id: aid, container: list});
						m_cont.switchNextNode(aid);
					});
				}
			}

			return item;
		},
		file: function(p_data)
		{
			var item = TreeViewer.item({
				parent: m_cont,
				id: p_data.id,
				name: p_data.title || p_data.name,
				desc: formatTime(p_data.length),
				image: '/pic/default_song.png',
				label: g_env.getCodec(p_data.codec).title,
				menu: [
					{title: 'Add to queue', href: {cmd: 'player_queue_file', params: {id: p_data.id}}},
					{title: 'Edit metadata', callback: function() { MetaDataEditor(p_data.id); }}
				]
			}).addClass('file');
			return item;
		}
	}

	g_env.data.request(p_args.desc.cmd);

	g_env.data.mgr.subscribe(p_args.desc.cmd, function(p_data) {
		m_cont.reset();
		var list = TreeViewer.listItem({list: p_data, parent: m_cont}, m_renderers[p_args.desc.root_renderer], p_args.desc.lists.grouping, p_args.desc.lists.sorting);
		m_cont.addNode({title: p_args.desc.title, id: -1, container: list});
		m_cont.switchNextNode(-1);
		m_cont.eventMgr.notify('onListItemUpdated');
	});

	m_cont.eventMgr.subscribe('send_'+p_args.desc.cmd, function() {
		m_cont.reset();
	});

	return m_cont;
}

function directoryBrowserWidget(p_args)
{
	var m_args = def(p_args, {});
	m_args.quick_search = true;
	m_args.menubar = [
		{title: 'Scan', cmd: 'library_scan'},
		{title: 'Refresh', callback: function() { m_cont.reset(); loadDir(-1, 'Folders'); }}
	];
	var m_cont = TreeViewer.container(m_args).addClass('directory');

	var m_renderers = {
		dir: function(p_data) {
			var item = TreeViewer.item({
				parent: m_cont,
				id: p_data.id,
				name: p_data.name,
				image: '/pic/default_folder.png',
				menu: [
					{title: 'Add to queue', href: {cmd: 'player_queue_directory', params: {directory_id: p_data.id}}},
				]
			}).addClass('dir_item');
			item.onclick = function() {
				loadDir(p_data.id, p_data.name);
			};
			return item;
		},
		file: function(p_data) {
			var item = TreeViewer.item({
				parent: m_cont,
				id: p_data.id,
				name: p_data.name,
				image: '/pic/default_song.png',
				label: p_data.codec ? g_env.getCodec(p_data.codec).title : '',
				menu: [
					{title: 'Add to queue', href: {cmd: 'player_queue_file', params: {id: p_data.id}}},
					{title: 'Edit metadata', callback: function() { MetaDataEditor(p_data.id); }},
				]
			}).addClass('dir_item');
			return item;
		}
	};

	var loadDir = function(p_dirId, p_name)
	{
		g_env.rpc.request.send('library_list_directory', {directory_id: p_dirId}, function(p_data) {
			var list = TreeViewer.listItem({list: p_data, parent: m_cont}, function(item) {
				return m_renderers[item.type](item);
			}, {limit: g_config.music_lists.letter_grouping.directories, name: 'name'}, ['type','name']);
			m_cont.addNode({title: p_name, id: p_dirId, container: list});
			m_cont.switchNextNode(p_dirId);
		});
	}

	loadDir(-1, 'Folders');

	return m_cont;
}
