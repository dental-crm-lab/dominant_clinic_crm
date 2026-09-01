CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#a8823f',
  pinHash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  pinHash TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  birthDate TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  allergies TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  teeth TEXT NOT NULL DEFAULT '{}',
  primaryDoctorId TEXT REFERENCES doctors(id) ON DELETE SET NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctorId TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  service TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS treatments (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctorId TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  tooth TEXT NOT NULL DEFAULT '',
  procedureName TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  patientId TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctorId TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  items TEXT NOT NULL DEFAULT '[]',
  discountPct REAL NOT NULL DEFAULT 0,
  payments TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Прочее',
  amount REAL NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Dominant',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  hours TEXT NOT NULL DEFAULT '',
  services TEXT NOT NULL DEFAULT '[]',
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_appt_doctor ON appointments(doctorId);
CREATE INDEX IF NOT EXISTS idx_appt_patient ON appointments(patientId);
CREATE INDEX IF NOT EXISTS idx_appt_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_treat_patient ON treatments(patientId);
CREATE INDEX IF NOT EXISTS idx_treat_doctor ON treatments(doctorId);
CREATE INDEX IF NOT EXISTS idx_inv_doctor ON invoices(doctorId);
CREATE INDEX IF NOT EXISTS idx_inv_patient ON invoices(patientId);
CREATE INDEX IF NOT EXISTS idx_patient_doctor ON patients(primaryDoctorId);
