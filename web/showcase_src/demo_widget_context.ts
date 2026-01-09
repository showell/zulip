import type { WidgetContext } from "../src/poll_widget";

export class DemoWidgetContext implements WidgetContext {
    owner_id:number;
    user_id:number;
    constructor(info:{
        owner_id:number
        user_id:number
    }){
        this.owner_id = info.owner_id
        this.user_id = info.user_id
    }

    is_container_hidden(): boolean {
        return false;
    }

    is_my_poll(): boolean {
        return this.owner_id === this.user_id
    }

    owner_user_id(): number {
        return this.owner_id
    }
    current_user_id():number{
        return this.user_id;
    }
    get_full_name_list(user_ids:number[]):string{
        const user_names = ['alice', 'bob']
        return user_ids.map((id)=>`${user_names[id - 1]}`).join(', ')
    }
}
