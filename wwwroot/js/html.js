
function registerHTML(p_name, p_preferredChild, p_customCreate, p_parent)
{
	var funcName = p_name;

	if(p_customCreate)
		window[funcName] = p_customCreate;
	else
		window[funcName] = function() {
			return create_html(def(p_parent, p_name), arguments, p_preferredChild);
		}
}

var html = {
	elements: {
		text: {
			custom: function(p_content) { 
				return document.createTextNode(p_content); 
			}
		},
		div: {},
		span: {},
		a: {},
		u: {},
		s: {},
		b: {},
		i: {},
		table: {
			child: 'tr',
		},
		tr: {
			child: 'td',
		},
		td: {},
		th: {},
		form: {},
		input: {},
		br: {
			custom: function() {
				return document.createElement('br');
			}
		},
		span: {},
		ul: {
			child:'li',
		},
		li: {},
		select: {
			child:'option',
		},
		option: {},
		textarea: {},
		fieldset: {
			child:'legend',
		},
		legend: {},
		img: {},
		thead: {},
		tbody: {},
		tfoot: {},
		hr: {},
		progress: {},
		pre: {},
		script: {},
		link: {},
		iframe: {}
	}, 
	externals: {}
}

for(var name in html.elements) {
	var desc = html.elements[name];
	registerHTML(name, desc.child || null, desc.custom || null);
}

function head() { var h = document.getElementsByTagName("head")[0]; add_spec_ext_to_element(h); return h; }
function body() { var b = document.getElementsByTagName("body")[0]; add_spec_ext_to_element(b); return b; }

function dGE2(id) { 
	var el = document.getElementById(id)
	if(!el)	
		return el;
	
	add_spec_ext_to_element(el);
	
	return el;
};

function a2(p_href, p_label, p_params)
{
	if(p_label == undefined) {
		p_label = p_href[0] == '/' ? (window.location.protocol + '//' + window.location.hostname) : '';
		p_label += p_href;
	}

	params = (p_params || {});
	params.href = p_href;

	return a(p_label,params);
}

