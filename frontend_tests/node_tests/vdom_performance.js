set_global('$', global.make_zjquery());
set_global('blueslip', global.make_zblueslip());

zrequire('pm_conversations');
zrequire('people');
zrequire('unread');
zrequire('buddy_data');
zrequire('presence');
zrequire('hash_util');
zrequire('user_status');
zrequire('util');
zrequire('vdom');
zrequire('pm_list_dom');
zrequire('pm_list');

set_global('narrow_state', {
    active: () => true,
    filter: () => undefined,
});

set_global('stream_popover', {
    hide_topic_popover: () => {},
});

set_global('ui', {
});

set_global('resize', {
    resize_stream_filters_container: () => {},
});

function time_it(label, cnt, f) {
    const t1 = new Date().getTime();

    _.each(_.range(cnt), (i) => {
        f(i);
    });
    const t2 = new Date().getTime();
    const elapsed = t2 - t1;
    console.info('\n' + label);
    console.info('elapsed (ms)', elapsed);
    console.info('per (ms)', elapsed / cnt);
}

run_test('performance', () => {
    const cnt = 300;

    const msg_id = 99;

    const orig_num_unread_for_person = unread.num_unread_for_person;

    _.each(_.range(cnt).reverse(), (i) => {
        const user_id = i + 1;

        const person = {
            user_id: user_id,
            email: 'foo' + user_id + '@zulip.com',
            full_name: 'Foo' + user_id + ' Barson',
        };
        people.add_in_realm(person);
        pm_conversations.recent.insert([user_id], msg_id);
    });

    time_it('get convos', 100, () => {
        // This is the code to actually get data, which
        // seems the most expensive piece here.
        pm_list._get_convos();
    });

    const convos = pm_list._get_convos();
    time_it('build vdom', 100, () => {
        pm_list_dom.pm_ul(convos);
    });

    const container_stub = {};

    container_stub.empty = () => {};
    container_stub.html = () => {};

    ui.get_content_element = () => {
        return container_stub;
    };

    const ast_render = pm_list._build_private_messages_list();

    time_it('just rendering', 100, () => {
        vdom.update(container_stub, ast_render, undefined);
    });

    time_it('close/expand', 100, () => {
        pm_list.close();
        pm_list.expand();
    });

    container_stub.html = () => {
        throw Error('should not redraw');
    };

    time_it('update with no changes', 100, () => {
        // This mostly measures how long it takes to
        // build the ast, plus the time it takes to
        // detect no changes in the ast.  It also includes
        // time to process the conversations.
        pm_list.update_private_messages();
    });

    container_stub.find = () => {
        return {
            children: () => {
                return {
                    eq: (i) => {
                        assert.equal(i, 0);
                        return {
                            replaceWith: () => {},
                        };
                    },
                };
            },
        };
    };

    time_it('updates with unread change', 100, (i) => {
        // This mostly measures how long it takes to
        // build the ast, plus the time it takes to
        // detect no changes in the ast.
        unread.num_unread_for_person = (user_id) => {
            if (user_id.toString() === '1') {
                return i;
            }
            return 0;
        };

        pm_list.update_private_messages();
    });

    const ast = pm_list._build_private_messages_list();
    assert.equal(ast.opts.keyed_children.length, cnt);
    const ast2 = pm_list._build_private_messages_list();

    time_it('equality checks', 100, () => {
        // equality checks are about 1ms even for
        // 300 persons...and these are actually deep
        // checks
        assert.equal(vdom.eq_tag(ast, ast2), true);
    });

    const container = undefined;

    time_it('vdom.update', 100, () => {
        // This is basically just seeing how fast
        // vdom.update will short circuit for identical asts.
        vdom.update(container, ast, ast2);
    });

    unread.num_unread_for_person = (user_id) => {
        if (user_id.toString() === '1') {
            return 99999;
        }
        return 0;
    };

    const ast_new = pm_list._build_private_messages_list();

    time_it('vdom.update w/one change', 100, () => {
        // This is basically just seeing how fast
        // vdom.update will short circuit for identical asts.
        vdom.update(container_stub, ast_new, ast);
    });


    // Measure convos with a few pieces stubbed.
    unread.num_unread_for_person = orig_num_unread_for_person;
    time_it('get convos (before stubbing)', 100, () => {
        pm_list._get_convos();
    });

    unread.num_unread_for_person = () => 10;

    time_it('get convos (w/stubbed unread)', 100, () => {
        pm_list._get_convos();
    });

    hash_util.pm_with_uri = () => '/some/url';
    buddy_data.get_user_circle_class = () => 'empty';
    people.user_ids_string_to_emails_string = () => {};

    time_it('get convos (w/more stubbing)', 100, () => {
        pm_list._get_convos();
    });

});

