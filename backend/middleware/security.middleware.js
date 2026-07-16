import xss from 'xss';
import rateLimit from 'express-rate-limit';

// Strips any HTML/script payloads out of incoming request bodies before
// they ever reach a controller or the database.
export const securityMiddleware = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  next();
};

function sanitize(payload) {
  if (typeof payload === 'string') {
    return xss(payload);
  }
  if (Array.isArray(payload)) {
    return payload.map(sanitize);
  }
  if (payload && typeof payload === 'object') {
    return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, sanitize(value)]));
  }
  return payload;
}

// Tight rate limit specifically for auth endpoints (login/register), on top
// of the global limiter in app.js, to slow down credential-stuffing and
// brute-force attempts against a single account.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: 1,
  message: { error: { message: 'Too many attempts. Please try again later.', status: 429 } },
});
