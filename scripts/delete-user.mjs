// One-shot: delete a user from auth.users by email.
// Usage: node --env-file=.env.local scripts/delete-user.mjs <email>
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!email) {
  console.error("Missing email arg. Usage: node scripts/delete-user.mjs <email>");
  process.exit(1);
}
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const listRes = await admin.auth.admin.listUsers({ perPage: 200 });
if (listRes.error) {
  console.error("listUsers failed:", listRes.error.message);
  process.exit(1);
}
const target = listRes.data.users.find(
  (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
);
if (!target) {
  console.log(`No user with email ${email}. Nothing to delete.`);
  process.exit(0);
}

console.log(`Found user id=${target.id} email=${target.email}. Deleting…`);
const delRes = await admin.auth.admin.deleteUser(target.id);
if (delRes.error) {
  console.error("deleteUser failed:", delRes.error.message);
  process.exit(1);
}
console.log("Deleted.");
