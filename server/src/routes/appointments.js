const express = require('express');
const { db, genId } = require('../db');
const { authMiddleware } = require('../auth');
const { appointmentOut } = require('../serialize');
const { broadcast } = require('../realtime');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const rows = req.user.role === 'doctor'
    ? db.prepare('SELECT * FROM appointments WHERE doctorId = ? ORDER BY date ASC, startTime ASC').all(req.user.doctorId)
    : db.prepare('SELECT * FROM appointments ORDER BY date ASC, startTime ASC').all();
  res.json(rows.map(appointmentOut));
});

router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.patientId || !b.date || !b.startTime || !b.endTime) {
    return res.status(400).json({ error: 'bad_request', message: 'Не хватает данных для записи' });
  }
  const doctorId = req.user.role === 'doctor' ? req.user.doctorId : b.doctorId;
  if (!doctorId) return res.status(400).json({ error: 'bad_request', message: 'Укажите врача' });
  const id = genId('appt');
  db.prepare(`INSERT INTO appointments (id, patientId, doctorId, date, startTime, endTime, service, status, notes)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, b.patientId, doctorId, b.date, b.startTime, b.endTime, b.service || 'Приём', 'scheduled', b.notes || '');
  broadcast('appointments');
  res.status(201).json(appointmentOut(db.prepare('SELECT * FROM appointments WHERE id = ?').get(id)));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  if (req.user.role === 'doctor' && existing.doctorId !== req.user.doctorId) {
    return res.status(403).json({ error: 'forbidden', message: 'Эта запись принадлежит другому врачу' });
  }
  const b = req.body || {};
  const next = { ...existing };
  ['patientId', 'date', 'startTime', 'endTime', 'service', 'status', 'notes'].forEach((k) => { if (b[k] !== undefined) next[k] = b[k]; });
  if (b.doctorId !== undefined && req.user.role !== 'doctor') next.doctorId = b.doctorId;

  db.prepare(`UPDATE appointments SET patientId=?, doctorId=?, date=?, startTime=?, endTime=?, service=?, status=?, notes=? WHERE id=?`)
    .run(next.patientId, next.doctorId, next.date, next.startTime, next.endTime, next.service, next.status, next.notes, req.params.id);
  broadcast('appointments');
  res.json(appointmentOut(db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(204).end();
  if (req.user.role === 'doctor' && existing.doctorId !== req.user.doctorId) {
    return res.status(403).json({ error: 'forbidden', message: 'Эта запись принадлежит другому врачу' });
  }
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  broadcast('appointments');
  res.status(204).end();
});

module.exports = router;
