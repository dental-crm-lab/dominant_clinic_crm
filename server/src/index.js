require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const { attach } = require('./realtime');
const { seed } = require('./seed');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ---- API routes ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bootstrap', require('./routes/bootstrap'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/treatments', require('./routes/treatments'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ---- Static frontend (PWA) ----
const webDir = path.join(__dirname, '..', '..', 'web');
app.use(express.static(webDir, { maxAge: '1h' }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(webDir, 'index.html'));
});

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'server_error', message: err.message || 'Внутренняя ошибка сервера' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
attach(io);
io.on('connection', () => {});

const PORT = process.env.PORT || 4000;

// Idempotent: seeds demo clinic data only on a brand-new database (first
// boot on a fresh Railway volume). Safe to leave in on every restart.
seed().catch((e) => console.error('Seed step failed (continuing to boot):', e))
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Dominant CRM server listening on port ${PORT}`);
    });
  });
