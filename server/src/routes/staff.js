const express = require('express');
const bcrypt = require('bcryptjs');
const { db, genId } = require('../db');
const { authMiddleware, requireRole } = require('../auth');
const { staffOut } = require('../serialize');
const { broadcast } = require('../realtime');

const router = express.Router();
router.use(authMiddleware, requireRole('admin'));

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM staff ORDER BY name ASC').all().map(staffOut));
});

router.post('/', async (req, res) => {
  const { name, role, pin } = req.body || {};
  if (!name || !role) return res.status(400).json({ error: 'bad_request', message: 'Укажите имя и роль' });
  const pinHash = await bcrypt.hash(String(pin || '0000'), 10);
  const id = genId('staff');
  db.prepare('INSERT INTO staff (id, name, role, pinHash) VALUES (?,?,?,?)').run(id, name, role, pinHash);
  broadcast('staff');
  res.status(201).json(staffOut(db.prepare('SELECT * FROM staff WHERE id = ?').get(id)));
});

router.patch('/:id', async (req, res) => {
  const existing = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const body = req.body || {};
  const next = { ...existing };
  if (body.name !== undefined) next.name = body.name;
  if (body.role !== undefined) next.role = body.role;
  if (body.pin) next.pinHash = await bcrypt.hash(String(body.pin), 10);
  db.prepare('UPDATE staff SET name=?, role=?, pinHash=? WHERE id=?').run(next.name, next.role, next.pinHash, req.params.id);
  broadcast('staff');
  res.json(staffOut(db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  broadcast('staff');
  res.status(204).end();
});

module.exports = router;
