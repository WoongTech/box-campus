"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type InteractionLockContextValue = {
  locked: boolean;
  setFieldFocused: (focused: boolean) => void;
};

const InteractionLockContext = createContext<InteractionLockContextValue | null>(null);

export function InteractionLockProvider({ children }: { children: ReactNode }) {
  const [fieldFocused, setFieldFocused] = useState(false);

  return (
    <InteractionLockContext value={{ locked: fieldFocused, setFieldFocused }}>
      {children}
    </InteractionLockContext>
  );
}

export function useInteractionLock() {
  const value = useContext(InteractionLockContext);
  if (!value) throw new Error("InteractionLockProvider가 없습니다.");
  return value;
}

export function useFieldFocusLock(active: boolean) {
  const { setFieldFocused } = useInteractionLock();
  useEffect(() => {
    setFieldFocused(active);
    return () => setFieldFocused(false);
  }, [active, setFieldFocused]);
}
