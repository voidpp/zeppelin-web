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
							default: true,
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
