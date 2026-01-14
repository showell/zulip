import assert from "minimalistic-assert";

import type {Message} from "./message_store.ts";
import type {PollWidgetOutboundData} from "./poll_schema.ts";
import * as poll_widget from "./poll_widget.ts";
import type {WidgetInitData} from "./submessage_schema.ts";
import type {TodoWidgetOutboundData} from "./todo_widget.ts";
import * as todo_widget from "./todo_widget.ts";
import {ZulipWidgetContext} from "./widget_context.ts";
import * as zform from "./zform.ts";

// Our Event data from the server is opaque and unknown
// until the widget parses it with zod.
export type Event = {sender_id: number; data: unknown};

type HandleInboundEventsFunction = (events: Event[]) => void;

export type PostToServerFunction = (data: {msg_type: string; data: WidgetOutboundData}) => void;

type WidgetOutboundData = PollWidgetOutboundData | TodoWidgetOutboundData;

export class GenericWidget {
    // Eventually we will have concrete classes for PollWidget,
    // TodoWidget, and ZformWidget, but for now we need this
    // wrapper class.
    inbound_events_handler: HandleInboundEventsFunction;

    constructor(inbound_events_handler: HandleInboundEventsFunction) {
        this.inbound_events_handler = inbound_events_handler;
    }

    handle_inbound_events(events: Event[]): void {
        this.inbound_events_handler(events);
    }
}

export function create_widget_instance(info: {
    widget_init_data: WidgetInitData;
    post_to_server: PostToServerFunction;
    $widget_elem: JQuery;
    message: Message;
}): GenericWidget {
    const {widget_init_data, post_to_server, $widget_elem, message} = info;

    // We pass this is into the widgets to provide them a black-box
    // service that sends any events **outbound** to the other active
    // users. For example, if I vote on a poll, the widget from my
    // client will send data to the server using this callback, and
    // then the server will broadcast my poll vote to other users.
    function post_to_server_callback(data: WidgetOutboundData): void {
        post_to_server({
            msg_type: "widget",
            data,
        });
    }

    function get_inbound_event_handler(): HandleInboundEventsFunction | undefined {
        // These activate functions are annoying, and they
        // are showell's fault from 2018. But they will go away soon,
        // or at least better encapsulated.
        // (showell wrote this comment)
        switch (widget_init_data.widget_type) {
            case "poll": {
                return poll_widget.activate({
                    $elem: $widget_elem,
                    widget_context: new ZulipWidgetContext(message),
                    callback: post_to_server_callback,
                    setup_data: widget_init_data.extra_data,
                });
            }
            case "todo": {
                return todo_widget.activate({
                    $elem: $widget_elem,
                    callback: post_to_server_callback,
                    message,
                    setup_data: widget_init_data.extra_data,
                });
            }
            case "zform": {
                return zform.activate({
                    $elem: $widget_elem,
                    message,
                    form_data: widget_init_data.extra_data,
                });
            }
        }

        // We should never reach here, because upstream
        // code will validate widget_type.
        assert(false);
        return undefined;
    }

    const inbound_events_handler = get_inbound_event_handler();
    assert(inbound_events_handler !== undefined);

    return new GenericWidget(inbound_events_handler);
}
