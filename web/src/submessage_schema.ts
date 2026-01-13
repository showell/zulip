import assert from "minimalistic-assert";
import * as z from "zod/mini";

import type {Message} from "./message_store.ts";
import {poll_setup_data_schema} from "./poll_data.ts";
import {todo_setup_data_schema} from "./todo_data.ts";
import {form_schema} from "./zform_data.ts";

/*

    Our submessages are shaped as followed:

    [
        {
            id: 9,
            sender_id: 33,
            message_id: 1000,
            content: '{"widget_type": "poll", "extra_data": {"question": "foo", "options": []}}',
            msg_type: 'widget',
        },
        {
            id: 10,
            sender_id: 99,
            message_id: 1000,
            content: '{"type":"new_option", "idx":1, "option":"eat pizza"}',
            msg_type: 'widget',
        },
        {
            id: 15,
            sender_id: 44,
            message_id: 1000,
            content: '{"type":"new_option", "idx":2, "option":"work through lunch"}',
            msg_type: 'widget',
        },
    ]
*/

export const submessage_schema = z.object({
    id: z.number(),
    sender_id: z.number(),
    message_id: z.number(),
    content: z.string(),
    msg_type: z.string(),
});

export type Submessage = z.infer<typeof submessage_schema>;

const widget_content_schema = z.discriminatedUnion("widget_type", [
    z.object({widget_type: z.literal("poll"), extra_data: poll_setup_data_schema}),
    z.object({widget_type: z.literal("todo"), extra_data: todo_setup_data_schema}),
    z.object({widget_type: z.literal("zform"), extra_data:form_schema}),
]);
export type WidgetInitData = z.infer<typeof widget_content_schema>;

const inbound_data_schema = z.intersection(
    z.object({
        type: z.string(),
    }),
    z.record(z.string(), z.unknown()),
);
type InboundData = z.infer<typeof inbound_data_schema>;

type InboundEvent = {
    sender_id: number;
    data: InboundData;
};

export type EventInfo = {
    original_sender_id: number;
    widget_init_data: WidgetInitData;
    inbound_events: InboundEvent[],
}

function parse_widget_content(content: string): WidgetInitData {
    return widget_content_schema.parse(JSON.parse(content));
}

export function get_event_info(message: Message): EventInfo {
    // Our caller checks that we have at least one submessage.
    assert(message.submessages.length > 0)

    message.submessages.sort((m1, m2) => m1.id - m2.id);

    const [first_submessage, ...other_submessages] = message.submessages;
    assert(first_submessage !== undefined);

    const widget_init_data = parse_widget_content(first_submessage.content);

    const inbound_events = other_submessages.map((submessage) => ({
        sender_id: submessage.sender_id,
        data: inbound_data_schema.parse(JSON.parse(submessage.content)),
    }));

    /*
        Return something that looks this to the caller:

            {
                original_sender_id: 33,
                widget_init_data: {
                    widget_type: "poll",
                    extra_data: {
                        question: "What's for lunch?",
                        options: [],
                    },
                },
                inbound_events: [
                    {
                        sender_id: 99,
                        data: {
                            type: "new_option",
                            idx: 1,
                            option: "pizza",
                        },
                    },
                    {
                        sender_id: 44,
                        data: {
                            type: "new_option",
                            idx: 2,
                            option: "tacos",
                        },
                    },
                ],
            });
    */

    return {
        original_sender_id: first_submessage.sender_id,
        widget_init_data,
        inbound_events,
    };
}

