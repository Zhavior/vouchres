import { buildJudgeScores } from "../scoring/judgeWeights";

export default function JudgeStack() {
  const judges = buildJudgeScores();

  return (
    <div className="space-y-3">
      {judges.map((judge) => (
        <div
          key={judge.id}
          className="rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">
                {judge.title}
              </h3>

              <p className="text-xs text-white/50">
                {judge.summary}
              </p>
            </div>

            <span className="text-lg font-bold text-vouch-cyan">
              {judge.score}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-vouch-cyan transition-all duration-500"
              style={{ width: `${judge.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
