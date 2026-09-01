const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL = '30d';

function signToken(identity) {
  // identity: { kind, id, name, role, doctorId? }
  return jwt.sign(identity, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized', message: 'Требуется авторизация' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'unauthorized', message: 'Сессия истекла, войдите снова' });
  }
}

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden', message: 'Недостаточно прав' });
    }
    next();
  };
}

module.exports = { signToken, authMiddleware, requireRole, JWT_SECRET };
