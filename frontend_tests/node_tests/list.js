const {performance} = require('perf_hooks');
const permute_list = zrequire('permute_list');

const array_move = permute_list.array_move;

function permutator(inputArr) {
    // https://stackoverflow.com/questions/9960908/permutations-in-javascript
    var results = [];

    function permute(arr, memo) {
        var cur, memo = memo || [];

        for (var i = 0; i < arr.length; i++) {
            cur = arr.splice(i, 1);
            if (arr.length === 0) {
                results.push(memo.concat(cur));
            }
            permute(arr.slice(), memo.concat(cur));
            arr.splice(i, 0, cur[0]);
        }

        return results;
    }

    return permute(inputArr);
}

let seed = 6;
function getRandomInt(max) {
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = Math.floor(seed / 233280 * max);
	return rnd
}

run_test('big_lists', () => {
    const arr_size = 1500;
    const num_trials = 350;
    const max_moves = 50;
    const num_tweaks = 20;
    const orig_lst = _.range(arr_size);

    const arrs = _.map(_.range(num_trials), () => {
        const arr = [...orig_lst];

        for (let i = 0; i < num_tweaks; ++i) {
            const from = getRandomInt(arr_size);
            const to = getRandomInt(arr_size);
            array_move(arr, from, to);
        }

        const lst = permute_list.arr_to_lst(arr);
        // console.log(lst.items.length);

        return arr;
    });

    let total_moves = 0;
    const t1 = performance.now();

    const results = [];
    for (arr of arrs) {
        const moves = permute_list.get_moves(arr, max_moves);
        if (!moves) {
            console.log(arr);
            console.log(permute_list.get_moves(arr, 999));
            throw Error('inefficient');
        }
        total_moves += moves.length;
        results.push({
            arr: arr,
            moves: moves,
        });
    }

    const t2 = performance.now();

    const elapsed = t2 - t1;

    console.info(elapsed, elapsed / arrs.length);

    for (res of results) {
        for (move of res.moves) {
            array_move(res.arr, move[0], move[1]);
        }
        assert.deepEqual(res.arr, orig_lst);
    }

    console.info(total_moves / arrs.length);
});

run_test('permute', () => {
    const orig_lst = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    lsts = permutator(orig_lst);

    let total_moves = 0;
    const t1 = performance.now();

    const max_moves = orig_lst.length - 1;

    const results = [];
    for (arr of lsts) {
        const moves = permute_list.get_moves(arr, max_moves);
        total_moves += moves.length;
        results.push({
            arr: arr,
            moves: moves,
        });
    }

    const t2 = performance.now();
    const elapsed = t2 - t1;

    console.info(elapsed, elapsed / lsts.length);

    for (res of results) {
        for (move of res.moves) {
            array_move(res.arr, move[0], move[1]);
        }
        assert.deepEqual(res.arr, orig_lst);
    }

    console.info(total_moves / lsts.length);
});

