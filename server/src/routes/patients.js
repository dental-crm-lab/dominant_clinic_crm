const express = require('express');
const { db, genId } = require('../db');
const { authMiddleware, requireRole } = require('../auth');
const { patientOut } = require('../serialize');
const { accessiblePatientIds } = require('../access');
const { broadcast } = require('../realtime');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  let rows;
  if (req.user.role === 'doctor') {
    const ids = accessiblePatientIds(req.user.doctorId);
    rows = ids.length
      ? db.prepare(`SELECT * FROM patients WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY fullName ASC`).all(...ids)
      : [];
  } else {
    rows = db.prepare('SELECT * FROM patients ORDER BY fullName ASC').all();
  }
  res.json(rows.map(patientOut));
});

router.post('/', requireRole('admin', 'reception'), (req, res) => {
  const b = req.body || {};
  if (!b.fullName) return res.status(400).json({ error: 'bad_request', message: 'Укажите ФИО пациента' });
  const id = genId('pat');
  db.prepare(`INSERT INTO patients (id, fullName, phone, birthDate, gender, address, allergies, notes, teeth, primaryDoctorId)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, b.fullName, b.phone || '', b.birthDate || '', b.gender || '', b.address || '', b.allergies || '', b.notes || '', '{}', b.primaryDoctorId || null);
  broadcast('patients');
  res.status(201).json(patientOut(db.prepare('SELECT * FROM patients WHERE id = ?').get(id)));
});

router.patch('/:id', requireRole('admin', 'reception'), (req, res) => {
  const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  const next = { ...existing };
  ['fullName', 'phone', 'birthDate', 'gender', 'address', 'allergies', 'notes', 'primaryDoctorId'].forEach((k) => {
    if (b[k] !== undefined) next[k] = b[k];
  });
  db.prepare(`UPDATE patients SET fullName=?, phone=?, birthDate=?, gender=?, address=?, allergies=?, notes=?, primaryDoctorId=? WHERE id=?`)
    .run(next.fullName, next.phone, next.birthDate, next.gender, next.address, next.allergies, next.notes, next.primaryDoctorId, req.params.id);
  broadcast('patients');
  res.json(patientOut(db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id)));
});

// Odontogram: doctors and admin may update a patient's tooth chart (deep-merged, not replaced).
router.patch('/:id/teeth', requireRole('admin', 'doctor'), (req, res) => {
  const patch = req.body && req.body.teeth;
  if (!patch || typeof patch !== 'object') return res.status(400).json({ error: 'bad_request', message: 'Некорректные данные зуба' });

  if (req.user.role === 'doctor' && !accessiblePatientIds(req.user.doctorId).includes(req.params.id)) {
    return res.status(403).json({ error: 'forbidden', message: 'Пациент недоступен' });
  }
  const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  let teeth = {};
  try { teeth = JSON.parse(existing.teeth || '{}'); } catch (e) { teeth = {}; }
  Object.assign(teeth, patch);
  db.prepare('UPDATE patients SET teeth = ? WHERE id = ?').run(JSON.stringify(teeth), req.params.id);
  broadcast('patients');
  res.json(patientOut(db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
  broadcast('patients');
  res.status(204).end();
});

module.exports = router;
