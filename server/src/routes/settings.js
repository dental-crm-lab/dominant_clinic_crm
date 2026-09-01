const express = require('express');
const { db } = require('../db');
const { authMiddleware, requireRole } = require('../auth');
const { settingsOut } = require('../serialize');
const { broadcast } = require('../realtime');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json(settingsOut(db.prepare("SELECT * FROM settings WHERE id = 'clinic'").get()));
});

router.patch('/', requireRole('admin'), (req, res) => {
  const existing = db.prepare("SELECT * FROM settings WHERE id = 'clinic'").get();
  const b = req.body || {};
  const next = { ...existing };
  ['name', 'phone', 'address', 'hours'].forEach((k) => { if (b[k] !== undefined) next[k] = b[k]; });
  if (b.services !== undefined) next.services = JSON.stringify(b.services);
  db.prepare("UPDATE settings SET name=?, phone=?, address=?, hours=?, services=?, updatedAt=datetime('now') WHERE id='clinic'")
    .run(next.name, next.phone, next.address, next.hours, next.services);
  broadcast('settings');
  res.json(settingsOut(db.prepare("SELECT * FROM settings WHERE id = 'clinic'").get()));
});

module.exports = router;
