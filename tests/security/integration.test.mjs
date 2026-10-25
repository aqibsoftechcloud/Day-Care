// Integration regression tests for the security remediation. Run against a LOCAL dev/prod server
// (BASE_URL, default http://localhost:3000) and the local database from .env. All data is synthetic
// and removed afterwards; each test uses its own fake client IP (via X-Forwarded-For, TEST-NET-3)
// so rate-limit buckets never collide. Usage: npm run test:security:integration
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: ".env", quiet: true });
const mariadb = require("mariadb");
const bcrypt = require("bcryptjs");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const RUN = Math.random().toString(36).slice(2, 8);
let db;
const cleanup = { phones: [], pages: [], users: [] };

const ip = (n) => `203.0.113.${n}`;
const post = (path, body, clientIp) =>
  fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": clientIp },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const randomPhone = () => "9" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0");

before(async () => {
  db = await mariadb.createConnection({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
});

after(async () => {
  for (const id of cleanup.pages) await db.query("delete from pages where id=?", [id]);
  for (const id of cleanup.users) await db.query("delete from users where id=?", [id]);
  for (const phone of cleanup.phones) await db.query("delete from appointment_leads where phone_number like ?", [`%${phone}%`]);
  await db.query("delete from rate_limit_events where bucket like 'login:%' or bucket like 'lead:%'");
  await db.end();
});

test("security headers are present and X-Powered-By is gone", async () => {
  const res = await fetch(BASE + "/");
  const csp = res.headers.get("content-security-policy") ?? "";
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.equal(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("/api/test-db no longer exposes database records", async () => {
  const res = await fetch(BASE + "/api/test-db");
  assert.equal(res.status, 404);
  assert.doesNotMatch(await res.text(), /Super Admin/i);
});

test("legacy stored malicious HTML is neutralized in rendered public output", async () => {
  const slug = `zz-sec-${RUN}`;
  const [lang] = await db.query("select id from languages limit 1");
  const body = `<p>legit <strong>bold</strong></p><img src=x onerror="window.__x=1"><script>window.__x=2</script><a href="javascript:alert(1)">bad</a><a href="/ok">ok</a>`;
  const res = await db.query(
    "insert into pages (language_id,title,seo_url,category,city_id,body,status) values (?,?,?,?,NULL,?,'active')",
    [lang.id, "Sec probe", slug, "general", body]
  );
  cleanup.pages.push(Number(res.insertId));

  const page = await fetch(`${BASE}/${slug}`);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /legit <strong>bold<\/strong>/);
  assert.match(html, /href="\/ok"/);
  assert.doesNotMatch(html, /onerror=/i);
  assert.doesNotMatch(html, /<script>window\.__x/);
  assert.doesNotMatch(html, /javascript:alert/i);
});

test("login: failures for one account+IP hit 429 with Retry-After; other IPs/accounts are unaffected", async () => {
  const email = `zz-sec-${RUN}-a@example.invalid`;
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await post("/api/auth/login", { email, password: "wrong-password" }, ip(11))).status);
  assert.deepEqual(statuses, [401, 401, 401, 401, 401, 429]);

  const blocked = await post("/api/auth/login", { email, password: "wrong-password" }, ip(11));
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);

  // The attacker's failures cannot lock the account for everyone else.
  assert.equal((await post("/api/auth/login", { email, password: "wrong-password" }, ip(12))).status, 401);
  assert.equal((await post("/api/auth/login", { email: `zz-sec-${RUN}-b@example.invalid`, password: "x" }, ip(11))).status, 401);
});

test("login: attempts distributed over many IPs against one account are capped account-wide", async () => {
  const email = `zz-sec-${RUN}-dist@example.invalid`;
  let last;
  for (let i = 0; i < 21; i++) last = (await post("/api/auth/login", { email, password: "wrong" }, ip(100 + i))).status;
  assert.equal(last, 429);
});

test("login: one IP spraying many accounts is capped IP-wide", async () => {
  let last;
  for (let i = 0; i < 21; i++) last = (await post("/api/auth/login", { email: `zz-sec-${RUN}-s${i}@example.invalid`, password: "wrong" }, ip(50))).status;
  assert.equal(last, 429);
});

test("login: a valid login still works after earlier failures", async () => {
  const [role] = await db.query("select id from roles limit 1");
  const email = `zz-sec-${RUN}-ok@example.invalid`;
  const res = await db.query("insert into users (name,email,password,role_id,status) values (?,?,?,?,'active')", ["Sec Test", email, bcrypt.hashSync("Correct-Horse-9", 10), role.id]);
  cleanup.users.push(Number(res.insertId));

  for (let i = 0; i < 3; i++) assert.equal((await post("/api/auth/login", { email, password: "nope" }, ip(60))).status, 401);
  const ok = await post("/api/auth/login", { email, password: "Correct-Horse-9" }, ip(60));
  assert.equal(ok.status, 200);
  assert.ok(ok.headers.get("set-cookie")?.includes("session="));
});

test("leads: oversized bodies are rejected with 413", async () => {
  assert.equal((await post("/api/appointment-leads", { full_name: "A".repeat(20000) }, ip(70))).status, 413);
  assert.equal((await post("/api/appointment-leads", JSON.stringify({ pad: "x".repeat(40000) }), ip(70))).status, 413);
});

test("leads: malformed shapes are rejected with 400, never 5xx", async () => {
  assert.equal((await post("/api/appointment-leads", "not json", ip(71))).status, 400);
  assert.equal((await post("/api/appointment-leads", "[1,2]", ip(71))).status, 400);
  const manyKeys = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`k${i}`, "v"]));
  assert.equal((await post("/api/appointment-leads", manyKeys, ip(71))).status, 400);
  assert.equal((await post("/api/appointment-leads", { full_name: { a: 1 } }, ip(71))).status, 400);
});

