import type {NewOption, Question, Vote} from "../src/poll_schema.ts";

import {make_poll_client} from "./poll_client.ts";
import {PollSession} from "./poll_session.ts";
import {Realm} from "./realm.ts";
import {Section} from "./ui.ts";

export function launch(): void {
    const section = new Section();
    const realm = new Realm();
    const poll_session = new PollSession();

    const alice = realm.make_user("Alice");
    const bob = realm.make_user("Bob");
    const chinmayi = realm.make_user("Chinmayi");

    const owner_id = alice.id;

    const setup_data = {
        question: "What do you think of the demo?",
        options: ["kinda cool!", "seems promising", "meh"],
    };

    function get_user_name(id: number): string {
        return realm.get_user_name(id);
    }

    for (const user of [alice, bob, chinmayi]) {
        const client = make_poll_client({
            owner_id,
            user_id: user.id,
            get_user_name,
            container: section.new_container({title: user.name, width: "375px"}),
            post_to_server_callback(data: NewOption | Question | Vote): void {
                poll_session.broadcast_event({sender_id: user.id, data});
            },
            setup_data,
        });
        poll_session.add_client(client);
    }
}
