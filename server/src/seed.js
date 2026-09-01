// Seeds the database with demo clinic data (safe to re-run — it skips if data already exists).
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, genId } = require('./db');

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
const TODAY = addDays(new Date(), 0);

const SERVICES = [
  { id: 's1', name: 'Консультация стоматолога', category: 'Консультация', price: 500 },
  { id: 's2', name: 'Профессиональная гигиена полости рта', category: 'Гигиена', price: 2500 },
  { id: 's3', name: 'Лечение кариеса (пломба)', category: 'Терапия', price: 3500 },
  { id: 's4', name: 'Лечение пульпита (1 канал)', category: 'Терапия', price: 3000 },
  { id: 's5', name: 'Удаление зуба простое', category: 'Хирургия', price: 2000 },
  { id: 's6', name: 'Удаление зуба сложное', category: 'Хирургия', price: 6500 },
  { id: 's7', name: 'Удаление зуба мудрости хирургически', category: 'Хирургия', price: 8000 },
  { id: 's8', name: 'Установка коронки (металлокерамика)', category: 'Ортопедия', price: 15000 },
  { id: 's9', name: 'Имплантация (1 имплант)', category: 'Имплантация', price: 35000 },
  { id: 's10', name: 'Отбеливание Zoom', category: 'Эстетика', price: 8000 },
  { id: 's11', name: 'Установка брекет-системы', category: 'Ортодонтия', price: 45000 },
  { id: 's12', name: 'Коррекция прикуса (визит)', category: 'Ортодонтия', price: 2000 },
  { id: 's13', name: 'Художественная реставрация зуба', category: 'Эстетика', price: 4500 },
  { id: 's14', name: 'Детская профилактика (фторирование)', category: 'Гигиена', price: 1800 }
];

