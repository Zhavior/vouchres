/** Reset a scroll container to the top — used on route section switches. */
export function resetScrollPane(pane: { scrollTop: number } | null | undefined): void {
  if (pane) pane.scrollTop = 0;
}
