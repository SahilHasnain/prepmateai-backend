import { failure } from '../utils/response.js';

// Reusable validation middleware for Zod schemas
// Usage: router.post('/endpoint', validate(mySchema), async (req, res) => {...})
export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        ...failure('Validation failed'),
        errors: result.error.errors
      });
    }
    
    // Attach validated data to req for use in controller
    req.validatedData = result.data;
    next();
  };
};
