/** Single entry point that registers every VouchEdge backend API route. */
import type { Express } from "express";
import { coreRoutes } from "./coreRoutes";
import { publicRoutes } from "./publicRoutes";
import { parlayRoutes } from "./parlayRoutes";
import { playerRegistryRoutes } from "./playerRegistryRoutes";
import { shareRoutes } from "./shareRoutes";
import { registerMlbRoutes } from "./mlbRoutes";
import { registerHrBoardRoutes } from "./mlbHrBoardRoutes";
import { registerMatchupRoutes } from "./mlbMatchupRoutes";
import { registerAgentRoutes } from "./agentRoutes";
import { registerJudgeRoutes } from "./judgeRoutes";
import { registerTrustRoutes } from "./trustRoutes";
import { registerResultRoutes } from "./resultRoutes";
import { registerAiJudgeSocialRoutes } from "./aiJudgeSocialRoutes";
import { listSkills, runSkill } from "../skills/skillRegistry";
import type { Request, Response } from "express";

export function registerApiRoutes(app: Express): void {
  app.use("/api", coreRoutes);
  app.use("/api", publicRoutes);
  app.use("/api", parlayRoutes);
  app.use("/api", playerRegistryRoutes);
  app.use("/api", shareRoutes);

  registerMlbRoutes(app);
  registerHrBoardRoutes(app);
  registerMatchupRoutes(app);
  registerAgentRoutes(app);
  registerJudgeRoutes(app);
  registerTrustRoutes(app);
  registerResultRoutes(app);
  registerAiJudgeSocialRoutes(app);

  // Skills introspection + generic runner.
  app.get("/api/skills", (_req: Request, res: Response) => res.json({ skills: listSkills() }));
  app.post("/api/skills/:id/run", async (req: Request, res: Response) => {
    try {
      res.json({ result: await runSkill(req.params.id, req.body ?? {}) });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // Backend health.
  app.get("/api/system/core-health", (_req: Request, res: Response) =>
    res.json({
      status: "ok",
      service: "vouchedge-core",
      routes: {
        core: true,
        parlays: true,
        playerRegistry: true,
      },
      time: new Date().toISOString(),
    })
  );

  app.get("/api/health", (_req: Request, res: Response) =>
    res.json({ status: "ok", service: "vouchedge-backend", time: new Date().toISOString() })
  );
}