test("leads: honeypot submissions look successful but nothing is stored", async () => {
  const phone = randomPhone();
  cleanup.phones.push(phone);
  const res = await post("/api/appointment-leads", { full_name: "Bot Test", phone, hp_company_url: "http://spam.example" }, ip(72));
  assert.equal(res.status, 201);
  assert.equal((await db.query("select id from appointment_leads where phone_number like ?", [`%${phone}%`])).length, 0);
});

test("leads: a valid submission still creates a lead", async () => {
  const [treatment] = await db.query("select t.id, t.city_id from treatments t join cities c on c.id=t.city_id where t.status='active' and c.status='active' limit 1");
  const phone = randomPhone();
  cleanup.phones.push(phone);
  const res = await post("/api/appointment-leads", { full_name: "Sec Valid", phone, city: String(treatment.city_id), treatment: `city:${treatment.id}`, email: "sec@example.invalid" }, ip(73));
  const text = await res.text();
  assert.equal(res.status, 201, text);
  assert.equal((await db.query("select id from appointment_leads where phone_number like ?", [`%${phone}%`])).length, 1);
});

test("leads: per-IP throttling returns 429 after the cap", async () => {
  const statuses = [];
  for (let i = 0; i < 10; i++) statuses.push((await post("/api/appointment-leads", { full_name: "Sec Flood", phone: randomPhone() }, ip(80))).status);
  assert.ok(statuses.slice(0, 8).every((s) => s !== 429), `first 8: ${statuses}`);
  assert.equal(statuses[8], 429, `statuses: ${statuses}`);
  assert.equal(statuses[9], 429);
});

test("leads: per-phone cap blocks one number across rotating IPs", async (ctx) => {
  // Distinct treatments defeat the 10-minute duplicate shortcut, so each call is a genuinely new lead.
  const treatments = await db.query("select t.id, t.city_id from treatments t join cities c on c.id=t.city_id where t.status='active' and c.status='active' limit 4");
  if (treatments.length < 4) return ctx.skip("needs 4 active city treatments");
  const phone = randomPhone();
  cleanup.phones.push(phone);
  const statuses = [];
  for (let i = 0; i < 4; i++) statuses.push((await post("/api/appointment-leads", { full_name: "Sec Phone", phone, city: String(treatments[i].city_id), treatment: `city:${treatments[i].id}` }, ip(90 + i))).status);
  assert.deepEqual(statuses, [201, 201, 201, 429]);
  assert.equal((await db.query("select id from appointment_leads where phone_number like ?", [`%${phone}%`])).length, 3);
});

test("write path: page body is sanitized on create and update via the API (synthetic Super Admin)", async (ctx) => {
  const [role] = await db.query("select id from roles where name='Super Admin' limit 1");
  if (!role) return ctx.skip("no Super Admin role");
  const email = `zz-sec-${RUN}-admin@example.invalid`;
  const user = await db.query("insert into users (name,email,password,role_id,status) values (?,?,?,?,'active')", ["Sec Admin", email, bcrypt.hashSync("Correct-Horse-9", 10), role.id]);
  cleanup.users.push(Number(user.insertId));

  const login = await post("/api/auth/login", { email, password: "Correct-Horse-9" }, ip(200));
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const headers = { "content-type": "application/json", "x-forwarded-for": ip(200), cookie };
  const [lang] = await db.query("select id from languages limit 1");
  const slug = `zz-sec-w-${RUN}`;

  const created = await fetch(`${BASE}/api/pages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ language_id: lang.id, title: "Sec write", seo_url: slug, category: "general", scope: "global", status: "active", body: `<p>keep</p><img src=x onerror="window.__x=1"><script>window.__x=2</script>` }),
  });
  assert.equal(created.status, 201);
  const [row] = await db.query("select id, body from pages where seo_url=?", [slug]);
  cleanup.pages.push(row.id);
  assert.doesNotMatch(row.body, /onerror|<script/i);
  assert.match(row.body, /<p>keep<\/p>/);

  const updated = await fetch(`${BASE}/api/pages/${row.id}`, { method: "PUT", headers, body: JSON.stringify({ body: `<p onclick="x()">u</p><iframe src="//e.example"></iframe>` }) });
  assert.equal(updated.status, 200);
  const [after] = await db.query("select body from pages where id=?", [row.id]);
  assert.doesNotMatch(after.body, /onclick|<iframe/i);
  assert.match(after.body, /<p>u<\/p>/);
});
