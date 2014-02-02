var TreeViewer = {
	item: function(p_data)
	{
		var cont = div({class: 'tree_item face'});

		if(p_data.hasOwnProperty('id'))
			cont.p('dbId', p_data.id);

		var nameCont = div({class: 'name'}, p_data.name);

		var iconCont = div({class: 'image'}, img({src: p_data.image}), p_data.label ? div({class: 'label'}, p_data.label) : null);

		cont.add(iconCont, nameCont, (p_data.desc ? div({class: 'desc'}, p_data.desc) : null));

		var waitForDomReady = 0;

		var update = function()
		{
			if(++waitForDomReady < 2)
				return;
			nameCont.css({maxWidth: $(cont).width() - $(iconCont).outerWidth() - parseInt(nameCont.css('marginRight'))});
			if(nameCont.scrollWidth > $(nameCont).width())
				$(cont.p('title', p_data.name)).tipsy({gravity: 's', fade: true, opacity: 0.9});
		}

		$(iconCont).find('img').load(update);
		p_data.parent.eventMgr.subscribe('onListItemUpdated', update);

		if(p_data.menu && p_data.menu.length) {
			cont.oncontextmenu = function() {
				if(window.location.search == '?nocontextmenu')
					return true;
				var contextMenu = new clMenu({
					destroyAfterHide: true,
					link_handler: function(p_href) {
						g_env.data.request(p_href.cmd, p_href.params);
					}
				});
				foreach(p_data.menu, function(m) {
					contextMenu.appendItem(m);
				});
				contextMenu.popup();
				return false;
			}
		}

		return cont;
	},
	directOpenableHandler: function(p_cont, p_data, p_typeDesc, p_onPanelGenerated)
	{
		var typeDesc = def(p_typeDesc, {});

		p_cont.generateList = function()
		{
			var aid = p_data.type+'_'+p_data.id;

			if(!p_data.parent.hasNode(aid)) {
				var list = TreeViewer.listItem({list: p_data.items, parent: p_data.parent}, p_data.parent.renderers, typeDesc.getGrouping ? typeDesc.getGrouping() : {});
				list.p('id', aid);
				p_data.parent.addNode({title: p_data.name, id: aid, container: list});
				if(p_onPanelGenerated)
					p_onPanelGenerated(list);
			}

			return aid;
		}

		p_cont.onclick = function()
		{
			p_data.parent.switchNextNode(this.generateList());
		}
	},
	directOpenableItem: function(p_data, p_typeDesc)
	{
		var m_cont = this.item(p_data);

		this.directOpenableHandler(m_cont, p_data, p_typeDesc);

		return m_cont;
	},
	listItem: function(p_data, p_itemProcess, p_grouping, p_sortName)
	{
		var grouping = def(p_grouping, {});

		if(p_sortName) {
			//var s = new Date();
			sortNames = p_sortName instanceof Array ? p_sortName : [p_sortName];
			//'casue this list is a reference for the original, need to clone it...
			p_data.list = clone(p_data.list);
			//console.log((new Date()).getTime()-s);
			p_data.list.sort(function(a, b){
				var res = 0;
				foreach(sortNames, function(name) {
					res = g_descriptors.sortMethods[typeof a[name]](a[name],b[name]);
					if(res != 0)
						return false;
				});
				return res;
			});
		}

		if(grouping.hasOwnProperty('name') && grouping.limit !== '' && p_data.list.length > grouping.limit)
			return this.listItemGrouped(p_data, p_itemProcess, grouping.name);
		else
			return this.listItemMixed(p_data, p_itemProcess);
	},
	listItemBase: function(p_data)
	{
		var m_cont = div({class: 'tree_list'});

		m_cont.search = function(p_items, p_val)
		{
			var val = p_val.toLowerCase();

			foreach(p_items, function(desc) {
				if(!p_val.length) {
					desc.container.show();
					return;
				}
				var found = foreach(desc.data, function(value, key) {
					if(!(typeof value == 'string'))
						return;
					if(value.toLowerCase().indexOf(val) != -1)
						return false;
				}) === false;
				desc.container.show(found);
			});
		}

		m_cont.filter = function(p_item)
		{
			if(!p_data.filter || typeof p_data.filter != 'object')
				return false;
			for(var name in p_data.filter) {
				var res = p_data.filter[name](p_item);
				if(res)
					return true;
			}
			return false;
		}

		return m_cont;
	},
	listItemMixed: function(p_data, p_itemProcess)
	{
		var m_cont = this.listItemBase(p_data);
		var m_items = [];
		var m_currHighLightedItem = -1;

		foreach(p_data.list, function(item) {
			if(m_cont.filter(item))
				return;
			var renderer = typeof p_itemProcess == 'object' ? p_itemProcess[item.type] : p_itemProcess;
			var cont = renderer(item);
			m_items.push({data: item, container: cont});
			m_cont.add(cont);
		});

		$(m_cont).mCustomScrollbar({
			contentTouchScroll: true,
			autoHideScrollbar: true,
			mouseWheelPixels: 200
		});

		p_data.parent.eventMgr.subscribe('onListItemUpdated', function() {
			$(m_cont).mCustomScrollbar("update");
		});

		m_cont.onQuickSearch = function(p_val)
		{
			this.search(m_items, p_val);
		}

		m_cont.getItem = function(p_idx)
		{
			if(p_idx >= 0 && p_idx < m_items.length)
				return m_items[p_idx];
			return false;
		}

		m_cont.resetHighlight = function()
		{
			if(m_currHighLightedItem >= 0)
				this.getItem(m_currHighLightedItem).container.removeClass('highlighted');
			m_currHighLightedItem = -1;
		}

		m_cont.highlightItem = function(p_idx)
		{
			var item = this.getItem(p_idx);
			if(item === false)
				return;

			if(m_currHighLightedItem == p_idx)
				return;

			if(m_currHighLightedItem >= 0)
				this.getItem(m_currHighLightedItem).container.removeClass('highlighted');
			var cont = $(item.container);
			cont.addClass('highlighted');

			if(g_config.music_lists.auto_scroll)
			{
				var scrollContTop = $(m_cont).find('.mCSB_container').position().top;
				var to = cont.position().top - $(m_cont).height() + cont.outerHeight();

				if(cont.position().top + scrollContTop < 0)
					$(m_cont).mCustomScrollbar('scrollTo', cont.position().top); //items at the top
				else if(to + scrollContTop > 0)
					$(m_cont).mCustomScrollbar('scrollTo',  to); //items at the bottom
			}

			m_currHighLightedItem = p_idx;
		}

		m_cont.updateLayout = function() {};

		return m_cont;
	},
	listItemGrouped: function(p_data, p_itemProcess, p_groupingName)
	{
		var m_tagCont = div({class: 'tags'});
		var m_list = div({class: 'list'});
		var m_cont = this.listItemBase(p_data).add(m_tagCont, m_list);
		var m_tags = {};
		var m_letters = {};
		var m_currGroupLetter = -1;
		var m_css = {};

		foreach(p_data.list, function(item) {
			var letter = item[p_groupingName][0];
			if(!letter)
				return;

			letter = letter.toUpperCase();

			if(letter == ' ')
				return;

			if(!m_letters.hasOwnProperty(letter)) {
				m_letters[letter] = {
					count: 0,
					cont: null,
					items: []
				};
			}
			m_letters[letter].count++;
			m_letters[letter].items.push({data: item});
		});

		var generateGroup = function(p_desc)
		{
			p_desc.cont = div().hide();

			m_list.add(p_desc.cont);

			foreach(p_desc.items, function(item) {
				var renderer = typeof p_itemProcess == 'object' ? p_itemProcess[item.data.type] : p_itemProcess;
				item.container = renderer(item.data);
				p_desc.cont.add(item.container);
			});

			$(p_desc.cont).css(m_css).mCustomScrollbar({
				contentTouchScroll: true,
				autoHideScrollbar: true,
				mouseWheelPixels: 200
			});

			p_data.parent.eventMgr.subscribe('onListItemUpdated', function() {
				$(p_desc.cont).mCustomScrollbar("update");
			});
		}

		var lettersArr = Map.keys(m_letters);

		lettersArr.sort();

		foreach(lettersArr, function(letter) {
			var tagCont = div(letter, {class: 'letter', onclick: function() {
				hideGroup(m_currGroupLetter);
				showGroup(letter);
			}});

			m_tags[letter] = tagCont;

			m_tagCont.add(tagCont);
		});

		var hideGroup = function(p_letter)
		{
			m_letters[p_letter].cont.hide();
			m_tags[p_letter].removeClass('active');
		}

		var showGroup = function(p_letter)
		{
			var desc = m_letters[p_letter];

			if(!desc.cont)
				generateGroup(desc);

			desc.cont.show();
			m_tags[p_letter].addClass('active');
			m_currGroupLetter = p_letter;

			m_cont.onQuickSearch('');
			if(m_cont.setQuickSearchValue)
				m_cont.setQuickSearchValue('');

			p_data.parent.eventMgr.notify('onListItemUpdated');
		}

		m_cont.onQuickSearch = function(p_val)
		{
			var desc = m_letters[m_currGroupLetter];
			this.search(desc.items, p_val);
		}

		m_cont.updateLayout = function()
		{
			m_css = {
				width: $(m_cont).width() - $(m_tagCont).width(),
				height: $(m_cont).height(),
				overflow: 'hidden'
			};

			$(m_list).css(m_css);
			$(m_tagCont).height($(m_cont).height());

			for(var l in m_letters) {
				if(m_letters[l].cont)
					$(m_letters[l].cont).css(m_css);
			}
		}

		$(m_tagCont).bind('mousewheel',function(ev, delta) {
			var scrollTop = $(this).scrollTop();
			$(this).scrollTop(scrollTop-Math.round(delta*50));
		});

		if(lettersArr.length)
			showGroup(lettersArr[0]);

		m_cont.highlightItem = function(p_idx)
		{
			throw 'Not implemented.';
		}

		m_cont.getItem = function(p_idx)
		{
			throw 'Not implemented.';
		}

		return m_cont;
	},
	container: function(p_args)
	{
		var m_cont = widget(p_args).addClass('tree_container');
		var m_menuBar = div({class: 'menubar'});
		var m_breadcrumbs = div({class: 'breadcrumbs'});
		var m_header = div({class: 'header'}, m_menuBar, m_breadcrumbs);
		var m_nodesCont = div({class: 'nodes'});
		var m_nodes = {};
		var m_path = [];
		var m_quickSearch = null;

		m_cont.eventMgr = new EventManager();

		foreach(p_args.menubar, function(menu) {
			var cb = menu.cmd ? function() { g_env.data.request(menu.cmd); } : (menu.callback ? menu.callback : function() { console.error('Menu callback or cmd is not defined'); })
			m_menuBar.add(clButton({label: menu.title, callback: cb, class: 'miniButton3D'}), ' ');
		});

		if(Map.def(p_args, 'quick_search', false))
		{
			m_quickSearch = quickSearchField({minLimit: 0, placeholder: 'Filter', class: 'tiny', wait: 0, callback: function(val) {
				if(!m_path.length)
					return;
				var id = m_path.last().id;
				if(!m_nodes.hasOwnProperty(id))
					return;

				m_nodes[id].quickSearchValue = val;
				m_nodes[id].container.onQuickSearch(val);
			}});
			m_menuBar.add(m_quickSearch);
		}

		m_cont.reset = function()
		{
			m_nodes = {};
			m_path = [];
			m_nodesCont.clear();
			this.updateBreadcrumbs();
			m_cont.eventMgr.notify('onListItemUpdated');
		}

		m_cont.updateQuickSearchField = function(p_id)
		{
			if(m_quickSearch)
				m_quickSearch.setValue(m_nodes[p_id].quickSearchValue);
		}

		m_cont.switchNextNode = function(p_id)
		{
			if(!m_nodes.hasOwnProperty(p_id))
				return;

			var node = m_nodes[p_id];
			var cont = $(node.container);
			node.container.show();
			cont.css('marginLeft', 0);
			if(node.container.onShow)
				node.container.onShow();

			if(m_path.length)
				this.hideNode(m_path.last().id);

			m_path.push({id: p_id, title: node.title});
			this.updateBreadcrumbs();
			this.updateQuickSearchField(p_id);
			m_cont.eventMgr.notify('onListItemUpdated');
		}

		m_cont.getPathOfNodes = function()
		{
			if(!m_path.length)
				return false;

			var path = [];
			foreach(m_path, function(part) {
				path.push(part.id);
			});

			return path;
		}

		m_cont.switchPrevNode = function(p_id)
		{
			if(!m_path.length)
				return;

			var animLen = 200;

			var idx = -1;
			foreach(m_path, function(part, i) {
				if(part.id == p_id) {
					idx = parseInt(i);
					return false;
				}
			});

			if(idx < 0)
				return;

			var curr = m_path.last();
			if(curr.id == p_id)
				return;

			var cont = $(m_nodes[p_id].container);
			m_nodes[p_id].container.show();
			if(m_nodes[p_id].container.onShow)
				m_nodes[p_id].container.onShow();

			cont.animate({
					marginLeft: 0
				}, animLen, 'swing', function() {
					m_nodes[curr.id].container.hide();
				});

			m_path.splice(idx+1, m_path.length);

			this.updateBreadcrumbs();
			this.updateQuickSearchField(p_id);
			m_cont.eventMgr.notify('onListItemUpdated');
		}

		m_cont.hideNode = function(p_id)
		{
			if(!m_nodes.hasOwnProperty(p_id))
				return;

			var cont = $(m_nodes[p_id].container);

			cont.animate({
					marginLeft: -1 * cont.outerWidth()
				}, 200, 'swing', function() {
					cont.hide();
				});
		}

		m_cont.hasNode = function(p_id)
		{
			return m_nodes.hasOwnProperty(p_id);
		}

		m_cont.updateBreadcrumbs = function()
		{
			var parts = [];
			var title = [];
			foreach(m_path, function(part) {
				parts.push(clTextButton({label: part.title, onclick: function() {
					m_cont.switchPrevNode(part.id);
				}}));
				title.push(part.title);
			});
			m_breadcrumbs.set(parts.quilt(' > '));

			//only show the tooltip when it overflowed the breadcrumbs container
			if($(m_breadcrumbs).width() < m_breadcrumbs.scrollWidth)
				m_breadcrumbs.p('title', title.join(' > '));
			else {
				//$(m_breadcrumbs).tipsy("hide");
				m_breadcrumbs.p('original-title', '');
			}
		}

		m_cont.back = function()
		{

		}

		m_cont.addNode = function(p_desc)
		{
			if(!Map.size(m_nodes)) {
				m_nodesCont.css({width: 1000}); //TODO...  if Map.size(m_nodes) == 2 updateLayout: $(p_desc.container).outerWidth() * 2
			}

			m_nodesCont.add(p_desc.container);

			var h = $(m_header).outerHeight(true);

			var updateLayout = function() {
				$(p_desc.container).css({
					width: $(m_cont).width(),
					height: $(m_cont).height() - $(m_header).outerHeight(true),
					overflow: 'hidden'
				});

				p_desc.container.updateLayout();
			}

			if(h < 10) { //the element is not the part of the DOM yet
				m_cont.eventMgr.subscribe('onDomReady', function() {
					updateLayout();
				});
			}

			updateLayout();

			p_desc.quickSearchValue = '';
			p_desc.container.setQuickSearchValue = function(p_val)
			{
				p_desc.quickSearchValue = p_val;
				m_quickSearch.setValue(p_val);
			}

			p_desc.container.hide();

			m_nodes[p_desc.id] = p_desc;
		}

		m_cont.getNode = function(p_id)
		{
			if(this.hasNode(p_id))
				return m_nodes[p_id];
			else
				return false;
		}

		m_cont.updateLayout = function()
		{
			m_breadcrumbs.css({width: $(m_header).width()});
			$(m_breadcrumbs).tipsy({
				gravity: 's',
				fade: true,
				opacity: 0.9,
			});
		}

		m_cont.eventMgr.subscribe(['onDomReady','onLayoutChanged'], m_cont.updateLayout);

		$(m_breadcrumbs).bind('mousewheel',function(ev, delta) {
			var scrollLeft = $(this).scrollLeft();
			$(this).scrollLeft(scrollLeft-Math.round(delta*50));
		});

		return m_cont.add(m_header, m_nodesCont);
	}
}
