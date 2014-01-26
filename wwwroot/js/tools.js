function hasEnv() { return typeof g_env != 'undefined'; }

function dGE(id){return document.getElementById(id);}
function dCE(type){return document.createElement(type);}
function dTE(text) {return document.createTextNode(text); }
function iadd(win,itemname,html) {
	var el = dCE(itemname);
	el.innerHTML = html;
	win.appendChild(win);
}
function def(p_var, p_default)
{
	return (typeof p_var == 'undefined') ? p_default : p_var;
}
function pathInfo(filename)
{
	var arr = filename.split('.');
	var res = {
		filename:	filename,
		extension:	''
	};
	if(arr.length < 2) return res;
	if(arr[0].length < 1) return res;
	res.extension = arr.pop();
	res.filename = arr.join('.');
	return res;
}
function str_url_friendly(str)
{ return str.replace(/[^a-zA-Z0-9_\-\.]/,'_'); }
function getClientSize()
{
	var w = document.compatMode=='CSS1Compat' && !window.opera?document.documentElement.clientWidth:document.body.clientWidth;
	var h = document.compatMode=='CSS1Compat' && !window.opera?document.documentElement.clientHeight:document.body.clientHeight;
	return {w:w,h:h};
}
function value(object,key,default_value)
{
	return object ? (object.hasOwnProperty(key) ? object[key] : default_value) : default_value;
}
function SearchElement(parent,element)
{
	if(parent == element) return true;
	if(parent.hasChildNodes() == false) return false;
	for(var a=0;a<parent.childNodes.length;a++) {
		var res = SearchElement(parent.childNodes[a],element);
		if(res) return true;
	}
	return false;
}
function toggle_text(id)
{ tt(id); }
function tt(id)
{ $('#'+id).toggle(); }
function makeQueryStr(qsarr)
{
	qs = '';
	for(var key in qsarr){
		qs += key + '=' + encodeURIComponent(qsarr[key]) + '&';
	}
	qs = qs.slice(0,-1);
	return qs;
}
function parseQueryStr(str)
{
	if(str.length < 2)
		return {};
	var data = {};
	var arr = str.split('?');
	var qs = arr.length > 1 ? arr[1] : arr[0];
	var params = qs.split('&');
	for(var a=0;a<params.length;a++) {
		var pa = params[a].split('=');
		data[pa[0]] = pa[1];
	}
	return data;
}
function parsePath(p_str)
{
	return {params: parseQueryStr(p_str), path: splitpath(p_str)};
}
function splitpath(p_path)
{
	var arr = p_path.split('?');
	var path_arr = arr[0].split('/');
	path_arr.clean('');
	return path_arr;
}
var Base64 = {
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	// public method for encoding

	encodeBinary: function (input) {
		var output = "";
		var bytebuffer;
		var encodedCharIndexes = new Array(4);
		var inx = 0;
		var paddingBytes = 0;

		while (inx < input.length) {
			// Fill byte buffer array
			bytebuffer = new Array(3);
			for (jnx = 0; jnx < bytebuffer.length; jnx++)
				if (inx < input.length)
					bytebuffer[jnx] = input.charCodeAt(inx++) & 0xff; // throw away high-order byte, as documented at: https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data
				else
					bytebuffer[jnx] = 0;

			// Get each encoded character, 6 bits at a time
			// index 1: first 6 bits
			encodedCharIndexes[0] = bytebuffer[0] >> 2;
			// index 2: second 6 bits (2 least significant bits from input byte 1 + 4 most significant bits from byte 2)
			encodedCharIndexes[1] = ((bytebuffer[0] & 0x3) << 4) | (bytebuffer[1] >> 4);
			// index 3: third 6 bits (4 least significant bits from input byte 2 + 2 most significant bits from byte 3)
			encodedCharIndexes[2] = ((bytebuffer[1] & 0x0f) << 2) | (bytebuffer[2] >> 6);
			// index 3: forth 6 bits (6 least significant bits from input byte 3)
			encodedCharIndexes[3] = bytebuffer[2] & 0x3f;

			// Determine whether padding happened, and adjust accordingly
			paddingBytes = inx - (input.length - 1);
			switch (paddingBytes) {
				case 2:
					// Set last 2 characters to padding char
					encodedCharIndexes[3] = 64;
					encodedCharIndexes[2] = 64;
					break;
				case 1:
					// Set last character to padding char
					encodedCharIndexes[3] = 64;
					break;
				default:
					break; // No padding - proceed
			}
			// Now we will grab each appropriate character out of our keystring
			// based on our index array and append it to the output string
			for (jnx = 0; jnx < encodedCharIndexes.length; jnx++)
				output += this._keyStr.charAt(encodedCharIndexes[jnx]);
		}
		return output;
	},

	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
		input = Base64._utf8_encode(input);
		while (i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
		}
		return output;
	},
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		while (i < input.length) {
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			output = output + String.fromCharCode(chr1);
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
		}
		output = Base64._utf8_decode(output);
		return output;
	},
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	},
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
		while ( i < utftext.length ) {
			c = utftext.charCodeAt(i);
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
	}
}
function pathInfo(filename)
{
	var arr = filename.split('.');
	var res = {
		filename:	filename,
		extension:	''
	};
	if(arr.length < 2) return res;
	if(arr[0].length < 1) return res;
	res.extension = arr.pop();
	res.filename = arr.join('.');
	return res;
}

