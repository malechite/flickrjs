var foo = function(id, set) {
    $('#flickr_set_loader').unbind().bind('click', function() {
        var username = $('#flickr_username').val();
        if(username !== '') {
            $('#flickr_set').html('<option>Loading your flickr sets...</option>');
            $('#flickr_loading').show();
            flickr = new flickr_js({ username : username });
        } else {
            $('p.error').remove();
            $('#flickr_loading').after('<p class="error">Please enter a username</p>');
        }
    });
    $(document.body).unbind('flickr_js_event').bind('flickr_js_event', function(e, options) {
        switch(options.method) {
            case 'people.findByUsername':
                if(options.type == 'parse') {
                    var user_id = flickr.user_id;
                    $('#flickr_id').val(user_id);
                    flickr.photosets.getList(user_id);
                    $('p.error').remove();
                } else if(options.type == 'error') {
                    $('p.error').remove();
                    $('#flickr_loading').hide().after('<p class="error">' + options.message + '</p>');
                }
                break;
            case 'photosets.getList':
                if(options.type == 'parse') {
                    var photosets = options.parse;
                    if(photosets) {
                        var items = '';
                        for(var x in photosets) {
                            items += '<option value="' + photosets[x].id + '">' + photosets[x].title + '</option>';
                        }
                        $('#flickr_set').html(items);
                        if(!flickr.photoset_data) { flickr.photoset_data = {}; }
                        flickr.photoset_data[flickr.user_id] = items;
                        $('#flickr_loading').hide();
                    }
                    if(set) {
                        $('#flickr_set').val(set);
                    }
                }
                break;
        }
    });
};

foo();