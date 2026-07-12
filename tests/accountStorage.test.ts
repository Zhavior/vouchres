import { describe, expect, it } from "vitest";
import { accountStorageKey, setAccountStorageScope } from "../src/lib/accountStorage";

describe("account-scoped browser storage", () => {
  it("separates guest and authenticated account keys", () => {
    setAccountStorageScope(null);
    expect(accountStorageKey("vouchedge_slips")).toBe("vouchedge_slips:guest");

    setAccountStorageScope("account-a");
    expect(accountStorageKey("vouchedge_slips")).toBe("vouchedge_slips:account:account-a");

    setAccountStorageScope("account-b");
    expect(accountStorageKey("vouchedge_slips")).toBe("vouchedge_slips:account:account-b");
  });

  it("does not reuse legacy unscoped keys", () => {
    setAccountStorageScope("account-a");
    expect(accountStorageKey("vouchedge_profile")).not.toBe("vouchedge_profile");
  });
});
