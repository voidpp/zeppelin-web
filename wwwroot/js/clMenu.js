/*!
 * clMenu 1.0
 *
 * Copyright 2011, dual licensed under the MIT or GPL Version 2 licenses.
 *
 * http://js.coldline.hu/docs
 *
 * http://coldline.hu
 */

var clMenuIconSet = {
	check: '/pic/check14.png',
	radio: '/pic/radio14.png',
	submenu: '/pic/menuarrow.gif'
};

var currid = 0;
function getNewId()
{
	return ++currid;
}

/**
	- args
		- [iconsize(16)]: (img.style.maxWidth)
		- [title]
		- [link_handler]: (call this instead of window.location if href is present in appendItem params),
		- [destroyAfterHide(false)]
		- [hideCallback]
*/

function clMenu(args)
{
	args = (args || {});
	var m_items = [];
	var m_iconSize = args.hasOwnProperty('iconsize') ? args.iconsize : 16;
	var m_self = this;
	var m_container = 0;
	var m_currentColumn = 0;
	this.on = false;
	var m_parentMenu = 0;
	var	m_destroyAfterHide = args.hasOwnProperty('destroyAfterHide') ? args.destroyAfterHide : false;
	var m_id = getNewId();

	//console.log('clMenu created with id=%i, title='+args.title,m_id);

	var m_hideCallback = args.hasOwnProperty('hideCallback') ? args.hideCallback : 0;

	/**
		- title
		- [tooltip]:
		- [callback(/func)]:
		- [href]:
		- [hreftarget]:
		- [icon]:
		- [type]: (normal|check|radio|separator|submenu|title)
		- [checked]:
		- [menu]: (ha type == submenu)
		- [handler]:
		- [id]:
	*/
	this.appendItem = function(params)
	{
		params.parent = this;
		if(!params.hasOwnProperty('handler') && args.hasOwnProperty('link_handler'))
			params.handler = args.link_handler;
		if(params.type == 'check' && !params.hasOwnProperty('icon'))
			params.icon = clMenuIconSet.check;
		if(params.type == 'radio' && !params.hasOwnProperty('icon'))
			params.icon = clMenuIconSet.radio;
		var item = new clMenuItem(params);
		m_items.push(item);
		return item;
	}

	this.getItemCount = function() {
		return m_items.length;
	}

	this.appendCheckItem = function(params) {
		params.type = 'check';
		params.icon = clMenuIconSet.check;
		return this.appendItem(params);
	}

	this.appendRadioItem = function(params) {
		params.type = 'radio';
		params.icon = clMenuIconSet.radio;
		return this.appendItem(params);
	}

	this.appendSeparator = function() {
		return this.appendItem({type:'separator'});
	}

	this.appendSubMenu = function(params) {
		// params: menu(clMenu), title
		params.type = 'submenu';
		return this.appendItem(params);
	}

	this.appendTitleItem = function(params) {
		params.type = 'title';
		return this.appendItem(params);
	}

	this.addBreak = function() {
		addColumn();
	}

	this.getSize = function() {
		return {w:$(m_container).width(), h:$(m_container).height()};
	}

	this.popup = function(pos) {

		var offs = 0;//((mp[0]+mwidth)>pwidth)?(-mwidth):0;

		var cs = getClientSize();
		var jcont = $(m_container);

		//console.log(m_container.style.left);

		if(args.isMobile === true) {

			jcont.css({
				left: 10,
				top: (cs.h-jcont.height())/2,
				width: cs.w-20
			});

		} else {
			if(cs.w < jcont.width() + clMenuMousePos.x)
			{
				offs = -jcont.width();
				if(m_parentMenu)
					offs -= m_parentMenu.getSize().w;
			}

			//console.log(offs);

			var cpos = pos ? pos : {x:(clMenuMousePos.x),y:(clMenuMousePos.y+2)};

			cpos.x += offs;

			jcont.css({
				left: cpos.x,
				top: cpos.y,
			});
		}

		m_self.on = true;

		if(m_parentMenu == 0) setTimeout(function() { document.oncontextmenu = document.onmousedown = function(e) { m_self.bodyonmousedown(e); } },10);
	}

	this.bodyonmousedown = function(e) {
		if(!e) e = window.event;
		var originalElement = e.srcElement || e.originalTarget;
		var res = false;
		var list = document.getElementsByClassName('clMenu_container');
		for(var a=0;a<list.length;a++){
			res = SearchElement(list[a],originalElement);
			if(res == true) break;
		}

		//console.log('m_items cnt=%i, res=%i, id=%i',m_items.length,res,m_id);

		if(!res) m_self.demolish();
	}

	this.demolish = function() {
		//console.log('demolish: m_items cnt=%i, id=%i',m_items.length,m_id);
		m_self.hide();
		hideSubMenus();
	}

	this.demolishNotify = function() {
		if(m_parentMenu == 0)
			this.demolish();
		else
			m_parentMenu.demolishNotify();
	}

	var hideSubMenus = function() {
		for(var a=0;a<m_items.length;a++) {
			var item = m_items[a];
			if(item.getType() == 'submenu') {
				item.hideSubMenu();
			}
		}
	}

	this.destroy = function() {
		document.body.removeChild(m_container);
	}

	this.destroyMenuTree = function() {
		for(var a=0;a<m_items.length;a++) {
			var item = m_items[a];
			item.destroy();
		}
		this.destroy();
	}

	this.hide = function() {
		m_container.style.top = '-1000px';
		m_self.on = false;
		//console.log('hide: id=%i',m_id);
		if(m_parentMenu == 0) document.oncontextmenu = document.onmousedown = function() {};

		if(m_destroyAfterHide && m_parentMenu == 0) this.destroyMenuTree();

		if(m_hideCallback) m_hideCallback();
	}

	this.setHideCallback = function(func) {
		m_hideCallback = func;
	}

	this.getContainer = function() {
		return m_container;
	}

	this.getIconSize = function() {
		return m_iconSize;
	}

	this.check = function(id,isCheck) {
		for(var a=0;a<m_items.length;a++) {
			var item = m_items[a];
			if(item.getId() == id) item.check(isCheck);
		}
	}

	this.appendMenuItemContainer = function(cont) {
		m_currentColumn.appendChild(cont);
	}

	var addColumn = function() {
		var m = m_currentColumn == 0 ? false : true;
		m_currentColumn = document.createElement('div');
		m_currentColumn.setAttribute('class','clMenu_container_column');
		m_container.appendChild(m_currentColumn);
		if(m)
			m_currentColumn.style.borderLeft = '1px solid #888';
	}

	this.setParentMenu = function(menu) {
		m_parentMenu = menu;
	}

	this.unCheckOthers = function(except) {
		for(var a=0;a<m_items.length;a++) {
			var item = m_items[a];
			if(item.getType() != 'radio') continue;
			if(item == except) continue;
			item.check(false);
		}
	}

	m_container = document.createElement('div');
	m_container.setAttribute('class','clMenu_container');
	m_container.style.top = '-1000px';

	document.body.appendChild(m_container);

	addColumn();


	if(args.hasOwnProperty('title')) {
		this.appendTitleItem({title:args.title});
	}
}

