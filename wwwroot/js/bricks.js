/**
	- p_args:
		- skeleton: form skeleton, see sForm
		- title: dialog title
		- [okButton]: label for the OK button
		- [callback(response.content)]: calls when the response for the form submit is arrived
		- [selections]: see sForm
		- [fieldsVisibility]: see sForm
		- [onsubmit]: callback before submit
*/
function formDialog(p_args)
{
	var submit = input(p_args.skeleton.submit, {style:'display: none;'}); //fostalicska html+js #1
	var params = {};
	var form = sForm({
		skeleton: p_args.skeleton,
		params: params,
		submit: submit,
		selections: p_args.selections,
		fieldsVisibility: p_args.fieldsVisibility
	});
	var dlg;

	//handle file type input with progress bar
	for(var name in p_args.skeleton.fields)
	{
		if(p_args.skeleton.fields[name].type != 'file')
			continue;

		p_args.skeleton.fields[name].onsize = function() {
			dlg.alignCenter();
		}

		//hellyeah, this is handles only one file field! (TODO...)

		var pb = progress({style:'width: 100%;', value:0, max:100});
		form.rows[name].form_field.parentNode.add(br(), pb);
		pb.hide();

		form.data_renderer = function(data) { return new FormData(form); };
		form.ajax_options = {
			xhr: function() {  // custom xhr
				myXhr = $.ajaxSettings.xhr();
				if(myXhr.upload){ // if upload property exists
					pb.show();
					myXhr.upload.addEventListener('progress', function(ev) { console.log(ev); pb.set({value: ev.loaded, max: ev.total}); }, false); // progressbar
					myXhr.upload.addEventListener('loadstart', function(ev) { form.disable(); dlg.disableButtons(); }, false); // progressbar
				}
				return myXhr;
			},
			cache: false,
			contentType: false,
			processData: false
		};
		break;
	}

	params.error_callback = function()
	{
		console.log('error');
		form.enable();
		dlg.enableButtons();
	}

	dlg = new clDialog({
		caption: p_args.title,
		content: form,
		minwidth: 200,
		icon: clDialogGlobalIcon,
		buttons: {
			ok: {
				label: (p_args.okButton || 'OK'),
				callback: function() {

					if(p_args.onsubmit)
						p_args.onsubmit($(form).serializeObject(), dlg);

					//only valid html forms will be submitted
					if(p_args.skeleton.params.method && p_args.skeleton.params.action)
						$(submit).trigger('click');  //fostalicska html+js #2
				}
			},
			cancel: {
				label: 'Cancel',
				keyCodes: [27],
				callback: function() { dlg.close();  }
			}
		},
		callback: function() {
			g_env.clearTipsy();
		}
	});
	params.callback = function(res) {
		if(res.code == 200) {
			dlg.close();
			if(p_args.callback)
				p_args.callback(res);
		}
	}
	dlg.build();

	var fields = $(form).find('input').filter(':visible');
	if(fields.length) {
		$(fields[0]).putCursorAtEnd();
	}

	return form;
}

