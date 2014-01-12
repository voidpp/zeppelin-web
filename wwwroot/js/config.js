function parseConfig(p_data)
{
	Map.init(p_data, {
		rpc: {
			host: window.location.hostname
		},
		music_lists: {
			letter_tags_display_limit: 50,
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

	p_data.rpc.url = parseURL(p_data.rpc);

	return p_data;
}