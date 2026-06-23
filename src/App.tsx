import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouter } from "./app-router";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchMyThemes = useThemeStore((s) => s.fetchMyThemes);

  // Fetch user on app load if token exists
  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
      fetchMyThemes();
    }
  }, [fetchMe, fetchMyThemes, isAuthenticated]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
