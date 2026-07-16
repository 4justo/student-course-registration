import { ZodError } from 'zod';

export const errorHandler = (err, _req, res, _next) => {
  // Validation errors -> 400 with readable field messages, instead of
  // falling through to a generic (and misleading) 500.
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        status: 400,
        details: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      },
    });
  }

  // Prisma unique-constraint violations -> 409 rather than a raw 500 leak.
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: { message: 'A record with that value already exists', status: 409 },
    });
  }

  const status = err.status || 500;
  // Never leak internal error detail (stack traces, DB errors) for
  // unexpected failures — log server-side, return a generic message.
  const message = status === 500 ? 'Internal Server Error' : err.message || 'Internal Server Error';
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({
    error: { message, status },
  });
};
