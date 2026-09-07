// Логирует каждый HTTP-запрос в SQLite (request_logs) — источник данных
// для супер-админ панели (см. routes/superadmin.js): кто и когда заходил,
// какие действия выполнял, какие запросы падали с ошибкой.
const { db } = require('./db');

db.exec(`
  CREATE TABLE IF NOT EXISTS request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    user_name TEXT,
    role TEXT,
    ip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const insertStmt = db.prepare(
  `INSERT INTO request_logs (method, path, status_code, user_name, role, ip, created_at)
   VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
);

function requestLogger(req, res, next) {
  res.on('finish', () => {
    if (req.path === '/api/health' || req.path.startsWith('/superadmin')) return;
    try {
      insertStmt.run(
        req.method,
        req.path,
        res.statusCode,
        (req.user && req.user.name) || null,
        (req.user && req.user.role) || null,
        req.ip || (req.connection && req.connection.remoteAddress) || null
      );
    } catch (e) {
      console.error('request log failed:', e.message);
    }
  });
  next();
}

module.exports = { requestLogger };
