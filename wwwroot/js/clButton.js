
/**
	- p_args: 
		- win|label: external element OR the button label
		- [small]: true|false
		- [callback(clButton)]: call back when the button clicked
		- [class]: use this insead of default class
		- [togglable]: button is togglable
		- [toogled]: button set to toggled
		- [groupHandler]: connect many clButton via this param. if any button is toggled in the group the previously button will be untoggled
		- [groupId]: group id for this button. should be unique among the group buttons
*/
function clButton(p_args)
{
	var m_isToggled = p_args.hasOwnProperty('toggled') ? p_args.toggled : false;
	var m_win = p_args.win ? p_args.win : div(p_args.label || p_args.labels[m_isToggled]);
	var m_enabled = true;
	var m_grpId = p_args.groupId;
	
	$(m_win).addClass(p_args.class ? p_args.class : 'button3D');
	
	if(p_args.hasOwnProperty('small') && p_args.small == true)	
		$(m_win).addClass('button3Ds');
	
	if(p_args.togglable && p_args.groupId && p_args.groupHandler) {
		p_args.groupHandler.buttons[p_args.groupId] = m_win;
	}
	
	m_win.enable = function(enable) {
		if(enable==undefined) enable = true;
		
		m_enabled = enable;
		if(enable) 
			$(m_win).removeClass('button3D_disabled');
		else
			$(m_win).addClass('button3D_disabled');
	}
	
	m_win.getGroupId = function()
	{
		return m_grpId;
	}
	
	m_win.setToggle = function(p_isdown)
	{
		//if(m_isToggled == p_isdown) return;
		m_isToggled = typeof p_isdown == 'undefined' ? true : p_isdown;
		if(p_args.labels)
			m_win.setLabel(p_args.labels[m_win.isToggled()]);
		if(m_isToggled)
			$(m_win).addClass('button3D_toggled');
		else 
			$(m_win).removeClass('button3D_toggled');
			
		if(m_isToggled && p_args.groupId && p_args.groupHandler && (p_args.groupHandler.curr != p_args.groupId)) {
			p_args.groupHandler.buttons[p_args.groupHandler.curr].setToggle(false);
			p_args.groupHandler.curr = p_args.groupId;
		}
	}
	
	m_win.isToggled = function()
	{
		return m_isToggled;
	}
	
	m_win.onclick = function(e) {
		if(!m_enabled) return false;
		
		if(p_args.togglable)
			m_win.setToggle(!m_isToggled);
		
		if(p_args.callback)
			p_args.callback(m_win);
		if(m_win.callback)
			m_win.callback(e || window.event);
	}
	
	m_win.disable = function() {
		this.enable(false);
	}	

	m_win.setLabel = function(p_label) {
		m_win.innerHTML = p_label;
	}

	m_win.getLabel = function() {
		return m_win.innerHTML;
	}
	
	m_win.setToggle(m_isToggled);
	
	return m_win;
}

function clImageButton(p_args)
{
	var m_enabled = true;
	var m_win = img({src:p_args.img, 'class':'clImageButton', onclick:function(e){
		if(!m_enabled) return false;
		if(e)
			e.stopPropagation();
		else
			window.event.cancelBubble = true;
		var e = e ? e : window.event;
		e.preventDefault();
		p_args.onclick(e, m_win.data);
	}});

	if(p_args.data)
		m_win.data = p_args.data;	
	
	m_win.enable = function(p_enable) {
		p_enable = (p_enable || true);

		m_enabled = p_enable;
		if(p_enable)
			$(m_win).removeClass('clImageButton_disabled');
		else
			$(m_win).addClass('clImageButton_disabled');
	}

	m_win.disable = function() {
		this.enable(false);
	}

	return m_win;
}

function clTextButton(p_args)
{
	var m_enabled = true;
	var m_win = span(p_args.label,{class:'clTextButton', onclick:function(e){
		if(!m_enabled) return false;
		p_args.onclick(e, m_win.data);
	}});
	
	if(p_args.data)
		m_win.data = p_args.data;

	m_win.enable = function(p_enable) {
		p_enable = p_enable != undefined ? p_enable : true;

		m_enabled = p_enable;
		if(p_enable)
			$(m_win).removeClass('clTextButton_disabled');
		else
			$(m_win).addClass('clTextButton_disabled');
	}

	m_win.disable = function() {
		this.enable(false);
	}

	return m_win;
}

function Enable3D(el,enable) 
{	
	if(!el) return false;	
	if(enable==null) enable=true;	
	if(enable) {
		if(el.onclick_old) el.onclick = el.onclick_old;
		el.onclick_old = null;
		$(el).removeClass('button3D_disabled');
	} else {
		if(el.onclick_old==null) el.onclick_old = el.onclick;		
		el.onclick = "return false;";
		$(el).addClass('button3D_disabled');;
	}	
	return true;
}

