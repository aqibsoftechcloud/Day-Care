// Session revocation, login error consistency and save-time sanitization of the remaining rich-text
// fields. Same conventions as integration.test.mjs: local server (BASE_URL), local DB, synthetic data
// removed afterwards, a private fake client IP per test. Usage: npm run test:security:session
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { SignJWT } from "jose";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: ".env", quiet: true });
const mariadb = require("mariadb");
const bcrypt = require("bcryptjs");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const RUN = Math.random().toString(36).slice(2, 8);
const PASSWORD = "Correct-Horse-9";
const cleanup = { users: [], pages: [], globalSpecialities: [] };
let db;
let roleId;

const ip = (n) => `203.0.113.${n}`;
const json = (cookie, clientIp) => ({ "content-type": "application/json", "x-forwarded-for": clientIp, ...(cookie ? { cookie } : {}) });
const me = (cookie) => fetch(`${BASE}/api/auth/me`, { headers: { cookie } });

async function makeUser(label, status = "active") {
  const email = `zz-sec-${RUN}-${label}@example.invalid`;
  const res = await db.query("insert into users (name,email,password,role_id,status) values (?,?,?,?,?)", ["Sec " + label, email, bcrypt.hashSync(PASSWORD, 10), roleId, status]);
  cleanup.users.push(Number(res.insertId));
  return { id: Number(res.insertId), email };
}

async function login(email, clientIp, password = PASSWORD) {
  const res = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: json(null, clientIp), body: JSON.stringify({ email, password }) });
  const cookie = res.headers.get("set-cookie")?.split(";")[0] ?? null;
  return { res, cookie };
}

/** A correctly signed token, optionally without / with a different version claim, for the encrypted id found in a real session. */
async function forgeToken(realCookie, claims) {
  const real = realCookie.slice("session=".length).split(".")[1];
  const sub = JSON.parse(Buffer.from(real, "base64url").toString()).sub;
  const now = Math.floor(Date.now() / 1000);
  const jwt = new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setSubject(sub).setIssuedAt(now).setExpirationTime(now + 600);
  return `session=${await jwt.sign(new TextEncoder().encode(process.env.JWT_SECRET))}`;
}

before(async () => {
  db = await mariadb.createConnection({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  roleId = (await db.query("select id from roles where name='Super Admin' limit 1"))[0].id;
});

after(async () => {
  for (const id of cleanup.pages) await db.query("delete from pages where id=?", [id]);
  for (const id of cleanup.globalSpecialities) await db.query("delete from global_specialities where id=?", [id]);
  for (const id of cleanup.users) await db.query("delete from users where id=?", [id]);
  await db.query("delete from rate_limit_events where bucket like 'login:%'");
  await db.end();
});

test("logout revokes the token that was used and every other outstanding token of that user", async () => {
  const user = await makeUser("logout");
  const a = await login(user.email, ip(120));
  const b = await login(user.email, ip(121));
  assert.equal((await me(a.cookie)).status, 200);
  assert.equal((await me(b.cookie)).status, 200);

  const out = await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: json(a.cookie, ip(120)) });
  assert.equal(out.status, 200);

  assert.equal((await me(a.cookie)).status, 401, "token A must be dead after logout");
  assert.equal((await me(b.cookie)).status, 401, "token B (other device) must be dead too");

  const c = await login(user.email, ip(122));
  assert.equal((await me(c.cookie)).status, 200, "a newly issued token works");
  assert.equal((await me(a.cookie)).status, 401, "old token stays dead");
});

test("logout with no / invalid / already-revoked token is harmless and does not revoke anyone", async () => {
  const user = await makeUser("idem");
  const a = await login(user.email, ip(123));
  const before = (await db.query("select session_version v from users where id=?", [user.id]))[0].v;

  assert.equal((await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: json(null, ip(123)) })).status, 200);
  assert.equal((await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: json("session=garbage", ip(123)) })).status, 200);
  assert.equal((await db.query("select session_version v from users where id=?", [user.id]))[0].v, before);
  assert.equal((await me(a.cookie)).status, 200);
});

