import xss from 'xss';

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
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, sanitize(value)]),
    );
  }
  return payload;
}
