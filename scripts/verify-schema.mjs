// Quick sanity: count seed rows and enumerate our tables.
import pg from "pg";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

const client = new pg.Client({
  host: `db.${ref}.supabase.co`,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: dbPassword,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const tables = await client.query(`
  select tablename from pg_tables
   where schemaname = 'public'
   order by tablename
`);
console.log("Public tables:", tables.rows.length);
for (const row of tables.rows) console.log(" •", row.tablename);

console.log();
for (const t of ["boards", "mediums", "classes", "subjects"]) {
  const c = await client.query(`select count(*)::int as n from public.${t}`);
  console.log(`${t}: ${c.rows[0].n} rows`);
}

await client.end();