/**
	- p_args:
		- skeleton: the form descriptor
			- fields: field list
			- submit: submit field
			- params: for <form>
			- [groups]: key of group-title and value of array of field-names hash descriptor
		- params: extra parameters for form
		- [submit]: external submit field
		- [selections]: key-value pairs to select or set value to fields (key: field name)
		- [fieldsVisibility]: struct of field names to hide/show field rows {black:[], white:[]}
*/
function sForm(p_args)
{
    var tbl = table();
    var sform = form(p_args.skeleton.hasOwnProperty('params') ? p_args.skeleton.params : {});
	var formCont = tbl;
	var m_groups = p_args.skeleton.groups ? {} : 0;
	var m_currShowedGroup = 0;
	var m_groupHandler = p_args.skeleton.groups ? {curr:0, buttons:{}} : 0;
	p_args.fieldsVisibility = def(p_args.fieldsVisibility, {});
	Map.init(p_args.fieldsVisibility, {black:[], white:[]});

	if(p_args.skeleton.groups) {
		var tabController = div({class:'tabcontroller'});
		for(var name in p_args.skeleton.groups)
		{
			var title = p_args.skeleton.groups[name].title;
			var toggled = m_currShowedGroup == 0;
			if(m_currShowedGroup == 0) {
				m_currShowedGroup = name;
				m_groupHandler.curr = name;
			}
			m_groups[name] = {
				rows: [],
				show: function(isShow) {
					for(var i=0;i<this.rows.length;i++)
						this.rows[i].show(isShow);
				}
			};
			tabController.add(clButton({label:title, togglable: true, class: 'button3D tab_button',  toggled: toggled, groupId: name, groupHandler: m_groupHandler, callback: function(win) {
				var newGrp = win.getGroupId();
				if(m_currShowedGroup == newGrp)
					return;
				m_groups[newGrp].show(true);
				m_groups[m_currShowedGroup].show(false);
				m_currShowedGroup = newGrp;
			}}));
		}
		formCont = div(tabController, tbl);
		$(tbl).addClass('tabcontent');
	}

	sform.add(formCont);
	sform.rows = {};

	sform.disable = function()
	{
		sform.enable(false);
	}

	sform.enable = function(p_enable)
	{
		var enable = typeof p_enable == 'undefined' ? true : p_enable;

		for(var name in this.rows)
		{
			this.rows[name].form_field.disabled = !enable;
		}
	}

    for(var name in p_args.skeleton.fields)
	{
        var input_desc = p_args.skeleton.fields[name];
		if(input_desc.type  == 'hidden' || input_desc.hidden) {
			if(p_args.selections && p_args.selections.hasOwnProperty(name))
				input_desc.value = p_args.selections[name];
			var inp = input(input_desc);

			sform.add(inp);
			if(input_desc.name == 'form_token') {
				sform.setFormToken = function(p_val) {
					inp.value = p_val;
				}
			}

			continue;
		}
        var row = tr();
		if(input_desc.type == 'separator') {
			row.add(td(hr(),{colspan:2}));
		} else {
			var ftd = td();
			if(p_args.selections && p_args.selections.hasOwnProperty(name))
				input_desc.outer_selection = p_args.selections[name];
			var field = sField(input_desc, ftd);
			var label;
			if(input_desc.togglable) {
				field.hide();
				label = clTextButton({label:input_desc.label, onclick:function(e) { $(getTarget(e).parentNode.parentNode.form_field).slideToggle(); }});
			} else if(input_desc.label)
				label = input_desc.label;
			else if(input_desc.label === false)
				label = false;
			if(label)
				row.add(td(label));
			ftd.add(field);
			if(label === false)
				ftd.p('colspan', 2);
			if(input_desc.hasOwnProperty('maxlength')) {
				field.title = 'Characters left: ' + (field.p('maxlength') - field.value.length);
				$(field).tipsy({trigger: 'focus', gravity: 'w'});
				var charlefthandler = function(e) {
					this.title = 'Characters left: ' + (this.p('maxlength') - this.value.length);
					$(this).tipsy('show');
				}
				$(field).keyup(charlefthandler).keydown(charlefthandler).change(charlefthandler);
			}
			if(input_desc.hasOwnProperty('title')) {
				row.title = input_desc.title;
				$(row).tipsy({gravity: 'e', fade: true});
			}
			if(input_desc.hasOwnProperty('comment')) {
				if(input_desc.ori_type != 'checkbox')
					ftd.add(br());
				ftd.add(span(input_desc.comment, {class:'input_comment'}));
			}
			row.add(ftd);
			if(p_args.fieldsVisibility.black.indexOf(name) >= 0 || (p_args.fieldsVisibility.white.length && p_args.fieldsVisibility.white.indexOf(name) == -1))
				row.hide();

			if(p_args.skeleton.groups) {
				for(var gname in p_args.skeleton.groups) {
					if(p_args.skeleton.groups[gname].fields.indexOf(name) >= 0)
						m_groups[gname].rows.push(row);

					if(gname != m_currShowedGroup)
						row.hide();
				}
			}



			//well...
			field.form = sform;
			row.form_field = field;
			sform.rows[name] = row;
		}
        tbl.add(row);
    }

	p_args.submit = (p_args.submit || clButton({win: input(p_args.skeleton.submit)}));

	tbl.add(tr(td(p_args.submit, {colspan:2})));

	if(p_args.params) {
		for(var key in p_args.params) {
			sform[key] = p_args.params[key];
		}
	}

	sform.setError = function(p_field, p_isError, p_msg) {
		if(!this.rows.hasOwnProperty(p_field))
			return;
		var field = this.rows[p_field].form_field;

		field.title = (p_msg || '');
		$(field).tipsy({trigger: 'manual', gravity:'w'});
		$(field).tipsy(p_isError ? 'show' : 'hide');
		if(p_isError)
			field.addClass('bad_field');
		else
			field.removeClass('bad_field');
	}

	sform.onSubmitCallback = function() {
		if(p_args.submit.hasOwnProperty('disable'))
			p_args.submit.disable();
	}

	sform.callback = function(content) {
		var code = (content.code || 200);

		if(p_args.submit.hasOwnProperty('enable'))
			p_args.submit.enable();
		if(content.form) {
			var has_any_error = 0;
			for(var field_name in content.form.fields)
			{
				if(!content.form.fields[field_name])
					continue;

				var htmlFieldName = field_name;

				if(content.form.fields[field_name].multiple)
					htmlFieldName += '[]';

				var has_error = content.form.fields[field_name].hasOwnProperty('error');
				if(has_error)
					has_any_error = true;

				sform.setError(field_name, has_any_error, content.form.fields[field_name].error);
			}

			if(!Map.empty(content.form.errors)) {
				has_any_error = true;
				for(var name in content.form.errors) {
					if(g_form_error_renderers.hasOwnProperty(name))
						g_form_error_renderers[name](sform, content.form.errors[name]);
				}
			}

			console.log('Error is occured:', has_any_error);

			if(has_any_error && p_args.submit.hasOwnProperty('enable'))
				p_args.submit.enable();

			if(has_any_error && p_args.params.error_callback) {
				p_args.params.error_callback(content);
			}
		}
		if(p_args.params.callback)
			p_args.params.callback(content);
	}

	if(p_args.params.method && p_args.params.action)
		setAjaxSubmit(sform);

	if(m_groups)
		m_groups[m_currShowedGroup].show(true);

	sform._args = p_args;

    return sform;
}

