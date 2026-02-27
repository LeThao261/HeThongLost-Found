const dotenv = require("dotenv");

// Load env vars before importing the app/db.
dotenv.config();

const app = require("./src/app");
const { pool } = require("./src/config/db");

const PORT = Number.parseInt(process.env.PORT || "3000", 10);

const server = app.listen(PORT);
server.once("listening", () => {
  console.log(`Server is running on port ${PORT}`);
});

async function shutdown(signal) {
  try {
    console.log(`Received ${signal}. Shutting down...`);
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");

    try {
      await pool.close();
    } catch (e) {
      // Pool may not be connected yet; ignore close errors during shutdown.
    }
    process.exit(0);
  } catch (err) {
    console.error("Shutdown error:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

