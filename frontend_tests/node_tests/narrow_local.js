zrequire('Filter', 'js/filter');
zrequire('MessageListData', 'js/message_list_data');
zrequire('narrow_state');
zrequire('narrow');

set_global('message_list', {});
set_global('muting', {
    is_topic_muted: () => false,
});

function test_with(fixture) {
    const filter = new Filter(fixture.filter_terms);
    narrow_state.set_current_filter(filter);

    const muting_enabled = narrow_state.muting_enabled();
    const msg_data = new MessageListData({
        filter: narrow_state.get_current_filter(),
        muting_enabled: muting_enabled,
    });
    const id_info = {
        target_id: fixture.target_id,
        local_select_id: undefined,
        final_select_id: undefined,
    };

    message_list.all = {
        fetch_status: {
            has_found_newest: () => fixture.has_found_newest,
        },
        empty: () => fixture.empty,
        all_messages: () => fixture.all_messages,
    };

    narrow_state.get_first_unread_info = () => fixture.unread_info;

    narrow.maybe_add_local_messages({
        id_info: id_info,
        msg_data: msg_data,
    });

    assert.deepEqual(id_info, fixture.expected_id_info);

    const msgs = msg_data.all_messages();
    const msg_ids = _.pluck(msgs, 'id');
    assert.deepEqual(msg_ids, fixture.expected_msg_ids);
}

run_test('near before unreads', () => {
    const fixture = {
        filter_terms: [
            {operator: 'near', operand: 42}
        ],
        target_id: 42,
        unread_info: {
            flavor: 'found',
            msg_id: 43,
        },
        has_found_newest: false,
        all_messages: [
            {id: 42},
            {id: 43},
            {id: 44},
        ],
        expected_id_info: {
            target_id: 42,
            final_select_id: 42,
            local_select_id: 42,
        },
        expected_msg_ids: [42, 43, 44],
    };

    test_with(fixture);
});

run_test('near with no unreads', () => {
    const fixture = {
        filter_terms: [
            {operator: 'near', operand: 42}
        ],
        target_id: 42,
        unread_info: {
            flavor: 'not_found',
        },
        has_found_newest: false,
        empty: true,
        expected_id_info: {
            target_id: 42,
            final_select_id: 42,
            local_select_id: undefined,
        },
        expected_msg_ids: [],
    };

    test_with(fixture);
});
