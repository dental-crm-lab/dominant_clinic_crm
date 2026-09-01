const express = require('express');
const bcrypt = require('bcryptjs');
const { db, genId } = require('../db');
const { authMiddleware, requireRole } = require('../auth');
const { doctorOut } = require('../serialize');
const { broadcast } = require('../realtime');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const doctors = db.prepare('SELECT * FROM doctors ORDER BY name ASC').all();
  res.json(doctors.map(doctorOut));
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { name, specialty, phone, bio, color, pin, active } = req.body || {};
  if (!name || !specialty) return res.status(400).json({ error: 'bad_request', message: 'Укажите имя и специализацию' });
  const pinHash = await bcrypt.hash(String(pin || '0000'), 10);
  const id = genId('doc');
  db.prepare(`INSERT INTO doctors (id, name, specialty, phone, bio, color, pinHash, active) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, name, specialty, phone || '', bio || '', color || '#a8823f', pinHash, active === false ? 0 : 1);
  broadcast('doctors');
  res.status(201).json(doctorOut(db.prepare('SELECT * FROM doctors WHERE id = ?').get(id)));
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const isSelf = req.user.role === 'doctor' && req.user.doctorId === id;
  const isAdmin = req.user.role === 'admin';
  if (!isSelf && !isAdmin) return res.status(403).json({ error: 'forbidden', message: 'Недостаточно прав' });

  const existing = db.prepare('SELECT * FROM doctors WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const body = req.body || {};
  const next = { ...existing };
  if (isAdmin) {
    ['name', 'specialty', 'phone', 'bio', 'color'].forEach((k) => { if (body[k] !== undefined) next[k] = body[k]; });
    if (body.active !== undefined) next.active = body.active ? 1 : 0;
  }
  if (body.pin) next.pinHash = await bcrypt.hash(String(body.pin), 10);

  db.prepare('UPDATE doctors SET name=?, specialty=?, phone=?, bio=?, color=?, pinHash=?, active=? WHERE id=?')
    .run(next.name, next.specialty, next.phone, next.bio, next.color, next.pinHash, next.active, id);
  broadcast('doctors');
  res.json(doctorOut(db.prepare('SELECT * FROM doctors WHERE id = ?').get(id)));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM doctors WHERE id = ?').run(req.params.id);
  broadcast('doctors');
  res.status(204).end();
});

module.exports = router;
