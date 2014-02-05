
var Library = {
	types: {
		artist: {
			getter: 'library_get_artists',
			nodeName: 'artists',
			parse: function(p_idList) {
				for(var a = 0; a < Library.data.albums.length; ++a) {
					var album = Library.data.albums[a];
					if(!album.artist_id)
						continue;
					var artist = Library.data.artists[Library.idToIdxMap.artists[album.artist_id]];
					if(!(artist.albums instanceof Array))
						artist.albums = [];
					artist.albums.push(album);
				}
			}
		},
		album: {
			getter: 'library_get_albums',
			nodeName: 'albums',
			parse: function(p_idList) {
				for(var a = 0; a < Library.data.files.length; ++a) {
					var file = Library.data.files[a];
					if(file.album_id) {
						var album = Library.data.albums[Library.idToIdxMap.albums[file.album_id]];
						if(!(album.files instanceof Array))
							album.files = [];
						album.files.push(file);
					}

					var directory = Library.data.directories[Library.idToIdxMap.directories[file.directory_id]];
					if(!(directory.items instanceof Array))
						directory.items = [];
					directory.items.push(file);
				}
			}
		},
		file: {
			getter: 'library_get_files',
			nodeName: 'files',
			parse: function() {}
		},
		directory: {
			getter: 'library_get_directories',
			nodeName: 'directories',
			parse: function(p_idList) {
				for(var a = 0; a < Library.data.directories.length; ++a) {
					var dir = Library.data.directories[a];
					if(!dir.parent_id)
						continue;
					var parent_dir = Library.data.directories[Library.idToIdxMap.directories[dir.parent_id]];
					if(!(parent_dir.items instanceof Array))
						parent_dir.items = [];
					parent_dir.items.push(dir);
				}
			}
		},
		playlist: {
			getter: 'library_get_playlists',
			nodeName: 'playlists',
			parse:	function(p_idList) {
				var idList = def(p_idList, []);
				for(var a = 0; a < Library.data.playlists.length; ++a) {
					if(idList.length && idList.indexOf(Library.data.playlists[a].id) == -1)
						continue;
					var pl = Library.data.playlists[a];
					var items = [];
					for(var b = 0; b < pl.items.length; ++b) {
						var item = pl.items[b];
						if(item.hasOwnProperty('item_id')) { //this item has been parsed alredy
							var libItem = Library.get(item.type, item.item_id);
							libItem.list_item_id = item.id;
							libItem.list_id = pl.id;
							items.push(libItem);
						} else
							items.push(item);
					}
					pl.items = items;
				}
			}
		},
	},
	getNodeName: function(p_type) {
		if(!Library.types.hasOwnProperty(p_type))
			throw "Unknown library node! ("+p_type+")";
		return Library.types[p_type].nodeName;
	},
	get: function(p_type, p_id) {
		var node = Library.getNodeName(p_type);
		if(!Library.idToIdxMap[node].hasOwnProperty(p_id))
			throw "Id: '"+p_id+"' not found in the '"+node+"' library!";
		var idx = Library.idToIdxMap[node][p_id];
		if(idx < 0 || idx >= Library.data[node].length)
			throw "Wrong index ("+idx+") in the '"+node+"' library!";
		return Library.data[node][idx];
	},
	set: function(p_type, p_id, p_data) {
		var node = Library.getNodeName(p_type);
		var idx = false;
		if(Library.idToIdxMap[node].hasOwnProperty(p_id)) {
			idx = Library.idToIdxMap[node][p_id];
			Library.data[node][idx] = p_data;
		} else {
			var len = Library.data[node].push(p_data);
			Library.idToIdxMap[node][p_id] = len-1;
		}
		Library.types[p_type].parse([p_id]);
		var isNew = idx === false;
		Library.agent.notify(isNew ? 'add' : 'change', p_type, isNew ? -1 : p_id, p_data);
	},
	remove: function(p_type, p_id) {
		var node = Library.getNodeName(p_type);
		if(!Library.idToIdxMap[node].hasOwnProperty(p_id))
			return false;
		var idx = Library.idToIdxMap[node][p_id];
		if(idx < 0 || idx >= Library.data[node].length)
			throw "Wrong index ("+idx+") in the '"+node+"' library!";
		Library.data[node].splice(idx, 1);
		Library.reindex(node);
		Library.agent.notify('remove', p_type, p_id);
	},
	reindex: function(p_node) {
		var idxs = {};
		foreach(Library.data[p_node], function(item, idx) {
			idxs[item.id] = idx;
		});
		Library.idToIdxMap[p_node] = idxs;
	},
	agent: {
		subscribers: {},
		subscribe: function(p_type, p_name, p_id, p_callback, p_obj) {
			var types = arrayize(p_type);
			var names = arrayize(p_name);
			var ids = arrayize(p_id);
			var subscribers = Library.agent.subscribers;

			foreach(types, function(type) {
				foreach(names, function(name) {
					foreach(ids, function(id) {
						Map.init_arr(subscribers, [type, name, id], []);
						subscribers[type][name][id].push({func: p_callback, object: def(p_obj, null)});
					});
				});
			});
		},
		notify: function(p_type, p_name, p_id, p_data) {
			var subscribers = Library.agent.subscribers;

			if(!subscribers.hasOwnProperty(p_type))
				return;
			if(!subscribers[p_type].hasOwnProperty(p_name))
				return;
			if(!subscribers[p_type][p_name].hasOwnProperty(p_id))
				return;

			foreach(subscribers[p_type][p_name][p_id], function(callback) {
				if(callback.object)
					callback.func.call(callback.object, p_data, p_type, p_name, p_id);
				else
					callback.func(p_data, p_type, p_name, p_id);
			});
		},
	},
	/*
		The data field is storing the items in an array because in large amount the iterating of an array is more faster than on map.
		Nevertheless the accessing to one item is more faster on a map, therefore the Library builds a map to find the array index for the corresponding data id.
	*/
	data: {},
	idToIdxMap: {},
}
