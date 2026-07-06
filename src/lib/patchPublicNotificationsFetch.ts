export function patchPublicNotificationsFetch() {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const response = await originalFetch(input, init);

    if (!url.includes("/api/notifications") || response.status !== 401) {
      return response;
    }

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof window.fetch;
}
