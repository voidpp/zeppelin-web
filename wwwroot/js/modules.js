function EventManager()
{
	var m_self = this;
	var m_subscribers = {};

	this.subscribe = function(p_name, p_callback, p_obj)
	{
		var names = p_name instanceof Array ? p_name : [p_name];

		foreach(names, function(name) {
			Map.init_arr(m_subscribers, [name], []);
			m_subscribers[name].push({func: p_callback, object: def(p_obj, null)});
		});
	}

	this.notify = function(p_name, p_data)
	{
		if(!m_subscribers.hasOwnProperty(p_name))
			return;

		foreach(m_subscribers[p_name], function(callback) {
			callback.func.call(callback.object, p_data, p_name);
		});
	}
}

function DataBinder()
{
	var m_self = this;
	var m_contents = {};

	this.add = function(p_element, p_name, p_renderer)
	{
		m_contents[p_name] = {
			container: p_element,
			renderer: def(p_renderer, p_element.set),
		};

		return p_element;
	}

	this.set = function(p_values)
	{
		foreach(p_values, function(value, name) {
			if(!m_contents.hasOwnProperty(name))
				return;

			if(value == null)
				m_contents[name].container.clear();
			else
				m_contents[name].renderer.call(m_contents[name].container, value);
		});
	}
}

function RPC(p_args)
{
	var m_self = this;
	var m_callId = 0;
	var m_callbacks = {};

	this.getNewCallId = function()
	{
		return ++m_callId;
	}

	this.send = function(p_command, p_params, p_success)
	{
		var params = def(p_params, {});

		var call_id = m_self.getNewCallId();

		var data = {
			jsonrpc: Map.def(p_args, 'version', '2.0'),
			method: p_command,
			id: call_id,
			params: params
		};

		var xhr = $.ajax({
			url: p_args.host,
			type: 'POST',
			data: JSON.stringify(data),
			success: function(res) {
				//console.debug('RPC returned. Command: '+p_command,', params:', p_params, ', result size:', xhr.responseText.length ); //', result:', res.result
				if(p_success)
					p_success(res.result);
			}
		});
	}
}