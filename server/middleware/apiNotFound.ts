import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError";

export const apiNotFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError({
      status: 404,
      code: "not_found",
      message: `API route not found: ${req.method} ${req.originalUrl}`,
    }),
  );
};
