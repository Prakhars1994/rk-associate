import { zValidator } from '@hono/zod-validator';

/** zod validator that returns a consistent 400 body. target: 'json' | 'param' | 'query' | 'form' */
export const validate = (target, schema) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'invalid_input', issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
        400
      );
    }
  });

/** Throws on a Supabase error so onError turns it into a 500 (logged). */
export function unwrap({ data, error }) {
  if (error) {
    const e = new Error(error.message || 'db_error');
    e.cause = error;
    throw e;
  }
  return data;
}
