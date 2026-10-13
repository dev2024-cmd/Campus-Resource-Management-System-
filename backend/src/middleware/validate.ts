import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema, source: "body" | "query" | "params" = "body") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as any).issues || (error as any).errors || [];
        res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Validation Error",
          errors: issues.map((e: any) => ({
            field: Array.isArray(e.path) ? e.path.join(".") : String(e.path),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
