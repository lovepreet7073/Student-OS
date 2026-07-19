// Apply every SQL file in supabase/migrations to the project referenced by
// NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
//
// Usage:  node --env-file=.env.local scripts/apply-migrations.mjs
//
// Each file is executed as one statement — trust the migration authors to
// keep them atomic. On error we abort and print the offending file so the
// operator can fix it and re-run (migrations are idempotent).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Extract project ref from the URL: https://<ref>.supabase.co
const refMatch = url.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!refMatch) {
  console.error("Couldn't parse project ref from NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}
const ref = refMatch[1];

// Extract the JWT's iat as the DB password — no, that's wrong.
// Supabase's DB password is the one you set at project creation, NOT the JWT.
// We need to connect via the pooler using the JWT? No — pooler needs the DB
// password. Since we don't have it here, use the direct-connection URL that
// Supabase exposes for CI:
//   postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres
// The service_role JWT does NOT open a Postgres session.
//
// Fall back: use the Management API path. Supabase exposes
//   POST /platform/pg-meta/<ref>/query { "query": "..." }
// with the service_role in the Authorization header — but this endpoint isn't
// documented for third-party use.
//
// Cleanest path: require the operator to also set SUPABASE_DB_PASSWORD in
// .env.local (same value they used when creating the project), which we then
// use here.
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) {
  console.error(
    "Missing SUPABASE_DB_PASSWORD. Add it to .env.local (the password you set\n" +
      "when you created the Supabase project).",
  );
  process.exit(1);
}

// Try direct connection first (works when the network allows outbound 5432).
// Fall back to the pooler, rotating through common regions if the caller
// didn't set SUPABASE_DB_REGION.
const region = process.env.SUPABASE_DB_REGION;
const candidates = [
  {
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: "postgres",
    label: "direct",
  },
  ...(region
    ? [
        {
          host: `aws-0-${region}.pooler.supabase.com`,
          port: 6543,
          user: `postgres.${ref}`,
          label: `pooler (${region})`,
        },
      ]
    : ["ap-south-1", "us-east-1", "us-east-2", "us-west-1", "eu-central-1", "eu-west-1", "ap-southeast-1"].map(
        (r) => ({
          host: `aws-0-${r}.pooler.supabase.com`,
          port: 6543,
          user: `postgres.${ref}`,
          label: `pooler (${r})`,
        }),
      )),
];

let client;
let connected = false;
for (const c of candidates) {
  const attempt = new pg.Client({
    host: c.host,
    port: c.port,
    database: "postgres",
    user: c.user,
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  process.stdout.write(`Trying ${c.label} @ ${c.host}:${c.port} … `);
  try {
    await attempt.connect();
    console.log("connected.");
    client = attempt;
    connected = true;
    break;
  } catch (err) {
    console.log(`no (${err.code || err.message})`);
    try {
      await attempt.end();
    } catch {}
  }
}
if (!connected) {
  console.error("\nCouldn't connect to Postgres. Set SUPABASE_DB_REGION correctly.");
  process.exit(1);
}

const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

for (const name of files) {
  process.stdout.write(`  → ${name} … `);
  const sql = readFileSync(join(dir, name), "utf8");
  try {
    await client.query(sql);
    console.log("ok");
  } catch (err) {
    console.log("FAILED");
    console.error(`\n----- ${name} error -----`);
    console.error(err.message);
    console.error("-------------------------");
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log("\nAll migrations applied.");
