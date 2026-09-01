const express = require('express');
const { db, genId } = require('../db');
const { authMiddleware, requireRole } = require('../auth');
const { invoiceOut, safeParse } = require('../serialize');
const { broadcast } = require('../realtime');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const rows = req.user.role === 'doctor'
    ? db.prepare('SELECT * FROM invoices WHERE doctorId = ? ORDER BY date DESC').all(req.user.doctorId)
    : db.prepare('SELECT * FROM invoices ORDER BY date DESC').all();
  res.json(rows.map(invoiceOut));
});

router.post('/', (req, res) => {
  const b = req.body || {};
  const items = Array.isArray(b.items) ? b.items : [];
  if (!b.patientId || !items.length) return res.status(400).json({ error: 'bad_request', message: 'Укажите пациента и хотя бы одну позицию' });
  const doctorId = req.user.role === 'doctor' ? req.user.doctorId : b.doctorId;
  if (!doctorId) return res.status(400).json({ error: 'bad_request', message: 'Укажите врача' });

  const id = genId('inv');
  const date = b.date || new Date().toISOString().slice(0, 10);
  db.prepare('INSERT INTO invoices (id, patientId, doctorId, date, items, discountPct, payments) VALUES (?,?,?,?,?,?,?)')
    .run(id, b.patientId, doctorId, date, JSON.stringify(items), Number(b.discountPct) || 0, '[]');
  broadcast('invoices');
  res.status(201).json(invoiceOut(db.prepare('SELECT * FROM invoices WHERE id = ?').get(id)));
});

router.post('/:id/payments', (req, res) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  if (req.user.role === 'doctor' && existing.doctorId !== req.user.doctorId) {
    return res.status(403).json({ error: 'forbidden', message: 'Этот счёт принадлежит другому врачу' });
  }
  const amount = Math.max(0, Number(req.body && req.body.amount) || 0);
  const method = (req.body && req.body.method) || 'cash';
  if (!amount) return res.status(400).json({ error: 'bad_request', message: 'Укажите сумму оплаты' });

  const payments = safeParse(existing.payments, []);
  payments.push({ date: new Date().toISOString().slice(0, 10), amount, method });
  db.prepare('UPDATE invoices SET payments = ? WHERE id = ?').run(JSON.stringify(payments), req.params.id);
  broadcast('invoices');
  res.json(invoiceOut(db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  broadcast('invoices');
  res.status(204).end();
});

module.exports = router;
