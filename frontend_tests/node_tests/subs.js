"use strict";

const {strict: assert} = require("assert");

const {stub_templates} = require("../zjsunit/handlebars");
const {set_global, zrequire} = require("../zjsunit/namespace");
const {run_test} = require("../zjsunit/test");
const {make_zjquery} = require("../zjsunit/zjquery");

set_global("ui", {
    get_content_element: (element) => element,
    get_scroll_element: (element) => element,
});
const peer_data = zrequire("peer_data");
zrequire("stream_data");
zrequire("search_util");
set_global("page_params", {});

set_global("location", {
    hash: "#streams/1/announce",
});

zrequire("subs");

set_global("$", make_zjquery());
set_global("hash_util", {
    by_stream_uri: () => {},
});

run_test("filter_table", () => {
    const stream_list = $(".streams-list");

    let scrolltop_called = false;
    stream_list.scrollTop = function (set) {
        scrolltop_called = true;
        if (!set) {
            return 10;
        }
        assert.equal(set, 10);
        return this;
    };

    // set-up sub rows stubs
    const sub_row_data = [
        {
            elem: "denmark",
            subscribed: false,
            name: "Denmark",
            stream_id: 1,
            description: "Copenhagen",
            subscribers: [1],
            stream_weekly_traffic: null,
            color: "red",
        },
        {
            elem: "poland",
            subscribed: true,
            name: "Poland",
            stream_id: 2,
            description: "monday",
            subscribers: [1, 2, 3],
            stream_weekly_traffic: 13,
            color: "red",
        },
        {
            elem: "pomona",
            subscribed: true,
            name: "Pomona",
            stream_id: 3,
            description: "college",
            subscribers: [],
            stream_weekly_traffic: 0,
            color: "red",
        },
        {
            elem: "cpp",
            subscribed: true,
            name: "C++",
            stream_id: 4,
            description: "programming lang",
            subscribers: [1, 2],
            stream_weekly_traffic: 6,
            color: "red",
        },
        {
            elem: "zzyzx",
            subscribed: true,
            name: "Zzyzx",
            stream_id: 5,
            description: "california town",
            subscribers: [1, 2],
            stream_weekly_traffic: 6,
            color: "red",
        },
    ];

    for (const sub of sub_row_data) {
        peer_data.set_subscribers(sub.stream_id, sub.subscribers);
        delete sub.subscribers;
        stream_data.create_sub_from_server_data(sub);
    }

    let populated_subs;

    stub_templates((fn, data) => {
        assert.equal(fn, "subscriptions");
        populated_subs = data.subscriptions;
    });

    subs.populate_stream_settings_left_panel();

    const sub_stubs = [];

    for (const data of populated_subs) {
        const sub_row = ".stream-row-" + data.elem;
        sub_stubs.push(sub_row);

        $(sub_row).attr("data-stream-id", data.stream_id);
        $(sub_row).set_find_results(
            '.sub-info-box [class$="-bar"] [class$="-count"]',
            $(".tooltip"),
        );
        $(sub_row).detach = function () {
            return sub_row;
        };
    }

    let tooltip_called = false;
    $(".tooltip").tooltip = function (obj) {
        tooltip_called = true;
        assert.deepEqual(obj, {
            placement: "left",
            animation: false,
        });
    };

    $.stub_selector("#subscriptions_table .stream-row", sub_stubs);

    const sub_table = $("#subscriptions_table .streams-list");
    let sub_table_append = [];
    sub_table.append = function (rows) {
        sub_table_append.push(rows);
    };

    let ui_called = false;
    ui.reset_scrollbar = function (elem) {
        ui_called = true;
        assert.equal(elem, $("#subscription_overlay .streams-list"));
    };

    // Search with single keyword
    subs.filter_table({input: "Po", subscribed_only: false});
    assert($(".stream-row-denmark").hasClass("notdisplayed"));
    assert(!$(".stream-row-poland").hasClass("notdisplayed"));
    assert(!$(".stream-row-pomona").hasClass("notdisplayed"));
    assert($(".stream-row-cpp").hasClass("notdisplayed"));
    assert($(".stream-row-zzyzx").hasClass("notdisplayed"));

    // assert these once and call it done
    assert(ui_called);
    assert(scrolltop_called);
    assert(tooltip_called);
    assert.deepEqual(sub_table_append, [
        ".stream-row-poland",
        ".stream-row-pomona",
        ".stream-row-cpp",
        ".stream-row-zzyzx",
        ".stream-row-denmark",
    ]);

    // Search with multiple keywords
    subs.filter_table({input: "Denmark, Pol", subscribed_only: false});
    assert(!$(".stream-row-denmark").hasClass("notdisplayed"));
    assert(!$(".stream-row-poland").hasClass("notdisplayed"));
    assert($(".stream-row-pomona").hasClass("notdisplayed"));
    assert($(".stream-row-cpp").hasClass("notdisplayed"));
    assert($(".stream-row-zzyzx").hasClass("notdisplayed"));

    subs.filter_table({input: "Den, Pol", subscribed_only: false});
    assert(!$(".stream-row-denmark").hasClass("notdisplayed"));
    assert(!$(".stream-row-poland").hasClass("notdisplayed"));
    assert($(".stream-row-pomona").hasClass("notdisplayed"));
    assert($(".stream-row-cpp").hasClass("notdisplayed"));
    assert($(".stream-row-zzyzx").hasClass("notdisplayed"));

    // Search is case-insensitive
    subs.filter_table({input: "po", subscribed_only: false});
    assert($(".stream-row-denmark").hasClass("notdisplayed"));
    assert(!$(".stream-row-poland").hasClass("notdisplayed"));
    assert(!$(".stream-row-pomona").hasClass("notdisplayed"));
    assert($(".stream-row-cpp").hasClass("notdisplayed"));
    assert($(".stream-row-zzyzx").hasClass("notdisplayed"));

    // Search handles unusual characters like C++
    subs.filter_table({input: "c++", subscribed_only: false});
    assert($(".stream-row-denmark").hasClass("notdisplayed"));
    assert($(".stream-row-poland").hasClass("notdisplayed"));
    assert($(".stream-row-pomona").hasClass("notdisplayed"));
    assert(!$(".stream-row-cpp").hasClass("notdisplayed"));
    assert($(".stream-row-zzyzx").hasClass("notdisplayed"));

    // Search subscribed streams only
    subs.filter_table({input: "d", subscribed_only: true});
    assert($(".stream-row-denmark").hasClass("notdisplayed"));
    assert(!$(".stream-row-poland").hasClass("notdisplayed"));
    assert($(".stream-row-pomona").hasClass("notdisplayed"));
    assert($(".stream-row-cpp").hasClass("notdisplayed"));
    assert($(".stream-row-zzyzx").hasClass("notdisplayed"));

    // Search terms match stream description
    subs.filter_table({input: "Co", subscribed_only: false});
    assert(!$(".stream-row-denmark").hasClass("notdisplayed"));
    assert($(".stream-row-poland").hasClass("notdisplayed"));
    assert(!$(".stream-row-pomona").hasClass("notdisplayed"));
    assert($(".stream-row-cpp").hasClass("notdisplayed"));
    assert($(".stream-row-zzyzx").hasClass("notdisplayed"));

    // Search names AND descriptions
    sub_table_append = [];

    subs.filter_table({input: "Mon", subscribed_only: false});
    assert($(".stream-row-denmark").hasClass("notdisplayed"));
    assert(!$(".stream-row-poland").hasClass("notdisplayed"));
    assert(!$(".stream-row-pomona").hasClass("notdisplayed"));
    assert($(".stream-row-cpp").hasClass("notdisplayed"));
    assert($(".stream-row-zzyzx").hasClass("notdisplayed"));
    assert.deepEqual(sub_table_append, [
        ".stream-row-pomona",
        ".stream-row-poland",
        ".stream-row-cpp",
        ".stream-row-zzyzx",
        ".stream-row-denmark",
    ]);

    // Explicitly order streams by name
    sub_table_append = [];
    subs.filter_table({input: "", subscribed_only: false, sort_order: "by-stream-name"});
    assert.deepEqual(sub_table_append, [
        ".stream-row-cpp",
        ".stream-row-denmark",
        ".stream-row-poland",
        ".stream-row-pomona",
        ".stream-row-zzyzx",
    ]);

    // Order streams by subscriber count
    sub_table_append = [];
    subs.filter_table({input: "", subscribed_only: false, sort_order: "by-subscriber-count"});
    assert.deepEqual(sub_table_append, [
        ".stream-row-poland",
        ".stream-row-cpp",
        ".stream-row-zzyzx",
        ".stream-row-denmark",
        ".stream-row-pomona",
    ]);

    // Order streams by weekly traffic
    sub_table_append = [];
    subs.filter_table({input: "", subscribed_only: false, sort_order: "by-weekly-traffic"});
    assert.deepEqual(sub_table_append, [
        ".stream-row-poland",
        ".stream-row-cpp",
        ".stream-row-zzyzx",
        ".stream-row-pomona",
        ".stream-row-denmark",
    ]);

    // Showing subscribed streams only puts un-subscribed DOM elements last
    sub_table_append = [];
    subs.filter_table({input: "", subscribed_only: true, sort_order: "by-subscriber-count"});
    assert.deepEqual(sub_table_append, [
        ".stream-row-poland",
        ".stream-row-cpp",
        ".stream-row-zzyzx",
        ".stream-row-pomona",
        ".stream-row-denmark",
    ]);

    // active stream-row is not included in results
    $(".stream-row-denmark").addClass("active");
    $(".stream-row.active").hasClass = function (cls) {
        assert.equal(cls, "notdisplayed");
        return $(".stream-row-denmark").hasClass("active");
    };
    $(".stream-row.active").removeClass = function (cls) {
        assert.equal(cls, "active");
        $(".stream-row-denmark").removeClass("active");
    };

    subs.filter_table({input: "d", subscribed_only: true});
    assert(!$(".stream-row-denmark").hasClass("active"));
    assert(!$(".right .settings").visible());
    assert($(".nothing-selected").visible());

    subs.filter_table({input: "d", subscribed_only: true});
    assert($(".stream-row-denmark").hasClass("notdisplayed"));
    assert(!$(".stream-row-poland").hasClass("notdisplayed"));
    assert($(".stream-row-pomona").hasClass("notdisplayed"));
    assert($(".stream-row-cpp").hasClass("notdisplayed"));
    assert($(".stream-row-zzyzx").hasClass("notdisplayed"));

    subs.filter_table({input: "d", subscribed_only: true});
    assert($(".stream-row-denmark").hasClass("notdisplayed"));
    assert(!$(".stream-row-poland").hasClass("notdisplayed"));
    assert($(".stream-row-pomona").hasClass("notdisplayed"));
    assert($(".stream-row-cpp").hasClass("notdisplayed"));
    assert($(".stream-row-zzyzx").hasClass("notdisplayed"));

    // test selected row set to active
    $(".stream-row[data-stream-id='1']").removeClass("active");
    subs.filter_table({input: "", subscribed_only: false});
    assert($(".stream-row[data-stream-id='1']").hasClass("active"));
});
