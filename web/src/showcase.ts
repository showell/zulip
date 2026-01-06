/* eslint-disable @typescript-eslint/no-explicit-any */
import "./showcase_mock";

// @ts-ignore
import * as hbs_bridge from "./hbs_bridge.ts";
// @ts-ignore
import * as pure_dom from "./pure_dom.ts";
import * as poll_widget from "./poll_widget.ts";

// Bypass JQuery type resolution for the showcase environment
const $: any = (window as any).$;

/**
 * INITIALIZE: Called by ui_init.js
 * This sets up the Alice & Bob side-by-side multi-user simulation.
 */
export function initialize(): void {
    // 1. STOP THE ROUTER: Clear the hash so Zulip doesn't try to open #inbox
    window.location.hash = "";

    // 2. NUKE THE UI: Hide everything that isn't your demo
    $("body").children().hide();
    
    // 3. CREATE A CLEAN CONTAINER
    const $showcase = $('<div id="gsoc-showcase"></div>').appendTo("body");
    
    $showcase.css({
        "position": "fixed",
        "top": "0",
        "left": "0",
        "width": "100vw",
        "height": "100vh",
        "z-index": "2147483647",
        "background": "#f0f2f5",
        "display": "flex",
        "flex-direction": "column",
        "padding": "20px",
        "gap": "20px",
        "box-sizing": "border-box",
        "font-family": "sans-serif"
    });
    // 3.5 INJECT STYLES (Crucial so it doesn't look broken)
    $('<style>').text(`
        #gsoc-showcase .poll-widget { font-size: 14px; color: #333; }
        #gsoc-showcase .poll-option-row { margin-bottom: 8px; display: flex; align-items: center; }
        #gsoc-showcase button { cursor: pointer; padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc; background: #fff; }
        #gsoc-showcase button:hover { background: #eee; }
        #gsoc-showcase input[type="text"] { padding: 4px; border: 1px solid #ccc; border-radius: 4px; margin-right: 8px; }
        #gsoc-showcase .poll-widget-option-voters { font-size: 12px; color: #666; margin-left: 10px; }
    `).appendTo('head');
    //

    // 4. Build the side-by-side UI + Debug Log Container
    $showcase.html(`
        <div style="display: flex; flex: 1; gap: 20px; min-height: 0;">
            <div id="alice-view" style="flex: 1; border: 4px solid #007bff; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow-y: auto;">
                <h1 style="color: #007bff; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">Alice (User 1)</h1>
                <div class="widget-content"></div>
            </div>
            <div id="bob-view" style="flex: 1; border: 4px solid #28a745; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow-y: auto;">
                <h1 style="color: #28a745; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">Bob (User 2)</h1>
                <div class="widget-content"></div>
            </div>
        </div>
        <div id="log-container" style="height: 220px; background: #272822; color: #f8f8f2; padding: 15px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: flex; flex-direction: column;">
            <h3 style="margin-top: 0; color: #ae81ff; font-size: 0.9em; text-transform: uppercase; border-bottom: 1px solid #444; padding-bottom: 5px;">Live Submessage Feed (Broadcast Events)</h3>
            <pre id="debug-log" style="margin: 0; flex: 1; overflow-y: auto; font-family: 'Courier New', monospace; font-size: 0.85em; white-space: pre-wrap; line-height: 1.4;">Waiting for widget interaction...</pre>
        </div>
    `);

    // 5. Inject DOM Fragments
    const alice_dom = (pure_dom.poll_widget() as any).to_dom();
    const bob_dom = (pure_dom.poll_widget() as any).to_dom();

    $("#alice-view .widget-content").append(alice_dom);
    $("#bob-view .widget-content").append(bob_dom);

    // 6. Setup the Virtual Server logic with Live Logging
    const virtual_server = {
        clients: [] as ((events: any[]) => void)[],
        broadcast(data: any) {
            // APPEND TO LOG
            const $log = $("#debug-log");
            if ($log.length) {
                const timestamp = new Date().toLocaleTimeString();
                const entry = `\n[${timestamp}] BROADCAST:\n${JSON.stringify(data, null, 2)}\n${"-".repeat(40)}`;
                $log.append(entry);
                $log.scrollTop($log[0].scrollHeight);
            }

            const event = { 
                sender_id: 9, 
                data: data 
            };

            for (const client_inbound of this.clients) {
                client_inbound([event]);
            }
        }
    };

    const setup_user = (selector: string) => {
        const inbound = (poll_widget as any).activate({
            $elem: $(`${selector} .poll-widget`),
            callback: (data: any) => virtual_server.broadcast(data),
            message: { id: 1 } as any,
            extra_data: {} as any,
        });
        virtual_server.clients.push(inbound);
    };

    setup_user("#alice-view");
    setup_user("#bob-view");
}
(window as any).showcase = { initialize };