/*!
 * clDialog 1.1.2
 *
 * Copyright 2011, dual licensed under the MIT or GPL Version 2 licenses.
 *
 * http://js.coldline.hu/docs
 *
 * http://coldline.hu
 */

/*needs dialog.css,button3D.css*/

var isOpera = navigator.userAgent.indexOf("Opera") > -1;

var clDialogGlobalIcon = '/favico.png';

function clConfirm(args)
{
	var dlg = new clDialog({
		caption: 'Question',
		message: args.question,
		minwidth: 300,
		icon: clDialogGlobalIcon,
		buttons: {
			ok: {
				label: 'OK',
				keyCodes: [13]
			},
			cancel: {
				label: 'Cancel',
				keyCodes: [27]
			}
		},
		callback: function(code) { if(code=='ok') args.callback(); }
	});
	dlg.build();
}
function clMessageBox(msg,caption,callback,type)
{
	var msgcont = td();
	if(isElement(msg))
		msgcont.add(msg);
	else
		msgcont.innerHTML = msg;
	
	var type = (type || 'info');
	var icon = img({src:'/pic/msg_'+type+'.png'});

	var dlg = new clDialog({
		caption: (caption || 'Message'),
		content: table(tr(td(icon, {style:'padding: 10px 5px;'}),msgcont), {class:'clMessageBox'}),
		minwidth: 300,
		icon: clDialogGlobalIcon,
		buttons: {
			ok: {
				label: 'OK',
				keyCodes: [13,27]
			}
		},
		callback: callback
	});
	dlg.build();
}
function clMessageBox2(content,caption)
{
	var dlg = new clDialog({
		caption: caption?caption:'Message',
		content: content,
		minwidth: 300,
		icon: clDialogGlobalIcon,
		buttons: {
			ok: {
				label: 'OK',
				keyCodes: [13,27]
			}
		}
	});
	dlg.build();
}
function clDialog(args)
{
	var m_currObj = this;
	var m_isModal = Map.def(args, 'ismodal', true);
	var m_oldEvents = 0;
	var m_bg = 0;
	var m_dialog = 0;
	var m_head = 0;
	var m_body = 0;
	var m_foot = 0;
	var m_isAero = Map.def(args, 'aero', false);
	var m_headIcon = Map.def(args, 'icon', clDialogGlobalIcon);
	var m_autoShow = Map.def(args, 'autoShow', true);
	var m_addEscToCancel = Map.def(args, 'addEscToCancel', true);
	var m_bannerImage = Map.def(args, 'banner', 0);
	var m_customBgClass = Map.def(args, 'customBgClass', 0);
	var m_animate = Map.def(args, 'animate', false);

	this.layout = function() {
		var dw = $(m_dialog).outerWidth();
		var dh = $(m_dialog).outerHeight();

		var size = getClientSize();

		var pw = m_bg ? $(m_bg).outerWidth() : size.w;
		var ph = m_bg ? $(m_bg).outerHeight() : size.h;

		var dtop = Math.round((ph-dh)/2);
		
		m_dialog.style.top = dtop+'px';
		m_dialog.style.left = Math.round((pw-dw)/2)+'px';

		if(m_bannerImage && m_isModal) {
			var bw = $(m_bannerImage).outerWidth();
			var bh = $(m_bannerImage).outerHeight();
			m_bannerImage.style.top = (dtop - 40 - bh) + 'px';
			m_bannerImage.style.left = Math.round((pw-bw)/2)+'px';
		}
	}

	this.storeEvents = function() {
		m_oldEvents = {
			onkeydown: document.onkeydown,
			onkeyup: document.onkeyup,
			onkeypress: document.onkeypress
		}
	}

	this.prohibitEvents = function() {
		for(var type in m_oldEvents) {
			document[type] = function(e) {
				return true;
			}
		}
	}

	this.releseEvents = function() {
		for(var type in m_oldEvents) {
			document[type] = m_oldEvents[type];
		}
	}

	this.initControl = function() {
		document.onkeydown = function(e) {
			var key;
			if(!e) e = window.event;
			if (e.keyCode) key = e.keyCode;
			else if (e.which) key = e.which;

			for(var id in args.buttons) {
				var item = args.buttons[id];
				if(!item.hasOwnProperty('keyCodes')) continue;
				for(var kc in item.keyCodes) {
					if(item.keyCodes[kc] == key) {
						return item.element.onclick();
					}
				}
			}
			if(m_addEscToCancel && key == 27) { //esc
				m_currObj.close(0);
				return true;
			}

			return true;
		}
	}

	this.getWin = function()
	{
		return m_dialog;
	}

	this.validateFields = function()
	{
		for(var field in args.fields){
			var item = args.fields[field];
			if(!item.hasOwnProperty('validator')) continue;
			if(item.validator(item.getValue()) == false) return false;
		}
		return true;
	}

	this.close = function(retcode)
	{
		if(args.hasOwnProperty('fastcallback')) {
			if(m_isModal)
				m_currObj.releseEvents();

			args.fastcallback(retcode);
			setTimeout(function() { delete args.fastcallback; m_currObj.close(retcode); },10); //enelkul nem jut ido a browsernek a szep hideolasra
			return;
		}


		this.hide(function() {

			if(m_bg) $(m_bg).hide();

			if(m_bg) document.body.removeChild(m_bg);

			if(m_isModal)
				m_currObj.releseEvents();

			if(args.callback)
				args.callback(retcode);
		});
	}

	this.hide = function(callback)
	{
		if(!m_animate) {
			m_dialog.hide();
			m_bg.hide();
			if(callback) 
				callback();
			return;	
		}
	
		$(m_dialog).animate({
				//top: '+=10',
				opacity: 0,
				scale: 0.8
			},300,'swing',function(){

				if(callback) callback();

				return true;
			});

		if(m_bg)
			$(m_bg).animate({ opacity: 0 },300);
	}

	this.show = function()
	{
		this.layout();
		
		if(!m_animate) {
			m_bg.show();
			m_dialog.show();
			return;
		}
		
		m_dialog.style.opacity = 0.01;

		if(m_bg) {
			m_bg.style.opacity = 0;
			$(m_bg).animate({ opacity: 1 },300);
		}

		//$(m_dialog).scale(0.8);

		$(m_dialog).animate({
				opacity: 1,
				scale: 1
			},300,'linear',function(){

				if(m_body.firstFieldItem.formElement)
					m_body.firstFieldItem.formElement.focus();

				return true;
			});
	}

	this.getBody = function()
	{
		return m_body;
	}

	this.setCaption = function(label)
	{
		if(m_head)
			m_head.setLabel(label);
	}

	this.disableButtons = function()
	{
		this.enableButtons(false);
	}

	this.enableButtons = function(p_enable)
	{
		var enable = typeof p_enable == 'undefined' ? true : p_enable;
		for(var id in args.buttons) {
			args.buttons[id].element.enable(enable);
		}
	}
	
	this.build = function() {
		if(m_isModal) {
			m_bg = div({class: 'mdBg'});
			//m_bg.style.display = 'none';
			if(m_customBgClass)
				m_bg.addClass(m_customBgClass);

			m_bg.onclick = function(e) {
				if(!e) e = window.event;
				var originalElement = e.srcElement || e.originalTarget;
				if(originalElement == this) {
					flashClass({
						interval:	90,
						classes: 	['mdHead_1','mdHead_2'],
						target:		$(m_head.getWin()),
						count:		6
					});
				}
			}
		}

		m_dialog = div({class:'mdMain'});
		if(m_isAero) 
			m_dialog.addClass('mdMain_aero');

		m_head = new buildDialogHeader({parent:this,label:args.caption,icon:m_headIcon});

		if(m_isAero) $(m_head.getWin()).addClass('mdHead_aero');

		var bodyargs = args;
		bodyargs.parent = this;
		m_body = new buildDialogBody(bodyargs);

		if(m_isAero) $(m_body.getWin()).addClass('mdBody_aero');

		var footargs = {
			parent:		this,
			buttons:	args.buttons,
			minwidth:	args.buttonminwidth > 0 ? args.buttonminwidth : 50
		}

		m_foot = new buildDialogFooter(footargs);
		
		if(m_isModal) {
			m_bg.appendChild(m_dialog);
			document.body.appendChild(m_bg);
		} else {
			document.body.appendChild(m_dialog);
		}

		if(args.hasOwnProperty('minwidth')) m_dialog.style.minWidth = args.minwidth+'px';

		$(m_dialog).draggable({ containment: 'parent', handle: m_head.getWin() });


		if(isOpera) {
			$(m_head.getWin()).jacg({radius: '7px 7px 0 0', start: '#CCCCCC', end: '#888888'});
			$(m_body.getWin()).jacg({radius: '0 0 7px 7px', start: '#DDDDDD', end: '#BBBBBB'});
			setButtonsGradientBg();
		}

		m_body.selectFields();

		if(m_isModal) {
			this.storeEvents();
			this.prohibitEvents();
		}

		this.initControl();

		//if(m_bg) $(m_bg).hide();


		if(m_bannerImage && m_isModal) {
			var bimg = dCE('img');
			bimg.src = m_bannerImage;
			m_bannerImage = bimg;
			$(m_bannerImage).addClass('mbBanner');
			m_bg.appendChild(m_bannerImage);
			m_bannerImage.style.opacity = 0;
			m_bannerImage.onload = function() {			
				m_currObj.layout();
				$(this).animate({ opacity: 1 },500);				
			}
		}
		
		if(m_autoShow)
			this.show();		
	}

}

