import { createContext, useContext, type RefObject } from 'react';

type FeedScrollContextValue = {
  scrollRef: RefObject<HTMLDivElement | null>;
};

const FeedScrollContext = createContext<FeedScrollContextValue | null>(null);

export function FeedScrollProvider({
  scrollRef,
  children,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <FeedScrollContext.Provider value={{ scrollRef }}>
      {children}
    </FeedScrollContext.Provider>
  );
}

export function useFeedScrollRoot(): RefObject<HTMLDivElement | null> | null {
  return useContext(FeedScrollContext)?.scrollRef ?? null;
}
