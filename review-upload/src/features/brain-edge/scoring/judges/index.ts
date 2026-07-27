import type { NormalizedPlayerPayload } from "../../../../adapters/normalized";

import { buildBrainContext } from "../brainContext";

import { barrelJudge } from "./barrelJudge";
import { matchupJudge } from "./matchupJudge";
import { parkJudge } from "./parkJudge";
import { weatherJudge } from "./weatherJudge";
import { formJudge } from "./formJudge";
import { lineupJudge } from "./lineupJudge";

import type { JudgeResult } from "./types";

export function runJudges(
  payload: NormalizedPlayerPayload,
): JudgeResult[] {
  const context = buildBrainContext(payload);

  return [
    barrelJudge(context),
    matchupJudge(context),
    parkJudge(context),
    weatherJudge(context),
    formJudge(context),
    lineupJudge(context),
  ];
}
