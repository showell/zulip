import assert from "minimalistic-assert";

import type {NewOption, Question, Vote} from "../src/poll_schema.ts";

import type {Event, PollClient} from "./poll_client.ts";
import {make_poll_client} from "./poll_client.ts";

function new_container(title: string): HTMLElement {
    const demo_area = document.querySelector(".demo");
    const outer_div = document.createElement("div");
    const div = document.createElement("div");
    const heading = document.createElement("h5");
    heading.textContent = title;
    outer_div.append(heading);
    outer_div.append(div);
    demo_area!.append(outer_div);
    return div;
}

export function launch(): void {
    const clients: PollClient[] = [];

    const alice = {id: 101, name: "Alice"};
    const bob = {id: 201, name: "Bob Roberts"};
    const chinmayi = {id: 301, name: "Chinmayi"};

    function get_user_name(id: number): string {
        switch (id) {
            case alice.id:
                return alice.name;
            case bob.id:
                return bob.name;
            case chinmayi.id:
                return chinmayi.name;
        }
        assert(false);
        return "UNKNOWN PERSON";
    }

    function broadcast_event(event: Event): void {
        const {sender_id, data} = event;

        for (const client of clients) {
            client.handle_inbound_events([{sender_id, data}]);
        }
    }

    const owner_id = alice.id;

    const setup_data = {
        question: "What do you think of the demo?",
        options: ["kinda cool!", "I don't quite get it", "meh"],
    };

    for (const user of [alice, bob, chinmayi]) {
        const client = make_poll_client({
            owner_id,
            user_id: user.id,
            get_user_name,
            container: new_container(user.name),
            post_to_server_callback(data: NewOption | Question | Vote): void {
                broadcast_event({sender_id: user.id, data});
            },
            setup_data,
        });
        clients.push(client);
    }
}
