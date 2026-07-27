import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { usePickSelection } from "../state/usePickSelection";

const PickSelectionContext = createContext<
  ReturnType<typeof usePickSelection> | null
>(null);

export function PickSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const store = usePickSelection();

  const value = useMemo(() => store, [store.pick]);

  return (
    <PickSelectionContext.Provider value={value}>
      {children}
    </PickSelectionContext.Provider>
  );
}

export function usePickSelectionContext() {
  const ctx = useContext(PickSelectionContext);

  if (!ctx) {
    throw new Error(
      "usePickSelectionContext must be used inside PickSelectionProvider"
    );
  }

  return ctx;
}
