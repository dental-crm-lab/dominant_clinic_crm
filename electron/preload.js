'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// Exposed only to setup.html (the app's own real UI, loaded from the clinic
// server, never touches this — it is a normal web page with no Node access).
contextBridge.exposeInMainWorld('dominantDesktop', {
  getConfig: function () { return ipcRenderer.invoke('dominant:get-config'); },
  setServerUrl: function (url) { return ipcRenderer.invoke('dominant:set-server-url', url); }
});
