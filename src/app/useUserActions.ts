import { useState, useCallback } from "react";

type ActionType = "reveal" | "flag" | "chord";
type UserAction = {
  type: ActionType;
  position: { r: number; c: number };
  score: number;
};

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