var g_form_error_renderers = {
	unique_fields: function(form, field_sets) {
		for(var j = 0; j < field_sets.length; j++) {
			for(var i = 0; i < field_sets[j].length; i++) {
				var name = field_sets[j][i];
				if(!form.rows.hasOwnProperty(name)) //maybe hidden form. (TODO: must check this)
					continue;
				form.setError(name, true, 'These fields are contacted to be unique, but it is not!');
			}
		}
	}
}

function sField(p_desc, p_parent)
{
	switch(p_desc.type)
	{
		case 'custom':
			return p_desc.renderer();
		case 'range':
			var inp_start = input({type:'hidden', name:p_desc.name+'[start]'});
			var inp_end = input({type:'hidden', name:p_desc.name+'[end]'});
			var slider = div({style:'width: 300px;'});
			$(slider).slider({range: true, values: [p_desc.min, p_desc.max] ,min:p_desc.min, max:p_desc.max, change: function(event, ui) { console.log(event); }});
			return div(slider, inp_start, inp_end);
		case 'date':
			var val = parseInt(p_desc.value) > 100000 ? new Date(parseInt(p_desc.value)*1000).format('yyyy-MM-dd') : p_desc.value;
			var inp = input({type:'text', value:val || '', name:p_desc.name});
			$(inp).datepicker({dateFormat: "yy-mm-dd"});
			return inp;
		case 'order':
			var desc = p_desc;
			desc.type = 'text';
			if(!desc.placeholder)
				desc.placeholder = 'Format: 1.2.3.4';
			var inp = input(desc);
			$(inp).keydown(function(e) {
				var key;
				if(!e) e = window.event;
				if (e.keyCode) key = e.keyCode;
				else if (e.which) key = e.which;
				return (
				  key == 8 ||
				  key == 9 ||
				  key == 46 ||
				  key == 190 || //.
				  (key >= 37 && key <= 40) ||
				  (key >= 48 && key <= 57) ||
				  (key >= 96 && key <= 105));
			});
			return inp;
		case 'file':
			if(p_desc.hasOwnProperty('multiple'))
			{
				p_desc.name += '[]';
				var inp = input(p_desc);
				inp.hide();
				var list = tbody();
				var tbl = table(thead(tr('Filename','Filesize')), list, {class:'mini', cellpadding:0, cellspacing:0});
				tbl.hide();
				inp.theFiles = [];
				inp.refreshList = function(p_list)
				{
					inp.theFiles = p_list;
					list.clear();
					for(var i=0; i<inp.theFiles.length;i++){
						var file = inp.theFiles[i];
						list.add(tr(
							td(file.name),
							td(bytesToSize(file.size))
						));
					}
					tbl.show(inp.theFiles.length);
					if(p_desc.onBrowse)
						p_desc.onBrowse();
				}
				inp.onchange = function(e)
				{
					this.refreshList(inp.files);
				}
				p_desc.rows = list;
				p_desc.input = inp;

				return div(clButton({label:'Browse', callback: function() { $(inp).trigger('click'); }}), tbl, inp);
			} else {
				var inp = input(p_desc);
				return p_desc.nonull ? inp : span('Null:', input({type:'checkbox', name:p_desc.name+'_setnull', value:1}), inp);
			}
		case 'datetime':
			var val = parseInt(p_desc.value) > 100000 ? new Date(parseInt(p_desc.value*1000)).format('yyyy-MM-dd HH:mm') : p_desc.value;
			var inp = input({type:'text', value:val || '', name:p_desc.name});
			$(inp).datetimepicker({dateFormat: "yy-mm-dd"});
			p_desc.format = function(p_unix) {
				inp.value = new Date(p_unix*1000).format('yyyy-MM-dd HH:mm');
			}
			return inp;
		case 'text':
			if(p_desc.hasOwnProperty('outer_selection'))
				p_desc.value = p_desc.outer_selection;
			//html5 combobox
			if(p_desc.hasOwnProperty('list') && p_desc.list instanceof Array && typeof p_parent != 'undefined') {
				var listid = 'id'+randomString(8);
				p_parent.add(datalist(p_desc.list, {id: listid}));
				p_desc.list = listid;
			}
			return input(p_desc);
		case 'reset':
		case 'password':
		case 'submit':
		case 'hidden':
			if(p_desc.hasOwnProperty('outer_selection'))
				p_desc.value = p_desc.outer_selection;
			return input(p_desc);
		case 'checkbox':
			//TODO: fix this shit
			var cb = input({type:'checkbox'});
			p_desc.ori_type = p_desc.type;
			p_desc.type = 'hidden';
			var inp = input(p_desc);
			cb.checked = (inp.value || 0) == 1 ? true : false;
			cb.onchange = function() {
				//TODO: improve p_desc for use not only 0 or 1 value
				inp.value = this.checked ? 1 : 0;
			}
			return div(cb,inp, {style:'display: inline-block'});
		case 'number':
			var desc = p_desc;
			desc.type = 'text';
			var inp = input(desc);
			$(inp).keydown(function(e) {
				var key;
				if(!e) e = window.event;
				if (e.keyCode) key = e.keyCode;
				else if (e.which) key = e.which;
				return (
				  key == 8 ||
				  key == 9 ||
				  key == 46 ||
				  (key >= 37 && key <= 40) ||
				  (key >= 48 && key <= 57) ||
				  (key >= 96 && key <= 105));
			});
			return inp;
		case 'newpass':
			return newPassField(p_desc);
		case 'textarea':
			var val = '';
			if(p_desc.hasOwnProperty('value')) {
				val = p_desc.value;
				delete p_desc.value;
			}
			return textarea(p_desc, val);
		case 'select':
			var ops = (p_desc.options || {});
			var val = def(p_desc.value, null);
			delete p_desc.options;
			delete p_desc.value;
			if(p_desc.multiple)
				p_desc.name += '[]';
			var element = select(p_desc);

			if(typeof val != 'object' || val == null)
				val = [val];

			var sortable = [];

			if((ops instanceof Array))
				sortable = ops;
			else {
				for(var key in ops) {
					if(ops.hasOwnProperty(key))
						sortable.push([key, ops[key]]);
				}
			}

			switch(p_desc.sort) {
				case 'val':
					sortable.sort(function(a,b) { return strcmp(a[1], b[1]); });
					break;
				case 'key':
					sortable.sort(function(a,b) { return strcmp(a[0], b[0]); });
					break;
			}
			var hasSelected = false;
			for(var i=0;i<sortable.length;i++)
			{
				var key = sortable[i][0];
				var value = sortable[i][1];
				var opdesc = {value:key};

				if(p_desc.hasOwnProperty('outer_selection') && p_desc.outer_selection == parseInt(key) && (!hasSelected || p_desc.multiple)) {
					opdesc.selected = 'selected';
					hasSelected = true;
				} else
					for(var v=0;v<val.length;v++){
						if((!hasSelected || p_desc.multiple) && (val[v] == key || (key == '' && val[v] == null))) {
							opdesc.selected = 'selected';
							hasSelected = true;
						}
					}
				element.add(option(value,opdesc));
			}
			if(p_desc.multiple) {
				if(hasEnv())
					g_env.afterLoad(function() {
						if(!p_desc.allow_append) {
							$(element).chosen({display_selected_options: false});
							return;
						}
						//create chosen stuff, which is the next of this select, and we get the next element for store the chosen container
						var chosen_cont = $(element).chosen({no_results_text: 'Press enter to add:', display_selected_options: false}).next();
						var chosen_input = chosen_cont.find('input');

						chosen_input.keyup(function(e){
							var key;
							if(!e) e = window.event;
							if (e.keyCode) key = e.keyCode;
							else if (e.which) key = e.which;
							if(key != 13)
								return true;
							//the not found any result text is in a no-result classed element. if it present the user pressed an enter and not found any result
							if(!chosen_cont.find('.no-results').length)
								return true;

							var val = chosen_input.val();
							var option_val = 'new:'+val;
							if(p_desc.append_callback) {
								option_val = p_desc.append_callback(val);
							}
							if(option_val === false)
								return true;
							//add the new option to the select
							var op = option({value: option_val, selected: ''}, val);
							element.add(op);
							$(element).trigger("chosen:updated");
							stopEvent(e);
							return false;
						});
					});
				element.getSelectedValues = function() {
					var items = [];
					var children = this.childNodes;
					for(var i=0; i<children.length;i++) {
						if(children[i].selected)
							items.push(children[i].value);
					}
					return items;
				}
			}
			return element;
		case 'radio': //TODO:
			return input(p_desc);
	}
}

