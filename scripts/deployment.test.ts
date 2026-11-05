import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import config from "../frontend/next.config.ts";
test("Next.js proxies API requests to the configured Express backend", async () => {
  const rules = await (config.rewrites as Function)();
  assert.deepEqual(rules, [
    {
      source: "/api/:path*",
      destination:
        (process.env.BACKEND_URL || "http://localhost:4000").replace(
          /\/$/,
          "",
        ) + "/api/:path*",
    },
  ]);
  assert.notEqual(config.output, "export");
});
test("Vercel projects point to the right frameworks and serverless entry", () => {
  for (const [folder, framework] of [
    ["frontend", "nextjs"],
    ["backend", "express"],
  ]) {
    const settings = JSON.parse(readFileSync(`${folder}/vercel.json`, "utf8"));
    assert.equal(settings.framework, framework);
  }
  const source = readFileSync("backend/src/index.ts", "utf8");
  assert.match(source, /export default createApp\(\)/);
  assert.doesNotMatch(source, /\.listen\(/);
  assert.ok(existsSync("database/migrations/001_initial.sql"));
});
