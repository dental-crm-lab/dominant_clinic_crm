'use strict';
/* ==== CONSTANTS ==== */
var CLINIC_NAME = 'Dominant';
var DAY_START = 8;   // 08:00
var DAY_END = 20;    // 20:00
var SLOT_MIN = 30;
var SLOTS_PER_DAY = ((DAY_END - DAY_START) * 60) / SLOT_MIN;
var SLOT_PX = 56;

var WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
var MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
var MONTHS_NOM = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

var DOCTOR_COLORS = ['#a8823f', '#4a6fa5', '#3f7a5c', '#b0463c', '#7a6fb0', '#4f9aa8'];

var APPT_STATUS = {
  scheduled: { label: 'Запланирована', badge: 'gray' },
  confirmed: { label: 'Подтверждена', badge: 'info' },
  completed: { label: 'Завершена', badge: 'success' },
  cancelled: { label: 'Отменена', badge: 'danger' },
  no_show:   { label: 'Не пришёл', badge: 'warn' }
};

var INVOICE_STATUS = {
  unpaid:  { label: 'Не оплачен', badge: 'danger' },
  partial: { label: 'Частично', badge: 'warn' },
  paid:    { label: 'Оплачен', badge: 'success' }
};

var PAYMENT_METHODS = { cash: 'Наличные', card: 'Карта', transfer: 'Перевод' };

var TOOTH_STATUSES = {
  healthy: { label: 'Здоров', cls: '' },
  caries: { label: 'Кариес', cls: 'st-caries' },
  filled: { label: 'Пломба', cls: 'st-filled' },
  crown: { label: 'Коронка', cls: 'st-crown' },
  implant: { label: 'Имплант', cls: 'st-implant' },
  planned: { label: 'План лечения', cls: 'st-planned' },
  missing: { label: 'Отсутствует', cls: 'st-missing' }
};

var UPPER_RIGHT = [18,17,16,15,14,13,12,11];
var UPPER_LEFT  = [21,22,23,24,25,26,27,28];
var LOWER_RIGHT = [48,47,46,45,44,43,42,41];
var LOWER_LEFT  = [31,32,33,34,35,36,37,38];

var EXPENSE_CATEGORIES = ['Аренда', 'Зарплата', 'Материалы и расходники', 'Коммунальные услуги', 'Реклама и маркетинг', 'Прочее'];

var NAV = {
  admin: [
    { id:'dashboard', label:'Дашборд', ic:'◆' },
    { id:'calendar', label:'Календарь', ic:'▦' },
    { id:'patients', label:'Пациенты', ic:'☺' },
    { id:'doctors', label:'Врачи', ic:'✦' },
    { id:'invoices', label:'Счета и оплаты', ic:'$' },
    { id:'finance', label:'Касса и финансы', ic:'≡' },
    { id:'settings', label:'Настройки', ic:'⚙' }
  ],
  reception: [
    { id:'calendar', label:'Календарь', ic:'▦' },
    { id:'patients', label:'Пациенты', ic:'☺' },
    { id:'invoices', label:'Счета и оплаты', ic:'$' }
  ],
  doctor: [
    { id:'calendar', label:'Мой календарь', ic:'▦' },
    { id:'patients', label:'Мои пациенты', ic:'☺' },
    { id:'invoices', label:'Мои счета', ic:'$' },
    { id:'profile', label:'Профиль', ic:'●' }
  ]
};

/* ==== HELPERS ==== */
function esc(s){
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, function(c){
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}
function uid(prefix){
  return (prefix||'id') + '_' + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4);
}
function fmtMoney(n){
  n = Math.round(Number(n)||0);
  return n.toLocaleString('ru-RU').replace(/,/g,' ') + ' сом';
}
function pad2(n){ return n < 10 ? '0'+n : ''+n; }
function toISODate(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function parseISODate(s){ var p = s.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
function todayISO(){ return toISODate(new Date()); }
function fmtDateHuman(iso, opts){
  var d = parseISODate(iso);
  var withYear = opts && opts.year;
  var s = d.getDate() + ' ' + MONTHS[d.getMonth()];
  if (withYear) s += ' ' + d.getFullYear();
  return s;
}
function fmtDateShort(iso){
  var d = parseISODate(iso);
  return pad2(d.getDate()) + '.' + pad2(d.getMonth()+1) + '.' + String(d.getFullYear()).slice(2);
}
function fmtWeekday(iso){ var d = parseISODate(iso); var idx = (d.getDay()+6)%7; return WEEKDAYS[idx]; }
function addDays(iso, n){ var d = parseISODate(iso); d.setDate(d.getDate()+n); return toISODate(d); }
function startOfWeek(iso){ var d = parseISODate(iso); var dow = (d.getDay()+6)%7; d.setDate(d.getDate()-dow); return toISODate(d); }
function timeToMinutes(t){ var p = t.split(':'); return (+p[0])*60 + (+p[1]); }
function minutesToTime(m){ return pad2(Math.floor(m/60)) + ':' + pad2(m%60); }
function initials(name){
  if (!name) return '?';
  var parts = name.trim().split(/\s+/);
  return (parts[0][0]||'') + (parts[1] ? parts[1][0] : '');
}
function ageFromBirth(iso){
  if (!iso) return null;
  var b = parseISODate(iso), n = new Date();
  var age = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth()===b.getMonth() && n.getDate() < b.getDate())) age--;
  return age;
}
function doctorColor(doctorId){
  var doc = state.data.doctors.find(function(d){ return d.id === doctorId; });
  if (doc && doc.color) return doc.color;
  var idx = state.data.doctors.findIndex(function(d){ return d.id === doctorId; });
  return DOCTOR_COLORS[Math.max(0,idx) % DOCTOR_COLORS.length];
}
function doctorName(doctorId){
  var doc = state.data.doctors.find(function(d){ return d.id === doctorId; });
  return doc ? doc.name : 'Врач';
}
function patientName(patientId){
  var p = state.data.patients.find(function(x){ return x.id === patientId; });
  return p ? p.fullName : 'Пациент';
}
function invoiceTotal(inv){
  var sub = (inv.items||[]).reduce(function(s,it){ return s + (Number(it.price)||0)*(Number(it.qty)||1); }, 0);
  var disc = sub * ((Number(inv.discountPct)||0)/100);
  return Math.max(0, sub - disc);
}
function invoicePaid(inv){
  return (inv.payments||[]).reduce(function(s,p){ return s + (Number(p.amount)||0); }, 0);
}
function invoiceStatus(inv){
  var total = invoiceTotal(inv), paid = invoicePaid(inv);
  if (paid <= 0) return 'unpaid';
  if (paid >= total - 0.5) return 'paid';
  return 'partial';
}
function toast(msg, isErr){
  var host = document.getElementById('toast-host');
  var el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(function(){ el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(function(){ el.remove(); }, 320); }, 2600);
}
function closeAllPopovers(){
  document.querySelectorAll('.tooth-pop').forEach(function(p){ p.remove(); });
}
function avatarStyle(seed){
  var colors = ['#a8823f','#4a6fa5','#3f7a5c','#b0463c','#7a6fb0'];
  var h = 0; for (var i=0;i<(seed||'').length;i++) h += seed.charCodeAt(i);
  var c = colors[h % colors.length];
  return 'background:'+c+';';
}

/* ==== STATE ==== */
var state = {
  online: false,
  ready: false,
  identity: null, // {kind:'staff'|'doctor', id, name, role, doctorId?}
  route: { view: 'login' },
  data: {
    settings: null,
    doctors: [],
    staff: [],
    patients: [],
    appointments: [],
    invoices: [],
    expenses: [],
    treatments: []
  },
  ui: {
    loginTab: 'staff',
    loginSelected: null,
    pinBuf: '',
    pinError: '',
    calDate: todayISO(),
    calMode: 'day',
    calDoctorFilter: 'all',
    patientSearch: '',
    selectedPatientId: null,
    patientTab: 'overview',
    invFilterStatus: 'all',
    invFilterDoctor: 'all',
    financeRange: 'month',
    financeFrom: null,
    financeTo: null,
    modal: null // {type, ...}
  },
  _dirty: false,
  _renderTimer: null
};

/* ==== DATA LAYER (REST + Socket.io) ==== */
var API_BASE = '/api';
var socket = null;

var COLLECTION_ENDPOINT = {
  doctors: 'doctors', staff: 'staff', patients: 'patients',
  appointments: 'appointments', invoices: 'invoices', expenses: 'expenses', treatments: 'treatments'
};

function authHeaders(){
  var h = { 'Content-Type': 'application/json' };
  if (state.token) h['Authorization'] = 'Bearer ' + state.token;
  return h;
}

function apiFetch(path, opts){
  opts = opts || {};
  opts.headers = Object.assign(authHeaders(), opts.headers || {});
  return fetch(API_BASE + path, opts).then(function(res){
    if (res.status === 204) return null;
    return res.json().catch(function(){ return null; }).then(function(body){
      if (!res.ok) {
        var err = new Error((body && body.message) || ('Ошибка сервера (' + res.status + ')'));
        err.status = res.status;
        err.body = body;
        throw err;
      }
      return body;
    });
  });
}

function applyLocalUpsert(col, rec){
  if (!rec) return;
  var arr = state.data[col];
  var idx = arr.findIndex(function(d){ return d.id === rec.id; });
  if (idx >= 0) arr[idx] = rec; else arr.push(rec);
}

var DataAPI = {
  add: function(col, data){
    return apiFetch('/' + COLLECTION_ENDPOINT[col], { method: 'POST', body: JSON.stringify(data) })
      .then(function(rec){ applyLocalUpsert(col, rec); return rec.id; })
      .catch(function(e){ toast('Не удалось сохранить: ' + e.message, true); throw e; });
  },
  update: function(col, id, partial){
    if (col === 'patients' && partial && Object.prototype.hasOwnProperty.call(partial, 'teeth') && Object.keys(partial).length === 1) {
      return apiFetch('/patients/' + id + '/teeth', { method: 'PATCH', body: JSON.stringify({ teeth: partial.teeth }) })
        .then(function(rec){ applyLocalUpsert(col, rec); })
        .catch(function(e){ toast('Не удалось обновить зуб: ' + e.message, true); throw e; });
    }
    return apiFetch('/' + COLLECTION_ENDPOINT[col] + '/' + id, { method: 'PATCH', body: JSON.stringify(partial) })
      .then(function(rec){ applyLocalUpsert(col, rec); })
      .catch(function(e){ toast('Не удалось обновить: ' + e.message, true); throw e; });
  },
  remove: function(col, id){
    return apiFetch('/' + COLLECTION_ENDPOINT[col] + '/' + id, { method: 'DELETE' })
      .then(function(){ state.data[col] = state.data[col].filter(function(d){ return d.id !== id; }); })
      .catch(function(e){ toast('Ошибка удаления: ' + e.message, true); throw e; });
  },
  updateSettings: function(partial){
    return apiFetch('/settings', { method: 'PATCH', body: JSON.stringify(partial) })
      .then(function(rec){ state.data.settings = rec; })
      .catch(function(e){ toast('Ошибка настроек: ' + e.message, true); throw e; });
  },
  addPayment: function(invId, amount, method){
    return apiFetch('/invoices/' + invId + '/payments', { method: 'POST', body: JSON.stringify({ amount: amount, method: method }) })
      .then(function(rec){ applyLocalUpsert('invoices', rec); })
      .catch(function(e){ toast('Не удалось принять оплату: ' + e.message, true); throw e; });
  }
};

function afterRemoteChange(){
  if (!state.ready) return;
  if (state.ui.modal) { state._dirty = true; return; }
  scheduleRenderDebounced();
}
function scheduleRenderDebounced(){
  if (state._renderTimer) return;
  state._renderTimer = setTimeout(function(){
    state._renderTimer = null;
    if (state.ui.modal) { state._dirty = true; return; }
    render();
  }, 260);
}

function refetchCollection(col){
  if (col === 'settings') {
    return apiFetch('/settings').then(function(s){ state.data.settings = s; afterRemoteChange(); }).catch(function(){});
  }
  if (!COLLECTION_ENDPOINT[col]) return;
  return apiFetch('/' + COLLECTION_ENDPOINT[col]).then(function(rows){ state.data[col] = rows; afterRemoteChange(); }).catch(function(){});
}

function connectSocket(){
  if (typeof io === 'undefined') return;
  try {
    socket = io({ auth: { token: state.token } });
    socket.on('connect', function(){ state.online = true; scheduleRenderDebounced(); });
    socket.on('disconnect', function(){ state.online = false; scheduleRenderDebounced(); });
    socket.on('sync', function(payload){
      var col = payload && payload.collection;
      if (col) refetchCollection(col);
    });
  } catch (e) { console.warn('socket connect failed', e); }
}
function disconnectSocket(){
  if (socket) { try { socket.disconnect(); } catch (e) {} socket = null; }
  state.online = false;
}

/* ==== RENDER: SHELL ==== */
function render(){
  closeAllPopovers();
  var root = document.getElementById('root');
  if (!state.identity) {
    root.innerHTML = renderLogin();
    return;
  }
  var nav = NAV[state.identity.role] || [];
  if (!nav.some(function(n){ return n.id === state.route.view; })) {
    state.route = { view: nav[0].id };
  }
  root.innerHTML = renderShell(nav);
  afterShellMount();
}

