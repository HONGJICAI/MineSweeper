import { useState, useCallback } from "react";
import { UserActionWithScore } from "../Game.types";

export function useUserActions() {
  const [userActions, setUserActions] = useState<UserActionWithScore[]>([]);

  const addUserAction = useCallback((action: UserActionWithScore) => {
    setUserActions((actions) => [...actions, action]);
  }, []);

  const resetUserActions = useCallback(() => {
    setUserActions([]);
  }, []);

  return { userActions, addUserAction, resetUserActions };
}