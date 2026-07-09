const db = require("./db");

const RETRY_MS = process.env.DB_RETRY_MS ? Number(process.env.DB_RETRY_MS) : 2000;
const MAX_ATTEMPTS = process.env.DB_MAX_ATTEMPTS ? Number(process.env.DB_MAX_ATTEMPTS) : 0;

async function waitForDb() {
  let attempts = 0;
  while (true) {
    try {
      await db.query("SELECT 1");
      console.log("Postgres is ready.");
      break;
    } catch (err) {
      attempts += 1;
      if (MAX_ATTEMPTS && attempts >= MAX_ATTEMPTS) {
        console.error("Max attempts reached waiting for Postgres.");
        process.exit(1);
      }
      console.log(`Waiting for Postgres (attempt ${attempts})...`);
      await new Promise((r) => setTimeout(r, RETRY_MS));
    }
  }
}

waitForDb()
  .then(() => {
    require("./index");
  })
  .catch((err) => {
    console.error("Error while waiting for Postgres:", err);
    process.exit(1);
  });
