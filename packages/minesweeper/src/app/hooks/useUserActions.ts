import { useState, useCallback } from "react";
import { UserActionDetail } from "../Game.types";

export function useUserActions() {
  const [userActions, setUserActions] = useState<UserActionDetail[]>([]);

  const addUserAction = useCallback((action: UserActionDetail) => {
    setUserActions((actions) => [...actions, action]);
  }, []);

  const resetUserActions = useCallback(() => {
    setUserActions([]);
  }, []);

  return { userActions, addUserAction, resetUserActions };
}