test("legacy tokens (no version claim) work until the first revocation, then die; tampered versions never work", async () => {
  const user = await makeUser("legacy");
  const real = await login(user.email, ip(124));
  const legacy = await forgeToken(real.cookie, {});

  assert.equal((await me(legacy)).status, 200, "legacy token is read as version 0 (current DB value)");
  assert.equal((await me(await forgeToken(real.cookie, { sv: 5 }))).status, 401, "future version rejected");
  assert.equal((await me(await forgeToken(real.cookie, { sv: "0" }))).status, 401, "non-numeric version rejected");
  assert.equal((await me(await forgeToken(real.cookie, { sv: -1 }))).status, 401, "negative version rejected");
  assert.equal((await me(await forgeToken(real.cookie, { sv: 0.5 }))).status, 401, "fractional version rejected");

  await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: json(real.cookie, ip(124)) });
  assert.equal((await me(legacy)).status, 401, "legacy token revoked by the version bump");
});

test("role/status checks still apply: deactivating a user kills a token whose version is current", async () => {
  const user = await makeUser("deact");
  const a = await login(user.email, ip(125));
  assert.equal((await me(a.cookie)).status, 200);
  await db.query("update users set status='inactive' where id=?", [user.id]);
  assert.equal((await me(a.cookie)).status, 401);
});

test("a password change through the users API revokes existing sessions; the new password works", async () => {
  const admin = await makeUser("pwadmin");
  const target = await makeUser("pwtarget");
  const adminSession = await login(admin.email, ip(126));
  const targetSession = await login(target.email, ip(127));
  assert.equal((await me(targetSession.cookie)).status, 200);

  const targetUserId = (await (await me(targetSession.cookie)).json()).user.user_id;
  const NEW = "Another-Horse-7";
  const put = await fetch(`${BASE}/api/users/${encodeURIComponent(targetUserId)}`, { method: "PUT", headers: json(adminSession.cookie, ip(126)), body: JSON.stringify({ password: NEW }) });
  assert.equal(put.status, 200, await put.text());

  assert.equal((await me(targetSession.cookie)).status, 401, "target's old session revoked");
  assert.equal((await me(adminSession.cookie)).status, 200, "admin's own session untouched");
  assert.equal((await login(target.email, ip(128), PASSWORD)).res.status, 401, "old password rejected");
  const fresh = await login(target.email, ip(129), NEW);
  assert.equal(fresh.res.status, 200);
  assert.equal((await me(fresh.cookie)).status, 200);

  const list = await (await fetch(`${BASE}/api/users`, { headers: { cookie: adminSession.cookie } })).text();
  assert.doesNotMatch(list, /session_version|\$2[aby]\$/, "version / hash never leak through the users API");
});

test("login: an inactive account with the correct password gets the same 401 message as a wrong password", async () => {
  const user = await makeUser("inactive", "inactive");
  const inactive = await login(user.email, ip(130), PASSWORD);
  const wrong = await login(user.email, ip(131), "wrong-password");
  const unknown = await login(`zz-sec-${RUN}-nobody@example.invalid`, ip(132), "wrong-password");

  for (const r of [inactive, wrong, unknown]) assert.equal(r.res.status, 401);
  const bodies = await Promise.all([inactive, wrong, unknown].map(async (r) => (await r.res.json()).message));
  assert.deepEqual(new Set(bodies), new Set(["Invalid email or password"]));
  assert.equal(inactive.cookie, null);
});

test("login: inactive-account attempts still count toward the rate limit", async () => {
  const user = await makeUser("inactive2", "inactive");
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await login(user.email, ip(133), PASSWORD)).res.status);
  assert.deepEqual(statuses, [401, 401, 401, 401, 401, 429]);
});

