import AuroraHero from "@/components/landing/aurora/AuroraHero";
import "@/styles/public-landing.css";

import {
  LiveSportsIntelligence,
  WhyVouchEdge,
  PremiumFeatures,
  DecisionIntelligence,
  CommunitySection,
  PricingSection,
  FAQSection,
  CTASection,
  FooterSection,
  type FooterNavigationTarget,
} from "@/components/landing-v3";

type Props = {
  onLogin: () => void;
  onJoinBeta: () => void;
  onViewDemo: () => void;
  onExploreCommunity: () => void;
  onFooterNavigate: (target: FooterNavigationTarget) => void;
};

export default function VouchEdgeLandingV3({
  onLogin,
  onJoinBeta,
  onViewDemo,
  onExploreCommunity,
  onFooterNavigate,
}: Props) {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <AuroraHero onLogin={onLogin} onJoinBeta={onJoinBeta} onViewDemo={onViewDemo} />

      <LiveSportsIntelligence />

      <WhyVouchEdge />

      <PremiumFeatures />

      <DecisionIntelligence />

      <CommunitySection onExploreCommunity={onExploreCommunity} />

      <PricingSection onJoinBeta={onJoinBeta} />

      <FAQSection />

      <CTASection onJoinBeta={onJoinBeta} onViewDemo={onViewDemo} />

      <FooterSection onNavigate={onFooterNavigate} />
    </main>
  );
}
