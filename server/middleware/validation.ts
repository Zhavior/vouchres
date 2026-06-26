import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Request validation via Zod.
 *
 * Usage:
 *   const CreatePickSchema = z.object({
 *     market: z.string().min(1).max(64),
 *     selection: z.string().min(1).max(280),
 *     odds_decimal: z.number().positive().optional(),
 *     stake_units: z.number().positive().max(100).optional(),
 *     legs: z.array(LegSchema).optional(),
 *   });
 *
 *   router.post("/picks", requireAuth, validate({ body: CreatePickSchema }), createPickHandler);
 *
 * The handler then receives a typed body via req.body (cast as needed).
 */
export function validate(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as any;
      if (schemas.params) req.params = schemas.params.parse(req.params) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "validation_error",
          details: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }
      return res.status(400).json({ error: "invalid_request" });
    }
  };
}
