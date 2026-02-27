import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Generic Zod validation middleware.
 * Validates req.body against the provided schema.
 * Returns 400 with structured field errors on failure.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace req.body with parsed (and coerced/trimmed) data
    req.body = result.data;
    next();
  };
}

/**
 * Format Zod errors into a flat key → message object.
 * Example: { "profile.firstName": "First name is required" }
 */
function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    // Only store the first error per field
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return errors;
}
