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

exports.ul = (opts) => {
    return {
        tag_name: 'ul',
        opts: opts,
    };
};

exports.render = (tag) => {
    const opts = tag.opts;
    const tag_name = tag.tag_name;
    const attr_str = _.map(opts.attrs, (attr) => {
        return ' ' + attr[0] + '="' + attr[1] + '"';
    }).join('');

    const start_tag = '<' + tag_name + attr_str + '>';
    const end_tag = '</' + tag_name + '>';

    if (opts.keyed_nodes === undefined) {
        blueslip.error("We need keyed_nodes to render innards.");
    }

    const innards = _.map(opts.keyed_nodes, (node) => {
        return node.render();
    }).join('\n');
    return start_tag + '\n' + innards + '\n' + end_tag;
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

    if (new_opts.keyed_nodes === undefined) {
        // We generally want to use vdom on lists, and
        // adding keys for childrens lets us avoid unnecessary
        // redraws (or lets us know we should just rebuild
        // the dom).
        blueslip.error("We need keyed_nodes for updates.");
    }

    const same_structure = exports.eq_array(
        new_opts.keyed_nodes,
        old_opts.keyed_nodes,
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

    _.each(new_opts.keyed_nodes, (new_node, i) => {
        const old_node = old_opts.keyed_nodes[i];
        if (new_node.eq(old_node)) {
            return;
        }
        const rendered_dom = new_node.render();
        child_elems.eq(i).replaceWith(rendered_dom);
    });
};

window.vdom = exports;