function str_url_friendly(str)
{
	return str.replace(/[^a-zA-Z0-9_\-\.]/,'_');
}
function SearchElement(parent,element)
{
	if(parent == element) return true;

	if(parent.hasChildNodes() == false) return false;

	for(var a=0;a<parent.childNodes.length;a++) {
		var res = SearchElement(parent.childNodes[a],element);
		if(res) return true;
	}

	return false;
}
function clone(o) {
	return eval('(' + JSON.stringify(o) + ')');
}
function html_entity_decode(str)
{
	return $("<div/>").html(str).text();
}
function bytesToSize(bytes, precision)
{
	precision = (precision || 1);

	var kilobyte = 1024;
	var megabyte = kilobyte * 1024;
	var gigabyte = megabyte * 1024;
	var terabyte = gigabyte * 1024;
	var petabyte = terabyte * 1024;
	if ((bytes >= 0) && (bytes < kilobyte)) {
		return bytes + ' B';
	} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
		return (bytes / kilobyte).toFixed(precision) + ' KB';
	} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
		return (bytes / megabyte).toFixed(precision) + ' MB';
	} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
		return (bytes / gigabyte).toFixed(precision) + ' GB';
	} else if ((bytes >= terabyte) && (bytes < petabyte)) {
		return (bytes / terabyte).toFixed(precision) + ' TB';
	} else if (bytes >= petabyte) {
		return (bytes / petabyte).toFixed(precision) + ' PB';
	} else {
		return bytes + ' B';
	}
}
function getRoundTimeDiff(diff)
{
	if(diff < 2) return diff+' sec';
	if(diff < 60) return diff+' secs';

	var mins = parseInt(diff/60);
	if(mins < 2) return  mins+' min';
	if(mins < 60) return  mins+' mins';

	var hours = parseInt(mins/60);
	if(hours < 2) return  hours+' hour';
	if(hours < 24) return  hours+' hours';

	var days = parseInt(hours/24);
	if(days < 2) return  days+' day';
	if(days < 30) return  days+' days';

	var months = parseInt(days/30.5);
	if(months < 2) return  months+' month';

	return months+' months';
}

function getRoundTimeFuture(time)
{
	var now = parseInt((new Date()).getTime() / 1000);
	return getRoundTimeDiff(time - now);
}
function getRoundTimePast(time)
{
	var now = parseInt((new Date()).getTime() / 1000);
	return getRoundTimeDiff(now - time)+' ago';
}
function flog(str)
{
	console.log(str);
}
function randomString(len) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = len;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}
/*Az IE monnyon le.*/
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(elt /*, from*/) {
    var len = this.length;
    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;
    for (; from < len; from++) {
      if (from in this && this[from] === elt)
        return from;
    }
    return -1;
  };
}
Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
if (!Array.prototype.insert) { //az ECMA monnyon le
	Array.prototype.insert = function(idx, item) {
		this.splice(idx, 0, item);
		return this
	}
}
if (!Array.prototype.last) { //az ECMA monnyon le
	Array.prototype.last = function() {
		return this.slice(-1)[0];
	};
}
Array.prototype.quilt = function(item) {
	for(var i = 0; i < this.length-1; i+=2) {
		this.insert(i+1, item);
	}
	return this;
};
function evalstr(str)
{
	var re = /<script\b[\s\S]*?>([\s\S]*?)<\//ig;
	var match;
	while (match = re.exec(str)) {
		eval(match[1]);
	}
}
String.prototype.ucfirst = function()
{ return this.charAt(0).toUpperCase() + this.substr(1); }

