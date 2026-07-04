import { verifyToken } from '../utils/jwt.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    // For backward compatibility, also set req.user.id if only userId exists
    if (!req.user.id && req.user.userId) {
      req.user.id = req.user.userId;
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};