function viewTitle(id){
  var map = {
    dashboard:'Дашборд', calendar:'Календарь', patients:'Пациенты', doctors:'Врачи',
    invoices:'Счета и оплаты', finance:'Касса и финансы', settings:'Настройки', profile:'Профиль'
  };
  return map[id] || '';
}
function viewSubtitle(){
  var d = new Date();
  var dow = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'][d.getDay()];
  return dow.charAt(0).toUpperCase()+dow.slice(1) + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

function renderShell(nav){
  var idn = state.identity;
  var roleLabel = idn.role === 'admin' ? 'Администратор' : idn.role === 'reception' ? 'Ресепшн' : 'Врач · ' + (state.data.doctors.find(function(d){return d.id===idn.doctorId;})||{}).specialty;
  var view = state.route.view;
  var noScroll = view === 'calendar';
  return ''
  + '<div id="app-screen">'
  +   '<aside class="sidebar">'
  +     '<div class="sidebar-mark"><div class="word">Dominant</div><div class="sub">Dental Clinic CRM</div></div>'
  +     '<nav class="side-nav">'
  +        nav.map(function(n){
              return '<button class="side-link' + (n.id===view?' active':'') + '" data-action="nav" data-view="' + n.id + '">'
                   + '<span class="ic">' + n.ic + '</span><span class="lbl">' + esc(n.label) + '</span></button>';
            }).join('')
  +     '</nav>'
  +     '<div class="side-foot">'
  +       '<div class="side-user"><span class="login-avatar" style="' + avatarStyle(idn.name) + '">' + esc(initials(idn.name)) + '</span>'
  +         '<div><div class="name">' + esc(idn.name) + '</div><div class="role">' + esc(roleLabel) + '</div></div></div>'
  +       '<button class="logout-btn" data-action="logout">Выйти</button>'
  +     '</div>'
  +   '</aside>'
  +   '<div class="main">'
  +     '<div class="topbar"><div><h1>' + esc(viewTitle(view)) + '</h1><div class="meta">' + esc(viewSubtitle()) + (state.online ? '' : ' · автономный демо-режим') + '</div></div>'
  +       '<div class="topbar-actions">' + renderTopbarActions(view) + '</div>'
  +     '</div>'
  +     '<div class="view-body' + (noScroll ? ' no-scroll' : '') + '" id="view-body">' + renderView(view) + '</div>'
  +   '</div>'
  + '</div>'
  + renderModal();
}

function renderTopbarActions(view){
  var idn = state.identity;
  if (view === 'patients' && idn.role !== 'doctor') {
    return '<button class="btn gold" data-action="open-patient-modal">+ Новый пациент</button>';
  }
  if (view === 'patients' && idn.role === 'doctor' && !state.ui.selectedPatientId) {
    return '';
  }
  if (view === 'doctors') return '<button class="btn gold" data-action="open-doctor-modal">+ Новый врач</button>';
  if (view === 'invoices') return '<button class="btn gold" data-action="open-invoice-modal">+ Новый счёт</button>';
  if (view === 'finance') return '<button class="btn" data-action="open-expense-modal">+ Расход</button>';
  return '';
}

function renderView(view){
  switch(view){
    case 'dashboard': return renderDashboard();
    case 'calendar': return renderCalendar();
    case 'patients': return renderPatients();
    case 'doctors': return renderDoctors();
    case 'invoices': return renderInvoices();
    case 'finance': return renderFinance();
    case 'settings': return renderSettings();
    case 'profile': return renderProfile();
    default: return '';
  }
}

function afterShellMount(){
  if (state.route.view === 'calendar' && !state.ui.modal) afterCalendarMount();
  if (state.ui.modal) afterModalMount();
  var body = document.getElementById('view-body');
  if (body) body.scrollTop = 0;
}

/* ==== RENDER: LOGIN ==== */
function renderLogin(){
  var ui = state.ui;
  var body;
  if (ui.loginSelected) {
    body = renderPinPad();
  } else {
    body = renderLoginList();
  }
  return ''
  + '<div id="login-screen"><div class="login-card">'
  +   '<div class="login-mark"><div class="word">Dominant</div><div class="rule"></div><div class="sub">Стоматологическая клиника</div></div>'
  +   '<div class="login-panel">' + body + '</div>'
  +   '<div class="login-hint">Внутренняя система клиники · выберите сотрудника для входа</div>'
  + '</div></div>';
}

function renderLoginList(){
  var ui = state.ui;
  var tabsHtml = ''
    + '<div class="role-tabs">'
    +   '<button class="role-tab' + (ui.loginTab==='staff'?' active':'') + '" data-action="login-tab" data-tab="staff">Администрация</button>'
    +   '<button class="role-tab' + (ui.loginTab==='doctor'?' active':'') + '" data-action="login-tab" data-tab="doctor">Врачи</button>'
    + '</div>';
  var list;
  if (ui.loginTab === 'staff') {
    list = state.data.staff.map(function(s){
      return '<button class="login-person" data-action="login-pick" data-kind="staff" data-id="' + s.id + '">'
        + '<span class="login-avatar" style="' + avatarStyle(s.name) + '">' + esc(initials(s.name)) + '</span>'
        + '<span><span class="name">' + esc(s.name) + '</span><br><span class="role-line">' + (s.role==='admin'?'Администратор':'Ресепшн') + '</span></span>'
        + '</button>';
    }).join('');
  } else {
    list = state.data.doctors.filter(function(d){ return d.active !== false; }).map(function(d){
      return '<button class="login-person" data-action="login-pick" data-kind="doctor" data-id="' + d.id + '">'
        + '<span class="login-avatar" style="background:' + d.color + ';">' + esc(initials(d.name)) + '</span>'
        + '<span><span class="name">' + esc(d.name) + '</span><br><span class="role-line">' + esc(d.specialty) + '</span></span>'
        + '</button>';
    }).join('');
  }
  if (!list) list = '<div class="hint" style="text-align:center;padding:20px;">Список пуст</div>';
  return tabsHtml + '<div class="login-list">' + list + '</div>';
}

function renderPinPad(){
  var sel = state.ui.loginSelected;
  var dots = '';
  for (var i=0;i<4;i++) dots += '<span class="' + (i < state.ui.pinBuf.length ? 'filled' : '') + '"></span>';
  var keys = [1,2,3,4,5,6,7,8,9,'','0','⌫'];
  var keysHtml = keys.map(function(k){
    if (k === '') return '<span></span>';
    if (k === '⌫') return '<button class="pin-key" data-action="pin-back">⌫</button>';
    return '<button class="pin-key" data-action="pin-key" data-k="' + k + '">' + k + '</button>';
  }).join('');
  return ''
  + '<button class="pin-back" data-action="login-back">← Назад</button>'
  + '<div style="text-align:center;">'
  +   '<span class="login-avatar" style="' + (sel.kind==='doctor' ? 'background:' + sel.color + ';' : avatarStyle(sel.name)) + 'width:52px;height:52px;font-size:19px;display:inline-flex;">' + esc(initials(sel.name)) + '</span>'
  +   '<div style="margin-top:10px;font-weight:600;font-size:15px;">' + esc(sel.name) + '</div>'
  +   '<div class="hint" style="color:#a39c86;">Введите PIN-код (демо: см. настройки)</div>'
  + '</div>'
  + '<div class="pin-dots">' + dots + '</div>'
  + '<div class="pin-grid">' + keysHtml + '</div>'
  + '<div class="pin-error">' + esc(state.ui.pinError||'') + '</div>';
}

/* ==== CHART HELPERS ==== */
var CHART_GRID = 'rgba(130,124,104,0.28)';
var CHART_LABEL = '#8a8570';
function barChartSVG(data, opts){
  opts = opts || {};
  var w = opts.width || 640, h = opts.height || 180;
  var padTop = 14, padBottom = 24, padX = 8;
  var plotH = h - padTop - padBottom;
  var vals = data.map(function(d){ return d.value; }).concat([1]);
  var max = Math.max.apply(null, vals) * 1.18 || 1;
  var n = data.length || 1;
  var gap = (w - padX*2) / n;
  var barW = Math.min(38, gap * 0.5);
  var grid = [0,0.5,1].map(function(f){
    var y = padTop + plotH*(1-f);
    return '<line x1="'+padX+'" y1="'+y.toFixed(1)+'" x2="'+(w-padX)+'" y2="'+y.toFixed(1)+'" stroke="'+CHART_GRID+'" stroke-width="1"/>';
  }).join('');
  var bars = data.map(function(d,i){
    var bh = max>0 ? (d.value/max)*plotH : 0;
    var x = padX + i*gap + (gap-barW)/2;
    var y = padTop + plotH - bh;
    var color = d.color || opts.color || '#a8823f';
    return '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+barW.toFixed(1)+'" height="'+Math.max(bh,1.5).toFixed(1)+'" rx="4" fill="'+color+'"><title>'+esc(d.label)+': '+fmtMoney(d.value)+'</title></rect>';
  }).join('');
  var labels = data.map(function(d,i){
    var x = padX + i*gap + gap/2;
    return '<text x="'+x.toFixed(1)+'" y="'+(h-8)+'" font-size="10" text-anchor="middle" fill="'+CHART_LABEL+'">'+esc(d.label)+'</text>';
  }).join('');
  return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" style="width:100%;height:'+h+'px;display:block;">' + grid + bars + labels + '</svg>';
}
function donutSVG(segments, opts){
  opts = opts || {};
  var size = opts.size || 168, sw = opts.strokeWidth || 24;
  var r = (size - sw)/2;
  var c = 2*Math.PI*r;
  var total = segments.reduce(function(s,x){ return s+x.value; }, 0);
  if (!total) return '<svg viewBox="0 0 '+size+' '+size+'" style="width:'+size+'px;height:'+size+'px;"><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+CHART_GRID+'" stroke-width="'+sw+'"/></svg>';
  var offset = 0;
  var circles = segments.filter(function(s){return s.value>0;}).map(function(seg){
    var frac = seg.value/total;
    var dash = frac*c;
    var el = '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+seg.color+'" stroke-width="'+sw+'" stroke-dasharray="'+dash.toFixed(1)+' '+(c-dash).toFixed(1)+'" stroke-dashoffset="'+(-offset).toFixed(1)+'" transform="rotate(-90 '+size/2+' '+size/2+')"><title>'+esc(seg.label)+': '+fmtMoney(seg.value)+'</title></circle>';
    offset += dash;
    return el;
  }).join('');
  return '<svg viewBox="0 0 '+size+' '+size+'" style="width:'+size+'px;height:'+size+'px;">' + circles + '</svg>';
}
function legendList(segments){
  var total = segments.reduce(function(s,x){ return s+x.value; }, 0) || 1;
  return '<div style="display:flex;flex-direction:column;gap:8px;">' + segments.map(function(s){
    var pct = Math.round((s.value/total)*100);
    return '<div style="display:flex;align-items:center;gap:8px;font-size:12px;">'
      + '<span class="dot" style="background:'+s.color+';"></span>'
      + '<span style="flex:1;color:var(--ink-soft);">'+esc(s.label)+'</span>'
      + '<span class="mono" style="font-weight:600;">'+pct+'%</span></div>';
  }).join('') + '</div>';
}

/* ==== RENDER: DASHBOARD ==== */
function renderDashboard(){
  var today = todayISO();
  var appts = state.data.appointments.filter(function(a){ return a.date === today; }).sort(function(a,b){ return a.startTime.localeCompare(b.startTime); });
  var revenueToday = 0, outstanding = 0;
  state.data.invoices.forEach(function(inv){
    (inv.payments||[]).forEach(function(p){ if (p.date === today) revenueToday += Number(p.amount)||0; });
    var st = invoiceStatus(inv);
    if (st !== 'paid') outstanding += invoiceTotal(inv) - invoicePaid(inv);
  });
  var activePatients = state.data.patients.length;
  var last7 = [];
  for (var i=6;i>=0;i--){
    var day = addDays(today,-i);
    var sum = 0;
    state.data.invoices.forEach(function(inv){ (inv.payments||[]).forEach(function(p){ if (p.date===day) sum += Number(p.amount)||0; }); });
    last7.push({ label: fmtDateShort(day).slice(0,5), value: sum });
  }
  var recentInvoices = state.data.invoices.slice().sort(function(a,b){ return b.date.localeCompare(a.date); }).slice(0,6);
  var completedToday = appts.filter(function(a){ return a.status==='completed'; }).length;

  var kpis = ''
    + kpiCard('Записи сегодня', appts.length, appts.length ? (completedToday + ' завершено') : 'нет записей')
    + kpiCard('Выручка сегодня', fmtMoney(revenueToday), 'наличные + карта + перевод')
    + kpiCard('Задолженность пациентов', fmtMoney(outstanding), 'по неоплаченным счетам')
    + kpiCard('Пациентов в базе', activePatients, 'всего в клинике');

  var scheduleRows = appts.length ? appts.map(function(a){
    return '<tr class="clickable" data-action="open-appt" data-id="' + a.id + '">'
      + '<td class="mono">' + a.startTime + '</td>'
      + '<td><span class="dot" style="background:' + doctorColor(a.doctorId) + ';margin-right:6px;"></span>' + esc(doctorName(a.doctorId)) + '</td>'
      + '<td>' + esc(patientName(a.patientId)) + '</td>'
      + '<td>' + esc(a.service) + '</td>'
      + '<td>' + apptStatusBadge(a.status) + '</td>'
      + '</tr>';
  }).join('') : '';

  var invRows = recentInvoices.map(function(inv){
    var st = invoiceStatus(inv);
    return '<tr class="clickable" data-action="open-invoice" data-id="' + inv.id + '">'
      + '<td class="mono">' + fmtDateShort(inv.date) + '</td>'
      + '<td>' + esc(patientName(inv.patientId)) + '</td>'
      + '<td>' + esc(doctorName(inv.doctorId)) + '</td>'
      + '<td class="mono">' + fmtMoney(invoiceTotal(inv)) + '</td>'
      + '<td>' + invStatusBadge(st) + '</td>'
      + '</tr>';
  }).join('');

  return ''
  + '<div class="kpi-grid" style="margin-bottom:20px;">' + kpis + '</div>'
  + '<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px;align-items:start;margin-bottom:20px;">'
  +   '<div class="card card-pad">'
  +     '<div class="section-head" style="margin-bottom:10px;"><h2 style="font-size:16px;">Выручка за 7 дней</h2></div>'
  +     barChartSVG(last7, { color:'#a8823f' })
  +   '</div>'
  +   '<div class="card card-pad">'
  +     '<div class="section-head" style="margin-bottom:10px;"><h2 style="font-size:16px;">Расписание на сегодня</h2>'
  +       '<span class="hint">' + appts.length + ' ' + pluralAppt(appts.length) + '</span></div>'
  +     (appts.length ? '<div class="table-wrap" style="max-height:220px;overflow-y:auto;"><table><tbody>' + appts.slice(0,6).map(function(a){
            return '<tr class="clickable" data-action="open-appt" data-id="'+a.id+'"><td class="mono" style="width:52px;">'+a.startTime+'</td><td>'+esc(patientName(a.patientId))+'</td><td style="text-align:right;">'+apptStatusBadge(a.status)+'</td></tr>';
          }).join('') + '</tbody></table></div>' : '<div class="empty-state"><div class="glyph">◆</div><div class="t">Свободный день</div></div>')
  +   '</div>'
  + '</div>'
  + '<div class="card">'
  +   '<div class="card-pad" style="padding-bottom:0;"><div class="section-head"><h2 style="font-size:16px;">Полное расписание на сегодня</h2></div></div>'
  +   (appts.length ? '<div class="table-wrap"><table><thead><tr><th>Время</th><th>Врач</th><th>Пациент</th><th>Услуга</th><th>Статус</th></tr></thead><tbody>' + scheduleRows + '</tbody></table></div>'
      : '<div class="empty-state"><div class="glyph">◆</div><div class="t">Записей нет</div></div>')
  + '</div>'
  + '<div class="card" style="margin-top:20px;">'
  +   '<div class="card-pad" style="padding-bottom:0;"><div class="section-head"><h2 style="font-size:16px;">Последние счета</h2>'
  +     '<button class="btn ghost sm" data-action="nav" data-view="invoices">Все счета →</button></div></div>'
  +   '<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Пациент</th><th>Врач</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>' + invRows + '</tbody></table></div>'
  + '</div>';
}
function pluralAppt(n){
  var m10 = n%10, m100 = n%100;
  if (m10===1 && m100!==11) return 'запись';
  if ([2,3,4].indexOf(m10)>=0 && [12,13,14].indexOf(m100)<0) return 'записи';
  return 'записей';
}
function kpiCard(label, val, delta, deltaCls){
  return '<div class="kpi"><div class="eyebrow">' + esc(label) + '</div><div class="val">' + val + '</div>'
    + (delta ? '<div class="delta' + (deltaCls ? ' '+deltaCls : '') + '">' + esc(delta) + '</div>' : '') + '</div>';
}
function apptStatusBadge(status){
  var s = APPT_STATUS[status] || APPT_STATUS.scheduled;
  return '<span class="badge ' + s.badge + '">' + s.label + '</span>';
}
function invStatusBadge(status){
  var s = INVOICE_STATUS[status] || INVOICE_STATUS.unpaid;
  return '<span class="badge ' + s.badge + '">' + s.label + '</span>';
}

/* ==== RENDER: CALENDAR ==== */
var WEEKDAYS_FULL = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
function fmtWeekdayFull(iso){ var d = parseISODate(iso); return WEEKDAYS_FULL[(d.getDay()+6)%7]; }
function hexTint(hex, a){
  hex = String(hex||'#a8823f').replace('#','');
  if (hex.length===3) hex = hex.split('').map(function(c){return c+c;}).join('');
  var r = parseInt(hex.substr(0,2),16)||168, g = parseInt(hex.substr(2,2),16)||130, b = parseInt(hex.substr(4,2),16)||63;
  return 'rgba('+r+','+g+','+b+','+(a===undefined?0.15:a)+')';
}
function badgeColorVar(key){ return key==='gray' ? 'var(--muted)' : 'var(--'+key+')'; }
function colHeadDoctor(d){
  if (!d) return '<div class="cal-col-head"></div>';
  return '<div class="cal-col-head"><div class="dr-name"><span class="dot" style="background:'+d.color+';margin-right:5px;"></span>'+esc(d.name)+'</div><div class="dr-spec">'+esc(d.specialty)+'</div></div>';
}
function colHeadDay(iso){
  var isToday = iso === todayISO();
  return '<div class="cal-col-head" style="'+(isToday?'background:var(--gold-tint);':'')+'"><div class="dname">'+fmtWeekday(iso)+'</div><div class="dnum" style="'+(isToday?'color:var(--gold-strong);':'')+'">'+parseISODate(iso).getDate()+'</div></div>';
}

function renderCalendar(){
  var idn = state.identity;
  var ui = state.ui;
  var isStaffView = idn.role !== 'doctor';
  var mode = ui.calMode;
  var columns = [];
  var dateLabel = '';

  if (mode === 'day') {
    dateLabel = fmtWeekdayFull(ui.calDate) + ', ' + fmtDateHuman(ui.calDate, {year:true});
    if (isStaffView) {
      var docs = state.data.doctors.filter(function(d){ return d.active !== false && (ui.calDoctorFilter==='all' || d.id===ui.calDoctorFilter); });
      columns = docs.map(function(d){ return { doctorId: d.id, date: ui.calDate, head: colHeadDoctor(d) }; });
    } else {
      var self = state.data.doctors.find(function(d){ return d.id===idn.doctorId; });
      columns = [{ doctorId: idn.doctorId, date: ui.calDate, head: colHeadDoctor(self) }];
    }
  } else {
    var weekStart = startOfWeek(ui.calDate);
    dateLabel = fmtDateHuman(weekStart) + ' – ' + fmtDateHuman(addDays(weekStart,6), {year:true});
    var docId = isStaffView ? (ui.calDoctorFilter==='all' ? ((state.data.doctors[0]||{}).id) : ui.calDoctorFilter) : idn.doctorId;
    for (var i=0;i<7;i++){ var dISO = addDays(weekStart,i); columns.push({ doctorId: docId, date: dISO, head: colHeadDay(dISO) }); }
  }

  if (!columns.length) {
    return '<div class="cal-wrap"><div class="empty-state" style="margin:auto;"><div class="glyph">▦</div><div class="t">Нет активных врачей</div><div class="hint">Добавьте врача в разделе «Врачи»</div></div></div>';
  }

  var gridTemplate = '56px repeat(' + columns.length + ', minmax(150px,1fr))';
  var headerCells = '<div class="cal-col-head"></div>' + columns.map(function(c){ return c.head; }).join('');
  var timeCells = '';
  for (var s=0; s<SLOTS_PER_DAY; s++){
    var minute = DAY_START*60 + s*SLOT_MIN;
    timeCells += '<div class="cal-time-cell">' + (minute%60===0 ? minutesToTime(minute) : '') + '</div>';
  }
  var colsHtml = columns.map(function(c){
    var apptsForCol = state.data.appointments.filter(function(a){ return a.doctorId===c.doctorId && a.date===c.date; });
    var slotsHtml = '';
    for (var s2=0;s2<SLOTS_PER_DAY;s2++){
      var minute2 = DAY_START*60+s2*SLOT_MIN;
      slotsHtml += '<div class="cal-slot' + (minute2%60===0?' hour':'') + '" data-action="cal-slot-click" data-doctor="'+c.doctorId+'" data-date="'+c.date+'" data-time="'+minutesToTime(minute2)+'"></div>';
    }
    var blocksHtml = apptsForCol.map(function(a){
      var top = ((timeToMinutes(a.startTime) - DAY_START*60)/SLOT_MIN)*SLOT_PX;
      var height = Math.max(((timeToMinutes(a.endTime)-timeToMinutes(a.startTime))/SLOT_MIN)*SLOT_PX - 3, 20);
      var col = doctorColor(a.doctorId);
      return '<div class="appt-block status-'+a.status+'" style="top:'+top+'px;height:'+height+'px;border-left-color:'+col+';background:'+hexTint(col)+';" data-action="open-appt" data-id="'+a.id+'">'
        + '<div class="t">'+a.startTime+'–'+a.endTime+'</div>'
        + '<div class="p">'+esc(patientName(a.patientId))+'</div>'
        + '<div class="s">'+esc(a.service)+'</div>'
        + '</div>';
    }).join('');
    return '<div class="cal-col" style="height:'+(SLOTS_PER_DAY*SLOT_PX)+'px;">' + slotsHtml + blocksHtml + '</div>';
  }).join('');

  var toolbar = ''
    + '<div class="cal-toolbar">'
    +   '<div class="cal-nav">'
    +     '<button class="icon-btn" data-action="cal-prev">‹</button>'
    +     '<div class="cur">'+esc(dateLabel)+'</div>'
    +     '<button class="icon-btn" data-action="cal-next">›</button>'
    +     '<button class="btn sm ghost" data-action="cal-today">Сегодня</button>'
    +   '</div>'
    +   '<div class="filters-row">'
    +     '<button class="btn gold sm" data-action="open-appt-modal">+ Новая запись</button>'
    +     (isStaffView ? ('<select class="chip-select" data-action="cal-doctor-filter">'
            + '<option value="all"' + (ui.calDoctorFilter==='all'?' selected':'') + '>Все врачи</option>'
            + state.data.doctors.filter(function(d){return d.active!==false;}).map(function(d){ return '<option value="'+d.id+'"'+(ui.calDoctorFilter===d.id?' selected':'')+'>'+esc(d.name)+'</option>'; }).join('')
            + '</select>') : '')
    +     '<div class="seg">'
    +       '<button class="'+(mode==='day'?'active':'')+'" data-action="cal-mode" data-mode="day">День</button>'
    +       '<button class="'+(mode==='week'?'active':'')+'" data-action="cal-mode" data-mode="week">Неделя</button>'
    +     '</div>'
    +   '</div>'
    + '</div>';

  var legend = '<div class="legend-row">' + Object.keys(APPT_STATUS).map(function(k){
      return '<div class="legend-item"><span class="dot" style="background:'+badgeColorVar(APPT_STATUS[k].badge)+';"></span>'+APPT_STATUS[k].label+'</div>';
    }).join('') + '</div>';

  return '<div class="cal-wrap">' + toolbar
    + '<div class="cal-scroll"><div class="cal-grid" style="grid-template-columns:'+gridTemplate+';">'
    +   headerCells + '<div class="cal-time-col">' + timeCells + '</div>' + colsHtml
    + '</div></div>' + legend + '</div>';
}

function afterCalendarMount(){
  var scrollEl = document.querySelector('.cal-scroll');
  if (!scrollEl) return;
  var now = new Date();
  var mins = now.getHours()*60+now.getMinutes();
  var top = ((mins - DAY_START*60)/SLOT_MIN)*SLOT_PX - 140;
  scrollEl.scrollTop = Math.max(0, top);
}

/* ==== RENDER: PATIENTS ==== */
function visiblePatientsForRole(){
  var idn = state.identity;
  if (idn.role !== 'doctor') return state.data.patients.slice();
  var ids = {};
  state.data.appointments.forEach(function(a){ if (a.doctorId===idn.doctorId) ids[a.patientId]=true; });
  state.data.treatments.forEach(function(t){ if (t.doctorId===idn.doctorId) ids[t.patientId]=true; });
  state.data.patients.forEach(function(p){ if (p.primaryDoctorId===idn.doctorId) ids[p.id]=true; });
  return state.data.patients.filter(function(p){ return ids[p.id]; });
}
function patientBalance(patientId, doctorId){
  var sum = 0;
  state.data.invoices.forEach(function(inv){
    if (inv.patientId!==patientId) return;
    if (doctorId && inv.doctorId!==doctorId) return;
    if (invoiceStatus(inv)!=='paid') sum += invoiceTotal(inv)-invoicePaid(inv);
  });
  return sum;
}

function renderPatients(){
  if (state.ui.selectedPatientId) return renderPatientCard(state.ui.selectedPatientId);
  return renderPatientsList();
}

function renderPatientsList(){
  var idn = state.identity;
  var list = visiblePatientsForRole();
  var q = (state.ui.patientSearch||'').toLowerCase().trim();
  if (q) list = list.filter(function(p){ return p.fullName.toLowerCase().indexOf(q)>=0 || (p.phone||'').indexOf(q)>=0; });
  list = list.slice().sort(function(a,b){ return a.fullName.localeCompare(b.fullName,'ru'); });
  var searchBar = '<div class="search-input" style="max-width:320px;margin-bottom:16px;"><input type="text" placeholder="Поиск по имени или телефону" value="'+esc(state.ui.patientSearch||'')+'" data-action-input="patient-search"/></div>';
  if (!list.length) return searchBar + '<div class="empty-state"><div class="glyph">☺</div><div class="t">Пациенты не найдены</div></div>';
  var rows = list.map(function(p){
    var bal = patientBalance(p.id, idn.role==='doctor'?idn.doctorId:null);
    var age = ageFromBirth(p.birthDate);
    return '<tr class="clickable" data-action="open-patient" data-id="'+p.id+'">'
      + '<td><div style="display:flex;align-items:center;gap:10px;"><span class="login-avatar" style="'+avatarStyle(p.fullName)+'width:30px;height:30px;font-size:11px;">'+esc(initials(p.fullName))+'</span>'+esc(p.fullName)+'</div></td>'
      + '<td class="mono">'+esc(p.phone||'—')+'</td>'
      + '<td>'+ (age!==null?age+' лет':'—') +'</td>'
      + '<td>'+esc(doctorName(p.primaryDoctorId))+'</td>'
      + '<td class="mono">'+ (bal>0 ? '<span style="color:var(--danger);font-weight:600;">'+fmtMoney(bal)+'</span>' : '—') +'</td>'
      + '</tr>';
  }).join('');
  return searchBar + '<div class="table-wrap"><table><thead><tr><th>Пациент</th><th>Телефон</th><th>Возраст</th><th>Врач</th><th>Долг</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function toothChartHTML(patient, readonly){
  var teeth = patient.teeth || {};
  function row(nums){
    return '<div class="tooth-quad">' + nums.map(function(n){
      var t = teeth[String(n)] || { status:'healthy' };
      var st = TOOTH_STATUSES[t.status] || TOOTH_STATUSES.healthy;
      var title = n + ' — ' + st.label + (t.note ? ': ' + t.note : '');
      return '<button class="tooth" ' + (readonly ? 'disabled' : 'data-action="tooth-click" data-tooth="'+n+'" data-patient="'+patient.id+'"') + ' title="'+esc(title)+'">'
        + '<span class="tooth-shape ' + st.cls + '"></span><span class="tooth-num">' + n + '</span></button>';
    }).join('') + '</div>';
  }
  var upper = '<div class="tooth-row">' + row(UPPER_RIGHT) + row(UPPER_LEFT) + '</div>';
  var lower = '<div class="tooth-row">' + row(LOWER_RIGHT) + row(LOWER_LEFT) + '</div>';
  var legend = '<div class="tooth-legend">' + Object.keys(TOOTH_STATUSES).map(function(k){
    var s = TOOTH_STATUSES[k];
    return '<div class="legend-item"><span class="tooth-shape ' + s.cls + '" style="width:14px;height:16px;"></span>' + s.label + '</div>';
  }).join('') + '</div>';
  return '<div class="tooth-chart">' + upper + lower + '</div>' + legend;
}

function toothPopoverHTML(patient, toothNum){
  var t = (patient.teeth||{})[String(toothNum)] || { status:'healthy', note:'' };
  var opts = Object.keys(TOOTH_STATUSES).map(function(k){
    var s = TOOTH_STATUSES[k];
    return '<div class="status-opt' + (t.status===k?' sel':'') + '" data-tooth-status="'+k+'"><span class="sw '+s.cls+'"></span>'+s.label+'</div>';
  }).join('');
  return '<h4>Зуб ' + toothNum + '</h4>'
    + '<div class="status-opts">' + opts + '</div>'
    + '<div class="field" style="margin-bottom:10px;"><label>Заметка</label><textarea id="tooth-note-input" rows="2">' + esc(t.note||'') + '</textarea></div>'
    + '<div style="display:flex;gap:8px;justify-content:flex-end;"><button class="btn ghost sm" data-action="tooth-pop-close">Отмена</button><button class="btn gold sm" data-action="tooth-pop-save" data-tooth="'+toothNum+'" data-patient="'+patient.id+'">Сохранить</button></div>';
}

function treatmentHistoryHTML(patient, canEdit){
  var list = state.data.treatments.filter(function(t){ return t.patientId===patient.id; }).sort(function(a,b){ return b.date.localeCompare(a.date); });
  var addBtn = canEdit ? '<button class="btn gold sm" data-action="open-treatment-modal" data-patient="'+patient.id+'">+ Добавить запись</button>' : '';
  var head = '<div class="section-head"><h2 style="font-size:16px;">История лечения</h2>' + addBtn + '</div>';
  if (!list.length) return head + '<div class="empty-state"><div class="glyph">✦</div><div class="t">Пока нет записей</div></div>';
  var items = list.map(function(t){
    return '<div class="timeline-item"><div class="timeline-dot" style="background:' + doctorColor(t.doctorId) + ';"></div><div class="timeline-date">' + fmtDateShort(t.date) + '</div>'
      + '<div class="timeline-body"><div class="timeline-title">' + esc(t.procedure) + (t.tooth ? ' · зуб ' + esc(t.tooth) : '') + '</div>'
      + '<div class="timeline-sub">' + esc(doctorName(t.doctorId)) + ' · ' + fmtMoney(t.price) + '</div></div></div>';
  }).join('');
  return head + '<div class="card card-pad"><div class="timeline">' + items + '</div></div>';
}

function patientInvoicesHTML(patient, idn){
  var list = state.data.invoices.filter(function(inv){ return inv.patientId===patient.id && (idn.role!=='doctor' || inv.doctorId===idn.doctorId); }).sort(function(a,b){ return b.date.localeCompare(a.date); });
  var addBtn = '<button class="btn gold sm" data-action="open-invoice-modal" data-patient="'+patient.id+'">+ Новый счёт</button>';
  var head = '<div class="section-head"><h2 style="font-size:16px;">Счета</h2>' + addBtn + '</div>';
  if (!list.length) return head + '<div class="empty-state"><div class="glyph">$</div><div class="t">Нет счетов</div></div>';
  var rows = list.map(function(inv){
    var st = invoiceStatus(inv);
    return '<tr class="clickable" data-action="open-invoice" data-id="'+inv.id+'"><td class="mono">'+fmtDateShort(inv.date)+'</td><td>'+esc(doctorName(inv.doctorId))+'</td><td class="mono">'+fmtMoney(invoiceTotal(inv))+'</td><td class="mono">'+fmtMoney(invoicePaid(inv))+'</td><td>'+invStatusBadge(st)+'</td></tr>';
  }).join('');
  return head + '<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Врач</th><th>Сумма</th><th>Оплачено</th><th>Статус</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function patientOverviewHTML(patient, canEdit){
  var age = ageFromBirth(patient.birthDate);
  var rows = [
    ['Телефон', patient.phone || '—'],
    ['Дата рождения', patient.birthDate ? (fmtDateHuman(patient.birthDate,{year:true}) + (age!==null ? ' (' + age + ' лет)' : '')) : '—'],
    ['Адрес', patient.address || '—'],
    ['Аллергии', patient.allergies || '—'],
    ['Лечащий врач', doctorName(patient.primaryDoctorId)],
    ['В базе с', fmtDateHuman(patient.createdAt,{year:true})]
  ];
  var grid = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">' + rows.map(function(r){
    return '<div><div class="eyebrow">' + r[0] + '</div><div style="margin-top:4px;font-size:14px;">' + esc(r[1]) + '</div></div>';
  }).join('') + '</div>';
  var notes = '<div style="margin-top:18px;"><div class="eyebrow">Заметки</div><div style="margin-top:6px;font-size:13.5px;color:var(--ink-soft);white-space:pre-wrap;">' + esc(patient.notes||'—') + '</div></div>';
  var editBtn = canEdit ? '<button class="btn sm" data-action="open-patient-modal" data-id="'+patient.id+'">Редактировать</button>' : '';
  return '<div class="section-head"><h2 style="font-size:16px;">Основная информация</h2>' + editBtn + '</div><div class="card card-pad">' + grid + notes + '</div>';
}

