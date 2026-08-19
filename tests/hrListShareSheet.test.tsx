// @vitest-environment happy-dom

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import HrListShareSheet from "../src/features/hr-list/components/HrListShareSheet";
import type { HrListShareBundle } from "../src/features/hr-list/hrListTypes";

const bundle: HrListShareBundle = {
  permalink: "https://vouchedge.app/l/abc123",
  cardImageUrl: "https://vouchedge.app/api/share/hr-list/abc123/card.png",
  text: "⚾ Boyd's Bombs · Aug 18\n\n• Aaron Judge (21% +285)\n\n5 HR targets · full board on VouchEdge 👇",
  xIntentUrl: "https://x.com/intent/post?text=x&url=y",
};

describe("HrListShareSheet", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("links to X's composer rather than posting, and carries both text and url", () => {
    render(<HrListShareSheet bundle={bundle} listTitle="Boyd's Bombs" onClose={() => {}} />);

    const post = screen.getByRole("link", { name: /post on x/i });
    const href = post.getAttribute("href") ?? "";

    expect(href).toContain("x.com/intent/post");
    expect(href).toContain(encodeURIComponent(bundle.text));
    expect(href).toContain(encodeURIComponent(bundle.permalink));
    // target=_blank without noopener leaks window.opener to the destination.
    expect(post.getAttribute("rel") ?? "").toContain("noopener");
  });

  it("states plainly that nothing is posted on the user's behalf", () => {
    render(<HrListShareSheet bundle={bundle} listTitle="Boyd's Bombs" onClose={() => {}} />);
    expect(screen.getByText(/nothing is\s+posted for you/i)).toBeTruthy();
  });

  it("shows the real card image so the preview matches what recipients see", () => {
    render(<HrListShareSheet bundle={bundle} listTitle="Boyd's Bombs" onClose={() => {}} />);
    const card = screen.getByAltText(/share card for Boyd's Bombs/i);
    expect(card.getAttribute("src")).toBe(bundle.cardImageUrl);
  });

  it("offers the other networks as intent links, never as direct posts", () => {
    render(<HrListShareSheet bundle={bundle} listTitle="Boyd's Bombs" onClose={() => {}} />);
    for (const name of [/reddit/i, /facebook/i, /whatsapp/i]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toContain(encodeURIComponent(bundle.permalink));
    }
  });

  it("is a labelled modal dialog with a reachable close control", () => {
    render(<HrListShareSheet bundle={bundle} listTitle="Boyd's Bombs" onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByRole("button", { name: /close share sheet/i })).toBeTruthy();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<HrListShareSheet bundle={bundle} listTitle="Boyd's Bombs" onClose={onClose} />);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not claim the placeholder card shows the user's players", () => {
    render(<HrListShareSheet bundle={bundle} listTitle="Boyd's Bombs" onClose={() => {}} />);
    expect(screen.getByText(/renders a placeholder rather than\s+your players/i)).toBeTruthy();
  });

  it("warns that the link is public before the user hands it out", () => {
    render(<HrListShareSheet bundle={bundle} listTitle="Boyd's Bombs" onClose={() => {}} />);
    expect(screen.getByText(/anyone with this link can view/i)).toBeTruthy();
  });
});
