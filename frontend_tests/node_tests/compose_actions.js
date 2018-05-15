var noop = function () {};
var return_false = function () { return false; };
var return_true = function () { return true; };

set_global('document', {
    location: {}, // we need this to load compose.js
});

set_global('page_params', {
    use_websockets: false,
});

set_global('$', global.make_zjquery());

set_global('compose_pm_pill', {
});

zrequire('people');
zrequire('compose_ui');
zrequire('compose');
zrequire('util');
zrequire('compose_state');
zrequire('compose_actions');

set_global('document', 'document-stub');

var start = compose_actions.start;
var cancel = compose_actions.cancel;
var get_focus_area = compose_actions._get_focus_area;
var respond_to_message = compose_actions.respond_to_message;
var reply_with_mention = compose_actions.reply_with_mention;

var compose_state = global.compose_state;

compose_state.recipient = (function () {
    var recipient;

    return function (arg) {
        if (arg === undefined) {
            return recipient;
        }

        recipient = arg;
    };
}());

set_global('reload', {
    is_in_progress: return_false,
});

set_global('notifications', {
    clear_compose_notifications: noop,
});

set_global('compose_fade', {
    clear_compose: noop,
});

set_global('drafts', {
    update_draft: noop,
});

set_global('resize', {
    resize_bottom_whitespace: noop,
});

set_global('narrow_state', {
    set_compose_defaults: noop,
});

set_global('unread_ops', {
    notify_server_message_read: noop,
});

set_global('common', {
    status_classes: 'status_classes',
});

function stub_selected_message(msg) {
    set_global('current_msg_list', {
        selected_message: function () {
            return msg;
        },
    });
}

function assert_visible(sel) {
    assert($(sel).visible());
}

function assert_hidden(sel) {
    assert(!$(sel).visible());
}

run_test('initial_state', () => {
    assert.equal(compose_state.composing(), false);
    assert.equal(compose_state.get_message_type(), false);
    assert.equal(compose_state.has_message_content(), false);
});

run_test('start', () => {
    compose_actions.autosize_message_content = noop;
    compose_actions.expand_compose_box = noop;
    compose_actions.set_focus = noop;
    compose_actions.complete_starting_tasks = noop;
    compose_actions.blur_textarea = noop;
    compose_actions.clear_textarea = noop;

    // Start stream message
    global.narrow_state.set_compose_defaults = function () {
        var opts = {};
        opts.stream = 'stream1';
        opts.subject = 'topic1';
        return opts;
    };

    var opts = {};
    start('stream', opts);

    assert_visible('#stream-message');
    assert_hidden('#private-message');

    assert.equal($('#stream').val(), 'stream1');
    assert.equal($('#subject').val(), 'topic1');
    assert.equal(compose_state.get_message_type(), 'stream');
    assert(compose_state.composing());

    // Start PM
    global.narrow_state.set_compose_defaults = function () {
        var opts = {};
        opts.private_message_recipient = 'foo@example.com';
        return opts;
    };

    opts = {
        content: 'hello',
    };

    $('#compose-textarea').trigger = noop;
    start('private', opts);

    assert_hidden('#stream-message');
    assert_visible('#private-message');

    assert.equal(compose_state.recipient(), 'foo@example.com');
    assert.equal($('#compose-textarea').val(), 'hello');
    assert.equal(compose_state.get_message_type(), 'private');
    assert(compose_state.composing());

    // Cancel compose.
    var pill_cleared;

    compose_pm_pill.clear = function () {
        pill_cleared = true;
    };

    assert_hidden('#compose_controls');
    cancel();
    assert(pill_cleared);
    assert_visible('#compose_controls');
    assert_hidden('#private-message');
    assert(!compose_state.composing());
});

run_test('respond_to_message', () => {
    // Test PM
    var person = {
        user_id: 22,
        email: 'alice@example.com',
        full_name: 'Alice',
    };
    people.add_in_realm(person);

    var msg = {
        type: 'private',
        sender_id: person.user_id,
    };
    stub_selected_message(msg);

    var opts = {
        reply_type: 'personal',
    };

    respond_to_message(opts);
    assert.equal(compose_state.recipient(), 'alice@example.com');

    // Test stream
    msg = {
        type: 'stream',
        stream: 'devel',
        subject: 'python',
        reply_to: 'bob', // compose.start needs this for dubious reasons
    };
    stub_selected_message(msg);

    opts = {
    };

    respond_to_message(opts);
    assert.equal($('#stream').val(), 'devel');
});

run_test('reply_with_mention', () => {
    var msg = {
        type: 'stream',
        stream: 'devel',
        subject: 'python',
        reply_to: 'bob', // compose.start needs this for dubious reasons
        sender_full_name: 'Bob Roberts',
    };
    stub_selected_message(msg);

    var syntax_to_insert;
    compose_ui.insert_syntax_and_focus = function (syntax) {
        syntax_to_insert = syntax;
    };

    var opts = {
    };

    reply_with_mention(opts);
    assert.equal($('#stream').val(), 'devel');
    assert.equal(syntax_to_insert, '@**Bob Roberts**');
    assert(compose_state.has_message_content());
});

run_test('get_focus_area', () => {
    assert.equal(get_focus_area('private', {}), 'private_message_recipient');
    assert.equal(get_focus_area('private', {
        private_message_recipient: 'bob@example.com'}), 'compose-textarea');
    assert.equal(get_focus_area('stream', {}), 'stream');
    assert.equal(get_focus_area('stream', {stream: 'fun'}),
                 'subject');
    assert.equal(get_focus_area('stream', {stream: 'fun',
                                           subject: 'more'}),
                 'compose-textarea');
    assert.equal(get_focus_area('stream', {stream: 'fun',
                                           subject: 'more',
                                           trigger: 'new topic button'}),
                 'subject');
});

run_test('focus_in_empty_compose', () => {
    $('#compose-textarea').is = function (attr) {
        assert.equal(attr, ':focus');
        return $('#compose-textarea').is_focused;
    };

    compose_state.composing = return_true;
    $('#compose-textarea').val('');
    $('#compose-textarea').focus();
    assert(compose_state.focus_in_empty_compose());

    compose_state.composing = return_false;
    assert(!compose_state.focus_in_empty_compose());

    $('#compose-textarea').val('foo');
    assert(!compose_state.focus_in_empty_compose());

    $('#compose-textarea').blur();
    assert(!compose_state.focus_in_empty_compose());
});