async function main() {
  const existing = db.prepare("SELECT id FROM settings WHERE id = 'clinic'").get();
  if (existing) {
    console.log('Seed skipped — data already present. Delete the DB file (server/data/dominant.db) to reseed from scratch.');
    return;
  }

  db.prepare('INSERT INTO settings (id, name, phone, address, hours, services) VALUES (?,?,?,?,?,?)')
    .run('clinic', 'Dominant', '+996 700 12 34 56', 'г. Бишкек, ул. Тыныстанова, 9', '09:00 – 19:00, без выходных', JSON.stringify(SERVICES));

  const doctorDefs = [
    { key: 'kuraglievich', name: 'Арсен Кураглиевич', specialty: 'Челюстно-лицевой хирург', phone: '+996 555 10 20 30', color: '#a8823f', pin: '1234', bio: 'Стаж 15 лет. Хирургическая стоматология, имплантация, костная пластика.' },
    { key: 'nurlanova', name: 'Салтанат Нурланова', specialty: 'Терапевт-стоматолог', phone: '+996 555 20 30 40', color: '#4a6fa5', pin: '2345', bio: 'Стаж 9 лет. Лечение кариеса, эндодонтия, эстетическая реставрация.' },
    { key: 'asanov', name: 'Бакыт Асанов', specialty: 'Ортодонт', phone: '+996 555 30 40 50', color: '#3f7a5c', pin: '3456', bio: 'Стаж 7 лет. Брекет-системы, элайнеры, коррекция прикуса.' },
    { key: 'dzhuma', name: 'Айгерим Джумабекова', specialty: 'Детский стоматолог', phone: '+996 555 40 50 60', color: '#b0463c', pin: '4567', bio: 'Стаж 6 лет. Детская стоматология и профилактика.' }
  ];
  const doctors = {};
  for (const d of doctorDefs) {
    const id = genId('doc');
    const pinHash = await bcrypt.hash(d.pin, 10);
    db.prepare('INSERT INTO doctors (id, name, specialty, phone, bio, color, pinHash, active) VALUES (?,?,?,?,?,?,?,1)')
      .run(id, d.name, d.specialty, d.phone, d.bio, d.color, pinHash);
    doctors[d.key] = id;
  }
  const dr = doctors;

  db.prepare('INSERT INTO staff (id, name, role, pinHash) VALUES (?,?,?,?)')
    .run(genId('staff'), 'Администратор клиники', 'admin', await bcrypt.hash('1111', 10));
  db.prepare('INSERT INTO staff (id, name, role, pinHash) VALUES (?,?,?,?)')
    .run(genId('staff'), 'Айнура Сатыбалдиева', 'reception', await bcrypt.hash('2222', 10));

  function teeth(list) {
    const m = {};
    list.forEach(([t, status, note]) => { m[t] = { status, note: note || '' }; });
    return JSON.stringify(m);
  }

  const patientDefs = [
    { key: 'daniyar', fullName: 'Данияр Молдалиев', phone: '+996 555 11 22 33', birthDate: '1988-04-12', gender: 'm', address: 'мкр. Асанбай, 14', allergies: 'Нет', notes: 'Постоянный пациент, наблюдается у хирурга.', primaryDoctorId: dr.kuraglievich, teeth: teeth([['48', 'missing'], ['47', 'filled'], ['16', 'crown'], ['26', 'caries', 'Требуется лечение']]) },
    { key: 'zhamilya', fullName: 'Жамиля Токтосунова', phone: '+996 555 22 33 44', birthDate: '1995-09-02', gender: 'f', address: 'ул. Чуй, 128', allergies: 'Лидокаин — уточнить перед анестезией', notes: '', primaryDoctorId: dr.nurlanova, teeth: teeth([['11', 'filled'], ['21', 'filled'], ['36', 'planned', 'Запланирован канал']]) },
    { key: 'erlan', fullName: 'Эрлан Бекбоев', phone: '+996 555 33 44 55', birthDate: '1979-01-20', gender: 'm', address: 'мкр. Джал, 45', allergies: 'Нет', notes: 'Плановая имплантация.', primaryDoctorId: dr.kuraglievich, teeth: teeth([['46', 'implant'], ['45', 'crown']]) },
    { key: 'gulnara', fullName: 'Гульнара Осмонова', phone: '+996 555 44 55 66', birthDate: '2006-03-11', gender: 'f', address: 'ул. Ахунбаева, 92', allergies: 'Нет', notes: 'Ортодонтическое лечение, брекеты с прошлого года.', primaryDoctorId: dr.asanov, teeth: '{}' },
    { key: 'timur', fullName: 'Тимур Абдышев', phone: '+996 555 55 66 77', birthDate: '1990-07-30', gender: 'm', address: 'мкр. Восток-5, 8', allergies: 'Нет', notes: '', primaryDoctorId: dr.nurlanova, teeth: teeth([['14', 'caries'], ['15', 'filled']]) },
    { key: 'nurbek', fullName: 'Нурбек Сыдыков', phone: '+996 555 66 77 88', birthDate: '2016-11-05', gender: 'm', address: 'ул. Московская, 30', allergies: 'Нет', notes: 'Ребёнок, наблюдение раз в 6 месяцев.', primaryDoctorId: dr.dzhuma, teeth: '{}' },
    { key: 'viktoriya', fullName: 'Виктория Ким', phone: '+996 555 77 88 99', birthDate: '1998-02-18', gender: 'f', address: 'мкр. 7, 19', allergies: 'Нет', notes: 'Хочет отбеливание.', primaryDoctorId: dr.nurlanova, teeth: '{}' },
    { key: 'azamat', fullName: 'Азамат Раимбеков', phone: '+996 555 88 99 00', birthDate: '1972-12-01', gender: 'm', address: 'ул. Фрунзе, 55', allergies: 'Аспирин', notes: 'Сложный имплантационный случай, две единицы.', primaryDoctorId: dr.kuraglievich, teeth: teeth([['36', 'missing'], ['37', 'missing']]) }
  ];
  const patients = {};
  for (const p of patientDefs) {
    const id = genId('pat');
    db.prepare(`INSERT INTO patients (id, fullName, phone, birthDate, gender, address, allergies, notes, teeth, primaryDoctorId) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(id, p.fullName, p.phone, p.birthDate, p.gender, p.address, p.allergies, p.notes, p.teeth, p.primaryDoctorId);
    patients[p.key] = id;
  }
  const pt = patients;

  const insertAppt = db.prepare(`INSERT INTO appointments (id, patientId, doctorId, date, startTime, endTime, service, status, notes) VALUES (?,?,?,?,?,?,?,?,?)`);
  const A = (dOffset, start, end, patientKey, doctorKey, service, status, notes) =>
    insertAppt.run(genId('appt'), pt[patientKey], dr[doctorKey], addDays(TODAY, dOffset), start, end, service, status, notes || '');

  A(-6, '09:00', '09:40', 'daniyar', 'kuraglievich', 'Консультация', 'completed');
  A(-5, '10:00', '11:00', 'erlan', 'kuraglievich', 'Имплантация (1 имплант)', 'completed');
  A(-4, '11:30', '12:00', 'zhamilya', 'nurlanova', 'Лечение кариеса (пломба)', 'completed');
  A(-3, '09:30', '10:00', 'timur', 'nurlanova', 'Консультация', 'completed');
  A(-3, '14:00', '15:00', 'gulnara', 'asanov', 'Коррекция прикуса (визит)', 'completed');
  A(-2, '10:00', '10:30', 'viktoriya', 'nurlanova', 'Профессиональная гигиена полости рта', 'completed');
  A(-2, '16:00', '16:40', 'nurbek', 'dzhuma', 'Детская профилактика (фторирование)', 'completed');
  A(-1, '09:00', '09:30', 'azamat', 'kuraglievich', 'Консультация', 'no_show', 'Пациент не предупредил');
  A(-1, '13:00', '13:40', 'daniyar', 'kuraglievich', 'Удаление зуба сложное', 'completed');
  A(0, '09:00', '09:40', 'zhamilya', 'nurlanova', 'Лечение пульпита (1 канал)', 'confirmed');
  A(0, '10:30', '11:10', 'timur', 'nurlanova', 'Лечение кариеса (пломба)', 'scheduled');
  A(0, '11:00', '12:00', 'erlan', 'kuraglievich', 'Консультация', 'confirmed', 'Контроль после имплантации');
  A(0, '14:00', '15:00', 'gulnara', 'asanov', 'Коррекция прикуса (визит)', 'scheduled');
  A(0, '15:30', '16:10', 'nurbek', 'dzhuma', 'Консультация', 'scheduled');
  A(1, '09:30', '10:30', 'azamat', 'kuraglievich', 'Имплантация (1 имплант)', 'scheduled', 'Вторая единица');
  A(1, '11:00', '11:40', 'viktoriya', 'nurlanova', 'Отбеливание Zoom', 'scheduled');
  A(1, '13:00', '13:30', 'gulnara', 'asanov', 'Коррекция прикуса (визит)', 'scheduled');
  A(2, '10:00', '10:40', 'zhamilya', 'nurlanova', 'Художественная реставрация зуба', 'scheduled');
  A(2, '12:00', '12:30', 'daniyar', 'kuraglievich', 'Консультация', 'scheduled');
  A(3, '09:00', '10:00', 'erlan', 'kuraglievich', 'Установка коронки (металлокерамика)', 'scheduled');
  A(-7, '12:00', '12:30', 'viktoriya', 'nurlanova', 'Консультация', 'cancelled', 'Перенос по просьбе пациента');

  const insertTreat = db.prepare('INSERT INTO treatments (id, patientId, doctorId, date, tooth, procedureName, price) VALUES (?,?,?,?,?,?,?)');
  const T = (patientKey, doctorKey, dOffset, tooth, procedure, price) =>
    insertTreat.run(genId('tr'), pt[patientKey], dr[doctorKey], addDays(TODAY, dOffset), tooth, procedure, price);

  T('daniyar', 'kuraglievich', -6, '', 'Консультация, план лечения', 500);
  T('erlan', 'kuraglievich', -5, '46', 'Имплантация (1 имплант)', 35000);
  T('zhamilya', 'nurlanova', -4, '36', 'Лечение кариеса (пломба)', 3500);
  T('timur', 'nurlanova', -3, '14', 'Консультация', 500);
  T('gulnara', 'asanov', -3, '', 'Коррекция брекет-системы', 2000);
  T('viktoriya', 'nurlanova', -2, '', 'Профессиональная гигиена', 2500);
  T('nurbek', 'dzhuma', -2, '', 'Фторирование', 1800);
  T('daniyar', 'kuraglievich', -1, '47', 'Удаление зуба сложное', 6500);

  const insertInv = db.prepare('INSERT INTO invoices (id, patientId, doctorId, date, items, discountPct, payments) VALUES (?,?,?,?,?,?,?)');
  const I = (patientKey, doctorKey, dOffset, items, paidList, discount) =>
    insertInv.run(
      genId('inv'), pt[patientKey], dr[doctorKey], addDays(TODAY, dOffset), JSON.stringify(items), discount || 0,
      JSON.stringify((paidList || []).map(([o, amount, method]) => ({ date: addDays(TODAY, o), amount, method })))
    );

  I('daniyar', 'kuraglievich', -6, [{ name: 'Консультация стоматолога', price: 500, qty: 1, tooth: '' }], [[-6, 500, 'cash']]);
  I('erlan', 'kuraglievich', -5, [{ name: 'Имплантация (1 имплант)', price: 35000, qty: 1, tooth: '46' }], [[-5, 20000, 'card']]);
  I('zhamilya', 'nurlanova', -4, [{ name: 'Лечение кариеса (пломба)', price: 3500, qty: 1, tooth: '36' }], [[-4, 3500, 'cash']]);
  I('timur', 'nurlanova', -3, [{ name: 'Консультация стоматолога', price: 500, qty: 1, tooth: '' }], [[-3, 500, 'cash']]);
  I('gulnara', 'asanov', -3, [{ name: 'Коррекция прикуса (визит)', price: 2000, qty: 1, tooth: '' }], [[-3, 2000, 'transfer']]);
  I('viktoriya', 'nurlanova', -2, [{ name: 'Профессиональная гигиена полости рта', price: 2500, qty: 1, tooth: '' }], []);
  I('nurbek', 'dzhuma', -2, [{ name: 'Детская профилактика (фторирование)', price: 1800, qty: 1, tooth: '' }], [[-2, 1800, 'cash']]);
  I('daniyar', 'kuraglievich', -1, [{ name: 'Удаление зуба сложное', price: 6500, qty: 1, tooth: '47' }], [[-1, 3000, 'cash']]);
  I('azamat', 'kuraglievich', -15, [{ name: 'Консультация стоматолога', price: 500, qty: 1, tooth: '' }, { name: 'Имплантация (1 имплант)', price: 35000, qty: 1, tooth: '36' }], [[-15, 17750, 'card']], 5);
  I('erlan', 'kuraglievich', -28, [{ name: 'Установка коронки (металлокерамика)', price: 15000, qty: 1, tooth: '45' }], [[-28, 15000, 'card']]);

  const insertExp = db.prepare('INSERT INTO expenses (id, date, category, amount, note) VALUES (?,?,?,?,?)');
  const cats = ['Аренда', 'Зарплата', 'Материалы и расходники', 'Коммунальные услуги', 'Реклама и маркетинг', 'Прочее'];
  insertExp.run(genId('exp'), addDays(TODAY, -28), cats[0], 60000, 'Аренда помещения');
  insertExp.run(genId('exp'), addDays(TODAY, -25), cats[2], 42000, 'Расходники и материалы');
  insertExp.run(genId('exp'), addDays(TODAY, -20), cats[1], 180000, 'Зарплата персонала');
  insertExp.run(genId('exp'), addDays(TODAY, -14), cats[3], 9500, 'Электричество, вода');
  insertExp.run(genId('exp'), addDays(TODAY, -10), cats[4], 12000, 'Реклама в соцсетях');
  insertExp.run(genId('exp'), addDays(TODAY, -6), cats[2], 21000, 'Закупка анестетиков');
  insertExp.run(genId('exp'), addDays(TODAY, -2), cats[5], 4000, 'Хозтовары');

  console.log('Seed complete.');
  console.log('Admin PIN: 1111 · Reception PIN: 2222 · Doctors PIN: 1234 / 2345 / 3456 / 4567');
}

module.exports = { seed: main };

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
