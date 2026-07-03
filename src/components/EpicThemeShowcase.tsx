import ThemeStore from "./ThemeStore";

const epicThemePreviewProfile = {
  displayName: "VouchEdge Preview",
  username: "vouchedge-preview",
  avatarUrl: "",
  bio: "Preview profile for the VouchEdge theme showcase.",
  verified: true,
  winRate: 0,
  totalPicks: 0,
  wonPicks: 0,
  unitsTracked: 0,
  unitsNetProfit: 0,
  followers: 0,
  following: 0,
  subscriptionTier: "SELLER_PRO" as const,
  theme: "vouchedge",
};

export default function EpicThemeShowcase() {
  return (
    <ThemeStore
      profile={epicThemePreviewProfile}
      onUpdateProfile={() => undefined}
    />
  );
}