function renderPatientCard(patientId){
  var patient = state.data.patients.find(function(p){ return p.id===patientId; });
  if (!patient) { state.ui.selectedPatientId = null; return renderPatientsList(); }
  var idn = state.identity;
  var canEditContact = idn.role !== 'doctor';
  var canEditTeeth = idn.role !== 'reception';
  var tab = state.ui.patientTab;
  var tabs = [['overview','Обзор'],['odonto','Одонтограмма'],['history','История лечения'],['invoices','Счета']];
  var tabsHtml = '<div class="tabs">' + tabs.map(function(t){
    return '<button class="tab-btn' + (tab===t[0]?' active':'') + '" data-action="patient-tab" data-tab="'+t[0]+'">'+t[1]+'</button>';
  }).join('') + '</div>';
  var body;
  if (tab === 'overview') body = patientOverviewHTML(patient, canEditContact);
  else if (tab === 'odonto') body = '<div class="card card-pad">' + toothChartHTML(patient, !canEditTeeth) + '</div>';
  else if (tab === 'history') body = treatmentHistoryHTML(patient, idn.role !== 'reception');
  else body = patientInvoicesHTML(patient, idn);

  var balance = patientBalance(patient.id, idn.role==='doctor' ? idn.doctorId : null);
  return ''
    + '<button class="btn ghost sm" data-action="patient-back" style="margin-bottom:14px;">← Все пациенты</button>'
    + '<div class="patient-header">'
    +   '<span class="login-avatar" style="' + avatarStyle(patient.fullName) + 'width:52px;height:52px;font-size:20px;">' + esc(initials(patient.fullName)) + '</span>'
    +   '<div><h2>' + esc(patient.fullName) + '</h2><div class="sub">' + esc(patient.phone||'') + ' · ' + esc(doctorName(patient.primaryDoctorId)) + (balance>0 ? ' · <span style="color:var(--danger);font-weight:600;">долг ' + fmtMoney(balance) + '</span>' : '') + '</div></div>'
    + '</div>'
    + tabsHtml + body;
}

