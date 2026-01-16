type User = {
    id: number;
    name: string;
};

// This is probably only ever gonna get instantiated once.
export class Realm {
    user_map = new Map<number, User>();
    seq = 100;

    make_user(name: string): User {
        this.seq += 1;
        const user_id = this.seq;

        const user = {
            id: user_id,
            name,
        };

        this.user_map.set(user_id, user);

        return user;
    }

    get_user_name(id: number): string {
        return this.user_map.get(id)!.name;
    }
}
