// Thin wrapper around the Socket.io instance so route files can broadcast
// "this collection changed" notices without importing the server bootstrap.
let ioInstance = null;

function attach(io) {
  ioInstance = io;
}

function broadcast(collection) {
  if (ioInstance) ioInstance.emit('sync', { collection });
}

module.exports = { attach, broadcast };