/* ==== RENDER: DOCTORS ==== */
function renderDoctors(){
  var list = state.data.doctors.slice().sort(function(a,b){ return a.name.localeCompare(b.name,'ru'); });
  if (!list.length) return '<div class="empty-state"><div class="glyph">✦</div><div class="t">Врачей пока нет</div></div>';
  var cards = list.map(function(d){
    var patCount = state.data.patients.filter(function(p){ return p.primaryDoctorId===d.id; }).length;
    var apptCount = state.data.appointments.filter(function(a){ return a.doctorId===d.id && a.date>=todayISO() && a.status!=='cancelled'; }).length;
    return '<div class="card doctor-card">'
      + '<span class="login-avatar" style="background:' + d.color + ';">' + esc(initials(d.name)) + '</span>'
      + '<div style="flex:1;"><div style="font-weight:600;font-size:14.5px;">' + esc(d.name) + (d.active===false ? ' <span class="badge gray">неактивен</span>' : '') + '</div>'
      + '<div class="hint">' + esc(d.specialty) + ' · ' + esc(d.phone||'') + '</div>'
      + '<div class="hint" style="margin-top:4px;">' + patCount + ' пациентов · ' + apptCount + ' предстоящих записей</div></div>'
      + '<div style="display:flex;gap:8px;">'
      +   '<button class="btn sm" data-action="open-doctor-modal" data-id="' + d.id + '">Изменить</button>'
      +   '<button class="btn sm ghost" data-action="toggle-doctor-active" data-id="' + d.id + '">' + (d.active===false ? 'Включить' : 'Деактивировать') + '</button>'
      + '</div></div>';
  }).join('');
  return '<div style="display:flex;flex-direction:column;gap:12px;">' + cards + '</div>';
}

