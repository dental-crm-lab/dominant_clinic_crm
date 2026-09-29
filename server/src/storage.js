// File storage for patient photos/x-rays. Plain disk storage (no S3/R2 —
// this clinic doesn't have an object-storage account), but the directory is
// resolved the same way db.js resolves DATABASE_PATH: by default a folder
// next to the sqlite file, so on Railway a single mounted volume
// (DATABASE_PATH=/data/dominant.db) automatically covers uploads too,
// without a second env var to configure.
//
// Access is never a public static path — every read goes through
// server/src/routes/patientFiles.js's /:id/raw endpoint, which checks the
// requester's auth/clinic access before streaming bytes. This mirrors the
// "no public bucket URL, backend gates every read" approach used for the
// same feature in Atlas Dental CRM (see storage.py there), adapted from
// S3/R2 presigned URLs to a local-disk equivalent since this app doesn't use
// object storage.
const fs = require('fs');
const path = require('path');
const { DB_PATH } = require('./db');

const UPLOADS_DIR = process.env.UPLOADS_PATH || path.join(path.dirname(DB_PATH), 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function absolutePath(storedName) {
  return path.join(UPLOADS_DIR, storedName);
}

function deleteFile(storedName) {
  try { fs.unlinkSync(absolutePath(storedName)); } catch (e) { /* already gone — fine, don't fail the DB delete over it */ }
}

module.exports = { UPLOADS_DIR, absolutePath, deleteFile };