function newPassField(p_desc)
{
	p_desc.type = 'text';

	//in this case this is not a new pass
	if(p_desc.value && p_desc.value.length == 32) {
		delete p_desc.required;
		p_desc.value = '';
	} else
		p_desc.value = randomString(8);
	var field = input(p_desc);
	var gen = img({src:'/pic/regen16.png','class':'passregenbutton'});
	gen.onclick = function() {
		field.value = randomString(8);
	}
	return div(field,gen,{'class':'newpassfieldcont'});
}

function clLongTextContainer(p_text, p_showLen)
{
    p_text += ''; //stringize

	var showLen = def(p_showLen, 12);

	if(p_text.length < showLen*2)
		return p_text;

	var dot3 = span('...');
	var pre = span(p_text.substr(0,showLen), {title: 'Double click to show the whole text'});
	var post = span(p_text.substr(showLen)).hide();

	var cont = div(pre, dot3, post, {ondblclick: function() {
		dot3.toggle();
		post.toggle();
	}});

	$(pre).tipsy();

	return cont;
}

/*
	TODO: configurable the pager position such as top, left, bottom, right.
*/
function clTabulable(p_desc)
{
	var m_pageContainer = div({class: 'container'});
	var m_pager = div({class: 'pager'});
	var m_cont = div({class: 'clTabulable'}, m_pageContainer, m_pager);
	var m_currPage = -1;
	var m_pages = [];

	m_cont.getPage = function(p_idx)
	{
		if(p_idx < 0 || p_idx >= m_pages.length)
			return false;
		return m_pages[p_idx];
	}

	m_cont.hidePage = function(p_idx)
	{
		var page = this.getPage(p_idx);
		if(page === false)
			return;

		page.title.removeClass('active');
		page.cont.removeClass('active');
	}

	m_cont.showPage = function(p_idx)
	{
		var page = this.getPage(p_idx);
		if(page === false)
			return;
		page.title.addClass('active');
		page.cont.addClass('active');
		m_currPage = p_idx;
		p_desc.settings.set(p_desc.id, p_idx);
	}

	var firstPage = false;

	foreach(p_desc.pages, function(desc, i) {
		var page = div({class: 'page'}, desc.container);
		var title = div({class: 'title'}, desc.title);

		if(Map.def(desc, 'default', false) && firstPage == -1)
			firstPage = i;

		m_pages.push({title: title, cont: page});

		m_pageContainer.add(page);
		m_pager.add(title);

		title.onclick = function() {
			m_cont.hidePage(m_currPage);
			m_cont.showPage(i);
		}
	});

	m_cont.updateLayout = function()
	{
		var size = {
				width: $(m_cont).width(),
				height: $(m_cont).outerHeight() - $(m_pager).outerHeight()
			};

		m_pageContainer.css(size);

		foreach(p_desc.pages, function(desc, i) {
			desc.container.css(size);
		});
	}

	if(firstPage !== false)
		m_cont.showPage(firstPage);

	return m_cont;
}
function clMultiButtonBar(p_args)
{
	var m_win = div({class:'clMultiButtonBar'});
	var m_groupHandler = {curr: p_args.curr?p_args.curr:0, buttons:{}};

	for(var i=0;i<p_args.items.length;i++)
	{
		var item = p_args.items[i];
		var toggled = item.grpid == p_args.curr;

		var button = clButton({label: item.title, groupId: (p_args.groupped?item.grpid:false), groupHandler: m_groupHandler, toggled: toggled, togglable: true, class: 'button3D button', callback: function(btn){
			btn.desc.callback(btn);
		}});

		button.desc = item;
		m_win.add(button);
	}

	return m_win;
}