/* ==== RENDER: INVOICES ==== */
function renderInvoices(){
  var idn = state.identity;
  var list = state.data.invoices.slice();
  if (idn.role === 'doctor') list = list.filter(function(inv){ return inv.doctorId===idn.doctorId; });
  if (idn.role !== 'doctor' && state.ui.invFilterDoctor !== 'all') list = list.filter(function(inv){ return inv.doctorId===state.ui.invFilterDoctor; });
  if (state.ui.invFilterStatus !== 'all') list = list.filter(function(inv){ return invoiceStatus(inv)===state.ui.invFilterStatus; });
  list.sort(function(a,b){ return b.date.localeCompare(a.date); });

  var totalAll = list.reduce(function(s,inv){ return s+invoiceTotal(inv); }, 0);
  var totalPaid = list.reduce(function(s,inv){ return s+invoicePaid(inv); }, 0);

  var filters = '<div class="filters-row" style="margin-bottom:16px;">'
    + (idn.role !== 'doctor' ? ('<select class="chip-select" data-action="inv-filter-doctor"><option value="all">Все врачи</option>' + state.data.doctors.map(function(d){ return '<option value="'+d.id+'"'+(state.ui.invFilterDoctor===d.id?' selected':'')+'>'+esc(d.name)+'</option>'; }).join('') + '</select>') : '')
    + '<select class="chip-select" data-action="inv-filter-status"><option value="all">Все статусы</option>'
    +   Object.keys(INVOICE_STATUS).map(function(k){ return '<option value="'+k+'"'+(state.ui.invFilterStatus===k?' selected':'')+'>'+INVOICE_STATUS[k].label+'</option>'; }).join('')
    + '</select>'
    + '</div>';

  var kpis = '<div class="kpi-grid" style="margin-bottom:16px;">'
    + kpiCard('Выставлено', fmtMoney(totalAll))
    + kpiCard('Получено', fmtMoney(totalPaid))
    + kpiCard('Остаток к оплате', fmtMoney(totalAll-totalPaid))
    + '</div>';

  if (!list.length) return filters + '<div class="empty-state"><div class="glyph">$</div><div class="t">Счетов не найдено</div></div>';

  var headExtra = idn.role !== 'doctor' ? '<th>Врач</th>' : '';
  var rows = list.map(function(inv){
    var st = invoiceStatus(inv);
    return '<tr class="clickable" data-action="open-invoice" data-id="'+inv.id+'">'
      + '<td class="mono">' + fmtDateShort(inv.date) + '</td>'
      + '<td>' + esc(patientName(inv.patientId)) + '</td>'
      + (idn.role !== 'doctor' ? '<td>' + esc(doctorName(inv.doctorId)) + '</td>' : '')
      + '<td class="mono">' + fmtMoney(invoiceTotal(inv)) + '</td>'
      + '<td class="mono">' + fmtMoney(invoicePaid(inv)) + '</td>'
      + '<td>' + invStatusBadge(st) + '</td></tr>';
  }).join('');
  return kpis + filters + '<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Пациент</th>' + headExtra + '<th>Сумма</th><th>Оплачено</th><th>Статус</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* ==== RENDER: FINANCE ==== */
function getServiceCategory(name){
  var s = ((state.data.settings && state.data.settings.services) || []).find(function(x){ return x.name===name; });
  return s ? s.category : 'Другое';
}
function financeRangeDates(){
  var r = state.ui.financeRange, to = todayISO(), from;
  if (r === 'today') from = to;
  else if (r === 'week') from = addDays(to,-6);
  else if (r === 'month') from = addDays(to,-29);
  else { from = state.ui.financeFrom || addDays(to,-29); to = state.ui.financeTo || to; }
  if (from > to) { var tmp = from; from = to; to = tmp; }
  return { from: from, to: to };
}

function renderFinance(){
  var range = financeRangeDates();
  var payments = [];
  state.data.invoices.forEach(function(inv){
    (inv.payments||[]).forEach(function(p){
      if (p.date >= range.from && p.date <= range.to) payments.push({ date:p.date, amount:Number(p.amount)||0, method:p.method, doctorId:inv.doctorId });
    });
  });
  var totalCollected = payments.reduce(function(s,p){ return s+p.amount; }, 0);
  var byMethod = { cash:0, card:0, transfer:0 };
  payments.forEach(function(p){ byMethod[p.method] = (byMethod[p.method]||0) + p.amount; });

  var outstanding = 0;
  state.data.invoices.forEach(function(inv){ if (invoiceStatus(inv) !== 'paid') outstanding += invoiceTotal(inv)-invoicePaid(inv); });

  var expensesInRange = state.data.expenses.filter(function(e){ return e.date >= range.from && e.date <= range.to; });
  var totalExpenses = expensesInRange.reduce(function(s,e){ return s+(Number(e.amount)||0); }, 0);
  var net = totalCollected - totalExpenses;

  var d0 = parseISODate(range.from), d1 = parseISODate(range.to);
  var dayCount = Math.max(1, Math.min(Math.round((d1-d0)/86400000)+1, 62));
  var days = [];
  for (var i=0;i<dayCount;i++){
    var dISO = addDays(range.from, i);
    var sum = payments.filter(function(p){ return p.date===dISO; }).reduce(function(s,p){ return s+p.amount; }, 0);
    var showLabel = dayCount <= 14 || i % Math.ceil(dayCount/10) === 0;
    days.push({ label: showLabel ? fmtDateShort(dISO).slice(0,5) : '', value: sum });
  }

  var byDoctor = {};
  payments.forEach(function(p){ byDoctor[p.doctorId] = (byDoctor[p.doctorId]||0) + p.amount; });
  var doctorSegments = Object.keys(byDoctor).map(function(id){ return { label: doctorName(id), value: byDoctor[id], color: doctorColor(id) }; }).sort(function(a,b){ return b.value-a.value; });

  var byCat = {};
  state.data.invoices.forEach(function(inv){
    if (inv.date < range.from || inv.date > range.to) return;
    (inv.items||[]).forEach(function(it){
      var cat = getServiceCategory(it.name);
      byCat[cat] = (byCat[cat]||0) + (Number(it.price)||0)*(Number(it.qty)||1);
    });
  });
  var catColors = ['#a8823f','#4a6fa5','#3f7a5c','#b0463c','#7a6fb0','#4f9aa8','#b8863f','#8a6b3d'];
  var catSegments = Object.keys(byCat).map(function(c,i){ return { label:c, value:byCat[c], color: catColors[i%catColors.length] }; }).sort(function(a,b){ return b.value-a.value; });

  var rangeSelector = '<div class="filters-row" style="margin-bottom:18px;">'
    + '<div class="seg">' + ['today','week','month','custom'].map(function(r){
        var lbl = { today:'Сегодня', week:'7 дней', month:'30 дней', custom:'Свой период' }[r];
        return '<button class="' + (state.ui.financeRange===r?'active':'') + '" data-action="finance-range" data-range="'+r+'">'+lbl+'</button>';
      }).join('') + '</div>'
    + (state.ui.financeRange === 'custom' ? (
        '<input type="date" class="chip-select" value="' + (state.ui.financeFrom||range.from) + '" data-action="finance-from">'
        + '<span class="hint">—</span>'
        + '<input type="date" class="chip-select" value="' + (state.ui.financeTo||range.to) + '" data-action="finance-to">'
      ) : '')
    + '</div>';

  var kpis = '<div class="kpi-grid" style="margin-bottom:20px;">'
    + kpiCard('Собрано за период', fmtMoney(totalCollected), 'наличные ' + fmtMoney(byMethod.cash) + ' · карта ' + fmtMoney(byMethod.card))
    + kpiCard('Расходы за период', fmtMoney(totalExpenses), expensesInRange.length + ' операций')
    + kpiCard('Чистая касса', fmtMoney(net), net>=0 ? 'положительная' : 'отрицательная', net>=0?'up':'down')
    + kpiCard('Общая задолженность', fmtMoney(outstanding), 'по всем пациентам')
    + '</div>';

  var chartsRow = '<div style="display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:16px;margin-bottom:20px;align-items:start;">'
    + '<div class="card card-pad"><h2 style="font-size:16px;margin-bottom:12px;">Динамика поступлений</h2>' + barChartSVG(days,{color:'#a8823f'}) + '</div>'
    + '<div class="card card-pad"><h2 style="font-size:16px;margin-bottom:12px;">По врачам</h2><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">' + donutSVG(doctorSegments,{size:118,strokeWidth:18}) + '<div style="flex:1;min-width:110px;">' + legendList(doctorSegments) + '</div></div></div>'
    + '<div class="card card-pad"><h2 style="font-size:16px;margin-bottom:12px;">По категориям услуг</h2><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">' + donutSVG(catSegments,{size:118,strokeWidth:18}) + '<div style="flex:1;min-width:110px;">' + legendList(catSegments) + '</div></div></div>'
    + '</div>';

  var expRows = state.data.expenses.slice().sort(function(a,b){ return b.date.localeCompare(a.date); }).slice(0,40).map(function(e){
    return '<tr><td class="mono">' + fmtDateShort(e.date) + '</td><td>' + esc(e.category) + '</td><td>' + esc(e.note||'') + '</td><td class="mono">' + fmtMoney(e.amount) + '</td>'
      + '<td style="text-align:right;"><button class="icon-btn" data-action="delete-expense" data-id="'+e.id+'" title="Удалить">✕</button></td></tr>';
  }).join('');
  var expensesBlock = '<div class="card">'
    + '<div class="card-pad" style="padding-bottom:0;"><div class="section-head"><h2 style="font-size:16px;">Расходы клиники</h2></div></div>'
    + (expRows ? '<div class="table-wrap"><table><thead><tr><th>Дата</th><th>Категория</th><th>Комментарий</th><th>Сумма</th><th></th></tr></thead><tbody>' + expRows + '</tbody></table></div>' : '<div class="empty-state">Расходов пока нет</div>')
    + '</div>';

  return rangeSelector + kpis + chartsRow + expensesBlock;
}

/* ==== RENDER: SETTINGS/PROFILE ==== */
function renderSettings(){
  var s = state.data.settings || {};
  var services = (s.services||[]).slice().sort(function(a,b){ return a.category.localeCompare(b.category,'ru') || a.name.localeCompare(b.name,'ru'); });

  var infoForm = '<div class="card card-pad" style="margin-bottom:20px;max-width:720px;">'
    + '<h2 style="font-size:16px;margin-bottom:14px;">Информация о клинике</h2>'
    + '<form data-form="clinic-settings">'
    +   '<div class="field-row"><div class="field"><label>Название</label><input name="name" value="' + esc(s.name||'') + '"></div>'
    +     '<div class="field"><label>Телефон</label><input name="phone" value="' + esc(s.phone||'') + '"></div></div>'
    +   '<div class="field-row"><div class="field"><label>Адрес</label><input name="address" value="' + esc(s.address||'') + '"></div>'
    +     '<div class="field"><label>Часы работы</label><input name="hours" value="' + esc(s.hours||'') + '"></div></div>'
    +   '<button class="btn gold sm" type="submit">Сохранить</button>'
    + '</form></div>';

  var svcRows = services.map(function(sv){
    return '<tr><td>' + esc(sv.name) + '</td><td>' + esc(sv.category) + '</td><td class="mono">' + fmtMoney(sv.price) + '</td>'
      + '<td style="text-align:right;white-space:nowrap;"><button class="icon-btn" data-action="open-service-modal" data-id="'+sv.id+'" title="Изменить">✎</button> '
      + '<button class="icon-btn" data-action="delete-service" data-id="'+sv.id+'" title="Удалить">✕</button></td></tr>';
  }).join('');
  var svcBlock = '<div class="card" style="margin-bottom:20px;">'
    + '<div class="card-pad" style="padding-bottom:0;"><div class="section-head"><h2 style="font-size:16px;">Прайс-лист услуг</h2><button class="btn gold sm" data-action="open-service-modal">+ Услуга</button></div></div>'
    + '<div class="table-wrap"><table><thead><tr><th>Услуга</th><th>Категория</th><th>Цена</th><th></th></tr></thead><tbody>' + svcRows + '</tbody></table></div>'
    + '</div>';

  var staffCards = state.data.staff.map(function(st){
    return '<div class="card doctor-card" style="margin-bottom:10px;"><span class="login-avatar" style="' + avatarStyle(st.name) + '">' + esc(initials(st.name)) + '</span>'
      + '<div style="flex:1;"><div style="font-weight:600;">' + esc(st.name) + '</div><div class="hint">' + (st.role==='admin'?'Администратор':'Ресепшн') + '</div></div>'
      + '<button class="btn sm" data-action="open-staff-modal" data-id="'+st.id+'">Изменить</button></div>';
  }).join('');
  var staffBlock = '<div><div class="section-head"><h2 style="font-size:16px;">Персонал и PIN-коды</h2><button class="btn gold sm" data-action="open-staff-modal">+ Сотрудник</button></div>' + staffCards + '</div>';

  return infoForm + svcBlock + staffBlock;
}

function renderProfile(){
  var idn = state.identity;
  var d = state.data.doctors.find(function(x){ return x.id===idn.doctorId; }) || {};
  return '<div class="card card-pad" style="max-width:520px;">'
    + '<div class="patient-header"><span class="login-avatar" style="background:' + (d.color||'#a8823f') + ';width:52px;height:52px;font-size:20px;">' + esc(initials(d.name||'')) + '</span>'
    +   '<div><h2>' + esc(d.name||'') + '</h2><div class="sub">' + esc(d.specialty||'') + '</div></div></div>'
    + '<div style="margin-top:16px;display:flex;flex-direction:column;gap:12px;">'
    +   '<div><div class="eyebrow">Телефон</div><div>' + esc(d.phone||'—') + '</div></div>'
    +   '<div><div class="eyebrow">О враче</div><div>' + esc(d.bio||'—') + '</div></div>'
    + '</div>'
    + '<form data-form="change-pin" style="margin-top:20px;border-top:1px solid var(--line);padding-top:16px;">'
    +   '<div class="field"><label>Новый PIN-код (4 цифры)</label><input name="pin" maxlength="4" pattern="[0-9]{4}" placeholder="Оставьте пустым, чтобы не менять"></div>'
    +   '<button class="btn gold sm" type="submit">Сохранить PIN</button>'
    + '</form>'
    + '</div>';
}

/* ==== MODALS ==== */
function renderModal(){
  var m = state.ui.modal;
  if (!m) return '';
  var title, body, wide = false;
  switch (m.type){
    case 'appointment': title = m.id ? 'Запись на приём' : 'Новая запись'; body = apptModalBody(m); break;
    case 'patient': title = m.id ? 'Карточка пациента' : 'Новый пациент'; body = patientModalBody(m); break;
    case 'doctor': title = m.id ? 'Врач' : 'Новый врач'; body = doctorModalBody(m); break;
    case 'invoice-new': title = 'Новый счёт'; body = invoiceNewModalBody(m); wide = true; break;
    case 'invoice-detail': title = 'Счёт'; body = invoiceDetailModalBody(m); wide = true; break;
    case 'treatment': title = 'Запись в историю лечения'; body = treatmentModalBody(m); break;
    case 'service': title = m.id ? 'Услуга' : 'Новая услуга'; body = serviceModalBody(m); break;
    case 'staff': title = m.id ? 'Сотрудник' : 'Новый сотрудник'; body = staffModalBody(m); break;
    case 'expense': title = 'Новый расход'; body = expenseModalBody(m); break;
    case 'confirm':
      title = 'Подтверждение';
      body = '<div class="modal-body">' + esc(m.message) + '</div>'
        + '<div class="modal-foot"><button type="button" class="btn ghost" data-action="modal-close">Отмена</button><button type="button" class="btn danger" data-action="confirm-yes">Удалить</button></div>';
      break;
    default: return '';
  }
  return '<div class="modal-veil" data-action="modal-veil"><div class="modal' + (wide?' wide':'') + '">'
    + '<div class="modal-head"><h3>' + esc(title) + '</h3><button class="modal-close" data-action="modal-close">✕</button></div>'
    + body
    + '</div></div>';
}

function apptModalBody(m){
  var idn = state.identity;
  var editing = !!m.id;
  var appt = editing ? state.data.appointments.find(function(a){ return a.id===m.id; }) : null;
  var date = appt ? appt.date : (m.date || state.ui.calDate || todayISO());
  var time = appt ? appt.startTime : (m.time || '09:00');
  var duration = appt ? (timeToMinutes(appt.endTime)-timeToMinutes(appt.startTime)) : 40;
  var doctorId = appt ? appt.doctorId : (idn.role==='doctor' ? idn.doctorId : (m.doctorId && m.doctorId!=='all' ? m.doctorId : (state.data.doctors[0]||{}).id));
  var patientId = appt ? appt.patientId : (m.patientId || '');
  var service = appt ? appt.service : '';
  var notes = appt ? appt.notes : '';
  var status = appt ? appt.status : 'scheduled';

  var patientOptions = state.data.patients.slice().sort(function(a,b){ return a.fullName.localeCompare(b.fullName,'ru'); }).map(function(p){
    return '<option value="'+p.id+'"' + (patientId===p.id?' selected':'') + '>' + esc(p.fullName) + '</option>';
  }).join('');

  var doctorField = idn.role === 'doctor'
    ? '<input type="hidden" name="doctorId" value="' + idn.doctorId + '">'
    : ('<div class="field"><label>Врач</label><select name="doctorId">' + state.data.doctors.filter(function(d){ return d.active!==false; }).map(function(d){ return '<option value="'+d.id+'"' + (doctorId===d.id?' selected':'') + '>' + esc(d.name) + '</option>'; }).join('') + '</select></div>');

  var svcOptions = ((state.data.settings && state.data.settings.services) || []).map(function(s){ return '<option value="' + esc(s.name) + '">'; }).join('');
  var durOptions = [20,30,40,60,90,120].map(function(d){ return '<option value="'+d+'"' + (duration===d?' selected':'') + '>' + d + ' мин</option>'; }).join('');
  var statusField = editing ? ('<div class="field"><label>Статус</label><select name="status">' + Object.keys(APPT_STATUS).map(function(k){ return '<option value="'+k+'"' + (status===k?' selected':'') + '>' + APPT_STATUS[k].label + '</option>'; }).join('') + '</select></div>') : '';
  var deleteBtn = editing ? '<button type="button" class="btn danger sm" data-action="delete-appt" data-id="'+m.id+'" style="margin-right:auto;">Удалить</button>' : '';

  return '<form data-form="appointment" data-id="' + (m.id||'') + '">'
    + '<div class="modal-body">'
    +   '<div class="field"><label>Пациент</label><select name="patientId" required><option value="">— выбрать —</option>' + patientOptions + '</select></div>'
    +   '<div class="field-row">' + doctorField + '<div class="field"><label>Услуга</label><input name="service" list="svc-datalist" value="' + esc(service) + '" placeholder="Например: Консультация"><datalist id="svc-datalist">' + svcOptions + '</datalist></div></div>'
    +   '<div class="field-row">'
    +     '<div class="field"><label>Дата</label><input type="date" name="date" value="'+date+'" required></div>'
    +     '<div class="field"><label>Время</label><input type="time" name="time" value="'+time+'" step="600" required></div>'
    +     '<div class="field"><label>Длительность</label><select name="duration">' + durOptions + '</select></div>'
    +   '</div>'
    +   statusField
    +   '<div class="field"><label>Заметки</label><textarea name="notes" rows="2">' + esc(notes) + '</textarea></div>'
    + '</div>'
    + '<div class="modal-foot">' + deleteBtn + '<button type="button" class="btn ghost" data-action="modal-close">Отмена</button><button type="submit" class="btn gold">Сохранить</button></div>'
    + '</form>';
}

function patientModalBody(m){
  var editing = !!m.id;
  var p = editing ? state.data.patients.find(function(x){ return x.id===m.id; }) : {};
  p = p || {};
  var docOptions = state.data.doctors.filter(function(d){ return d.active!==false; }).map(function(d){ return '<option value="'+d.id+'"' + (p.primaryDoctorId===d.id?' selected':'') + '>' + esc(d.name) + '</option>'; }).join('');
  var deleteBtn = editing ? '<button type="button" class="btn danger sm" data-action="delete-patient" data-id="'+m.id+'" style="margin-right:auto;">Удалить</button>' : '';
  return '<form data-form="patient" data-id="' + (m.id||'') + '">'
    + '<div class="modal-body">'
    +   '<div class="field-row"><div class="field"><label>ФИО</label><input name="fullName" value="' + esc(p.fullName||'') + '" required></div>'
    +     '<div class="field"><label>Телефон</label><input name="phone" value="' + esc(p.phone||'') + '"></div></div>'
    +   '<div class="field-row"><div class="field"><label>Дата рождения</label><input type="date" name="birthDate" value="' + (p.birthDate||'') + '"></div>'
    +     '<div class="field"><label>Пол</label><select name="gender"><option value="f"' + (p.gender==='f'?' selected':'') + '>Женский</option><option value="m"' + (p.gender==='m'?' selected':'') + '>Мужской</option></select></div></div>'
    +   '<div class="field"><label>Адрес</label><input name="address" value="' + esc(p.address||'') + '"></div>'
    +   '<div class="field-row"><div class="field"><label>Аллергии</label><input name="allergies" value="' + esc(p.allergies||'') + '"></div>'
    +     '<div class="field"><label>Лечащий врач</label><select name="primaryDoctorId"><option value="">—</option>' + docOptions + '</select></div></div>'
    +   '<div class="field"><label>Заметки</label><textarea name="notes" rows="2">' + esc(p.notes||'') + '</textarea></div>'
    + '</div>'
    + '<div class="modal-foot">' + deleteBtn + '<button type="button" class="btn ghost" data-action="modal-close">Отмена</button><button type="submit" class="btn gold">Сохранить</button></div>'
    + '</form>';
}

function doctorModalBody(m){
  var editing = !!m.id;
  var d = editing ? state.data.doctors.find(function(x){ return x.id===m.id; }) : {};
  d = d || {};
  var curColor = d.color || DOCTOR_COLORS[0];
  var colorSwatches = DOCTOR_COLORS.map(function(c){
    return '<button type="button" class="color-swatch" data-action="pick-doctor-color" data-color="'+c+'" style="width:26px;height:26px;border-radius:50%;background:'+c+';border:2px solid '+(curColor===c?'var(--ink)':'transparent')+';cursor:pointer;"></button>';
  }).join(' ');
  var deleteBtn = editing ? '<button type="button" class="btn danger sm" data-action="delete-doctor" data-id="'+m.id+'" style="margin-right:auto;">Удалить</button>' : '';
  return '<form data-form="doctor" data-id="' + (m.id||'') + '">'
    + '<div class="modal-body">'
    +   '<div class="field-row"><div class="field"><label>ФИО</label><input name="name" value="' + esc(d.name||'') + '" required></div>'
    +     '<div class="field"><label>Специализация</label><input name="specialty" value="' + esc(d.specialty||'') + '" required></div></div>'
    +   '<div class="field-row"><div class="field"><label>Телефон</label><input name="phone" value="' + esc(d.phone||'') + '"></div>'
    +     '<div class="field"><label>PIN для входа</label><input name="pin" maxlength="4" pattern="[0-9]{4}" placeholder="' + (editing ? 'Оставьте пустым, чтобы не менять' : '0000') + '"></div></div>'
    +   '<div class="field"><label>О враче</label><textarea name="bio" rows="2">' + esc(d.bio||'') + '</textarea></div>'
    +   '<input type="hidden" name="color" id="doctor-color-input" value="' + curColor + '">'
    +   '<div class="field"><label>Цвет в календаре</label><div style="display:flex;gap:8px;" id="doctor-color-swatches">' + colorSwatches + '</div></div>'
    + '</div>'
    + '<div class="modal-foot">' + deleteBtn + '<button type="button" class="btn ghost" data-action="modal-close">Отмена</button><button type="submit" class="btn gold">Сохранить</button></div>'
    + '</form>';
}

function invRowTemplate(it, idx, services){
  var svcOpts = '<option value="">Своя позиция…</option>' + services.map(function(s){
    return '<option value="' + esc(s.name) + '" data-price="' + s.price + '"' + (it.name===s.name?' selected':'') + '>' + esc(s.name) + ' — ' + fmtMoney(s.price) + '</option>';
  }).join('');
  return '<div class="inv-item-row" data-idx="' + idx + '" style="display:grid;grid-template-columns:1.7fr 64px 60px 92px 28px;gap:6px;align-items:center;margin-bottom:8px;">'
    + '<div><select class="inv-item-service" style="margin-bottom:4px;">' + svcOpts + '</select>'
    +   '<input type="text" class="inv-item-name" placeholder="Название позиции" value="' + esc(it.name||'') + '"></div>'
    + '<input type="text" class="inv-item-tooth" placeholder="Зуб" value="' + esc(it.tooth||'') + '">'
    + '<input type="number" class="inv-item-qty" min="1" value="' + (it.qty||1) + '">'
    + '<input type="number" class="inv-item-price" min="0" value="' + (it.price||0) + '">'
    + '<button type="button" class="icon-btn" data-action="remove-inv-item" data-idx="' + idx + '" title="Удалить">✕</button>'
    + '</div>';
}

function invoiceNewModalBody(m){
  var idn = state.identity;
  if (!m.items || !m.items.length) m.items = [{ name:'', tooth:'', qty:1, price:0 }];
  var patientOptions = state.data.patients.slice().sort(function(a,b){ return a.fullName.localeCompare(b.fullName,'ru'); }).map(function(p){
    return '<option value="' + p.id + '"' + (m.patientId===p.id?' selected':'') + '>' + esc(p.fullName) + '</option>';
  }).join('');
  var doctorField = idn.role === 'doctor'
    ? '<input type="hidden" id="inv-doctor" value="' + idn.doctorId + '">'
    : ('<div class="field"><label>Врач</label><select id="inv-doctor">' + state.data.doctors.map(function(d){ return '<option value="'+d.id+'"' + (m.doctorId===d.id?' selected':'') + '>' + esc(d.name) + '</option>'; }).join('') + '</select></div>');
  var services = (state.data.settings && state.data.settings.services) || [];
  var rows = m.items.map(function(it, idx){ return invRowTemplate(it, idx, services); }).join('');

  return '<div class="modal-body">'
    + '<div class="field-row"><div class="field"><label>Пациент</label><select id="inv-patient"><option value="">— выбрать —</option>' + patientOptions + '</select></div>' + doctorField + '</div>'
    + '<div class="field"><label>Позиции счёта</label>'
    +   '<div style="display:grid;grid-template-columns:1.7fr 64px 60px 92px 28px;gap:6px;font-size:10px;color:var(--muted);margin-bottom:4px;"><div>Услуга</div><div>Зуб</div><div>Кол-во</div><div>Цена</div><div></div></div>'
    +   '<div id="inv-items-wrap">' + rows + '</div>'
    +   '<button type="button" class="btn ghost sm" data-action="add-inv-item">+ Добавить позицию</button>'
    + '</div>'
    + '<div class="field-row" style="margin-top:10px;"><div class="field"><label>Скидка, %</label><input type="number" id="inv-discount" min="0" max="100" value="' + (m.discountPct||0) + '"></div>'
    +   '<div class="field"><label>Итого к оплате</label><div class="mono" id="inv-total-display" style="font-size:19px;font-weight:700;padding-top:8px;">' + fmtMoney(0) + '</div></div></div>'
    + '</div>'
    + '<div class="modal-foot"><button type="button" class="btn ghost" data-action="modal-close">Отмена</button><button type="button" class="btn gold" data-action="save-invoice">Создать счёт</button></div>';
}

function invoiceDetailModalBody(m){
  var inv = state.data.invoices.find(function(x){ return x.id===m.id; });
  if (!inv) return '<div class="modal-body">Счёт не найден</div>';
  var total = invoiceTotal(inv), paid = invoicePaid(inv), due = Math.max(0, total-paid);
  var st = invoiceStatus(inv);
  var itemsRows = (inv.items||[]).map(function(it){
    return '<tr><td>' + esc(it.name) + (it.tooth ? ' · зуб ' + esc(it.tooth) : '') + '</td><td class="mono">' + (it.qty||1) + '</td><td class="mono">' + fmtMoney(it.price) + '</td><td class="mono">' + fmtMoney((Number(it.price)||0)*(Number(it.qty)||1)) + '</td></tr>';
  }).join('');
  var paymentsRows = (inv.payments||[]).map(function(p){
    return '<tr><td class="mono">' + fmtDateShort(p.date) + '</td><td>' + (PAYMENT_METHODS[p.method]||p.method) + '</td><td class="mono">' + fmtMoney(p.amount) + '</td></tr>';
  }).join('') || '<tr><td class="hint">Оплат ещё не было</td></tr>';

  var payForm = due > 0 ? (
    '<form data-form="add-payment" data-id="' + inv.id + '" style="display:flex;gap:8px;align-items:end;margin-top:10px;">'
    + '<div class="field" style="margin-bottom:0;flex:1;"><label>Сумма оплаты</label><input type="number" name="amount" min="1" max="' + Math.ceil(due) + '" value="' + Math.ceil(due) + '" required></div>'
    + '<div class="field" style="margin-bottom:0;flex:1;"><label>Способ</label><select name="method">' + Object.keys(PAYMENT_METHODS).map(function(k){ return '<option value="'+k+'">'+PAYMENT_METHODS[k]+'</option>'; }).join('') + '</select></div>'
    + '<button type="submit" class="btn gold sm">Принять оплату</button>'
    + '</form>'
  ) : '<div class="hint" style="margin-top:10px;color:var(--success);">Счёт полностью оплачен ✓</div>';

  return '<div class="modal-body">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
    +   '<div><div style="font-weight:600;">' + esc(patientName(inv.patientId)) + '</div><div class="hint">' + esc(doctorName(inv.doctorId)) + ' · ' + fmtDateShort(inv.date) + '</div></div>'
    +   invStatusBadge(st)
    + '</div>'
    + '<div class="table-wrap"><table><thead><tr><th>Позиция</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead><tbody>' + itemsRows + '</tbody></table></div>'
    + (inv.discountPct ? '<div class="hint" style="text-align:right;margin-top:6px;">Скидка ' + inv.discountPct + '%</div>' : '')
    + '<div style="display:flex;justify-content:flex-end;gap:24px;margin-top:12px;padding-top:12px;border-top:1px solid var(--line);">'
    +   '<div><div class="eyebrow">Итого</div><div class="mono" style="font-size:16px;font-weight:700;">' + fmtMoney(total) + '</div></div>'
    +   '<div><div class="eyebrow">Оплачено</div><div class="mono" style="font-size:16px;font-weight:700;color:var(--success);">' + fmtMoney(paid) + '</div></div>'
    +   '<div><div class="eyebrow">Остаток</div><div class="mono" style="font-size:16px;font-weight:700;color:' + (due>0?'var(--danger)':'var(--muted)') + ';">' + fmtMoney(due) + '</div></div>'
    + '</div>'
    + '<div style="margin-top:16px;"><div class="eyebrow" style="margin-bottom:6px;">История платежей</div><div class="table-wrap"><table><tbody>' + paymentsRows + '</tbody></table></div></div>'
    + payForm
    + '</div>'
    + '<div class="modal-foot"><button type="button" class="btn danger sm" data-action="delete-invoice" data-id="' + inv.id + '" style="margin-right:auto;">Удалить счёт</button><button type="button" class="btn ghost" data-action="modal-close">Закрыть</button></div>';
}

function treatmentModalBody(m){
  var services = (state.data.settings && state.data.settings.services) || [];
  var svcOptions = services.map(function(s){ return '<option value="' + esc(s.name) + '" data-price="' + s.price + '">'; }).join('');
  return '<form data-form="treatment" data-patient="' + m.patientId + '">'
    + '<div class="modal-body">'
    +   '<div class="field-row"><div class="field"><label>Дата</label><input type="date" name="date" value="' + todayISO() + '" required></div>'
    +     '<div class="field"><label>Зуб (необязательно)</label><input name="tooth" placeholder="напр. 36"></div></div>'
    +   '<div class="field"><label>Процедура</label><input name="procedure" list="tr-svc-list" required id="tr-procedure-input"><datalist id="tr-svc-list">' + svcOptions + '</datalist></div>'
    +   '<div class="field"><label>Стоимость, сом</label><input type="number" name="price" min="0" id="tr-price-input" value="0"></div>'
    + '</div>'
    + '<div class="modal-foot"><button type="button" class="btn ghost" data-action="modal-close">Отмена</button><button type="submit" class="btn gold">Сохранить</button></div>'
    + '</form>';
}

function serviceModalBody(m){
  var services = (state.data.settings && state.data.settings.services) || [];
  var sv = m.id ? (services.find(function(s){ return s.id===m.id; }) || {}) : {};
  var cats = ['Консультация','Гигиена','Терапия','Хирургия','Ортопедия','Имплантация','Ортодонтия','Эстетика','Другое'];
  return '<form data-form="service" data-id="' + (m.id||'') + '">'
    + '<div class="modal-body">'
    +   '<div class="field"><label>Название услуги</label><input name="name" value="' + esc(sv.name||'') + '" required></div>'
    +   '<div class="field-row"><div class="field"><label>Категория</label><select name="category">' + cats.map(function(c){ return '<option value="'+c+'"' + (sv.category===c?' selected':'') + '>'+c+'</option>'; }).join('') + '</select></div>'
    +     '<div class="field"><label>Цена, сом</label><input type="number" name="price" min="0" value="' + (sv.price||0) + '" required></div></div>'
    + '</div>'
    + '<div class="modal-foot">' + (m.id ? '<button type="button" class="btn danger sm" data-action="delete-service" data-id="'+m.id+'" style="margin-right:auto;">Удалить</button>' : '') + '<button type="button" class="btn ghost" data-action="modal-close">Отмена</button><button type="submit" class="btn gold">Сохранить</button></div>'
    + '</form>';
}

function staffModalBody(m){
  var s = m.id ? (state.data.staff.find(function(x){ return x.id===m.id; }) || {}) : {};
  return '<form data-form="staff" data-id="' + (m.id||'') + '">'
    + '<div class="modal-body">'
    +   '<div class="field"><label>ФИО</label><input name="name" value="' + esc(s.name||'') + '" required></div>'
    +   '<div class="field-row"><div class="field"><label>Роль</label><select name="role"><option value="admin"' + (s.role==='admin'?' selected':'') + '>Администратор</option><option value="reception"' + (s.role==='reception'?' selected':'') + '>Ресепшн</option></select></div>'
    +     '<div class="field"><label>PIN-код</label><input name="pin" maxlength="4" pattern="[0-9]{4}" placeholder="' + (m.id ? 'Оставьте пустым, чтобы не менять' : '0000') + '"></div></div>'
    + '</div>'
    + '<div class="modal-foot">' + (m.id ? '<button type="button" class="btn danger sm" data-action="delete-staff" data-id="'+m.id+'" style="margin-right:auto;">Удалить</button>' : '') + '<button type="button" class="btn ghost" data-action="modal-close">Отмена</button><button type="submit" class="btn gold">Сохранить</button></div>'
    + '</form>';
}

function expenseModalBody(m){
  return '<form data-form="expense">'
    + '<div class="modal-body">'
    +   '<div class="field-row"><div class="field"><label>Дата</label><input type="date" name="date" value="' + todayISO() + '" required></div>'
    +     '<div class="field"><label>Сумма, сом</label><input type="number" name="amount" min="1" required></div></div>'
    +   '<div class="field"><label>Категория</label><select name="category">' + EXPENSE_CATEGORIES.map(function(c){ return '<option value="'+c+'">'+c+'</option>'; }).join('') + '</select></div>'
    +   '<div class="field"><label>Комментарий</label><input name="note"></div>'
    + '</div>'
    + '<div class="modal-foot"><button type="button" class="btn ghost" data-action="modal-close">Отмена</button><button type="submit" class="btn gold">Добавить</button></div>'
    + '</form>';
}

function syncInvoiceDraftFromDOM(m){
  var rows = document.querySelectorAll('.inv-item-row');
  var items = [];
  rows.forEach(function(r){
    items.push({
      name: r.querySelector('.inv-item-name').value,
      tooth: r.querySelector('.inv-item-tooth').value,
      qty: Number(r.querySelector('.inv-item-qty').value) || 1,
      price: Number(r.querySelector('.inv-item-price').value) || 0
    });
  });
  m.items = items;
  var patSel = document.getElementById('inv-patient'); if (patSel) m.patientId = patSel.value;
  var docSel = document.getElementById('inv-doctor'); if (docSel) m.doctorId = docSel.value;
  var discInput = document.getElementById('inv-discount'); if (discInput) m.discountPct = Number(discInput.value) || 0;
}
function recalcInvoiceTotalDisplay(){
  var disp = document.getElementById('inv-total-display');
  if (!disp) return;
  var sub = 0;
  document.querySelectorAll('.inv-item-row').forEach(function(r){
    var qty = Number(r.querySelector('.inv-item-qty').value) || 0;
    var price = Number(r.querySelector('.inv-item-price').value) || 0;
    sub += qty * price;
  });
  var discEl = document.getElementById('inv-discount');
  var disc = discEl ? (Number(discEl.value)||0) : 0;
  var total = Math.max(0, sub - sub*(disc/100));
  disp.textContent = fmtMoney(total);
}

function afterModalMount(){
  var veil = document.querySelector('.modal-veil');
  if (!veil) return;
  var firstInput = veil.querySelector('input:not([type=hidden]), select, textarea');
  if (firstInput) { try { firstInput.focus({preventScroll:true}); } catch(e){} }
  recalcInvoiceTotalDisplay();
  veil.addEventListener('input', function(e){
    if (e.target.classList.contains('inv-item-qty') || e.target.classList.contains('inv-item-price') || e.target.id==='inv-discount') {
      recalcInvoiceTotalDisplay();
    }
  });
  veil.addEventListener('change', function(e){
    if (e.target.classList.contains('inv-item-service')) {
      var row = e.target.closest('.inv-item-row');
      var opt = e.target.options[e.target.selectedIndex];
      var nameInput = row.querySelector('.inv-item-name');
      var priceInput = row.querySelector('.inv-item-price');
      if (opt.value) { nameInput.value = opt.value; priceInput.value = opt.getAttribute('data-price') || 0; }
      else { nameInput.value = ''; }
      recalcInvoiceTotalDisplay();
    }
    if (e.target.id === 'tr-procedure-input') {
      var list = document.getElementById('tr-svc-list');
      var match = list ? Array.prototype.find.call(list.options, function(o){ return o.value === e.target.value; }) : null;
      var priceEl = document.getElementById('tr-price-input');
      if (match && priceEl) priceEl.value = match.getAttribute('data-price') || 0;
    }
  });
}


/* ==== EVENTS ==== */
var pendingConfirmAction = null;
function askConfirm(message, onYes){
  pendingConfirmAction = onYes;
  state.ui.modal = { type:'confirm', message: message };
  render();
}
function closeModal(){
  state.ui.modal = null;
  pendingConfirmAction = null;
  var wasDirty = state._dirty;
  state._dirty = false;
  render();
}

function attemptPinLogin(){
  var sel = state.ui.loginSelected;
  if (!sel) return;
  var buf = state.ui.pinBuf;
  if (buf.length < 4) return;
  apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ kind: sel.kind, id: sel.id, pin: buf }) })
    .then(function(res){
      state.token = res.token;
      state.identity = res.identity;
      try { localStorage.setItem('dominant_token', res.token); } catch (e) {}
      state.ui.loginSelected = null; state.ui.pinBuf = ''; state.ui.pinError = '';
      return loadBootstrapAndStart();
    })
    .catch(function(e){
      state.ui.pinError = (e && e.message) || 'Неверный PIN-код';
      state.ui.pinBuf = '';
      render();
    });
}

