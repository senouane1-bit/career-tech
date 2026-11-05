/** Run once before deploying, and again when adding a numbered SQL migration. */
import dotenv from "dotenv";
import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
dotenv.config({ path: new URL("../backend/.env", import.meta.url).pathname });
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL in backend/.env or the environment.");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("SELECT pg_advisory_lock(81742026)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const dir = new URL("./migrations/", import.meta.url);
  for (const file of (await readdir(dir))
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort()) {
    if (
      (
        await client.query("SELECT 1 FROM schema_migrations WHERE name=$1", [
          file,
        ])
      ).rows.length
    )
      continue;
    await client.query("BEGIN");
    try {
      await client.query(await readFile(new URL(file, dir), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}