function clSubPageBar(p_args)
{
	for(var i=0;i<p_args.items.length;i++)
	{
		var item = p_args.items[i];
		item.callback = function(btn) {
			g_env.redirect(btn.desc.href);
		}
		item.grpid = item.href.split('?')[0];
	}
	p_args.curr = g_env.getPath();

	return clMultiButtonBar(p_args);
}

function clFlexPane(p_desc, p_paneManager)
{
	var m_cont = div({class:'content'}, p_desc.content);
	var m_icon = img({src: p_desc.icon ?  p_desc.icon : '/favico.png', class:'icon'});
	var m_slideButton = clImageButton({img:'/pic/Collapse-black-32.png', onclick:function(){ p_desc.slideContent(p_desc.layout.opened?0:1, false, true); }});
	var m_title = div({class:'caption'}, m_icon, typeof p_desc.title == 'function' ? p_desc.title(p_desc) : p_desc.title,
		div({class:'control'}, m_slideButton, ' ', clImageButton({img:'/pic/close.png', onclick:function(){ p_desc.show(0, true); }})));
	var m_boxIn = div({class:'box'}, m_title, m_cont);
	var m_box = div({class:'clFlexPane'}, m_boxIn);

	$(p_desc.content).addClass('clFlexPane_content');

	$(m_slideButton).attr('title', 'Collapse/expand this box').tipsy({gravity:'s'});

	var panes = {};

	p_desc.padding = {
		top: parseInt($(m_boxIn).css('marginTop')),
		left: parseInt($(m_boxIn).css('marginLeft')),
		bottom: parseInt($(m_boxIn).css('marginBottom')),
		right: parseInt($(m_boxIn).css('marginRight'))
	};

	p_desc.slideContent = function(p_open, p_quick, p_save)
	{
		this.layout.opened = p_open;
		$(m_boxIn).resizable('option', 'disabled', !this.layout.opened);
		if(p_save)
			p_paneManager.savePane(this);

		var h = p_open ? (this.layout ? this.layout.h : this.oriLayout.h) : ($(m_title).height()+p_desc.padding.top+p_desc.padding.bottom);

		if(p_quick)
			$(m_boxIn).height(h);
		else
			$(m_boxIn).animate({ height: h }, 400, 'easeOutExpo');

		m_slideButton.src = !p_open ? '/pic/Expand-black-32.png' : '/pic/Collapse-black-32.png';
	}

	p_desc.show = function(p_show, p_save)
	{
		this.layout.showed = p_show;
		m_box.show(p_show);
		if(p_save)
			p_paneManager.savePane(this);
	}

	p_desc.getRect = function()
	{
		var l = this.layout;
		return {
			vertical: {
				begin: l.y,
				end: l.y+l.h
			},
			horizontal: {
				begin: l.x,
				end: l.x+l.w
			}
		};
	}

	p_desc.defaultLayout = function()
	{
		var pos = $(m_box).position();
		return {
			x: pos.left,
			y: pos.top,
			w: $(m_boxIn).outerWidth(),
			h: $(m_boxIn).outerHeight(),
			opened: 1,
			showed: 1
		};
	}

	p_desc.update = function()
	{
		var boxin = $(m_boxIn);
		var cont = $(m_cont);
		cont.width(this.layout.w);
		cont.height(this.layout.h-$(m_title).outerHeight());
		boxin.width(this.layout.w);
		boxin.height(this.layout.h);
		$(m_box).css({
			left: this.layout.x+'px',
			top: this.layout.y+'px'
		});
		this.show(this.layout.showed, false);
		this.slideContent(this.layout.opened, true, false);
	}
	var grid = 10;

	$(m_boxIn).resizable({
		alsoResize: m_cont,
		resize: function(ev, ui) {
			if(p_paneManager.onResize)
				p_paneManager.onResize(p_desc);
		},
		stop: function(ev, ui) {
			if(!p_desc.layout) p_desc.layout = {w:0,h:0};
			p_desc.layout.w = p_desc.layout.opened ? $(m_boxIn).outerWidth() : p_desc.oriLayout.w;
			p_desc.layout.h = p_desc.layout.opened ? $(m_boxIn).outerHeight() : p_desc.oriLayout.h;
			p_paneManager.savePane(p_desc);
		}
	});
	var help = 'Double click: stretch this box to the closest one!';

	$(m_boxIn).find('.ui-resizable-s').dblclick(function() {
		p_paneManager.stretchToNext(p_desc, 'vertical');
	}).attr('title', help);
	$(m_boxIn).find('.ui-resizable-e').dblclick(function() {
		p_paneManager.stretchToNext(p_desc, 'horizontal');
	}).attr('title', help);
	$(m_boxIn).find('.ui-resizable-se').dblclick(function() {
		p_paneManager.stretchToNext(p_desc, 'vertical');
		p_paneManager.stretchToNext(p_desc, 'horizontal');
	}).attr('title', help);

	$(m_box).draggable({
		snap: true,
		containment: "parent",
		handle:'.caption',
		drag: function(e, ui) {
			if(p_paneManager.onDrag)
				p_paneManager.onDrag(p_desc);
		},
		start: function(ev, ui) {
			m_boxIn.addClass('lifted');
		},
		stop: function(ev, ui) {
			if(!p_desc.layout) p_desc.layout = {x:0,y:0};
			p_desc.layout.x = ui.position.left;
			p_desc.layout.y = ui.position.top;
			m_boxIn.removeClass('lifted');
			p_paneManager.savePane(p_desc);
		}
	});

	return m_box;
}

