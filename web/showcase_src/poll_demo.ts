import $ from "jquery";
import assert from "minimalistic-assert";

import type {NewOption, Question, Vote} from "../src/poll_schema.ts";

import type {Event, PollClient} from "./poll_client.ts";
import {make_poll_client} from "./poll_client.ts";

// Middle row classes for some base styling and the `.widget-content` element.

const demo_area = document.querySelector(".demo");
demo_area!.innerHTML = `<div class="poll-alice">`;
demo_area!.innerHTML += `<div class="poll-bob">`;
console.log("Alice and Bob are in non-message containers!!!");

let alice_client: PollClient | undefined;
let bob_client: PollClient | undefined;

function broadcast_event(event: Event): void {
    const {sender_id, data} = event;

    if (alice_client) {
        alice_client.handle_inbound_events([{sender_id, data}]);
    }
    if (bob_client) {
        bob_client.handle_inbound_events([{sender_id, data}]);
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

alice_client = make_poll_client({
    owner_id,
    user_id: alice.id,
    get_user_name,
    $elem: $(".poll-alice"),
    post_to_server_callback(data: NewOption | Question | Vote): void {
        broadcast_event({sender_id: alice.id, data});
    },
    setup_data,
});

bob_client = make_poll_client({
    owner_id,
    user_id: bob.id,
    get_user_name,
    $elem: $(".poll-bob"),
    post_to_server_callback(data: NewOption | Question | Vote): void {
        broadcast_event({sender_id: bob.id, data});
    },
    setup_data,
});
