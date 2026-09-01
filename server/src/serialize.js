function safeParse(str, fallback) {
  try { return JSON.parse(str); } catch (e) { return fallback; }
}

function doctorOut(d) {
  return { id: d.id, name: d.name, specialty: d.specialty, phone: d.phone, bio: d.bio, color: d.color, active: !!d.active };
}

function staffOut(s) {
  return { id: s.id, name: s.name, role: s.role };
}

function patientOut(p) {
  return {
    id: p.id, fullName: p.fullName, phone: p.phone, birthDate: p.birthDate, gender: p.gender,
    address: p.address, allergies: p.allergies, notes: p.notes,
    primaryDoctorId: p.primaryDoctorId, teeth: safeParse(p.teeth, {}), createdAt: p.createdAt
  };
}

function appointmentOut(a) {
  return {
    id: a.id, patientId: a.patientId, doctorId: a.doctorId, date: a.date, startTime: a.startTime,
    endTime: a.endTime, service: a.service, status: a.status, notes: a.notes, createdAt: a.createdAt
  };
}

function treatmentOut(t) {
  return { id: t.id, patientId: t.patientId, doctorId: t.doctorId, date: t.date, tooth: t.tooth, procedure: t.procedureName, price: t.price };
}

function invoiceOut(i) {
  return {
    id: i.id, patientId: i.patientId, doctorId: i.doctorId, date: i.date,
    items: safeParse(i.items, []), discountPct: i.discountPct, payments: safeParse(i.payments, []),
    createdAt: i.createdAt
  };
}

function expenseOut(e) {
  return { id: e.id, date: e.date, category: e.category, amount: e.amount, note: e.note };
}

function settingsOut(s) {
  if (!s) return null;
  return { name: s.name, phone: s.phone, address: s.address, hours: s.hours, services: safeParse(s.services, []) };
}

module.exports = { safeParse, doctorOut, staffOut, patientOut, appointmentOut, treatmentOut, invoiceOut, expenseOut, settingsOut };
