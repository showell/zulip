export function get_base_html(): string {
    return `
        <div
          hidden
          id="page-params"
          data-params='{
            "page_type":"home",
            "development_environment":true,
            "google_analytics_id":"G-TEST1234",
            "request_language":"en",
            "apps_page_url":"/apps/",
            "corporate_enabled":true,
            "embedded_bots_enabled":true,
            "furthest_read_time":null,
            "insecure_desktop_app":false,
            "is_node_test":true,
            "is_spectator":false,
            "login_page":"/devlogin/",
            "language_list":[
              {"code":"id","locale":"id","name":"Bahasa Indonesia","percent_translated":11},
              {"code":"en-gb","locale":"en_GB","name":"British English","percent_translated":90},
              {"code":"ca","locale":"ca","name":"català","percent_translated":10},
              {"code":"cs","locale":"cs","name":"česky","percent_translated":75},
              {"code":"zh-tw","locale":"zh_TW","name":"Chinese (Traditional Han script)","percent_translated":99},
              {"code":"cy","locale":"cy","name":"Cymraeg","percent_translated":40},
              {"code":"da","locale":"da","name":"dansk","percent_translated":29},
              {"code":"de","locale":"de","name":"Deutsch","percent_translated":97},
              {"code":"en","locale":"en","name":"English"},
              {"code":"es","locale":"es","name":"español","percent_translated":57},
              {"code":"fr","locale":"fr","name":"français","percent_translated":61},
              {"code":"hi","locale":"hi","name":"हिंदी","percent_translated":5}
            ],
            "presence_history_limit_days_for_web_app":30,
            "promote_sponsoring_zulip":true,
            "realm_rendered_description":"<p>Welcome to the Zulip dev server.</p>",
            "show_try_zulip_modal":false,
            "state_data":null,
            "translation_data":{
              "Compose":"Compose",
              "Send":"Send",
              "Search":"Search"
            },
            "warn_no_email":false
          }'
        ></div>
        <div class="app">
                    <div class="app-main">
                        <div class="column-left" id="left-sidebar-container"></div>
                        <div class="column-middle">
                            <div class="column-middle-inner">
                                <div id="recent_view">
                                    <div class="recent_view_container">
                                        <div id="recent_view_table"></div>
                                    </div>
                                    <table id="recent-view-content-table">
                                        <tbody data-empty="No conversations match your filters." id="recent-view-content-tbody"></tbody>
                                    </table>
                                    <div id="recent_view_bottom_whitespace">
                                        <div class="bottom-messages-logo">
                                            <svg class="messages-logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 773.12 773.12">
                                                <circle cx="386.56" cy="386.56" r="386.56"/>
                                                <path d="M566.66 527.25c0 33.03-24.23 60.05-53.84 60.05H260.29c-29.61 0-53.84-27.02-53.84-60.05 0-20.22 9.09-38.2 22.93-49.09l134.37-120c2.5-2.14 5.74 1.31 3.94 4.19l-49.29 98.69c-1.38 2.76.41 6.16 3.25 6.16h191.18c29.61 0 53.83 27.03 53.83 60.05zm0-281.39c0 20.22-9.09 38.2-22.93 49.09l-134.37 120c-2.5 2.14-5.74-1.31-3.94-4.19l49.29-98.69c1.38-2.76-.41-6.16-3.25-6.16H260.29c-29.61 0-53.84-27.02-53.84-60.05s24.23-60.05 53.84-60.05h252.54c29.61 0 53.83 27.02 53.83 60.05z"/>
                                            </svg>
                                        </div>
                                        <div id="recent_view_loading_messages_indicator"></div>
                                    </div>
                                    <!-- Don't show the banner until we have some messages loaded. -->
                                    <div class="recent-view-load-more-container main-view-banner info notvisible">
                                        <div class="last-fetched-message banner_content">This view is still loading messages.</div>
                                        <button class="fetch-messages-button main-view-banner-action-button right_edge notvisible">
                                            <span class="loading-indicator"></span>
                                            <span class="button-label">Load more</span>
                                        </button>
                                    </div>
                                </div>
                                <div id="inbox-view" class="no-visible-focus-outlines">
                                    <div class="inbox-container">
                                        <div id="inbox-pane"></div>
                                    </div>
                                </div>
                                <div id="message_feed_container">
                                    <div class="message-feed" id="main_div">
                                        <div class="top-messages-logo">
                                            <svg class="messages-logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 773.12 773.12">
                                                <circle cx="386.56" cy="386.56" r="386.56"/>
                                                <path d="M566.66 527.25c0 33.03-24.23 60.05-53.84 60.05H260.29c-29.61 0-53.84-27.02-53.84-60.05 0-20.22 9.09-38.2 22.93-49.09l134.37-120c2.5-2.14 5.74 1.31 3.94 4.19l-49.29 98.69c-1.38 2.76.41 6.16 3.25 6.16h191.18c29.61 0 53.83 27.03 53.83 60.05zm0-281.39c0 20.22-9.09 38.2-22.93 49.09l-134.37 120c-2.5 2.14-5.74-1.31-3.94-4.19l49.29-98.69c1.38-2.76-.41-6.16-3.25-6.16H260.29c-29.61 0-53.84-27.02-53.84-60.05s24.23-60.05 53.84-60.05h252.54c29.61 0 53.83 27.02 53.83 60.05z"/>
                                            </svg>
                                        </div>
                                        <div id="loading_older_messages_indicator"></div>
                                        <div id="page_loading_indicator"></div>
                                        <div id="message_feed_errors_container"></div>
                                        <div id="message-lists-container"></div>
                                        <div id="scheduled_message_indicator"></div>
                                        <div id="mark_read_on_scroll_state_banner"></div>
                                        <div id="typing_notifications"></div>
                                        <div id="mark_read_on_scroll_state_banner_place_holder"></div>
                                        <div id="bottom_whitespace"></div>
                                    </div>
                                </div>
                                <div id="compose">
                                    <div id="compose-container"></div>
                                </div>
                            </div>
                        </div>
                        <div class="column-right" id="right-sidebar-container"></div>
                        <!--/right sidebar-->
                    </div>
                </div>
                <div class="hidden">
                    <form id="logout_form" action="/accounts/logout/" method="POST">
                        <input type="hidden" name="csrfmiddlewaretoken" value="phOJKH3IYRAnLpa47IkE84skelZWg8emXEVgFZmu5PdMfCXDTerLaN9gqD7SkJWy">
                    </form>
                </div>`;
}
