import "dotenv/config";
import { createApp } from "./application.js";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL before starting the API. See README.md.");
if (
  process.env.NODE_ENV === "production" &&
  !process.env.FRONTEND_URL?.startsWith("https://")
)
  throw new Error("Production FRONTEND_URL must use HTTPS.");
const port = Number(process.env.PORT || 4000);
createApp().listen(port, () =>
  console.log(`CareerTech API listening on ${port}`),
);