String.prototype.removeLast = function(p_last)
{
	var len = typeof p_last == 'undefined' ? 1 : p_last;
	return this.substring(0, this.length - len);
}
if (typeof String.prototype.splice != 'function') {
	String.prototype.splice = function( idx, s ) {
		return (this.slice(0,idx) + s + this.slice(idx));
	};
}
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

String.prototype.getLastWord = function()
{
	if(!this.length)
		return '';
	var words = this.split(' ');
	return words[words.length-1];
}

String.repeat = function(chr,count)
{
    var str = "";
    for(var x=0;x<count;x++) {str += chr};
    return str;
}
String.prototype.padL = function(width,pad)
{
    if (!width ||width<1)
        return this;

    if (!pad) pad=" ";
    var length = width - this.length
    if (length < 1) return this.substr(0,width);

    return (String.repeat(pad,length) + this).substr(0,width);
}
String.prototype.padR = function(width,pad)
{
    if (!width || width<1)
        return this;

	if (!pad) pad=" ";
    var length = width - this.length
    if (length < 1) this.substr(0,width);
    return (this + String.repeat(pad,length)).substr(0,width);
}
Date.prototype.format = function(p_format)
{
    var date = this;
    if (!p_format)
      p_format="MM/dd/yyyy";

    var month = date.getMonth() + 1;
    var year = date.getFullYear();

    p_format = p_format.replace("MM",month.toString().padL(2,"0"));

    if (p_format.indexOf("yyyy") > -1)
        p_format = p_format.replace("yyyy",year.toString());
    else if (p_format.indexOf("yy") > -1)
        p_format = p_format.replace("yy",year.toString().substr(2,2));

    p_format = p_format.replace("dd",date.getDate().toString().padL(2,"0"));

    var hours = date.getHours();
    if (p_format.indexOf("t") > -1)
    {
       if (hours > 11)
        p_format = p_format.replace("t","pm")
       else
        p_format = p_format.replace("t","am")
    }
    if (p_format.indexOf("HH") > -1)
        p_format = p_format.replace("HH",hours.toString().padL(2,"0"));
    if (p_format.indexOf("hh") > -1) {
        if (hours > 12) hours - 12;
        if (hours == 0) hours = 12;
        p_format = p_format.replace("hh",hours.toString().padL(2,"0"));
    }
    if (p_format.indexOf("mm") > -1)
       p_format = p_format.replace("mm",date.getMinutes().toString().padL(2,"0"));
    if (p_format.indexOf("ss") > -1)
       p_format = p_format.replace("ss",date.getSeconds().toString().padL(2,"0"));

    return p_format;
}
function isElement(obj)
{
  try {
    //Using W3 DOM2 (works for FF, Opera and Chrom)
    return obj instanceof HTMLElement;
  }
  catch(e){
    //Browsers not supporting W3 DOM2 don't have HTMLElement and
    //an exception is thrown and we end up here. Testing some
    //properties that all elements have. (works on IE7)
    return (typeof obj==="object") &&
      (obj.nodeType===1) && (typeof obj.style === "object") &&
      (typeof obj.ownerDocument ==="object");
  }
}
var Map = {
	def: function(p_obj, p_key, p_default)
	{
		return p_obj.hasOwnProperty(p_key) ? p_obj[p_key] : p_default;
	},
	mine: function(p_obj, p_field)
	{
		var res = [];
		foreach(p_obj, function(item) {
			if(item.hasOwnProperty(p_field))
				res.push(item[p_field]);
		});
		return res;
	},
	get: function(p_obj, p_keyList, p_default)
	{
		try {
			var obj = p_obj;
			foreach(p_keyList, function(key) {
				if(!obj.hasOwnProperty(key))
					throw 0;
				obj = obj[key];
			});
			return obj;
		} catch(ex) {
			return p_default;
		}
	},
	insertBefore: function(p_obj, p_key, p_new)
	{
		var tmp = {};
		var found = false;
		for(var key in p_obj) {
			if(key == p_key)
				found = true;
			if(found) {
				tmp[key] = p_obj[key];
				delete p_obj[key];
			}
		}
		for(var key in p_new) {
			p_obj[key] = p_new[key];
		}

		for(var key in tmp) {
			p_obj[key] = tmp[key];
		}
		return p_obj;
	},
	sort: function(p_obj, p_function, p_limit)
	{
		var keys = Map.keys(p_obj);
		keys.sort(p_function);
		var res = [];
		var limit = def(p_limit, 0);
		for(var i=0;i<keys.length;i++) {
			if(limit && i>=limit-1)
				break;
			res.push(p_obj[keys[i]]);
		}
		return res;
	},
	keys: function(p_obj)
	{
		var keys = [];
		for(var k in p_obj) {
			if(p_obj.hasOwnProperty(k))
				keys.push(k);
		}
		return keys;
	},
	key_idx: function(p_obj, p_key)
	{
		var idx = 0;
		for(var key in p_obj) {
			if(key == p_key)
				return idx;
			idx++;
		}
		return -1;
	},
	first_key: function(p_obj)
	{
		for (i in p_obj) return i;
	},
	first: function(p_obj)
	{
		for (i in p_obj) return p_obj[i];
	},
	size: function(p_obj)
	{
		if(typeof p_obj == 'object' && typeof p_obj.length == 'number')
			return p_obj.length;

		var cnt = 0;
		for (name in p_obj) {
			cnt++;
		}
		return cnt;
	},
	checkTree: function(p_obj, p_keysArr)
	{
		try {
			var obj = p_obj;
			foreach(p_keysArr, function(key) {
				if(!obj.hasOwnProperty(key))
					throw 0;
				obj = obj[key];
			});
		} catch(ex) {
			return false;
		}

		return true;
	},
	init_arr: function(p_obj, p_args, p_value)
	{
		if(p_args.length < 1)
			return;

		var obj = p_obj;

		for(var i = 0; i<p_args.length; i++)
		{
			var key = p_args[i];
			if(!obj.hasOwnProperty(key))
				obj[key] = (i == p_args.length-1 && typeof p_value != 'undefined') ? p_value : {};
			obj = obj[key];
		}
	},
	init: function(p_obj, p_struct)
	{
		if(typeof p_obj != 'object')
			return; //maybe throw sg exception...

		if(!Map.size(p_struct))
			return;

		var obj = p_obj;
		for(var key in p_struct) {
			if(obj.hasOwnProperty(key))
				Map.init(obj[key], p_struct[key]);
			else
				obj[key] = p_struct[key];
		}
	},
	empty: function(p_obj)
	{
		if(typeof p_obj == 'undefined')
			return true;

		var name;
		for (name in p_obj) {
			return false;
		}
		return true;
	},
	merge: function(p_target, p_source)
	{
		for(var key in p_source) {
			if(typeof p_source[key] == 'object')
				Map.merge(p_target[key], p_source[key]);
			else
				p_target[key] = p_source[key];
		}
	},
	merge_options: function(obj1,obj2)
	{
		var obj3 = {};
		for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
		for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
		return obj3;
	},
	toOptions: function(p_arr, p_titleField, p_addNull)
	{
		var addNull = (p_addNull || false);
		p_titleField = (p_titleField || 'title');

		var res = [];
		if(addNull)
			res[''] = 'none';
		for(var key in p_arr)  {
			res[key] = p_arr[key][p_titleField];
		}
		return res;
	}
}
/*
(function($) {
    $.fn.goTo = function(extra) {
		extra = (extra || 0);
        $('html, body').animate({
            scrollTop: $(this).offset().top + extra + 'px'
        }, 'fast');
        return this; // for chaining...
    }
})(jQuery);
*/
function objMerge(p_target, p_source)
{
	for(var key in p_source)
	{
		var value = p_source[key];
		if(typeof value == 'object') {
			if(p_target[key] == undefined)
				p_target[key] = {};
			objMerge(p_target[key], value);
		} else
			p_target[key] = value;
	}
}
function getTarget(e)
{
	var ev = (e || window.event);
	return (ev.srcElement || ev.originalTarget);
}
function dateFromString(str) {
  var m = str.match(/(\d+)-(\d+)-(\d+)\s+(\d+):(\d+):(\d+)/);
  if(m == null)
	return 0;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime()/1000;
}
function timeFromString(str) {
  var m = str.match(/(\d+)-(\d+)-(\d+)\s+(\d+):(\d+):(\d+)/);
  if(m == null)
	return 0;
  var unix = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime()/1000;
  var midnight = new Date(+m[1], +m[2] - 1, +m[3]).getTime()/1000;
  return unix-midnight;
}
function dT(v)
{
	if(v < 10)
		return '0'+v;
	return v;
}
function formatTime(p_time)
{
	var h = Math.floor(p_time/3600);
	var m = Math.floor((p_time%3600)/60);
	var s = p_time%60;
	return (h ? h + ':' : '') + dT(m) + ':' + dT(s);
}
function cookieData(p_key, p_val, p_params)
{
	var val = 0;
	if(typeof p_val == 'undefined') {
		var raw = $.cookie(p_key);
		val = JSON.parse(raw);
		if(!val)
			val = raw;
	} else {
		val = typeof p_val == 'object' ? JSON.stringify(p_val) : p_val;
		$.cookie(p_key, val, p_params);
	}
	return val;
}
function inputTabAllower(e, element)
{
	var keynum = window.event ? e.keyCode : (e.which ? e.which : 0);

	if(keynum != 9)
		return;

	var start = element.selectionStart;
	var end = element.selectionEnd;

	var $this = $(element);
	var value = $this.val();

	// set textarea value to: text before caret + tab + text after caret
	$this.val(value.substring(0, start) + "\t" + value.substring(end));

	// put caret at right position again (add one for the tab)
	element.selectionStart = element.selectionEnd = start + 1;

	e.preventDefault();
}

