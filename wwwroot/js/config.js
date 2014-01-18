function parseConfig()
{
	if(typeof g_config == 'undefined')
		throw 'Config is missing or broken.<br>To create please copy the config.example.json to config.json and study it.';

	Map.init(g_config, {
		rpc: {
			host: window.location.hostname
		},
		music_lists: {
			letter_grouping: {
				artists: 42,
				albums: 42,
				songs: false,
				directories: 42,
			},
			queue: {
				auto_jump: false,
			},
			auto_scroll: false,
		},
	});

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

	g_config.rpc.url = parseURL(g_config.rpc);
}