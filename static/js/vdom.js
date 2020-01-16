exports.eq_array = (a, b, eq) => {
    if (a === b) {
        // either both are undefined, or they
        // are referentially equal
        return true;
    }

    if (a === undefined || b === undefined) {
        return false;
    }

    if (a.length !== b.length) {
        return false;
    }

    return _.all(a, (item, i) => {
        return eq(item, b[i]);
    });
};

exports.eq_attr = (a, b) => {
    return a[0] === b[0] && a[1] === b[1];
};

exports.eq_keyed_child = (a, b) => {
    return a.key === b.key &&
        exports.eq_tag(a.ast, b.ast);
};

exports.eq_tag = (tag1, tag2) => {
    if (tag2 === undefined) {
        return false;
    }

    if (tag1.tag_name !== tag2.tag_name) {
        return false;
    }

    const a = tag1.opts;
    const b = tag2.opts;

    return a.text === b.text &&
        exports.eq_array(
            a.attrs, b.attrs, exports.eq_attr) &&
        exports.eq_array(
            a.children, b.children, exports.eq_tag) &&
        exports.eq_array(
            a.keyed_children, b.keyed_children, exports.eq_keyed_child);
};

exports.tag = (tag_name, opts) => {
    return {
        tag_name: tag_name,
        opts: opts,
    };
};

const tags = [
    'a',
    'div',
    'li',
    'span',
    'ul',
];

_.each(tags, (tag_name) => {
    exports[tag_name] = (opts) => {
        return exports.tag(tag_name, opts);
    };
});

function fix_data(s) {
    if (typeof s === 'string') {
        return s;
    }
    if (typeof s === 'number') {
        return s.toString();
    }
    return JSON.stringify(s);
}

exports.render = (tag) => {
    const opts = tag.opts;
    const tag_name = tag.tag_name;
    const attr_str = _.map(opts.attrs, (attr) => {
        const val = attr[0].startsWith('data-') ?
            fix_data(attr[1]) : attr[1];
        return ' ' + attr[0] + '="' + val + '"';
    }).join('');

    const start_tag = '<' + tag_name + attr_str + '>';
    const end_tag = '</' + tag_name + '>';

    if (opts.keyed_children) {
        const innards = _.map(opts.keyed_children, (child) => {
            return exports.render(child.ast);
        }).join('\n');
        return start_tag + '\n' + innards + '\n' + end_tag;
    } else if (opts.children) {
        const innards = _.map(opts.children, (child) => {
            return exports.render(child);
        }).join('\n');
        return start_tag + '\n' + innards + '\n' + end_tag;
    } else if (opts.text) {
        const escaped_text = util.escape_html(opts.text.toString());
        return start_tag + escaped_text + end_tag;
    }
    return start_tag + end_tag;
};

exports.update = (container, new_dom, old_dom) => {
    function do_full_update() {
        const rendered_dom = exports.render(new_dom);
        container.html(rendered_dom);
    }

    if (old_dom === undefined) {
        do_full_update();
        return;
    }

    const new_opts = new_dom.opts;
    const old_opts = old_dom.opts;

    if (new_opts.keyed_children === undefined) {
        // We generally want to use vdom on lists, and
        // adding keys for childrens lets us avoid unnecessary
        // redraws (or lets us know we should just rebuild
        // the dom).
        blueslip.error("We need keyed_children for updates.");
    }

    if (exports.eq_tag(new_dom, old_dom)) {
        return;
    }

    const same_structure = exports.eq_array(
        new_opts.keyed_children,
        old_opts.keyed_children,
        (a, b) => a.key === b.key
    );

    if (!same_structure) {
        /* We could do something smarter like detecting row
           moves, but it's overkill for small lists.
        */
        do_full_update();
        return;
    }

    const tag_name = new_dom.tag_name;
    const child_elems = container.find(tag_name).children();

    _.each(new_opts.keyed_children, (new_child, i) => {
        const old_child = old_opts.keyed_children[i];
        if (exports.eq_tag(new_child.ast, old_child.ast)) {
            return;
        }
        const rendered_dom = exports.render(new_child.ast);
        child_elems.eq(i).replaceWith(rendered_dom);
    });
};

window.vdom = exports;
