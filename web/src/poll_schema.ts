import * as z from "zod/mini";

/*
    EVENT TYPES FOLLOW.

    The inbound types have exactly the same shape as the
    outbound types. It's a peer-to-peer protocol.

    Alice send the NewOption message (outbound).
    Bob receives the NewOption message (inbound).

    It's actually that simple.
*/

export const new_option_schema = z.object({
    type: z.literal("new_option"),
    idx: z.number(),
    option: z.string(),
});
export type NewOption = {type: string; idx: number; option: string};

export const question_schema = z.object({
    type: z.literal("question"),
    question: z.string(),
});
export type Question = {type: string; question: string};

export const vote_schema = z.object({
    type: z.literal("vote"),
    key: z.string(),
    vote: z.number(),
});
export type Vote = {type: string; key: string; vote: number};

/* ---------------------- */

export const poll_setup_data_schema = z.object({
    question: z.optional(z.string()),
    options: z.optional(z.array(z.string())),
});

export type PollSetupData = z.infer<typeof poll_setup_data_schema>;

export type PollWidgetOutboundData = NewOption | Question | Vote;
