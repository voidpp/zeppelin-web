function EventManager()
{
	var m_self = this;
	var m_subscribers = {};
	
	this.subscribe = function(p_name, p_callback, p_obj)
	{
		Map.init_arr(m_subscribers, [p_name], []);
		m_subscribers[p_name].push({func: p_callback, object: def(p_obj, null)});
	}
	
	this.notify = function(p_name, p_data)
	{
		if(!m_subscribers.hasOwnProperty(p_name))
			return;
		
		foreach(m_subscribers[p_name], function(callback) {
			callback.func.call(callback.object, p_data);
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
		
		$.ajax({
			url: p_args.host,
			type: 'POST',
			data: JSON.stringify(data),
			success: function(res) {
				if(p_success)
					p_success(res.result);
			}
		});		
	}
}