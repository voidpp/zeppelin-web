var Config = {
	eventMgr: new EventManager(),
	descriptor: {
		rpc: {
			title: 'RPC',
			children: {
				host: {
					title: 'Host',
					default: window.location.hostname,
				},
				port: {
					title: 'Port',
					default: parseInt(window.location.port),
				},
				path: {
					title: 'Path',
					default: '/jsonrpc',
				},
				/*
				protocol: {
					title: 'Protocol',
					default: window.location.protocol,
				},
				*/
			}
		},
		music_lists: {
			title: 'Music lists',
			children: {
				letter_grouping: {
					title: 'Letter grouping',
					help: 'If the size of the list is over this value the list is groupped by the first letter of the items. -1 means disable the grouping',
					children: {
						artists: {
							title: 'Artists',
							default: 42,
						},
						albums: {
							title: 'Albums',
							default: 42,
						},
						songs: {
							title: 'Songs',
							default: -1,
						},
						directories: {
							title: 'Directories',
							default: 42,
						},
					}
				},
				queue: {
					title: 'Queue',
					children: {
						auto_jump: {
							title: 'Auto jumping',
							help: 'The highlight jumps automatic to the currently played item',
							default: true,
						},
						auto_scroll: {
							title: 'Auto scrolling',
							help: 'The highlight scrolls automatic to the currently played item',
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

		console.log(conf);

		//default values
		this.fillDefaults(conf, this.descriptor);

		var parseURL = function(p_parts)
		{
			var res = '';
			res += Map.def(p_parts, 'protocol', 'http') + '://';

			res += p_parts.host;

			if(p_parts.port)
				res += ':' + p_parts.port;

			res += Map.def(p_parts, 'path', '/');

			return res;
		}

		conf.rpc.url = parseURL(conf.rpc);

		return conf;
	},
	save: function(p_conf)
	{
		localStorage.config = JSON.stringify(p_conf);
	},
}
