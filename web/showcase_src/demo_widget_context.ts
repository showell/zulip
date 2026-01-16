import type {WidgetContext} from "../src/poll_widget";

type LookupUser = (user_id: number) => string;

export class DemoWidgetContext implements WidgetContext {
    owner_id: number;
    user_id: number;
    get_user_name: LookupUser;

    constructor(info: {owner_id: number; user_id: number; get_user_name: LookupUser}) {
        this.owner_id = info.owner_id;
        this.user_id = info.user_id;
        this.get_user_name = info.get_user_name;
    }

    is_container_hidden(): boolean {
        return false;
    }

    is_my_poll(): boolean {
        return this.owner_id === this.user_id;
    }

    owner_user_id(): number {
        return this.owner_id;
    }
    current_user_id(): number {
        return this.user_id;
    }
    get_full_name_list(user_ids: number[]): string {
        return user_ids.map((id) => this.get_user_name(id)).join(", ");
    }
}