function buildDialogBody(args)
{
	var m_parent = args.parent;

	var m_win = dCE('div');
	m_win.setAttribute('class','mdBody');
	var m_fieldTable = 0;

	var m_msg = dCE('div');
	m_msg.setAttribute('class','mdBody_msg');

	if(args.hasOwnProperty('message')) {
		m_msg.innerHTML = args.message;
	} else if(args.hasOwnProperty('content')) {
		m_msg.appendChild(args.content);
	} else {
		m_msg.innerHTML = '<i>empty</i>';
	}

	m_win.appendChild(m_msg);

	this.getWin = function(){
		return m_win;
	}

	this.getFieldTable = function() {
		return m_fieldTable;
	}

	var fields = new Object();
	this.firstFieldItem = 0;

	this.selectFields = function()
	{
		if(args.hasOwnProperty('fields')) {
			for(var field in args.fields){
				var item = args.fields[field];

				if(item.hasOwnProperty('select') && item.select) item.formElement.select();
			}
		}
	}

	if(args.hasOwnProperty('fields')) {
		m_fieldTable = dCE('table');
		m_fieldTable.setAttribute('cellspacing','0');
		m_fieldTable.setAttribute('class','mdBody_field_table');
		//m_fieldTable.style.width = '100%';
		for(var field in args.fields){
			var item = args.fields[field];
			var element = null;
			switch(item.type){
				case 'text':
				case 'checkbox':
				case 'password':
				case 'hidden':
				case 'radio':
					element = dCE('input');
					element.setAttribute('type',item.type);
					break;
				case 'textarea':
					element = dCE('textarea');
					break;
				case 'select':
					element = dCE('select');
					for(var a=0;a<item.options.length;a++) {
						var opt = dCE('option');
						opt.value = item.options[a].value;
						opt.innerHTML = item.options[a].label;
						element.appendChild(opt);
					}
					if(item.size > 1) element.size = item.size;
					break;
				default:
					break;
			}

			if(element == null) continue;
			element.setAttribute('name',field);

			switch(item.type){
				case 'text':
				case 'textarea':
				case 'select':
				case 'password':
					element.style.width = '99%';
					break;
				default:
					break;
			}



			item.formElement = element;
			item.getValue = function() {
				return this.formElement.value;
			}
			item.isChecked = function() {
				return this.formElement.checked;
			}

			if(this.firstFieldItem == 0) this.firstFieldItem = item;

			if(item.hasOwnProperty('value')) element.value = item.value;
			if(item.hasOwnProperty('checked')) element.checked = item.checked;

			var td1 = dCE('td');
			td1.innerHTML = item.hasOwnProperty('label') ? item.label : '';
			var td2 = dCE('td');
			td2.appendChild(element);

			var tr = dCE('tr');
			tr.appendChild(td1);
			tr.appendChild(td2);

			m_fieldTable.appendChild(tr);

			//fields[field] = item;
		}

		m_win.appendChild(m_fieldTable);
	}

	this.getFields = function() {
		return fields;
	}

	m_parent.getWin().appendChild(m_win);

}

