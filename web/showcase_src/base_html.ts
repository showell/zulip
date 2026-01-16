export function get_base_html(): string {
    const page_params_json = `{
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
        "language_list":[],
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
      }`;

    return `
        <div id="page-params" data-params='${page_params_json}'></div>
        <div class="demo"></div>
        `;
}
