import pg from "pg";
export type DB = {
  query: (
    text: string,
    values?: any[],
  ) => Promise<{ rows: any[]; rowCount: number | null }>;
};
// Small pool per function instance. Use your provider's pooled PostgreSQL URL.
export const db: DB = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});