function buildDialogHeader(args)
{
	var m_parent = args.parent;
	var m_icon = null;
	var m_label = null;

	this.getWin = function() {
		return m_win;
	}

	this.setLabel = function(label) {
		if(m_label)
			m_label.innerHTML = label;
	}

	var m_win = dCE('div');
	m_win.setAttribute('class','mdHead');

	var m_caption = dCE('span');
	m_caption.setAttribute('class','mbHead_caption');
	if(args.icon){
		m_icon = dCE('img');
		m_icon.setAttribute('src',args.icon);
		m_icon.setAttribute('style',"vertical-align: bottom; margin: -2px 3px -1px 0");
		m_caption.appendChild(m_icon);
	}

	m_label = dCE('span');
	m_caption.appendChild(m_label);
	this.setLabel(args.label);

	var close = dCE('span');
	close.setAttribute('class','mbHead_close');
	if(isOpera) close.style.marginTop = '-15px'; // ??

	close.onclick = function() {
		m_parent.close(0);
	}

	m_win.appendChild(m_caption);
	m_win.appendChild(close);

	m_parent.getWin().appendChild(m_win);
}

function buildDialogFooter(args)
{
	var m_parent = args.parent;
	var m_win = dCE('div');
	m_win.setAttribute('class','mdFoot');
	var m_currObj = this;

	for(var id in args.buttons) {
		var bdesc = args.buttons[id];
		var button = clButton({label:(bdesc.tooltip || bdesc.label)});
		bdesc.element = button;
		button.fieldItemId = id;
		button.desc = bdesc;		
		
		button.callback = function(e) {
			if(!e) e = window.event;
			if(this.desc.validate == true) {
				if(m_parent.validateFields() == false) return true;
			}
			if(this.desc.hasOwnProperty('callback')) {
				return this.desc.callback(e,m_currObj);
			} else {
				m_parent.close(this.fieldItemId);
			}

			return false;
		}
		button.style.marginLeft = '7px';
		button.style.marginRight = '7px';

		if(args.hasOwnProperty('minwidth') && args.minwidth > 0) button.style.minWidth = args.minwidth+'px';
		
		m_win.appendChild(button);
	}

	m_parent.getBody().getWin().appendChild(m_win);
}

function flashClass(args)
{
	if(args.counter == undefined) {
		args.counter = 1;
		args.count++;
	}

	args.target.removeClass( args.classes[ args.counter % args.classes.length ] );

	args.counter += 1;

	args.target.addClass( args.classes[ args.counter % args.classes.length ] );

	if(args.counter > args.count) return;

	setTimeout(function(){ flashClass(args); },args.interval);
}

function stopEvent(e) {
	if (e && e.preventDefault) e.preventDefault();
	else if (e && e.returnValue) e.returnValue = false;

	if (e && e.stopPropagation) e.stopPropagation();
	else if (e && e.cancelBubble) e.cancelBubble = true;

	e.stopped = true;
	return false;
};
