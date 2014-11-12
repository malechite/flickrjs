/**
 * Flickr_js
 * @desc A simple javascript wrapper for Flickr's API
 * @author Brandon Dusseau (malechite@gmail.com)
 * @version 0.1.0
 * requires Koi 0.2 and Jquery 1.7
**/

var flickr_js = Koi.define({
    
    methods : {
        people : {
            "findByUsername" : {
                "arguments"  : ["username"],
                "callback"   : function(options) {
                    var id =  options.data.user.id;
                    if(id) { 
                        options.context.user_id = id; 
                        options.context.methods[options.x][options.y].parse = id;
                        options.context.send_event({ type: "parse", method: options.x + "." + options.y, parse: id });
                    }                    
                },
            }
        },
        photosets : {
            "getList"        : {
                "arguments"  : ["user_id", "page", "per_page"],
                "callback"   : function(options) {
                    var photosets = options.data.photosets.photoset;
                    if(photosets) {
                        var parse = [];
                        for(var x in photosets) {
                            parse[x] = {
                                title: photosets[x].title._content,
                                description: photosets[x].description._content,
                                id: photosets[x].id                                
                            };
                        }
                        options.context.methods[options.x][options.y].parse = parse;
                        options.context.send_event({ type: "parse", method: options.x + "." + options.y, parse: parse });
                    }
                }
            },
            "getPhotos"      : {
                "arguments"  : ["photoset_id", "extras", "privacy_filter", "per_page", "page", "media"]
            }
        }  
    },
    
    init : function(options) {
        //define globals
        var options = options || {};
        this.api_key  = options.api_key  || 'da692f7a821fefd32b3a899aca462bbd';
        this.user_id  = options.user_id  || null;
        this.username = options.username || null;
        this.format   = options.format   || 'json';
        this.ssl      = options.format   || true;
        if(this.ssl) {
            this.base_url = 'https://secure.flickr.com/services/rest/?method=flickr.';
        } else {
            this.base_url = 'http://api.flickr.com/services/rest/?method=flickr.';
        }
        var _this = this;
        for(var x in this.methods) {
            this[x] = {};
            var _parent = this[x];
            for(var y in this.methods[x]) {
               _parent[y] = this.create_function(x,y);
            }
        }
        if(this.user_id == null && this.username != null) {
            this.people.findByUsername(this.username);
        } else {
            return false;
        }
    },
    
    create_function : function(x, y) {
        var _x = x;
        var _y = y;
        var _this = this;
        return function() {
            var options = {
                method : _x + '.' + _y,
                x: _x,
                y: _y,
                callback : _this.methods[_x][_y].callback || false
            }
            options.params = {};  
            var count = 0;          
            for(var z in _this.methods[_x][_y].arguments) {
                if(_this.methods[_x][_y].arguments[z] == "user_id") {
                    options.params[_this.methods[_x][_y].arguments[z]] = arguments[z] || _this.user_id;
                } else {
                    options.params[_this.methods[_x][_y].arguments[z]] = arguments[z];
                    count++;
                }
            }             
            _this.fetch(options);
        }
    },
    
    fetch : function(options) {
        var _this = this;
        var url = this.base_url + options.method + '&api_key=' + this.api_key;
        if(options.params) {
            for(var x in options.params) {
                if(options.params[x]) {
                    url += '&' + x + '=' + options.params[x];
                }
            }
        }
        url += '&format=' + this.format + '&nojsoncallback=1';
        _this.send_event({ type: "load", method: options.method });
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if(data && data.stat == "ok") {
                    _this.methods[options.x][options.y].response = data;
                    _this.send_event({ type: "receive", method: options.method, data: data });
                    if(options.callback) {
                        options.callback({ context: _this, x: options.x, y: options.y, data: data });
                    }
                } else if(data && data.stat == "fail") {
                    _this.send_event({ type: "error", method: options.method, message: data.message });
                }                  
            },
            error: function() {
                _this.send_event({ type: "error", method: options.method, message: 'could not load data from flickr' });
            },
            complete: function() {
                _this.send_event({ type: "complete", method: options.method });
            }
        });
    },
    
    send_event: function(options) {
        if(typeof flickr_js_event == "function") { 
            flickr_js_event(options); 
        }
        $(document.body).trigger('flickr_js_event', options);
    }    
});