var toothPopoverActive = null;
function openToothPopover(patientId, tooth, anchorRect){
  closeAllPopovers();
  var patient = state.data.patients.find(function(p){ return p.id===patientId; });
  if (!patient) return;
  var pop = document.createElement('div');
  pop.className = 'tooth-pop';
  pop.innerHTML = toothPopoverHTML(patient, tooth);
  document.body.appendChild(pop);
  var top = anchorRect.bottom + 8, left = anchorRect.left;
  var maxLeft = window.innerWidth - 256;
  if (left > maxLeft) left = Math.max(8, maxLeft);
  if (top + 270 > window.innerHeight) top = Math.max(8, anchorRect.top - 270);
  pop.style.top = top + 'px';
  pop.style.left = left + 'px';
  var selected = ((patient.teeth||{})[String(tooth)]||{}).status || 'healthy';
  pop.querySelectorAll('.status-opt').forEach(function(o){
    o.addEventListener('click', function(){
      pop.querySelectorAll('.status-opt').forEach(function(x){ x.classList.remove('sel'); });
      o.classList.add('sel');
      selected = o.getAttribute('data-tooth-status');
    });
  });
  var closeBtn = pop.querySelector('[data-action="tooth-pop-close"]');
  if (closeBtn) closeBtn.addEventListener('click', function(){ pop.remove(); });
  var saveBtn = pop.querySelector('[data-action="tooth-pop-save"]');
  if (saveBtn) saveBtn.addEventListener('click', function(){
    var noteEl = pop.querySelector('#tooth-note-input');
    var patch = {}; patch[String(tooth)] = { status: selected, note: noteEl ? noteEl.value : '' };
    DataAPI.update('patients', patientId, { teeth: patch }).then(function(){ pop.remove(); render(); toast('Зуб обновлён'); });
  });
  setTimeout(function(){
    document.addEventListener('click', function outsideClick(ev){
      if (!pop.contains(ev.target) && !ev.target.closest('[data-action="tooth-click"]')) {
        pop.remove();
        document.removeEventListener('click', outsideClick);
      }
    });
  }, 0);
}

