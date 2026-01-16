import $ from "jquery";

import type {PollWidgetOutboundData} from "../src/poll_schema.ts";
import * as poll_widget from "../src/poll_widget.ts";

import {DemoWidgetContext} from "./demo_widget_context.ts";

type EventData = PollWidgetOutboundData;
type Event = {sender_id: number; data: unknown};
type EventsHandler = (events: Event[]) => void;

// Middle row classes for some base styling and the `.widget-content` element.
document.querySelector(".column-middle-inner")!.innerHTML = `<div class="widget-content-alice">`;
document.querySelector(".column-middle-inner")!.innerHTML += `<div class="widget-content-bob">`;
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

const setup_data = {
    question: "Where do you want to go?",
    options: ["east", "west"],
};

const alice_widget_context = new DemoWidgetContext({
    owner_id: 1,
    user_id: 1,
});
const bob_widget_context = new DemoWidgetContext({
    owner_id: 1,
    user_id: 2,
});

const $widget_elem_alice = $(".widget-content-alice");
const opts = {
    $elem: $widget_elem_alice,
    widget_context: alice_widget_context,
    callback(data: EventData): void {
        broadcast_event({sender_id: 1, data});
    },
    setup_data,
};
poll_callback_alice = poll_widget.activate(opts);

const $widget_elem_bob = $(".widget-content-bob");
const opts_bob = {
    $elem: $widget_elem_bob,
    widget_context: bob_widget_context,
    callback(data: EventData): void {
        broadcast_event({sender_id: 2, data});
    },
    setup_data,
};
poll_callback_bob = poll_widget.activate(opts_bob);
