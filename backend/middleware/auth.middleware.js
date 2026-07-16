import jwt from 'jsonwebtoken';
import config from '../config/index.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) return token;
  return null;
}

// Verifies the access token and attaches the decoded payload to req.user.
// Any route mounted behind this middleware is unreachable without a valid,
// unexpired token.
export function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required', status: 401 } });
  }

  try {
    req.user = jwt.verify(token, config.jwtAccessSecret);
    return next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Invalid or expired token', status: 401 } });
  }
}

// Use after requireAuth to restrict a route to admin accounts only.
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Admin access required', status: 403 } });
  }
  return next();
}