document.body.addEventListener('click', function(e){
  var insideModal = e.target.closest('.modal');
  if (!insideModal && e.target.closest('[data-action="modal-veil"]')) { closeModal(); return; }

  var el = e.target.closest('[data-action]');
  if (!el) return;
  var action = el.dataset.action;

  switch (action){
    case 'nav':
      state.route = { view: el.dataset.view };
      if (el.dataset.view === 'patients') state.ui.selectedPatientId = null;
      render();
      break;
    case 'logout':
      clearSession();
      disconnectSocket();
      state.data = { settings: null, doctors: [], staff: [], patients: [], appointments: [], invoices: [], expenses: [], treatments: [] };
      state.route = { view: 'login' };
      state.ui.loginSelected = null; state.ui.pinBuf=''; state.ui.pinError='';
      render();
      loadLoginOptions();
      break;
    case 'login-tab':
      state.ui.loginTab = el.dataset.tab; render(); break;
    case 'login-pick': {
      var kind = el.dataset.kind, pid2 = el.dataset.id;
      var rec = kind === 'staff' ? state.data.staff.find(function(s){ return s.id===pid2; }) : state.data.doctors.find(function(d){ return d.id===pid2; });
      if (!rec) break;
      state.ui.loginSelected = Object.assign({ kind: kind }, rec);
      state.ui.pinBuf=''; state.ui.pinError='';
      render();
      break;
    }
    case 'login-back':
      state.ui.loginSelected = null; state.ui.pinError=''; render(); break;
    case 'pin-back':
      state.ui.pinBuf = state.ui.pinBuf.slice(0,-1); render(); break;
    case 'pin-key':
      if (state.ui.pinBuf.length < 4) state.ui.pinBuf += el.dataset.k;
      render();
      if (state.ui.pinBuf.length === 4) setTimeout(attemptPinLogin, 180);
      break;

    case 'open-patient':
      state.ui.selectedPatientId = el.dataset.id; state.ui.patientTab='overview'; render(); break;
    case 'patient-back':
      state.ui.selectedPatientId = null; render(); break;
    case 'patient-tab':
      state.ui.patientTab = el.dataset.tab; render(); break;
    case 'open-patient-modal':
      state.ui.modal = { type:'patient', id: el.dataset.id || null }; render(); break;
    case 'open-doctor-modal':
      state.ui.modal = { type:'doctor', id: el.dataset.id || null }; render(); break;
    case 'open-service-modal':
      state.ui.modal = { type:'service', id: el.dataset.id || null }; render(); break;
    case 'open-staff-modal':
      state.ui.modal = { type:'staff', id: el.dataset.id || null }; render(); break;
    case 'open-expense-modal':
      state.ui.modal = { type:'expense' }; render(); break;
    case 'open-treatment-modal':
      state.ui.modal = { type:'treatment', patientId: el.dataset.patient }; render(); break;
    case 'open-appt':
      state.ui.modal = { type:'appointment', id: el.dataset.id }; render(); break;
    case 'open-appt-modal':
      state.ui.modal = { type:'appointment', date: state.ui.calDate }; render(); break;
    case 'cal-slot-click':
      state.ui.modal = { type:'appointment', date: el.dataset.date, time: el.dataset.time, doctorId: el.dataset.doctor }; render(); break;
    case 'open-invoice':
      state.ui.modal = { type:'invoice-detail', id: el.dataset.id }; render(); break;
    case 'open-invoice-modal':
      state.ui.modal = { type:'invoice-new', patientId: el.dataset.patient || '', doctorId: state.identity.role==='doctor' ? state.identity.doctorId : '', items:[{name:'',tooth:'',qty:1,price:0}], discountPct:0 };
      render(); break;

    case 'modal-close': closeModal(); break;
    case 'confirm-yes': {
      var fn = pendingConfirmAction; pendingConfirmAction = null;
      if (typeof fn === 'function') fn();
      break;
    }

    case 'cal-prev':
      state.ui.calDate = state.ui.calMode==='week' ? addDays(state.ui.calDate,-7) : addDays(state.ui.calDate,-1);
      render(); break;
    case 'cal-next':
      state.ui.calDate = state.ui.calMode==='week' ? addDays(state.ui.calDate,7) : addDays(state.ui.calDate,1);
      render(); break;
    case 'cal-today':
      state.ui.calDate = todayISO(); render(); break;
    case 'cal-mode':
      state.ui.calMode = el.dataset.mode; render(); break;
    case 'finance-range':
      state.ui.financeRange = el.dataset.range; render(); break;

    case 'toggle-doctor-active': {
      var doc2 = state.data.doctors.find(function(d){ return d.id===el.dataset.id; });
      if (doc2) DataAPI.update('doctors', doc2.id, { active: doc2.active===false }).then(function(){ render(); });
      break;
    }
    case 'pick-doctor-color': {
      var colInput = document.getElementById('doctor-color-input');
      if (colInput) colInput.value = el.dataset.color;
      var wrap = document.getElementById('doctor-color-swatches');
      if (wrap) wrap.querySelectorAll('.color-swatch').forEach(function(sw){ sw.style.borderColor = 'transparent'; });
      el.style.borderColor = 'var(--ink)';
      break;
    }

    case 'tooth-click':
      openToothPopover(el.dataset.patient, el.dataset.tooth, el.getBoundingClientRect());
      break;

    case 'add-inv-item':
      syncInvoiceDraftFromDOM(state.ui.modal);
      state.ui.modal.items.push({ name:'', tooth:'', qty:1, price:0 });
      render(); break;
    case 'remove-inv-item':
      syncInvoiceDraftFromDOM(state.ui.modal);
      state.ui.modal.items.splice(Number(el.dataset.idx), 1);
      if (!state.ui.modal.items.length) state.ui.modal.items.push({ name:'', tooth:'', qty:1, price:0 });
      render(); break;
    case 'save-invoice': {
      syncInvoiceDraftFromDOM(state.ui.modal);
      var mi = state.ui.modal;
      var validItems = mi.items.filter(function(it){ return it.name && it.name.trim(); });
      if (!mi.patientId) { toast('Выберите пациента', true); break; }
      if (!mi.doctorId) { toast('Выберите врача', true); break; }
      if (!validItems.length) { toast('Добавьте хотя бы одну позицию', true); break; }
      DataAPI.add('invoices', { patientId: mi.patientId, doctorId: mi.doctorId, date: todayISO(), items: validItems, discountPct: mi.discountPct||0 }).then(function(){
        state.ui.modal = null; render(); toast('Счёт создан');
      });
      break;
    }

    case 'delete-appt': {
      var idA = el.dataset.id;
      askConfirm('Удалить эту запись на приём?', function(){ DataAPI.remove('appointments', idA).then(function(){ state.ui.modal=null; render(); toast('Запись удалена'); }); });
      break;
    }
    case 'delete-patient': {
      var idP = el.dataset.id;
      askConfirm('Удалить пациента и все его данные?', function(){ DataAPI.remove('patients', idP).then(function(){ state.ui.modal=null; state.ui.selectedPatientId=null; render(); toast('Пациент удалён'); }); });
      break;
    }
    case 'delete-doctor': {
      var idD = el.dataset.id;
      askConfirm('Удалить врача из клиники?', function(){ DataAPI.remove('doctors', idD).then(function(){ state.ui.modal=null; render(); toast('Врач удалён'); }); });
      break;
    }
    case 'delete-invoice': {
      var idI = el.dataset.id;
      askConfirm('Удалить счёт?', function(){ DataAPI.remove('invoices', idI).then(function(){ state.ui.modal=null; render(); toast('Счёт удалён'); }); });
      break;
    }
    case 'delete-service': {
      var idS = el.dataset.id;
      askConfirm('Удалить услугу из прайс-листа?', function(){
        var services = ((state.data.settings&&state.data.settings.services)||[]).filter(function(s){ return s.id!==idS; });
        DataAPI.updateSettings({ services: services }).then(function(){ state.ui.modal=null; render(); toast('Услуга удалена'); });
      });
      break;
    }
    case 'delete-staff': {
      var idSt = el.dataset.id;
      askConfirm('Удалить сотрудника?', function(){ DataAPI.remove('staff', idSt).then(function(){ state.ui.modal=null; render(); toast('Сотрудник удалён'); }); });
      break;
    }
    case 'delete-expense': {
      var idE = el.dataset.id;
      askConfirm('Удалить расход?', function(){ DataAPI.remove('expenses', idE).then(function(){ render(); toast('Расход удалён'); }); });
      break;
    }
  }
});

