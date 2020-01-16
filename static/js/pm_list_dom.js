exports.circle_background = (convo) => {
    if (convo.fraction_present) {
        return 'background:hsla(106, 74%, 44%, ' + convo.fraction_present + ');';
    }
    return 'background:none; border-color:hsl(0, 0%, 50%);';
};

exports.pm_left_col_span = (convo) => {
    const classes = [
        'user_circle',
        convo.user_circle_class,
    ];
    const class_ = classes.join(' ');

    if (convo.is_group) {
        return vdom.span({
            attrs: [
                ['class', class_],
                ['style', exports.circle_background(convo)],
            ],
        });
    }

    // regular PMs
    return vdom.span({
        attrs: [
            ['class', class_],
        ],
    });
};

exports.pm_left_col = (convo) => {
    return vdom.div({
        attrs: [
            ['class', 'pm_left_col'],
        ],
        children: [
            exports.pm_left_col_span(convo),
        ],
    });
};

exports.partners = (convo) => {
    return vdom.a({
        attrs: [
            ['href', convo.url],
            ['class', 'conversation-partners'],
        ],
        text: convo.recipients,
    });
};

exports.count = (convo) => {
    const classes = ['private_message_count'];

    if (convo.is_zero) {
        classes.push('zero_count');
    }
    const class_ = classes.join(' ');

    return vdom.div({
        attrs: [
            ['class', class_],
        ],
        children: [
            vdom.div({
                attrs: [
                    ['class', 'value'],
                ],
                text: convo.unread,
            }),
        ],
    });
};

exports.pm_box_attrs = (convo) => {
    return [
        ['class', 'pm-box'],
        ['id', 'pm_user_status'],
        ['data-user-ids-string', convo.user_ids_string],
        ['data-is-group', convo.is_group],
    ];
};

exports.pm_box = (convo) => {
    return vdom.span({
        attrs: exports.pm_box_attrs(convo),
        children: [
            exports.pm_left_col(convo),
            exports.partners(convo),
            exports.count(convo),
        ],
    });
};

exports.pm_li_class = (convo) => {
    const classes = [
        'top_left_row',
        'expanded_private_messages',
    ];
    if (convo.is_zero) {
        classes.push('zero-pm-unreads');
    }
    if (convo.is_active) {
        classes.push('active-sub-filter');
    }
    return classes.join(' ');
};

exports.keyed_pm_li = (convo) => {
    const key = convo.user_ids_string;
    const attrs = [
        ['class', exports.pm_li_class(convo)],
        ['data-user-ids-string', key],
    ];
    const ast = vdom.li({
        attrs: attrs,
        children: [exports.pm_box(convo)],
    });

    return {
        key: key,
        ast: ast,
    };
};

exports.pm_ul = (convos) => {
    const attrs = [
        ['class', 'expanded_private_messages'],
        ['data-name', 'private'],
    ];
    return vdom.ul({
        attrs: attrs,
        keyed_children: _.map(convos, exports.keyed_pm_li),
    });
};

window.pm_list_dom = exports;
