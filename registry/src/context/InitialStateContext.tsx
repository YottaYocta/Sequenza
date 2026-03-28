import { createContext, useContext, useState, type ReactNode } from "react";
import type { EditorInitialState } from "@sequenza/workbench";

export type InitialStateContextValue = {
  initialState: EditorInitialState | undefined;
  setInitialState: (state: EditorInitialState | undefined) => void;
};

const InitialStateContext = createContext<InitialStateContextValue | null>(
  null,
);

export function InitialStateProvider({ children }: { children: ReactNode }) {
  const [initialState, setInitialState] = useState<
    EditorInitialState | undefined
  >(undefined);

  return (
    <InitialStateContext.Provider value={{ initialState, setInitialState }}>
      {children}
    </InitialStateContext.Provider>
  );
}

export function useInitialState() {
  const ctx = useContext(InitialStateContext);
  if (!ctx)
    throw new Error("useInitialState must be used within InitialStateProvider");
  return ctx;
}
