// Patient photos / x-rays / CT scans. Ported from the file-upload module of
// Atlas Dental CRM (FastAPI + S3/R2 there) to this app's stack (Express +
// node:sqlite + local disk). Same architecture, adapted:
//   - Upload goes THROUGH this backend as multipart/form-data (multer),
//     never straight into storage, so extension/size are validated first.
//   - Bytes are never served from a public path — every read (list metadata
//     here, actual bytes at /:id/raw) is gated by the same auth + per-doctor
//     patient-access check used everywhere else in this app (accessiblePatientIds).
//   - Rotation (0/90/180/270) is stored as a number and applied client-side
//     via CSS transform; the file on disk is never re-encoded.
//   - Tooth number is a nullable FDI number, editable any time via PATCH,
//     independent of the upload step.
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db, genId } = require('../db');
const { authMiddleware, requireRole } = require('../auth');
const { patientFileOut } = require('../serialize');
const { accessiblePatientIds } = require('../access');
const { broadcast } = require('../realtime');
const storage = require('../storage');

const router = express.Router();
router.use(authMiddleware);

const ALLOWED_EXT = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.pdf': 'application/pdf', '.heic': 'image/heic', '.heif': 'image/heif'
};
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, storage.UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, genId('pf') + (path.extname(file.originalname) || '').toLowerCase())
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT[ext]) return cb(new Error('bad_extension'));
    cb(null, true);
  }
});

// Doctors only see/touch files for patients they're allowed to see; admin
// and reception aren't scoped (same rule as patients.js/treatments.js).
function canAccessPatient(req, patientId) {
  if (req.user.role !== 'doctor') return true;
  return accessiblePatientIds(req.user.doctorId).includes(patientId);
}

function loadOwnedFile(req, res) {
  const f = db.prepare('SELECT * FROM patient_files WHERE id = ?').get(req.params.id);
  if (!f) { res.status(404).json({ error: 'not_found' }); return null; }
  if (!canAccessPatient(req, f.patientId)) { res.status(403).json({ error: 'forbidden', message: 'Файл недоступен' }); return null; }
  return f;
}

router.get('/patient/:patientId', (req, res) => {
  if (!canAccessPatient(req, req.params.patientId)) return res.status(403).json({ error: 'forbidden', message: 'Пациент недоступен' });
  const rows = db.prepare('SELECT * FROM patient_files WHERE patientId = ? ORDER BY createdAt DESC').all(req.params.patientId);
  res.json(rows.map(patientFileOut));
});

router.post('/patient/:patientId', (req, res) => {
  if (!canAccessPatient(req, req.params.patientId)) return res.status(403).json({ error: 'forbidden', message: 'Пациент недоступен' });
  const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(req.params.patientId);
  if (!patient) return res.status(404).json({ error: 'not_found', message: 'Пациент не найден' });

  upload.single('file')(req, res, (err) => {
    if (err) {
      const message = err.message === 'bad_extension'
        ? 'Недопустимый формат файла. Разрешены: JPG, PNG, WEBP, PDF, HEIC'
        : (err.code === 'LIMIT_FILE_SIZE' ? 'Файл слишком большой (максимум 20 МБ)' : 'Не удалось загрузить файл');
      return res.status(400).json({ error: 'bad_request', message });
    }
    if (!req.file) return res.status(400).json({ error: 'bad_request', message: 'Файл не получен' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileType = ['xray', 'ct', 'photo'].includes(req.body.fileType) ? req.body.fileType : 'photo';
    const toothNumber = req.body.toothNumber ? Number(req.body.toothNumber) : null;
    const id = genId('pf');
    db.prepare(`INSERT INTO patient_files (id, patientId, fileType, fileName, storedName, mimeType, size, notes, toothNumber, uploadedBy, uploadedByName)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, req.params.patientId, fileType, req.file.originalname, req.file.filename,
        ALLOWED_EXT[ext] || req.file.mimetype || 'application/octet-stream', req.file.size,
        (req.body.notes || '').trim(), toothNumber, req.user.id || '', req.user.name || '');
    broadcast('patientFiles');
    res.status(201).json(patientFileOut(db.prepare('SELECT * FROM patient_files WHERE id = ?').get(id)));
  });
});

// Streams the actual bytes. Deliberately not under the static /web mount and
// not a public URL — the client fetches this with its Authorization header
// and turns the response into a blob: URL, same "gate every read" rule as
// the presigned-URL approach it's adapted from.
router.get('/:id/raw', (req, res) => {
  const f = loadOwnedFile(req, res);
  if (!f) return;
  const filePath = storage.absolutePath(f.storedName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not_found', message: 'Файл отсутствует на сервере' });
  res.setHeader('Content-Type', f.mimeType || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.sendFile(filePath);
});

router.patch('/:id/rotate', (req, res) => {
  const f = loadOwnedFile(req, res);
  if (!f) return;
  const direction = req.body && req.body.direction;
  if (direction !== 'left' && direction !== 'right') {
    return res.status(400).json({ error: 'bad_request', message: "direction должен быть 'left' или 'right'" });
  }
  const delta = direction === 'left' ? -90 : 90;
  const rotation = (((f.rotation || 0) + delta) % 360 + 360) % 360;
  db.prepare('UPDATE patient_files SET rotation = ? WHERE id = ?').run(rotation, f.id);
  broadcast('patientFiles');
  res.json(patientFileOut(db.prepare('SELECT * FROM patient_files WHERE id = ?').get(f.id)));
});

// Tooth number (and notes) can be set/changed any time, independent of the
// upload step — e.g. tagging an x-ray with a tooth after the fact.
router.patch('/:id', (req, res) => {
  const f = loadOwnedFile(req, res);
  if (!f) return;
  const b = req.body || {};
  const toothNumber = Object.prototype.hasOwnProperty.call(b, 'toothNumber')
    ? (b.toothNumber === null || b.toothNumber === '' ? null : Number(b.toothNumber))
    : f.toothNumber;
  const notes = b.notes !== undefined ? String(b.notes).trim() : f.notes;
  db.prepare('UPDATE patient_files SET toothNumber = ?, notes = ? WHERE id = ?').run(toothNumber, notes, f.id);
  broadcast('patientFiles');
  res.json(patientFileOut(db.prepare('SELECT * FROM patient_files WHERE id = ?').get(f.id)));
});

// Reception can upload (e.g. scanning a document/photo at check-in) but not
// delete clinical images — same spirit as canEditTeeth excluding reception.
router.delete('/:id', requireRole('admin', 'doctor'), (req, res) => {
  const f = loadOwnedFile(req, res);
  if (!f) return;
  db.prepare('DELETE FROM patient_files WHERE id = ?').run(f.id);
  storage.deleteFile(f.storedName);
  broadcast('patientFiles');
  res.status(204).end();
});

module.exports = router;
