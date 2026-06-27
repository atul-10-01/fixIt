import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Generic validation middleware factory.
 * Validates req.body against a Zod schema.
 * On success, replaces req.body with the coerced/parsed output.
 * On failure, returns 400 with structured Zod field errors.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const formErrors = result.error.flatten().formErrors;
      res.status(400).json({
        error: "Request validation failed",
        fieldErrors,
        formErrors,
      });
      return;
    }
    // Replace raw body with coerced/parsed data from Zod
    req.body = result.data;
    next();
  };
};
