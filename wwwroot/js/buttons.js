function rpcButton(p_args)
{
	var call = function() {
		g_env.rpc.request.send(p_args.command, Map.def(p_args, 'params', null), Map.def(p_args, 'callback', null));
	}

	if(p_args.label) {
		return clButton({label: p_args.label, callback: call});
	} else if(p_args.img) {
		return clImageButton({img: p_args.img, onclick: call});
	}
}