document.body.addEventListener('change', function(e){
  var el = e.target;
  if (!el.dataset || !el.dataset.action) return;
  switch (el.dataset.action){
    case 'cal-doctor-filter': state.ui.calDoctorFilter = el.value; render(); break;
    case 'inv-filter-doctor': state.ui.invFilterDoctor = el.value; render(); break;
    case 'inv-filter-status': state.ui.invFilterStatus = el.value; render(); break;
    case 'finance-from': state.ui.financeFrom = el.value; render(); break;
    case 'finance-to': state.ui.financeTo = el.value; render(); break;
  }
});

document.body.addEventListener('input', function(e){
  var el = e.target;
  if (el.dataset && el.dataset.actionInput === 'patient-search') {
    state.ui.patientSearch = el.value;
    render();
    var again = document.querySelector('[data-action-input="patient-search"]');
    if (again) { again.focus(); var v = again.value; again.setSelectionRange(v.length, v.length); }
  }
});

document.body.addEventListener('submit', function(e){
  var form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  var type = form.dataset.form;
  var fd = new FormData(form);
  var idn = state.identity;

  if (type === 'appointment') {
    var id = form.dataset.id;
    var time = fd.get('time'); var duration = Number(fd.get('duration')) || 30;
    var data = {
      patientId: fd.get('patientId'), doctorId: fd.get('doctorId'), service: fd.get('service') || 'Приём',
      date: fd.get('date'), startTime: time, endTime: minutesToTime(timeToMinutes(time)+duration), notes: fd.get('notes') || ''
    };
    if (id) {
      data.status = fd.get('status') || 'scheduled';
      DataAPI.update('appointments', id, data).then(function(){ state.ui.modal=null; render(); toast('Запись сохранена'); });
    } else {
      data.status = 'scheduled';
      DataAPI.add('appointments', data).then(function(){ state.ui.modal=null; render(); toast('Запись создана'); });
    }
  } else if (type === 'patient') {
    var pid = form.dataset.id;
    var pdata = {
      fullName: fd.get('fullName'), phone: fd.get('phone'), birthDate: fd.get('birthDate'), gender: fd.get('gender'),
      address: fd.get('address'), allergies: fd.get('allergies'), primaryDoctorId: fd.get('primaryDoctorId') || '', notes: fd.get('notes') || ''
    };
    if (pid) {
      DataAPI.update('patients', pid, pdata).then(function(){ state.ui.modal=null; render(); toast('Пациент обновлён'); });
    } else {
      DataAPI.add('patients', pdata).then(function(newId){ state.ui.modal=null; state.ui.selectedPatientId=newId; state.ui.patientTab='overview'; render(); toast('Пациент добавлен'); });
    }
  } else if (type === 'doctor') {
    var did = form.dataset.id;
    var pinRaw = (fd.get('pin') || '').trim();
    var ddata = { name: fd.get('name'), specialty: fd.get('specialty'), phone: fd.get('phone'), bio: fd.get('bio') || '', color: fd.get('color') };
    if (pinRaw) ddata.pin = pinRaw;
    if (did) {
      DataAPI.update('doctors', did, ddata).then(function(){ state.ui.modal=null; render(); toast('Врач обновлён'); });
    } else {
      ddata.active = true;
      if (!ddata.pin) ddata.pin = '0000';
      DataAPI.add('doctors', ddata).then(function(){ state.ui.modal=null; render(); toast('Врач добавлен'); });
    }
  } else if (type === 'service') {
    var sid = form.dataset.id;
    var sdata = { name: fd.get('name'), category: fd.get('category'), price: Number(fd.get('price')) || 0 };
    var services = ((state.data.settings && state.data.settings.services) || []).slice();
    if (sid) services = services.map(function(s){ return s.id===sid ? Object.assign({}, s, sdata) : s; });
    else { sdata.id = uid('svc'); services.push(sdata); }
    DataAPI.updateSettings({ services: services }).then(function(){ state.ui.modal=null; render(); toast('Услуга сохранена'); });
  } else if (type === 'staff') {
    var stid = form.dataset.id;
    var stPinRaw = (fd.get('pin') || '').trim();
    var stdata = { name: fd.get('name'), role: fd.get('role') };
    if (stPinRaw) stdata.pin = stPinRaw;
    if (stid) {
      DataAPI.update('staff', stid, stdata).then(function(){ state.ui.modal=null; render(); toast('Сотрудник обновлён'); });
    } else {
      if (!stdata.pin) stdata.pin = '0000';
      DataAPI.add('staff', stdata).then(function(){ state.ui.modal=null; render(); toast('Сотрудник добавлен'); });
    }
  } else if (type === 'expense') {
    var edata = { date: fd.get('date'), category: fd.get('category'), amount: Number(fd.get('amount')) || 0, note: fd.get('note') || '' };
    DataAPI.add('expenses', edata).then(function(){ state.ui.modal=null; render(); toast('Расход добавлен'); });
  } else if (type === 'treatment') {
    var patId = form.dataset.patient;
    var patient = state.data.patients.find(function(p){ return p.id===patId; });
    var doctorId = idn.role==='doctor' ? idn.doctorId : ((patient && patient.primaryDoctorId) || (state.data.doctors[0]||{}).id);
    var tdata = { patientId: patId, doctorId: doctorId, date: fd.get('date'), tooth: fd.get('tooth') || '', procedure: fd.get('procedure'), price: Number(fd.get('price')) || 0 };
    DataAPI.add('treatments', tdata).then(function(){ state.ui.modal=null; render(); toast('Запись добавлена в историю'); });
  } else if (type === 'add-payment') {
    var invId = form.dataset.id;
    var amount = Math.max(0, Number(fd.get('amount')) || 0);
    var method = fd.get('method');
    if (!amount) { toast('Укажите сумму оплаты', true); return; }
    DataAPI.addPayment(invId, amount, method).then(function(){ render(); toast('Оплата принята'); });
  } else if (type === 'clinic-settings') {
    var cdata = { name: fd.get('name'), phone: fd.get('phone'), address: fd.get('address'), hours: fd.get('hours') };
    DataAPI.updateSettings(cdata).then(function(){ render(); toast('Настройки сохранены'); });
  } else if (type === 'change-pin') {
    var newPin = fd.get('pin');
    if (!/^[0-9]{4}$/.test(newPin)) { toast('PIN должен содержать 4 цифры', true); return; }
    DataAPI.update('doctors', state.identity.doctorId, { pin: newPin }).then(function(){ form.reset(); toast('PIN обновлён'); });
  }
});

/* ==== INIT ==== */
state.token = null;

function renderBootScreen(){
  return '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--ink);color:#a39c86;font-family:var(--font-display);font-size:15px;letter-spacing:.08em;">DOMINANT</div>';
}

function clearSession(){
  state.token = null;
  state.identity = null;
  try { localStorage.removeItem('dominant_token'); } catch (e) {}
}

function loadLoginOptions(){
  apiFetch('/auth/login-options').then(function(res){
    state.data.staff = res.staff || [];
    state.data.doctors = res.doctors || [];
    state.ready = true;
    render();
  }).catch(function(e){
    toast('Нет связи с сервером: ' + e.message, true);
    state.ready = true;
    render();
  });
}

function loadBootstrapAndStart(){
  return apiFetch('/bootstrap').then(function(data){
    state.data = Object.assign({}, state.data, data);
    state.ready = true;
    if (!state.route || !state.identity || state.route.view === 'login') {
      state.route = { view: NAV[state.identity.role][0].id };
    }
    connectSocket();
    render();
  }).catch(function(e){
    toast('Не удалось загрузить данные: ' + e.message, true);
    clearSession();
    loadLoginOptions();
  });
}

function initData(){
  var host = document.getElementById('root');
  host.innerHTML = renderBootScreen();
  var savedToken = null;
  try { savedToken = localStorage.getItem('dominant_token'); } catch (e) {}
  if (savedToken) {
    state.token = savedToken;
    apiFetch('/auth/me').then(function(res){
      state.identity = res.identity;
      return loadBootstrapAndStart();
    }).catch(function(){
      clearSession();
      loadLoginOptions();
    });
  } else {
    loadLoginOptions();
  }
}

initData();
