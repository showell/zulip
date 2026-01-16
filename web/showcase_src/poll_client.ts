import $ from "jquery";

import type {PollSetupData, PollWidgetOutboundData} from "../src/poll_schema.ts";
import * as poll_widget from "../src/poll_widget.ts";

import {DemoWidgetContext} from "./demo_widget_context.ts";

export type Event = {sender_id: number; data: unknown};

type HandleInboundEventsFunction = (events: Event[]) => void;

export class PollClient {
    inbound_events_handler: HandleInboundEventsFunction;

    constructor(inbound_events_handler: HandleInboundEventsFunction) {
        this.inbound_events_handler = inbound_events_handler;
    }

    handle_inbound_events(events: Event[]): void {
        this.inbound_events_handler(events);
    }
}

export function make_poll_client(info: {
    owner_id: number;
    user_id: number;
    get_user_name: (id: number) => string;
    container: HTMLElement;
    post_to_server_callback: (data: PollWidgetOutboundData) => void;
    setup_data: PollSetupData;
}): PollClient {
    const {owner_id, user_id, get_user_name, container, post_to_server_callback, setup_data} = info;

    const widget_context = new DemoWidgetContext({
        owner_id,
        user_id,
        get_user_name,
    });

    const handler = poll_widget.activate({
        $elem: $(container),
        widget_context,
        callback: post_to_server_callback,
        setup_data,
    });

    return new PollClient(handler);
}
