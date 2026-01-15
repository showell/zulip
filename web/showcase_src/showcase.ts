import $ from "jquery";
import assert from "minimalistic-assert";

import {get_base_html} from "./base_html.ts";

console.log("jquery should be loaded:", $().jquery);

// Setting base html
document.body.innerHTML = get_base_html();

// We need this to be async, and we want to be
// explicit about when it happens.
await import("../src/templates.ts");
console.log("finished importing templates.ts");

const {page_params} = await import("../src/base_page_params.ts");
console.log("page_params", page_params);

// Double check i18n.ts is gonna be ok.
const i18n = await import("../src/i18n.ts");
assert(page_params.page_type === "home");
const lang_list = page_params.language_list.map((lang) => ({
    ...lang,
    display_name: `LANG:${lang.name}`,
}));
i18n.initialize({language_list: lang_list});
console.log("language_list", i18n.language_list);

await import("./poll_demo.ts");
