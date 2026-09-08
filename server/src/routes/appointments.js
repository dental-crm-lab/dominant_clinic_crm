const express = require('express');
const { db, genId } = require('../db');
const { authMiddleware } = require('../auth');
const { appointmentOut } = require('../serialize');
const { broadcast } = require('../realtime');

const router = express.Router();
router.use(authMiddleware);

function toMinutes(t) {
  var parts = String(t || '0:0').split(':');
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

// Finds an existing, non-cancelled appointment for the same doctor on the same
// day whose time range overlaps [startTime, endTime). Excludes excludeId so
// editing an appointment doesn't conflict with itself.
function findConflict(doctorId, date, startTime, endTime, excludeId) {
  const rows = db.prepare(
    `SELECT * FROM appointments WHERE doctorId = ? AND date = ? AND status != 'cancelled' AND id != ?`
  ).all(doctorId, date, excludeId || '');
  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);
  return rows.find(function (a) {
    return newStart < toMinutes(a.endTime) && toMinutes(a.startTime) < newEnd;
  });
}

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

  const conflict = findConflict(doctorId, b.date, b.startTime, b.endTime);
  if (conflict) {
    const cp = db.prepare('SELECT fullName FROM patients WHERE id = ?').get(conflict.patientId);
    return res.status(409).json({
      error: 'time_conflict',
      message: 'На это время у врача уже есть запись' + (cp ? ' — ' + cp.fullName : '') + ' (' + conflict.startTime + '–' + conflict.endTime + ')'
    });
  }

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

  if (next.status !== 'cancelled') {
    const conflict = findConflict(next.doctorId, next.date, next.startTime, next.endTime, req.params.id);
    if (conflict) {
      const cp = db.prepare('SELECT fullName FROM patients WHERE id = ?').get(conflict.patientId);
      return res.status(409).json({
        error: 'time_conflict',
        message: 'На это время у врача уже есть запись' + (cp ? ' — ' + cp.fullName : '') + ' (' + conflict.startTime + '–' + conflict.endTime + ')'
      });
    }
  }

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
