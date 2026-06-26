import express from "express";
import { registerApiRoutes } from "../server/routes";

const app = express();

app.use(express.json());

// Register the same real API routes used by the local Express server.
// This gives Vercel serverless access to /api/mlb/hr-board/today and the rest.
registerApiRoutes(app);

export default app;