function box()
{
	return clBox({title: arguments[0], children: Array.prototype.slice.call(arguments).slice(1)}); //retard javascript: "arguments is not an actual JavaScript array ..."
}

function clBox(p_args)
{
	var title = (p_args.title || 'Box');
	var m_caption = div(title, {class:'box_caption'})
	var m_cont = div({class:'box_container'});
	var m_addToNavi = p_args.hasOwnProperty('navi') ? p_args.navi : true;
	p_args.class = p_args.class || {};
	var m_win = div(m_caption, m_cont, {class: p_args.class.carrier ? p_args.class.carrier : 'box_carrier'});

	for(var i=0;i<p_args.children.length;i++)
	{
		m_cont.add(p_args.children[i]);
	}

	m_win.getCaption = function()
	{
		return m_caption;
	}

	m_caption.onclick = function()
	{
		var state = $.cookie(m_win.getCookieKey());

		$(m_cont).slideToggle('fast', function() {
			if(m_win.onSlideDown && state == '0')
				m_win.onSlideDown();
			else if(m_win.onSlideUp && state == '1')
				m_win.onSlideUp();
		});
		$.cookie(m_win.getCookieKey(), state == '0' ? '1' : '0'); //retard javascript
	}

	m_win.getCookieKey = function()
	{
		return 'box_' + title + '_' + g_env.getFullPath();
	}

	m_win.add = function()
	{
		for(var idx = 0; idx < arguments.length; idx++)
		{
			var arg = arguments[idx];
			if(isElement(arg)) {
				m_cont.appendChild(arg);
				continue;
			}
			m_cont.appendChild(window[p_preferredChild](arg));
		}
	}

	if(typeof g_naviPanel != 'undefined' && m_addToNavi) {
		g_naviPanel.addItem({label:title, element:m_win});
	}

	if(p_args.close) {
		$.cookie(m_win.getCookieKey(), '0');
		m_cont.hide();
	}

	if(hasEnv() && m_addToNavi)
	{
		var opened = ($.cookie(m_win.getCookieKey()) || '1');
		if(opened == '0') {
			m_cont.hide();
		}
		$.cookie(m_win.getCookieKey(), opened);
	}

	return m_win;
}