/**
	Simple Class Creation and Inheritance
	http://ejohn.org/blog/simple-javascript-inheritance/
*/

(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();

function searchInLimit(p_value, p_limits)
{
	for(var name in p_limits) {
		var limits = p_limits[name];
		if(limits[0] <= p_value && limits[1] > p_value)
			return name;
	}
	return 0;
}
function evalDivision(p_str)
{
	var parts = p_str.split('/');
	if(parts.lenght < 2)
		return parseFloat(p_str);
	var data = parts[0];
	for(var i = 1; i < parts.length; i++)
		data /= parts[i];
	return data;
}
function stopEvent(e)
{
	if(e)
		e.stopPropagation();
	else
		window.event.cancelBubble = true;
	var e = e ? e : window.event;
	e.preventDefault();
}
function intcmpn(i1,i2)
{
	return intcmp(i1,i2)*-1;
}
function intcmp(i1,i2)
{
	i1 = parseInt(i1);
	i2 = parseInt(i2);
    if (i1 < i2) return -1;
    if (i1 > i2) return 1;
    return 0;
}
function strcmp(s1, s2) {
    if (s1.toLowerCase() < s2.toLowerCase()) return -1;
    if (s1.toLowerCase() > s2.toLowerCase()) return 1;
    return 0;
}
var Geometry = {
	coords: {
		vertical: {
			opposite: 'horizontal',
			dir: 'h',
			borders: ['top','bottom']
		},
		horizontal: {
			opposite: 'vertical',
			dir: 'w',
			borders: ['left','right']
		}
	}
}
function foreach(p_obj, p_callback) {
	for(var i in p_obj) {
		if(p_obj.hasOwnProperty(i)) {
			if(p_callback(p_obj[i], p_obj instanceof Array ? parseInt(i) : i) === false)
				return false;
		}
	}
	return true;
}
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

function searchInRange(p_value, p_ranges)
{
	for(var name in p_ranges) {
		var ranged = p_ranges[name];
		if(ranged[0] <= p_value && ranged[1] >= p_value)
			return name;
	}
}

$.fn.scrollBetween = function(p_range, p_duration, p_wait)
{
	this.stop();
	var self = this; //scumbag ECMA

	setTimeout(function() {
		self.animate({
			scrollLeft: p_range[1]
		}, p_duration, 'linear', function() {
			$(this).scrollBetween(p_range.reverse(), p_duration, p_wait);
		});
	}, def(p_wait, 200));
}

$.fn.autoScroll = function(p_args)
{
	var m_args = def(p_args, {});

	this.each(function(id, el) {
		el.scrollLeft = '0px';
		if(el.scrollWidth > el.offsetWidth)
			$(el).scrollBetween([0, el.scrollWidth - el.offsetWidth], Map.def(m_args, 'duration', 4200), Map.def(m_args, 'wait', 200));
	});

	return this;
};
function getAttributeNames(node) {
  var index, rv, attrs;

  rv = [];
  attrs = node.attributes;
  for (index = 0; index < attrs.length; ++index) {
    rv.push(attrs[index].nodeName);
  }
  rv.sort();
  return rv;
}
function equivElms(elm1, elm2) {
  var attrs1, attrs2, name, node1, node2;

  // Compare attributes without order sensitivity
  attrs1 = getAttributeNames(elm1);
  attrs2 = getAttributeNames(elm2);
  if (attrs1.join(",") !== attrs2.join(",")) {
    console.log("Found nodes with different sets of attributes; not equiv");
    return false;
  }

  // ...and values
  // unless you want to compare DOM0 event handlers
  // (onclick="...")
  for (index = 0; index < attrs1.length; ++index) {
    name = attrs1[index];
    if (elm1.getAttribute(name) !== elm2.getAttribute(name)) {
      console.log("Found nodes with mis-matched values for attribute '" + name + "'; not equiv");
      return false;
    }
  }

  // Walk the children
  for (node1 = elm1.firstChild, node2 = elm2.firstChild;
       node1 && node2;
       node1 = node1.nextSibling, node2 = node2.nextSibling) {
     if (node1.nodeType !== node2.nodeType) {
       console.log("Found nodes of different types; not equiv");
       return false;
     }
     if (node1.nodeType === 1) { // Element
       if (!equivElms(node1, node2)) {
         return false;
       }
     }
     else if (node1.nodeValue !== node2.nodeValue) {
       console.log("Found nodes with mis-matched nodeValues; not equiv");
       return false;
     }
  }
  if (node1 || node2) {
    // One of the elements had more nodes than the other
    console.log("Found more children of one element than the other; not equivalent");
    return false;
  }

  // Seem the same
  return true;
}

//Returns the object's class, Array, Date, RegExp, Object are of interest to us
var getClass = function(val)
{
	return Object.prototype.toString.call(val).match(/^\[object\s(.*)\]$/)[1];
};
//Defines the type of the value, extended typeof
var whatis = function(val)
{
	if (val === undefined)
		return 'undefined';
	if (val === null)
		return 'null';

	if(isElement(val))
		return 'html';

	var type = typeof val;

	if (type === 'object')
		type = getClass(val).toLowerCase();

	if (type === 'number') {
		if (val.toString().indexOf('.') > 0)
			return 'float';
		else
			return 'integer';
	}

	return type;
};

var _equal = {
	html: equivElms,
	array: function(a, b) {
		if (a === b)
			return true;
		if (a.length !== b.length)
			return false;
		for (var i = 0; i < a.length; i++){
			if(!equal(a[i], b[i])) {
				return false;
			}
		};
		return true;
	},
	object: function(a, b) {
		if (a === b)
			return true;
		for (var i in a) {
			if (b.hasOwnProperty(i)) {
				if (!equal(a[i],b[i])) return false;
			} else {
				return false;
			}
		}

		for (var i in b) {
			if (!a.hasOwnProperty(i)) {
				return false;
			}
		}
		return true;
	},
	date: function(a, b) {
		return a.getTime() === b.getTime();
	},
	regexp: function(a, b) {
		return a.toString() === b.toString();
	},
	'function': this.regexp
}
/*
 * Are two values equal, deep compare for objects and arrays.
 * @param a {any}
 * @param b {any}
 * @return {boolean} Are equal?
 */
var equal = function(a, b) {
	if (a !== b) {
		var atype = whatis(a), btype = whatis(b);

		if (atype === btype) {
			return _equal.hasOwnProperty(atype) ? _equal[atype](a, b) : a==b;
		}

		return false;
	}

	return true;
};
(function($)
{
    jQuery.fn.putCursorAtEnd = function() {
    return this.each(function() {
        $(this).focus()

        // If this function exists...
        if (this.setSelectionRange) {
            // ... then use it
            // (Doesn't work in IE)

            // Double the length because Opera is inconsistent about whether a carriage return is one character or two. Sigh.
            var len = $(this).val().length * 2;
            this.setSelectionRange(len, len);
        } else {
            // ... otherwise replace the contents with itself
            // (Doesn't work in Google Chrome)
            $(this).val($(this).val());
        }

        // Scroll to the bottom, in case we're in a tall textarea
        // (Necessary for Firefox and Google Chrome)
        this.scrollTop = 999999;
    });
    };
})(jQuery);

window.isMobileBrowser = function()
{
	return /(up.browser|up.link|mmp|symbian|opera mobi|opera mini|opera tablet|smartphone|midp|wap|phone|android)/i.test(navigator.userAgent);
}