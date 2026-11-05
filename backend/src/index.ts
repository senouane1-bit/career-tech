/** Vercel entry point: export the Express handler without opening a port. */
import "dotenv/config";
import { createApp } from "./application.js";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (
  process.env.NODE_ENV === "production" &&
  !process.env.FRONTEND_URL?.startsWith("https://")
) {
  throw new Error("Set FRONTEND_URL to the exact HTTPS frontend origin.");
}
export default createApp();
