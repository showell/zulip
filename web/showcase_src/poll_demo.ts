import type {PollWidgetOutboundData} from "../src/poll_schema.ts";

// Middle row classes for some base styling and the `.widget-content` element.
document.querySelector(".column-middle-inner")!.innerHTML = `<div class="widget-content-alice">`;
document.querySelector(".column-middle-inner")!.innerHTML += `<div class="widget-content-bob">`;
console.log("alice and bob are in non-message containers");

export const {DemoWidgetContext} = await import("./demo_widget_context.ts");
const poll_widget = await import("../src/poll_widget.ts");

const alice_widget_context = new DemoWidgetContext({
    owner_id: 1,
    user_id: 1,
});
const bob_widget_context = new DemoWidgetContext({
    owner_id: 1,
    user_id: 2,
});

const $widget_elem_alice = $(".widget-content-alice");
let poll_callback_alice;
const opts = {
    $elem: $widget_elem_alice,
    widget_context: alice_widget_context,
    callback(data: PollWidgetOutboundData) {
        poll_callback_alice!([{sender_id: 1, data}]);
        poll_callback_bob!([{sender_id: 1, data}]);
    },
    setup_data: {
        question: "Where to go?",
        options: ["east", "west"],
    },
};
poll_callback_alice = poll_widget.activate(opts);

const $widget_elem_bob = $(".widget-content-bob");
let poll_callback_bob;
const opts_bob = {
    $elem: $widget_elem_bob,
    widget_context: bob_widget_context,
    callback(data: PollWidgetOutboundData) {
        poll_callback_bob!([{sender_id: 2, data}]);
        poll_callback_alice([{sender_id: 2, data}]);
    },
    setup_data: {
        question: "Where to go?",
        options: ["east", "west"],
    },
};
poll_callback_bob = poll_widget.activate(opts_bob);
