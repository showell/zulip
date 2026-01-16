import $ from "jquery";
import assert from "minimalistic-assert";

import type {PollWidgetOutboundData} from "../src/poll_schema.ts";
import * as poll_widget from "../src/poll_widget.ts";

import {DemoWidgetContext} from "./demo_widget_context.ts";

type EventData = PollWidgetOutboundData;
type Event = {sender_id: number; data: unknown};
type EventsHandler = (events: Event[]) => void;

// Middle row classes for some base styling and the `.widget-content` element.
const demo_area = document.querySelector(".demo");
demo_area!.innerHTML = `<div class="poll-alice">`;
demo_area!.innerHTML += `<div class="poll-bob">`;
console.log("alice and bob are in non-message containers");

let poll_callback_alice: EventsHandler | undefined;
let poll_callback_bob: EventsHandler | undefined;

function broadcast_event(event: Event): void {
    const {sender_id, data} = event;

    if (poll_callback_alice) {
        poll_callback_alice([{sender_id, data}]);
    }
    if (poll_callback_bob) {
        poll_callback_bob([{sender_id, data}]);
    }
}

const alice = {id: 101, name: "Alice"};
const bob = {id: 202, name: "Bob"};
const owner_id = alice.id;

function get_user_name(id: number): string {
    switch (id) {
        case alice.id:
            return alice.name;
        case bob.id:
            return bob.name;
    }
    assert(false);
    return "UNKNOWN PERSON";
}

const setup_data = {
    question: "What do you think of the demo?",
    options: ["kinda cool!", "I don't quite get it", "meh"],
};

const alice_widget_context = new DemoWidgetContext({
    owner_id,
    user_id: alice.id,
    get_user_name,
});

const bob_widget_context = new DemoWidgetContext({
    owner_id,
    user_id: bob.id,
    get_user_name,
});

const opts = {
    $elem: $(".poll-alice"),
    widget_context: alice_widget_context,
    callback(data: EventData): void {
        broadcast_event({sender_id: alice.id, data});
    },
    setup_data,
};
poll_callback_alice = poll_widget.activate(opts);

const opts_bob = {
    $elem: $(".poll-bob"),
    widget_context: bob_widget_context,
    callback(data: EventData): void {
        broadcast_event({sender_id: bob.id, data});
    },
    setup_data,
};
poll_callback_bob = poll_widget.activate(opts_bob);
