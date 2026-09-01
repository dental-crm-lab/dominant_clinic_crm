const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { signToken, authMiddleware } = require('../auth');

const router = express.Router();

// Public: who can log in (no secrets exposed)
router.get('/login-options', (req, res) => {
  const staff = db.prepare('SELECT id, name, role FROM staff ORDER BY name ASC').all();
  const doctors = db.prepare('SELECT id, name, specialty, color FROM doctors WHERE active = 1 ORDER BY name ASC').all();
  res.json({ staff, doctors });
});

router.post('/login', async (req, res) => {
  const { kind, id, pin } = req.body || {};
  if (!kind || !id || !pin) return res.status(400).json({ error: 'bad_request', message: 'Не хватает данных для входа' });

  try {
    if (kind === 'staff') {
      const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(id);
      if (!staff || !(await bcrypt.compare(String(pin), staff.pinHash))) {
        return res.status(401).json({ error: 'invalid_pin', message: 'Неверный PIN-код' });
      }
      const identity = { kind: 'staff', id: staff.id, name: staff.name, role: staff.role };
      return res.json({ token: signToken(identity), identity });
    }
    if (kind === 'doctor') {
      const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(id);
      if (!doctor || !doctor.active || !(await bcrypt.compare(String(pin), doctor.pinHash))) {
        return res.status(401).json({ error: 'invalid_pin', message: 'Неверный PIN-код' });
      }
      const identity = { kind: 'doctor', id: doctor.id, name: doctor.name, role: 'doctor', doctorId: doctor.id, color: doctor.color };
      return res.json({ token: signToken(identity), identity });
    }
    return res.status(400).json({ error: 'bad_request', message: 'Неизвестный тип входа' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error', message: 'Ошибка сервера при входе' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ identity: req.user });
});

module.exports = router;