function clMenuItem(args)
{
	var m_params = args;
	var m_self = this;

	var m_container = document.createElement('div');
	var m_iconCont = document.createElement('div');
	var m_labelCont = document.createElement('div');

	var m_icon = 0;
	var m_timerc1 = 0;
	var m_timerc2 = 0;
	var m_submenu = m_params.type == 'submenu' ? m_params.menu : 0;
	var m_parent = m_params.parent;
	var m_subicon;

	switch(m_params.type) {
		case 'separator':
			var hr = document.createElement('hr');
			m_labelCont.appendChild(hr);
			break;

		case 'title':
			m_container.setAttribute('title',m_params.hasOwnProperty('tooltip') ? m_params.tooltip : m_params.title);
			m_labelCont.innerHTML = m_params.title;
			m_container.setAttribute('class','clMenu_menuTitleItem');
			break;

		default:
			m_container.setAttribute('title',m_params.hasOwnProperty('tooltip') ? m_params.tooltip : m_params.title);
			m_labelCont.innerHTML = m_params.title;
			m_iconCont.setAttribute('class','clMenu_menuItem_iconCont');
			m_labelCont.setAttribute('class','clMenu_menuItem_labelCont');
			m_container.setAttribute('class','clMenu_menuItem');
			break;
	}

	m_container.appendChild(m_iconCont);
	m_container.appendChild(m_labelCont);

	m_container.onclick = function() {
		//console.log('item click');
		if(!m_params.enabled) return;

		switch(m_params.type) {
			case 'check':
			case 'radio':
				m_self.check(!m_params.checked);
				break;
			default:
				break;
		}

		if(m_params.hasOwnProperty('callback')) {
			m_params.callback(m_self);
			m_parent.demolishNotify();
			return;
		}

		if(m_params.hasOwnProperty('href')) {
			if(m_params.hasOwnProperty('handler'))
				m_params.handler(m_params.href);
			else
				window.location	= m_params.href;
			m_parent.demolishNotify();
			return;
		}

	}

	//this.getContainer

	this.getParams = function() {
		return m_params;
	}

	this.enable = function(isenable) {
		if(isenable)
			$(m_container).removeClass('disabledMenuItem');
		else
			$(m_container).addClass('disabledMenuItem');

		m_params.enabled = isenable;

		m_iconCont.style.opacity = isenable ? 1.0 : 0.2;

		if(m_subicon) m_subicon.style.opacity = isenable ? 1.0 : 0.3;
	}

	this.isEnabled = function() {
		return m_params.enabled;
	}

	this.destroy = function() {
		if(m_submenu){
			m_submenu.destroyMenuTree();
		}
		//todo...
	}

	this.getSubMenu = function() {
		return m_submenu;
	}

	if(m_params.type == 'submenu') {
		m_submenu.setParentMenu(m_parent);

		$(m_container).mouseenter( function() {
			if(!m_params.enabled) return;
			clearTimeout(m_timerc2);
			m_timerc2 = -1;
			var pos = clFindPos(m_container);
			pos.x += m_container.offsetWidth+1;
			pos.y -= 2;
			m_submenu.popup(pos);
			$(m_container).addClass('clMenu_menuItem_sub');
		});

		$(m_container).mouseleave(function() {
			if(!m_params.enabled) return;
			m_timerc1 = setTimeout(function() { m_self.hideSubMenu(); },20);
		});

		var subcont = m_submenu.getContainer();
		var parentcont = m_parent.getContainer();

		$(parentcont).mouseenter( function () {
			if(m_submenu.on && m_timerc2==0) {
				m_timerc2 = setTimeout(function() { m_timerc2 = 0; m_self.hideSubMenu(); },20);
			}
		});

		$(subcont).mouseenter(function () {
			clearTimeout(m_timerc1);
			m_timerc2 = 0;
		});

		m_subicon = document.createElement('img');
		m_subicon.src = clMenuIconSet.submenu;
		m_subicon.setAttribute('class','clMenu_menuItem_submenuimg');
		m_container.appendChild(m_subicon);
	}

	this.hideSubMenu = function() {
		if(m_submenu == 0) return;
		$(m_container).removeClass('clMenu_menuItem_sub');
		m_submenu.demolish();
	}

	if(m_params.hasOwnProperty('icon')) {
		m_icon = document.createElement('img');
		m_icon.setAttribute('src',m_params.icon);
		m_iconCont.appendChild(m_icon);
	}

	this.check = function(isCheck) {
		if(m_params.type != 'check' && m_params.type != 'radio') return;

		m_icon.style.display = isCheck ? '' : 'none';
		m_params.checked = isCheck;

		if(m_params.type == 'radio' && m_params.checked == true) {
			m_parent.unCheckOthers(m_self);
		}
	}

	this.getType = function() {
		return m_params.type;
	}

	this.getId = function() {
		return m_params.id;
	}

	this.hasSubMenu = function() {
		return m_submenu == 0 ? false : true;
	}

	this.check(m_params.checked);

	if(!m_params.hasOwnProperty('enabled'))
		m_params.enabled = true;

	this.enable(m_params.enabled);

	var size = m_params.hasOwnProperty('iconsize') ? m_params.iconsize : m_parent.getIconSize();

	m_iconCont.style.width = m_parent.getIconSize()+'px';
	if(m_icon) {
		m_icon.style.maxWidth = size+'px';
	}
	m_parent.appendMenuItemContainer(m_container);
}

var clMenuMousePos = {};

document.onmousemove = function(e) {
	var mX = 0;
	var mY = 0;
	if (!e) var e = window.event;
	if (e.pageX || e.pageY) {
		mX = e.pageX;
		mY = e.pageY;
	} else if (e.clientX || e.clientY) {
		mX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		mY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	};
	clMenuMousePos.x = mX;
	clMenuMousePos.y = mY;
};

function clFindPos(obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	};
	return {x:curleft,y:curtop};
};
