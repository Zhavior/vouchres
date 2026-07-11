import { describe, expect, it, vi } from "vitest";
import { showAppToast, subscribeAppToast } from "../src/lib/appToast";

describe("appToast", () => {
  it("notifies subscribers with trimmed message", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAppToast(listener);

    showAppToast("  Saved  ");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Saved", kind: "info" }),
    );

    unsubscribe();
    showAppToast("ignored");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ignores empty messages", () => {
    const listener = vi.fn();
    subscribeAppToast(listener);
    showAppToast("   ");
    expect(listener).not.toHaveBeenCalled();
  });
});
