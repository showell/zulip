import * as blueslip from "./blueslip.ts";
import * as channel from "./channel.ts";
import type {MessageList} from "./message_list.ts";
import * as message_store from "./message_store.ts";
import type {Message} from "./message_store.ts";
import type {PollWidgetOutboundData} from "./poll_data.ts";
import type {EventInfo, Submessage} from "./submessage_schema.ts";
import {get_event_info} from "./submessage_schema.ts";
import type {TodoWidgetOutboundData} from "./todo_widget.ts";
import * as widgetize from "./widgetize.ts";

type WidgetOutboundData = PollWidgetOutboundData | TodoWidgetOutboundData;

export function get_message_events(message: Message): EventInfo | undefined {
    if (message.locally_echoed) {
        return undefined;
    }

    if (message.submessages.length === 0) {
        return undefined;
    }

    return get_event_info(message);
}

export function process_widget_rows_in_list(list: MessageList | undefined): void {
    for (const message_id of widgetize.get_message_ids()) {
        const $row = list?.get_row(message_id);
        if ($row && $row.length > 0) {
            process_submessages({message_id, $row});
        }
    }
}

export function process_submessages(in_opts: {$row: JQuery; message_id: number}): void {
    // This happens in our rendering path, so we try to limit any
    // damage that may be triggered by one rogue message.
    try {
        do_process_submessages(in_opts);
        return;
    } catch (error) {
        blueslip.error("Failed to do_process_submessages", undefined, error);
        return;
    }
}

export function do_process_submessages(in_opts: {$row: JQuery; message_id: number}): void {
    const message_id = in_opts.message_id;
    const message = message_store.get(message_id);

    if (!message) {
        return;
    }

    const event_info = get_message_events(message);

    if (!event_info) {
        return;
    }

    // Right now, our only use of submessages is widgets.
    const {
        original_sender_id,
        widget_init_data,
        inbound_events,
    } = event_info;

    if (original_sender_id !== message.sender_id) {
        blueslip.warn(`User ${original_sender_id} tried to hijack message ${message.id}`);
        return;
    }

    const post_to_server = make_server_callback(message_id);

    // Call into the input layer for the widget system here.
    widgetize.activate({
        widget_init_data,
        events: inbound_events,
        $row: in_opts.$row,
        message,
        post_to_server,
    });
}

export function update_message(submsg: Submessage): void {
    const message = message_store.get(submsg.message_id);

    if (message === undefined) {
        // This is generally not a problem--the server
        // can send us events without us having received
        // the original message, since the server doesn't
        // track that.
        return;
    }

    const existing = message.submessages.find((sm) => sm.id === submsg.id);

    if (existing !== undefined) {
        blueslip.warn("Got submessage multiple times: " + submsg.id);
        return;
    }

    message.submessages.push(submsg);
}

export function handle_event(submsg: Submessage): void {
    // Update message.submessages in case we haven't actually
    // activated the widget yet, so that when the message does
    // come in view, the data will be complete.
    update_message(submsg);

    // Right now, our only use of submessages is widgets.
    const msg_type = submsg.msg_type;

    if (msg_type !== "widget") {
        blueslip.warn("unknown msg_type: " + msg_type);
        return;
    }

    let data: unknown;

    try {
        data = JSON.parse(submsg.content);
    } catch {
        blueslip.warn("server sent us invalid json in handle_event: " + submsg.content);
        return;
    }

    // Call into the input layer for the widget system here.
    widgetize.handle_event({
        sender_id: submsg.sender_id,
        message_id: submsg.message_id,
        data,
    });
}

export function make_server_callback(
    message_id: number,
): (opts: {msg_type: string; data: WidgetOutboundData}) => void {
    return function (opts: {msg_type: string; data: WidgetOutboundData}) {
        const url = "/json/submessage";

        void channel.post({
            url,
            data: {
                message_id,
                msg_type: opts.msg_type,
                content: JSON.stringify(opts.data),
            },
        });
    };
}
