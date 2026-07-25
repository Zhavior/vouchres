export interface JudgeScore {
  id:
    | "barrel"
    | "matchup"
    | "park"
    | "form"
    | "weather"
    | "lineup";

  title: string;

  score: number;

  summary: string;
}

export function buildJudgeScores(): JudgeScore[] {
  return [
    {
      id: "barrel",
      title: "Barrel Judge",
      score: 88,
      summary: "Elite quality of contact.",
    },
    {
      id: "matchup",
      title: "Matchup Judge",
      score: 81,
      summary: "Pitcher profile favors power.",
    },
    {
      id: "park",
      title: "Park Judge",
      score: 79,
      summary: "Above-average HR environment.",
    },
    {
      id: "form",
      title: "Recent Form",
      score: 91,
      summary: "Strong last-15-game trend.",
    },
    {
      id: "weather",
      title: "Weather",
      score: 72,
      summary: "Neutral conditions.",
    },
    {
      id: "lineup",
      title: "Lineup",
      score: 86,
      summary: "Premium batting position.",
    },
  ];
}
