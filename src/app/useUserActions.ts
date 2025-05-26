import { useState, useCallback } from "react";
import { UserAction } from "./Game.types";

export function useUserActions() {
  const [userActions, setUserActions] = useState<UserAction[]>([]);

  const addUserAction = useCallback((action: UserAction) => {
    setUserActions((actions) => [action, ...actions]);
  }, []);

  const resetUserActions = useCallback(() => {
    setUserActions([]);
  }, []);

  return { userActions, addUserAction, resetUserActions };
}