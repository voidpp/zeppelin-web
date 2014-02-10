var Config = {
	eventMgr: new EventManager(),
	descriptor: {
		server: {
			title: 'Server',
			children: {
				address: {
					title: 'Address',
					default: window.location.hostname,
				},
				controller_port: {
					title: 'Controller port',
					default: window.location.port,
				},
				controller_path: {
					title: 'Controller path',
					default: '/jsonrpc',
				},
			}
		},
		music_lists: {
			title: 'Music lists',
			children: {
				letter_grouping: {
					title: 'Grouping',
					help: 'Group library lists by the starting letter.',
					details: 'Letter grouping will be turned on after having at least the configured amount of items. Leave the fields empty if you do not want to enable this feature.',
					children: {
						artists: {
							title: 'Artists',
							format: 'number',
							default: 42,
						},
						albums: {
							title: 'Albums',
							format: 'number',
							default: 42,
						},
						songs: {
							title: 'Songs',
							format: 'number',
							default: '',
						},
						directories: {
							title: 'Directories',
							format: 'number',
							default: 42,
						},
					}
				},
				queue: {
					title: 'Queue',
					children: {
						auto_jump: {
							title: 'Auto jumping',
							help: 'The highlight jumps automatically to the currently played item',
							default: false,
						},
						auto_scroll: {
							title: 'Auto scrolling',
							help: 'The highlight scrolls automatically to the currently played item',
							default: false,
						},
					}
				},
			}
		}
	},
	fillDefaults: function(p_conf, p_desc)
	{
		foreach(p_desc, function(val, key){
			if(val.hasOwnProperty('children')) {
				if(!p_conf.hasOwnProperty(key))
					p_conf[key] = {};
				Config.fillDefaults(p_conf[key], val.children);
			} else {
				if(!val.hasOwnProperty('default'))
					throw 'Not found default value in descriptor for '+key;

				if(!p_conf.hasOwnProperty(key))
					p_conf[key] = val.default;
			}
		});
	},
	load: function()
	{
		var conf = {};

		try {
			if(localStorage.hasOwnProperty('config')) {
				conf = JSON.parse(localStorage.config);
				Map.numberize(conf);
			}
		} catch (e) {
			console.error(e);
		}

		//default values
		this.fillDefaults(conf, this.descriptor);

		return conf;
	},
	save: function(p_conf)
	{
		localStorage.config = JSON.stringify(p_conf);
	},
}

function configPanel(p_confDesc, p_config)
{
	var m_cont = TreeViewer.container({}).addClass('config_panel');
	var m_confDesc = clone(p_confDesc);

	var m_fieldRenderers = {
		string: function(p_data) {
			var inp = input({type: 'text'});
			var cont = div(div({class: 'title'},p_data.title), inp);
			if(p_data.help)
				cont.add(div({class: 'help'}, p_data.help))
			Object.defineProperty(cont, 'value', {
				get: function(){ return inp.value; },
				set: function(val){ inp.value = val; }
			});
			return cont;
		},
		number: function(p_data) {
			var cont = div(div({class: 'label'}, div({class: 'title'},p_data.title), p_data.help ? div({class:'help'}, p_data.help) : null));
			var inp = input({type: 'text'});
			Object.defineProperty(cont, 'value', {
				get: function(){ return inp.value; },
				set: function(val){ inp.value = val; }
			});
			return cont.add(label(inp, {class: 'input'}));
		},
		boolean: function(p_data) {
			var cont = div(div({class: 'label'}, div({class: 'title'},p_data.title), p_data.help ? div({class:'help'}, p_data.help) : null));
			var inp = input({type: 'checkbox', class: 'cb-switch'});
			var sw = div({class: 'switch'});
			Object.defineProperty(cont, 'value', {
				get: function(){ return inp.checked; },
				set: function(val){ inp.checked = val; }
			});
			return cont.add(label(inp, sw, {class: 'input'}));
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
			var format = p_data.format ? p_data.format : (typeof p_data.default);
			var leafRenderer = m_fieldRenderers[format];
			var cont = leafRenderer(p_data);
			cont.value = p_data.value;
			p_data.container = cont;
			return cont.addClass('leaf item');
		},
		node: function(p_data) {
			var cont = div({class: 'node item'}, div({class:'title'}, p_data.title));
			if(p_data.help)
				cont.add(div({class: 'help'}, p_data.help));
			TreeViewer.directOpenableHandler(cont, {
				parent: m_cont,
				id: randomString(5),
				name: p_data.title,
				type: p_data.type,
				items: p_data.children,
			}, {}, function(p_panel) {
				if(p_data.details)
					p_panel.pre(div({class: 'details'}, p_data.details));
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
				if(val.container)
					p_conf[key] = val.container.value;
			}
		});
	}

	m_cont.saveConfig = function(p_conf)
	{
		saveToConfig(m_confDesc, p_conf);
	}

	return m_cont;
}
