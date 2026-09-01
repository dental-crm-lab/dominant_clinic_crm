const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../auth');
const { doctorOut, patientOut, appointmentOut, treatmentOut, invoiceOut, expenseOut, settingsOut, staffOut } = require('../serialize');
const { accessiblePatientIds } = require('../access');

const router = express.Router();
router.use(authMiddleware);

// One combined, role-filtered payload for the initial app load.
router.get('/', (req, res) => {
  const role = req.user.role;
  const isDoctor = role === 'doctor';
  const ids = isDoctor ? accessiblePatientIds(req.user.doctorId) : null;
  const inClause = ids && ids.length ? `(${ids.map(() => '?').join(',')})` : '(NULL)';

  const settings = settingsOut(db.prepare("SELECT * FROM settings WHERE id = 'clinic'").get());
  const doctors = db.prepare('SELECT * FROM doctors ORDER BY name ASC').all().map(doctorOut);

  const patients = isDoctor
    ? (ids.length ? db.prepare(`SELECT * FROM patients WHERE id IN ${inClause} ORDER BY fullName ASC`).all(...ids) : [])
    : db.prepare('SELECT * FROM patients ORDER BY fullName ASC').all();

  const appointments = isDoctor
    ? db.prepare('SELECT * FROM appointments WHERE doctorId = ? ORDER BY date ASC, startTime ASC').all(req.user.doctorId)
    : db.prepare('SELECT * FROM appointments ORDER BY date ASC, startTime ASC').all();

  const treatments = isDoctor
    ? (ids.length ? db.prepare(`SELECT * FROM treatments WHERE patientId IN ${inClause} ORDER BY date DESC`).all(...ids) : [])
    : db.prepare('SELECT * FROM treatments ORDER BY date DESC').all();

  const invoices = isDoctor
    ? db.prepare('SELECT * FROM invoices WHERE doctorId = ? ORDER BY date DESC').all(req.user.doctorId)
    : db.prepare('SELECT * FROM invoices ORDER BY date DESC').all();

  const expenses = role === 'admin' ? db.prepare('SELECT * FROM expenses ORDER BY date DESC').all() : [];
  const staff = role === 'admin' ? db.prepare('SELECT * FROM staff ORDER BY name ASC').all() : [];

  res.json({
    settings,
    doctors,
    staff: staff.map(staffOut),
    patients: patients.map(patientOut),
    appointments: appointments.map(appointmentOut),
    treatments: treatments.map(treatmentOut),
    invoices: invoices.map(invoiceOut),
    expenses: expenses.map(expenseOut)
  });
});

module.exports = router;
