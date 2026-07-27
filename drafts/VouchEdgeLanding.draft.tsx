import {
  Container,
  Header,
  Hero,
  Section,
  Surface,
  Button,
} from "@/aurora";

export default function VouchEdgeLanding() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />

      <Hero
        eyebrow="VouchEdge Beta"
        title="Sports intelligence built for people who research before they bet."
        description="Understand every matchup with transparent evidence, live data, and premium research."
        actions={
          <>
            <Button>Join Beta</Button>
            <Button variant="secondary">Explore Player Lab</Button>
          </>
        }
      />

      <Container>
        <Section>
          <Surface>
            Product Preview
          </Surface>
        </Section>

        <Section>
          <Surface>
            Live Games
          </Surface>
        </Section>

        <Section>
          <Surface>
            Player Lab
          </Surface>
        </Section>

        <Section>
          <Surface>
            Pricing
          </Surface>
        </Section>

        <Section>
          <Surface>
            FAQ
          </Surface>
        </Section>

        <Section>
          <Surface>
            Final CTA
          </Surface>
        </Section>
      </Container>
    </main>
  );
}
