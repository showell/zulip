import type {Event, PollClient} from "./poll_client.ts";

export class PollSession {
    clients: PollClient[] = [];

    broadcast_event(event: Event): void {
        const {sender_id, data} = event;

        for (const client of this.clients) {
            client.handle_inbound_events([{sender_id, data}]);
        }
    }

    add_client(client: PollClient): void {
        this.clients.push(client);
    }
}
