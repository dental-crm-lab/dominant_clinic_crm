// Отдельная супер-админ панель для Dominant CRM: полностью не связана с
// ролями admin/reception/doctor (см. auth.js) — доступ по логину/паролю
// из переменных окружения SUPERADMIN_LOGIN / SUPERADMIN_PASSWORD (Railway).
// Источник данных для активности и ошибок — таблица request_logs
// (см. ../requestLog.js), которую пишет глобальный middleware на каждый запрос.
const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');

const router = express.Router();

const sessions = new Map(); // token -> createdAt (мс)
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getCredentials() {
  return { login: process.env.SUPERADMIN_LOGIN, password: process.env.SUPERADMIN_PASSWORD };
}

function requireSuperadmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const createdAt = token && sessions.get(token);
  if (!createdAt) return res.status(401).json({ error: 'unauthorized', message: 'Не авторизован' });
  if (Date.now() - createdAt > TOKEN_TTL_MS) {
    sessions.delete(token);
    return res.status(401).json({ error: 'unauthorized', message: 'Сессия истекла, войдите заново' });
  }
  next();
}

router.post('/login', (req, res) => {
  const { login, password } = getCredentials();
  if (!login || !password) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'Супер-админ панель не настроена (нет SUPERADMIN_LOGIN/SUPERADMIN_PASSWORD на сервере)'
    });
  }
  const { username, password: pw } = req.body || {};
  if (String(username || '').trim() !== login || pw !== password) {
    return res.status(401).json({ error: 'unauthorized', message: 'Неверный логин или пароль' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now());
  res.json({ token });
});

router.post('/logout', requireSuperadmin, (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  sessions.delete(token);
  res.json({ ok: true });
});

function count(table) {
  return db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;
}

router.get('/overview', requireSuperadmin, (req, res) => {
  const now = new Date();
  const todayStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayIso = todayStartUtc.toISOString().slice(0, 19).replace('T', ' ');
  const weekAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const todayDate = now.toISOString().slice(0, 10);

  const requestsToday = db.prepare(`SELECT COUNT(*) AS c FROM request_logs WHERE created_at >= ?`).get(todayIso).c;
  const requestsWeek = db.prepare(`SELECT COUNT(*) AS c FROM request_logs WHERE created_at >= ?`).get(weekAgoIso).c;
  const errorsToday = db.prepare(`SELECT COUNT(*) AS c FROM request_logs WHERE status_code >= 400 AND created_at >= ?`).get(todayIso).c;
  const activeStaffWeek = db.prepare(
    `SELECT COUNT(DISTINCT user_name) AS c FROM request_logs WHERE user_name IS NOT NULL AND created_at >= ?`
  ).get(weekAgoIso).c;
  const appointmentsToday = db.prepare(`SELECT COUNT(*) AS c FROM appointments WHERE date = ?`).get(todayDate).c;

  res.json({
    doctors_total: count('doctors'),
    staff_total: count('staff'),
    patients_total: count('patients'),
    appointments_total: count('appointments'),
    appointments_today: appointmentsToday,
    invoices_total: count('invoices'),
    requests_today: requestsToday,
    requests_week: requestsWeek,
    errors_today: errorsToday,
    active_staff_week: activeStaffWeek
  });
});

const ACTION_RULES = [
  [/^POST$/, /^\/api\/auth\/login$/, 'Вход в систему'],
  [/^POST$/, /^\/api\/patients$/, 'Создан пациент'],
  [/^PUT$/, /^\/api\/patients\/[^/]+$/, 'Изменён пациент'],
  [/^DELETE$/, /^\/api\/patients\/[^/]+$/, 'Удалён пациент'],
  [/^POST$/, /^\/api\/appointments$/, 'Создана запись на приём'],
  [/^PUT$/, /^\/api\/appointments\/[^/]+$/, 'Изменена запись на приём'],
  [/^DELETE$/, /^\/api\/appointments\/[^/]+$/, 'Удалена запись на приём'],
  [/^POST$/, /^\/api\/treatments$/, 'Добавлено лечение'],
  [/^POST$/, /^\/api\/invoices$/, 'Выставлен счёт'],
  [/^PUT$/, /^\/api\/invoices\/[^/]+$/, 'Изменён счёт'],
  [/^POST$/, /^\/api\/expenses$/, 'Добавлен расход'],
  [/^POST$/, /^\/api\/doctors$/, 'Добавлен врач'],
  [/^PUT$/, /^\/api\/doctors\/[^/]+$/, 'Изменён врач'],
  [/^POST$/, /^\/api\/staff$/, 'Добавлен сотрудник'],
  [/^PUT$/, /^\/api\/settings/, 'Изменены настройки клиники']
];

function labelFor(method, p) {
  for (const [m, r, label] of ACTION_RULES) {
    if (m.test(method) && r.test(p)) return label;
  }
  return method + ' ' + p;
}

router.get('/activity', requireSuperadmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '150', 10), 500);
  const rows = db.prepare(
    `SELECT * FROM request_logs WHERE method IN ('POST','PUT','DELETE','PATCH') ORDER BY id DESC LIMIT ?`
  ).all(limit);
  res.json(rows.map((r) => ({
    created_at: r.created_at,
    label: labelFor(r.method, r.path),
    method: r.method,
    path: r.path,
    status_code: r.status_code,
    doctor_name: r.user_name
  })));
});

router.get('/errors', requireSuperadmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
  const rows = db.prepare(
    `SELECT * FROM request_logs WHERE status_code >= 400 ORDER BY id DESC LIMIT ?`
  ).all(limit);
  res.json(rows.map((r) => ({
    created_at: r.created_at,
    method: r.method,
    path: r.path,
    status_code: r.status_code,
    doctor_name: r.user_name,
    ip: r.ip
  })));
});

module.exports = router;
