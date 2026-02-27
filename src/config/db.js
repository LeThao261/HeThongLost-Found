const sql = require("mssql");
const dotenv = require("dotenv");

// Load environment variables early (safe to call multiple times).
dotenv.config();

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function toInt(value, defaultValue) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : defaultValue;
}

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: toInt(process.env.DB_PORT, 1433),
  options: {
    encrypt: toBool(process.env.DB_ENCRYPT, true),
    trustServerCertificate: toBool(process.env.DB_TRUST_SERVER_CERT, true),
  },
  pool: {
    max: toInt(process.env.DB_POOL_MAX, 10),
    min: toInt(process.env.DB_POOL_MIN, 0),
    idleTimeoutMillis: toInt(process.env.DB_POOL_IDLE_TIMEOUT_MS, 30000),
  },
  requestTimeout: toInt(process.env.DB_REQUEST_TIMEOUT_MS, 30000),
};

// Create a single connection pool for the entire app.
const pool = new sql.ConnectionPool(dbConfig);

// Lazy connect: do not connect at import-time (avoids crashing app startup).
let poolConnectPromise = null;

async function getPool() {
  if (!poolConnectPromise) {
    poolConnectPromise = pool.connect();
  }
  await poolConnectPromise;
  return pool;
}

module.exports = {
  sql,
  pool,
  getPool,
};

