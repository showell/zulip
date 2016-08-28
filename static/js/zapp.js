var zapp = (function () {

var exports = {};
var zapp = exports;
var zapp_container;
var top_level_menu;
var zapp_close;

exports.init = function (container, zapp_helper) {
    zapp_container = container;
    top_level_menu = build_top_level_menu(zapp_helper);
    zapp_container.html(top_level_menu.container);
};

exports.open = function (on_close) {
    top_level_menu.activate();
    zapp_close = on_close;
};

var build_top_level_menu = function (zapp_helper) {
    var people = zapp_helper.people;
    var page_params = zapp_helper.page_params;
    var menu;

    var on_item_close  = function () {
        menu.activate();
    };

    function build_compose() {
        return zapp.build_compose_widget(zapp_helper, on_item_close);
    }

    function build_people() {
        return zapp.build_people_widget(people, on_item_close);
    }

    function build_settings() {
        return zapp.build_settings_widget(page_params, on_item_close);
    }

    var items = [
        {
            name: 'Compose',
            func: build_compose,
        },
        {
            name: 'People',
            func: build_people,
        },
        {
            name: 'Settings',
            func: build_settings
        }
    ];

    var on_close = function () {
        zapp_close();
    }

    menu = build_generic_menu(items, on_close);

    return menu;
}

exports.build_compose_widget = function (zapp_helper, on_close) {
    var apply_markdown = zapp_helper.apply_markdown;
    var message_content = zapp_helper.message_content;
    var self = {};

    function button () {
        return $('<button>').css('margin', '20px');
    }

    var outer = $('<div>');
    var compose_box = $('<textarea>');
    var render_button = button().html('render');
    var bold_button = button().html('bold');
    var exit_button = button().html('exit');
    var output = $('<div>');


    outer.append($('<div>').html(compose_box));
    outer.append(bold_button, render_button, exit_button);
    outer.append(output);

    self.container = outer;

    self.activate = function () {
        outer.show();
        compose_box.focus();
        compose_box.autosize();
        compose_box.trigger('autosize.resize');

        bold_button.click(function () {
            var message = compose_box.val();
            var start = compose_box.prop('selectionStart');
            var end = compose_box.prop('selectionEnd');

            if (start < 0 || (start === end)) {
                start = 0;
                end = message.length;
            }
                
            var prefix = message.substring(0, start);
            var middle = message.substring(start, end);
            var suffix = message.substring(end, message.length);

            message = prefix + '**' + middle + '**' + suffix;
            compose_box.val(message);
            compose_box.trigger('autosize.resize');
        });

        render_button.click(function () {
            var message = compose_box.val();
            var rendered = apply_markdown(message);
            output.html(rendered);
            message_content(message);
        });

        exit_button.click(function () {
            outer.hide();
            on_close();
        });
    };

    return self;
};

exports.build_people_widget = function (people, on_close) {
    var names = _.pluck(people.get_rest_of_realm(), 'full_name');
    var callback = {
        on_close: function () {
            on_close();
        },

        on_select: function (i) {
        },
    };

    function get_zoom_content (name, i) {
        var content = {
            container: $('<pre>').html(
                JSON.stringify(people.get_by_name(name), null, 4))
        };
        return content;
    }

    var menu = build_generic_zoomer(names, get_zoom_content, on_close);
    return menu;
};

exports.build_settings_widget = function (page_params, on_close) {
    var keys = _.sortBy(_.keys(page_params));
    var true_keys = _.filter(keys, function (k) {
        return page_params[k] === true;
    });
    var false_keys = _.filter(keys, function (k) {
        return page_params[k] === false;
    });

    var language_keys = [
        'default_language',
        'default_language_name',
        'language_list',
        'language_list_dbl_col',
        'realm_default_language',
    ];

    var number_keys = [
        'event_queue_id',
        'furthest_read_time',
        'initial_pointer',
        'initial_servertime',
        'last_event_id',
        'max_message_id',
        'maxfilesize',
        'poll_timeout',
        'realm_message_content_edit_limit_seconds',
        'server_generation',
        'unread_count',
        'user_id',
    ];

    var realm_keys = [
        'domain',
        'product_name',
        'realm_emoji',
        'realm_filters',
        'realm_name',
    ];

    var stream_keys = [
        'muted_topics',
        'neversubbed_info',
        'notifications_stream',
        'realm_default_streams',
    ];

    var url_keys = [
        'avatar_url',
        'login_page',
        'realm_uri',
        'server_uri',
    ];

    var user_keys = [
        'bot_list',
        'cross_realm_user_emails',
        'email',
        'email_dict',
        'fullname',
        'initial_presences',
        'people_list',
    ];

    var other_keys = _.difference(keys,
        true_keys, false_keys, number_keys,
        language_keys, realm_keys, stream_keys, url_keys,
        user_keys);

    function value(v) {
        if (_.isString(v) || _.isNumber(v)) {
            return v;
        }
        var json = JSON.stringify(v, null, 4);
        return $('<pre>').html(json);
    }

    function table(keys) {
        var self = {};
        var table = $('<table border=1>');
        _.each(keys, function(k) {
            var tr = $('<tr valign="top">');
            tr.append(td(k));
            tr.append(td(value(page_params[k])));
            table.append(tr);
        });
        self.container = table;

        return self;
    }

    function bool_settings(keys) {
        var self = {};
        var list = $('<ul>');
        _.each(keys, function(k) {
            var li = $('<li>');
            list.append(li.html(k));
        });
        self.container = list;
        return self;
    }

    function disabled() {
        return bool_settings(false_keys);
    }

    function enabled() {
        return bool_settings(true_keys);
    }

    function language() {
        return table(language_keys);
    }

    function number() {
        return table(number_keys);
    }

    function realm() {
        return table(realm_keys);
    }

    function stream() {
        return table(stream_keys);
    }

    function urls() {
        return table(url_keys);
    }

    function user() {
        return table(user_keys);
    }

    function others() {
        return table(other_keys);
    }

    var items = [
        {
            name: 'Disabled',
            func: disabled,
        },
        {
            name: 'Enabled',
            func: enabled,
        },
        {
            name: 'Language',
            func: language,
        },
        {
            name: 'Numbers',
            func: number,
        },
        {
            name: 'Realm',
            func: realm,
        },
        {
            name: 'Stream',
            func: stream,
        },
        {
            name: 'URLs',
            func: urls,
        },
        {
            name: 'User',
            func: user,
        },
        {
            name: 'Others',
            func: others,
        }
    ];

    menu = build_generic_menu(items, on_close);

    return menu;
};

function build_generic_zoomer(names, get_zoom_content, on_close) {
    var self = {};
    var content_td = $('<td valign="top">');
    content_td.css('padding-left', '30px');

    self.activate = function () {
        chooser.activate();
    }

    var callback = (function (i) {
        var self = {};

        self.on_select = function (i) {
            var zoom_content = get_zoom_content(names[i], i);
            content_td.html(zoom_content.container);
        };

        self.can_activate = function (i) {
            return false;
        };

        self.on_close = function () {
            on_close();
        };

        return self;
    }());

    var chooser = build_generic_chooser(names, callback);

    // build table framework
    var table = $('<table>');
    var tr = $('<tr>');
    var chooser_td = $('<td valign="top">');

    chooser_td.append(chooser.container);
    tr.append(chooser_td);
    tr.append(content_td);
    table.append(tr);
    self.container = table;

    return self;
};

function build_generic_menu(items, on_close) {
    var self = {};
    var choices = [];
    var content_td = $('<td valign="top">');
    content_td.css('padding-left', '30px');

    _.each(items, function (v, i) {
        var choice = v.func();
        choices.push(choice);
    });

    self.activate = function () {
        chooser.activate();
    }

    var callback = (function (i) {
        var self = {};

        self.on_select = function (i) {
            var choice = choices[i];
            content_td.html(choice.container);
        };

        self.can_activate = function (i) {
            return choices[i].activate;
        };

        self.activate = function (i) {
            choices[i].activate();
        };

        self.on_close = function () {
            on_close();
        };

        return self;
    }());

    var names = _.pluck(items, 'name');
    var chooser = build_generic_chooser(names, callback);

    // build table framework
    var table = $('<table>');
    var tr = $('<tr>');
    var chooser_td = $('<td valign="top">');

    chooser_td.append(chooser.container);
    tr.append(chooser_td);
    tr.append(content_td);
    table.append(tr);
    self.container = table;

    return self;
};

function build_generic_chooser(items, callback) {
    var self = {};
    var i_option = -1;
    var options = [];
    self.container = $('<ul>');

    _.each(items, function(v, i) {
        var option = $('<li>').html(v);
        self.container.append(option);
        options.push(option);
    });

    function activate(i) {
        if (callback) {
            callback.activate(i);
        }
    }

    function can_activate(i) {
        return callback && callback.can_activate(i);
    }

    function select(i) {
        options[i].css('background', 'lightgray');
        options[i].css('color', 'blue');
        if (callback) {
            callback.on_select(i);
        }
    }

    function deselect(i) {
        dehighlight_item(i);
        options[i].css('color', 'black');
    }

    function dehighlight_item(i) {
        options[i].css('background', 'white');
    }

    self.activate = function () {
        self.container.focus();
        if (i_option == -1) {
            i_option = 0;
        }
        select(i_option);
        $(document).on('keydown', function (e) {
            if (e.which == 40) {
                if (i_option + 1 < options.length) {
                    deselect(i_option);
                    i_option += 1;
                    select(i_option);
                }
            }
            else if (e.which == 38) {
                if (i_option > 0) {
                    deselect(i_option);
                    i_option -= 1;
                    select(i_option);
                }
            }
            else if (e.which == 39) { // right arrow
                if (can_activate(i_option)) {
                    $(document).off('keydown');
                    activate(i_option);
                    dehighlight_item(i_option);
                }
            }
            else if (e.which == 27 || e.which == 37) {
                // escape/left arrow
                $(document).off('keydown');
                callback.on_close();
                dehighlight_item(i_option);
            }

            // we want complete control
            e.preventDefault();
            return true;
        });
    };

    return self;
}

function td(val) {
    return $('<td>').html(val);
}


return exports;

}());
if (typeof module !== 'undefined') {
    module.exports = zapp;
}
