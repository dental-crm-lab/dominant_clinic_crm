'use strict';
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    return {};
  }
}
function saveConfig(cfg) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

let mainWindow = null;

function normalizeUrl(raw) {
  var u = String(raw || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u.replace(/\/+$/, '');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#15140f',
    icon: path.join(__dirname, 'icon.ico'),
    title: 'Dominant CRM',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  var cfg = loadConfig();
  if (cfg.serverUrl) {
    loadServer(cfg.serverUrl);
  } else {
    loadSetup();
  }

  mainWindow.on('closed', function () { mainWindow = null; });

  // Any link the app tries to open in a new window/tab opens in the
  // user's real browser instead of a second Electron window.
  mainWindow.webContents.setWindowOpenHandler(function (details) {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });
}

function loadSetup() {
  mainWindow.loadFile(path.join(__dirname, 'setup.html'));
}

function loadServer(url) {
  mainWindow.loadURL(url).catch(function (err) {
    console.error('Failed to load server', err);
    loadSetup();
  });
}

ipcMain.handle('dominant:get-config', function () {
  return loadConfig();
});

ipcMain.handle('dominant:set-server-url', function (evt, rawUrl) {
  var url = normalizeUrl(rawUrl);
  if (!url) return { ok: false, error: 'Пустой адрес' };
  var cfg = loadConfig();
  cfg.serverUrl = url;
  saveConfig(cfg);
  loadServer(url);
  return { ok: true, url: url };
});

ipcMain.handle('dominant:open-setup', function () {
  loadSetup();
  return true;
});

ipcMain.handle('dominant:reload', function () {
  if (mainWindow) mainWindow.reload();
  return true;
});

function buildMenu() {
  var template = [
    {
      label: 'Dominant CRM',
      submenu: [
        { label: 'Обновить страницу', accelerator: 'CmdOrCtrl+R', click: function () { if (mainWindow) mainWindow.reload(); } },
        { label: 'Сменить адрес сервера…', click: function () { loadSetup(); } },
        { type: 'separator' },
        { label: 'Инструменты разработчика', accelerator: 'F12', click: function () { if (mainWindow) mainWindow.webContents.toggleDevTools(); } },
        { type: 'separator' },
        { role: 'quit', label: 'Выход' }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'zoomIn', label: 'Увеличить' },
        { role: 'zoomOut', label: 'Уменьшить' },
        { role: 'resetZoom', label: 'Сбросить масштаб' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полный экран' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Only one instance of the desktop app at a time (avoids two windows
// fighting over the same clinic session on the same PC).
var gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', function () {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(function () {
    buildMenu();
    createWindow();
    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}
