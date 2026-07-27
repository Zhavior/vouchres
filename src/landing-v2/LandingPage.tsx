import { Hero } from "./sections/Hero";
import "./styles/aurora.css";

export default function LandingPage() {
  const navigate = (path: string) => {
    window.location.assign(path);
  };

  return (
    <main className="aurora-landing">
      <Hero
        onNavigate={(section) => {
          switch (section) {
            case "hr_board":
              navigate("/hr-board");
              break;
            case "results":
              navigate("/results");
              break;
            default:
              break;
          }
        }}
        onGetStarted={() => navigate("/signup")}
        onAuthIntent={() => navigate("/login")}
      />

      <section id="board" className="aurora-placeholder-section">
        <p className="aurora-eyebrow">Next section</p>
        <h2>The board before the first pitch.</h2>
      </section>
    </main>
  );
}
