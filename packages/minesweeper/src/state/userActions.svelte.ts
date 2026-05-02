import type { UserActionDetail } from "@caiji-games/minesweeper-core";

export function createUserActionsState() {
    let actions = $state<UserActionDetail[]>([]);

    function add(action: UserActionDetail) {
        actions.push(action);
    }

    function reset() {
        actions = [];
    }

    return {
        get actions() { return actions; },
        add,
        reset,
    };
}

export type UserActionsState = ReturnType<typeof createUserActionsState>;