function add_spec_ext_to_element(element, p_preferredChild)
{
	if(element.hasOwnProperty('hasCL'))
		return;

	p_preferredChild = (p_preferredChild || 'text');

	element.hasCL = true;
	
	element.clear = function()
	{
		element.innerHTML = '';
		
		return element;
	}
	
	element.remove = function()
	{
		element.parentNode.removeChild(element);
		
		return element;
	}
	
	element.set = function()
	{
		element.clear();
		for(var idx = 0; idx < arguments.length; idx++)
			element.insert(arguments[idx]);
			
		return element;
	}
	
	element.toggle = function(p_fadeTime)
	{
		this.show(!this.isShown(), p_fadeTime);
		return element;
	}
	
	/**
		- p_isShow: true|false, 0|1: show or not. >1: p_isShow = fadeTime
		- [p_fadeTime]: animate hide/show in millisecs
	*/
	element.show = function(p_isShow, p_fadeTime)
	{
		var isShow = def(p_isShow, true);
		var fadeTime = def(p_fadeTime, 0);
		
		if(typeof p_isShow == 'number' && p_isShow > 1) {
			isShow = true;
			fadeTime = p_isShow;
		}

		if(!element.hasOwnProperty('original_display'))
			element.original_display = element.style.display == 'none' ? '' : element.style.display;
	
		var newDisp = isShow ? element.original_display : 'none';
		
		if(fadeTime) {
			var op = isShow ? 1 : 0;
			$(element).css({opacity: isShow?0:1, display: newDisp});
			$(element).animate({opacity: op}, fadeTime);
		} else
			element.style.display = newDisp;
			
		return element;
	}
	
	element.visible = function(p_isVisible)
	{
		var is = def(p_isVisible, true);
		
		if(!element.hasOwnProperty('original_visibility'))
			element.original_visibility = element.style.visibility;
	
		element.style.visibility = is ? element.original_visibility : 'hidden';		
		
		return element;
	}
	
	//parameter
	element.p = function(p_field, p_value)
	{
		if(typeof p_value != 'undefined') {
			element.setAttribute(p_field, p_value);
			return element;
		} else
			return element.getAttribute(p_field);
	}
	
	//clear paramater
	element.cp = function(p_field)
	{
		element.removeAttribute(p_field);
		return element;
	}
	
	//carefully...
	element.isShown = function()
	{
		return element.style.display != 'none';
	}
	
	element.hide = function(p_fadeTime)
	{
		this.show(false, p_fadeTime);
		return element;
	}
	
	element.add = function()
	{
		for(var idx = 0; idx < arguments.length; idx++)
			this.insert(arguments[idx]);
		
		return element;
	}
	
	element.pre = function()
	{
		for(var idx = 0; idx < arguments.length; idx++)
			this.insert(arguments[idx], 0);
			
		return element;
	}
	
	element.insert = function(p_item, p_pos)
	{
		if(isElement(p_item))
			element.doInsert(p_item, p_pos);
		else if(p_item instanceof Array) {
			for(var i=0; i<p_item.length;i++)
				element.insert(p_item[i], p_pos);
		} else if(typeof p_item  == 'object') {
			for(var key in p_item) {
				if(typeof p_item[key] == 'function' || typeof p_item[key] == 'object')
					element[key] = p_item[key];
				else
					element.setAttribute(key, p_item[key]);
			}
		} else 
			element.doInsert(window[p_preferredChild](p_item), p_pos);	
			
		return element;
	}
	
	element.doInsert = function(p_item, p_pos)
	{
		if(typeof p_pos == 'undefined' || p_pos >= element.childNodes.length || element.childNodes.length == 0)
			element.appendChild(p_item);
		else
			element.insertBefore(p_item, element.childNodes[p_pos]);	
		
		return element;
	}
	
	element.alignCenter = function()
	{
		var ew = $(element).outerWidth();
		var eh = $(element).outerHeight();
		var pw = $(element).parent().outerWidth();
		var ph = $(element).parent().outerHeight();
		//console.log(ew,eh,pw,ph);
		var dleft = Math.round((pw-ew)/2);
		var dtop = Math.round((ph-eh)/2);
		element.style.left = dleft+'px';
		element.style.top = dtop+'px';
		return element;
	}
	
	element.addClass = function(p_className)
	{
		var classes = element.getClasses();
		if(classes.indexOf(p_className) == -1) {
			classes.push(p_className);
			element.p('class', classes.join(' '));
		}
		return element;
	}
	
	element.getClasses = function()
	{
		var classes = element.p('class') || '';
		return classes.split(' ');
	}
	
	element.removeClass = function(p_className)
	{
		var classes = element.getClasses();
		var idx = classes.indexOf(p_className);
		if(idx != -1) {
			classes.splice(idx,1);
			element.p('class', classes.join(' ')); 
		}
		return element;
	}
	
	element.onready = function(p_callback) { //this way is deprecated. TODO: find a replacement. and bad, this called every time when the dom change, eg mod a style
		this.addEventListener("DOMSubtreeModified", function(e) { p_callback(e); }, false);
		return element;
	}
	
	element.trigger = function(p_type, p_data)
	{
		var ev = {srcElement: element, originalTarget: element};
		Hash.merge(ev, def(p_data, {}));
		element[p_type](ev);
	}
	
	element.parent = function(p_step)
	{
		var step = def(p_step, 1);
		var res = element;		
		for(var i = 0; i < step; i++) {
			res = res.parentNode;
		}
		add_spec_ext_to_element(res);
		return res;
	}
	
	element.html = function(p_html)
	{
		if(typeof p_html == 'undefined')
			return element.innerHTML;
		
		element.innerHTML = p_html;
		return element;
	}
	
	for(var name in html.externals) {
		element[name] = html.externals[name];
	}
}

function create_html(p_type, p_args, p_preferredChild)
{
	var element = document.createElement(p_type);
	
	add_spec_ext_to_element(element, p_preferredChild);
	element.set.apply(this, p_args);
	
	return element;
}