function quickSearchField(p_args)
{
	var tid = 0;
	var wait = Map.def(p_args, 'wait', 400);
	var waitValue = div({class:'value'});
	var minLimit = Map.def(p_args, 'minLimit', 3);
	var value = decodeURIComponent(Map.def(p_args, 'value', ''));
	var lastVal = value;
	var inp = input({
		type: 'text',
		placeholder: (p_args.placeholder || 'Search'),
		name: (p_args.name || 'search'),
		class: (p_args.class || ''),
		style: (p_args.style || ''),
		value: value,
		onkeyup: function(e){
			var key;
			if(!e) e = window.event;
			if (e.keyCode) key = e.keyCode;
			else if (e.which) key = e.which;
			if(inp.value == lastVal && key != 13)
				return;
			lastVal = inp.value;
			clearTimeout(tid);
			waitValue.style.width = '0px';
			$(waitValue).stop();
			if(inp.value.length < minLimit)
				return;
			if(key == 13 || wait == 0) {
				p_args.callback(inp.value);
			} else {
				$(waitValue).animate({width: '99%'}, wait, 'linear');
				tid = setTimeout(function(){
					p_args.callback(inp.value);
				}, wait);
			}
		}
	});
	if(value)
		g_env.afterLoad(function() { inp.focus(); inp.setSelectionRange(value.length, value.length); });

	var cont = div({class:'quicksearch'}, inp, br(), div({class: 'wait'}, waitValue));
	cont.setValue = function(p_val)
	{
		inp.value = p_val;
	}
	return cont;
}
