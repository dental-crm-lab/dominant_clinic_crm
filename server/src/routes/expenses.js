const express = require('express');
const { db, genId } = require('../db');
const { authMiddleware, requireRole } = require('../auth');
const { expenseOut } = require('../serialize');
const { broadcast } = require('../realtime');

const router = express.Router();
router.use(authMiddleware, requireRole('admin'));

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM expenses ORDER BY date DESC').all().map(expenseOut));
});

router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.date || !b.amount) return res.status(400).json({ error: 'bad_request', message: 'Укажите дату и сумму' });
  const id = genId('exp');
  db.prepare('INSERT INTO expenses (id, date, category, amount, note) VALUES (?,?,?,?,?)')
    .run(id, b.date, b.category || 'Прочее', Number(b.amount) || 0, b.note || '');
  broadcast('expenses');
  res.status(201).json(expenseOut(db.prepare('SELECT * FROM expenses WHERE id = ?').get(id)));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  broadcast('expenses');
  res.status(204).end();
});

module.exports = router;