test("save-time sanitization: JSON section content (page sections) and a flat rich-text column (global speciality)", async () => {
  const admin = await makeUser("rt");
  const { cookie } = await login(admin.email, ip(134));
  const headers = json(cookie, ip(134));
  const EVIL = `<h2>Head</h2><p>keep <strong>bold</strong> <a href="https://example.com">ok</a></p><img src=x onerror="window.__x=1"><script>window.__x=2</script><a href="javascript:alert(1)">bad</a>`;
  const assertClean = (html) => {
    assert.doesNotMatch(html, /<script|onerror|javascript:/i);
    for (const keep of ["<h2>Head</h2>", "<strong>bold</strong>", 'href="https://example.com"']) assert.ok(html.includes(keep), `${keep} missing in ${html}`);
  };

  // page section (JSON column)
  const [lang] = await db.query("select id from languages limit 1");
  const page = await db.query("insert into pages (language_id,title,seo_url,category,city_id,status) values (?,?,?,?,NULL,'active')", [lang.id, "Sec rt", `zz-sec-rt-${RUN}`, "general"]);
  cleanup.pages.push(Number(page.insertId));
  const created = await fetch(`${BASE}/api/pages/${page.insertId}/sections`, { method: "POST", headers, body: JSON.stringify({ section_type: "content", content: { heading: "H", content: EVIL } }) });
  assert.equal(created.status, 201, await created.text());
  const [section] = await db.query("select id, content from page_sections where page_id=? order by id desc limit 1", [page.insertId]);
  const stored = typeof section.content === "string" ? JSON.parse(section.content) : section.content;
  assertClean(stored.content);
  assert.equal(stored.heading, "H");

  const updated = await fetch(`${BASE}/api/pages/${page.insertId}/sections/${section.id}`, { method: "PUT", headers, body: JSON.stringify({ content: { heading: "H2", content: EVIL + "<iframe src=//e.example></iframe>" } }) });
  assert.equal(updated.status, 200, await updated.text());
  const [after] = await db.query("select content from page_sections where id=?", [section.id]);
  const storedAfter = typeof after.content === "string" ? JSON.parse(after.content) : after.content;
  assertClean(storedAfter.content);
  assert.doesNotMatch(storedAfter.content, /iframe/i);

  // flat column
  const form = new FormData();
  for (const [k, v] of Object.entries({ speciality_name: `Sec ${RUN}`, seo_url: `zz-sec-gs-${RUN}`, description: EVIL, status: "inactive" })) form.append(k, v);
  const gs = await fetch(`${BASE}/api/global-specialities`, { method: "POST", headers: { cookie, "x-forwarded-for": ip(134) }, body: form });
  assert.equal(gs.status, 201, await gs.text());
  const [row] = await db.query("select id, description, short_description from global_specialities where seo_url=?", [`zz-sec-gs-${RUN}`]);
  cleanup.globalSpecialities.push(row.id);
  assertClean(row.description);
});

test("cookie attributes: login sets Secure; HttpOnly; SameSite=lax; Path=/ and logout expires it with the same attributes", async () => {
  const user = await makeUser("cookie");
  const { res, cookie } = await login(user.email, ip(140));
  const set = res.headers.get("set-cookie") ?? "";
  assert.match(set, /;\s*HttpOnly/i);
  assert.match(set, /;\s*SameSite=lax/i);
  assert.match(set, /;\s*Path=\//i);
  assert.match(set, /;\s*Max-Age=86400/i);
  // Secure unless the server was deliberately started in development with ALLOW_INSECURE_SESSION_COOKIE=true.
  if (process.env.EXPECT_INSECURE_COOKIE === "true") assert.doesNotMatch(set, /;\s*Secure/i);
  else assert.match(set, /;\s*Secure/i);

  const out = await fetch(`${BASE}/api/auth/logout`, { method: "POST", headers: json(cookie, ip(140)) });
  const cleared = out.headers.get("set-cookie") ?? "";
  assert.match(cleared, /^session=;/);
  assert.match(cleared, /Expires=Thu, 01 Jan 1970/i);
  assert.match(cleared, /;\s*HttpOnly/i);
  assert.match(cleared, /;\s*SameSite=lax/i);
  assert.match(cleared, /;\s*Path=\//i);
  if (process.env.EXPECT_INSECURE_COOKIE !== "true") assert.match(cleared, /;\s*Secure/i);
});
