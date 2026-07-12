import { useState } from "react";
import { ProductEvents } from "../../lib/productEvents";

type Props = {
  onComplete: () => void;
};

const sports = [
  "MLB",
  "NFL",
  "NBA",
];

export function PersonalizedOnboarding({
  onComplete,
}: Props) {
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState<string | null>(null);
  const [team, setTeam] = useState<string | null>(null);

  function completeStep(name: string) {
    ProductEvents.experimentViewed(
      "new_onboarding_v2",
      "variant"
    );

    void ProductEvents.onboardingStepCompleted?.(name);
  }

  function finish() {
    ProductEvents.onboardingCompleted?.({
      sport,
      team,
    });

    onComplete();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="max-w-md w-full rounded-2xl bg-white/5 p-6 border border-white/10">
        {step === 1 && (
          <>
            <h1 className="text-3xl font-black">
              Build Your Edge
            </h1>

            <p className="mt-3 text-white/70">
              Choose what you follow and we personalize your intelligence feed.
            </p>

            <div className="mt-6 space-y-3">
              {sports.map((item) => (
                <button
                  key={item}
                  className="w-full rounded-xl bg-white/10 p-3 hover:bg-white/20"
                  onClick={() => {
                    setSport(item);
                    completeStep("sport_selected");
                    setStep(2);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold">
              Pick your team
            </h2>

            <div className="mt-6 space-y-3">
              {["Yankees", "Dodgers", "Braves"].map((item) => (
                <button
                  key={item}
                  className="w-full rounded-xl bg-white/10 p-3 hover:bg-white/20"
                  onClick={() => {
                    setTeam(item);
                    completeStep("team_selected");
                    setStep(3);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold">
              Your Edge is ready
            </h2>

            <p className="mt-3 text-white/70">
              We'll personalize Featured Edge, Vouch AI, and Daily Brief.
            </p>

            <button
              className="mt-6 w-full rounded-xl bg-cyan-400 text-black p-3 font-bold"
              onClick={finish}
            >
              Enter VouchEdge
            </button>
          </>
        )}
      </div>
    </div>
  );
}
