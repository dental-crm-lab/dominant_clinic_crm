const { db } = require('./db');

// Which patient IDs a given doctor may access: their own primary patients,
// plus anyone they've had an appointment or treatment with.
function accessiblePatientIds(doctorId) {
  const rows = db.prepare(`
    SELECT DISTINCT p.id AS id FROM patients p
    LEFT JOIN appointments a ON a.patientId = p.id AND a.doctorId = ?
    LEFT JOIN treatments t ON t.patientId = p.id AND t.doctorId = ?
    WHERE p.primaryDoctorId = ? OR a.id IS NOT NULL OR t.id IS NOT NULL
  `).all(doctorId, doctorId, doctorId);
  return rows.map((r) => r.id);
}

module.exports = { accessiblePatientIds };
