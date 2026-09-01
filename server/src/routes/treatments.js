const express = require('express');
const { db, genId } = require('../db');
const { authMiddleware, requireRole } = require('../auth');
const { treatmentOut } = require('../serialize');
const { accessiblePatientIds } = require('../access');
const { broadcast } = require('../realtime');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  let rows;
  if (req.user.role === 'doctor') {
    const ids = accessiblePatientIds(req.user.doctorId);
    rows = ids.length
      ? db.prepare(`SELECT * FROM treatments WHERE patientId IN (${ids.map(() => '?').join(',')}) ORDER BY date DESC`).all(...ids)
      : [];
  } else {
    rows = db.prepare('SELECT * FROM treatments ORDER BY date DESC').all();
  }
  res.json(rows.map(treatmentOut));
});

router.post('/', requireRole('admin', 'doctor'), (req, res) => {
  const b = req.body || {};
  if (!b.patientId || !b.procedure || !b.date) return res.status(400).json({ error: 'bad_request', message: 'Не хватает данных' });

  if (req.user.role === 'doctor' && !accessiblePatientIds(req.user.doctorId).includes(b.patientId)) {
    return res.status(403).json({ error: 'forbidden', message: 'Пациент недоступен' });
  }
  const doctorId = req.user.role === 'doctor' ? req.user.doctorId : (b.doctorId || null);
  if (!doctorId) return res.status(400).json({ error: 'bad_request', message: 'Укажите врача' });

  const id = genId('tr');
  db.prepare('INSERT INTO treatments (id, patientId, doctorId, date, tooth, procedureName, price) VALUES (?,?,?,?,?,?,?)')
    .run(id, b.patientId, doctorId, b.date, b.tooth || '', b.procedure, Number(b.price) || 0);
  broadcast('treatments');
  res.status(201).json(treatmentOut(db.prepare('SELECT * FROM treatments WHERE id = ?').get(id)));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM treatments WHERE id = ?').run(req.params.id);
  broadcast('treatments');
  res.status(204).end();
});

module.exports = router;
