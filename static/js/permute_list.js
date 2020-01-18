exports.array_move = (arr, from, to) => {
    var element = arr[from];
    arr.splice(from, 1);
    arr.splice(to, 0, element);
}

exports.print_lst = (lst) => {
    const items = lst.items;
    console.log('--');
    console.info(lst.top_val);
    console.info(items);
    let cnt = 0;
    for (node of lst) {
        console.log(node_num, _.range(node.lo, node.lo + node.cnt));
    }
}

function maybe_join(items, i) {
    const src = items[i];

    if (i + 1 >= items.length) {
        return;
    }

    const succ = items[i+1];

    if (src.lo + src.cnt !== succ.lo) {
        return;
    }

    src.cnt += succ.cnt;
    items.splice(i + 1, 1);
}

function insert_front(lst, from) {
    const items = lst.items;
    const node = items[from];
    lst.top_val = node.lo + node.cnt;
    items.splice(from, 1);
    maybe_join(items, from-1);
}

function shift_already_sorted(lst) {
    const items = lst.items;

    while (items.length > 0 && items[0].lo === lst.top_val) {
        const node = items[0];
        lst.top_val = node.lo + node.cnt;
        items.shift();
    }
}

function find_val(lst, val) {
    const items = lst.items;
    let pos = 0;
    let offset = 0;

    while (pos < items.length && items[pos].lo !== val) {
        offset += items[pos].cnt;
        pos += 1;
    }

    return {
        pos: pos,
        offset: offset,
    };
}

exports.arr_to_lst = (arr) => {
    if (arr.length === 0) {
        return {
            items: [],
        }
    }

    const items = [
        { lo: arr[0], cnt: 1},
    ];

    let i = 1;
    let pos = 0;

    while (i < arr.length) {
        if (arr[i] === items[pos].lo + items[pos].cnt) {
            items[pos].cnt += 1;
        } else {
            pos += 1;
            items.push({
                lo: arr[i],
                cnt: 1,
            });
        }
        i += 1;
    }

    return {
        items: items,
        top_val: 0,
    }
}

function add_fwd_moves(lst, moves) {
    const items = lst.items;
    const top_val = lst.top_val;

    while (items[0].lo !== top_val) {
        const node = items[0];
        const cnt = node.cnt;
        const lo = node.lo;
        const succ = lo + cnt;
        const res = find_val(lst, succ);
        const to = res.pos;

        if (to < items.length) {
            items[to].lo = lo;
            items[to].cnt += cnt;
        } else {
            items.push(node);
        }
        items.shift();

        const i_to = top_val + res.offset - 1;
        const move = [top_val, i_to];

        for (let i = 0; i < cnt; ++i) {
            moves.push(move);
        }
    }
}

function add_back_moves(lst, moves, from, offset) {
    const items = lst.items;
    const top_val = lst.top_val;
    let i_to = top_val;
    let i_from = top_val + offset;
    let cnt = items[from].cnt;
    for (let i = 0; i < cnt; ++i) {
        moves.push([i_from, i_to]);
        i_from += 1;
        i_to += 1;
    }
    insert_front(lst, from);
}

exports.get_moves = (arr, max_moves) => {
    const lst = exports.arr_to_lst(arr);
    const items = lst.items;

    const moves = [];

    shift_already_sorted(lst);


    while (lst.items.length > 0) {
        const top_val = lst.top_val;
        const res = find_val(lst, top_val);
        const pos = res.pos;
        const offset = res.offset;

        if (offset < items[pos].cnt) {
            add_fwd_moves(lst, moves);
            if (moves.length > max_moves) {
                return;
            }
        } else {
            add_back_moves(lst, moves, pos, offset);
            if (moves.length > max_moves) {
                return;
            }
        }
        shift_already_sorted(lst);
    }

    return moves;
}

