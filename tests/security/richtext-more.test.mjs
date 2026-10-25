// Save-time sanitization through the real create/update endpoints of: treatments, specialities, global
// treatments, and the speciality / treatment / hospital / global-speciality / global-treatment section
// services. Local server + local DB, synthetic records created by this file only and deleted by id.
// Usage: npm run test:security:richtext-more
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: ".env", quiet: true });
const mariadb = require("mariadb");
const bcrypt = require("bcryptjs");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const RUN = Math.random().toString(36).slice(2, 8);
const EVIL = `<h2>Head</h2><p>keep <strong>bold</strong> <a href="https://example.com">ok</a></p><ul><li>one</li></ul><img src=x onerror="window.__x=1"><script>window.__x=2</script><a href="javascript:alert(1)">bad</a>`;
const EVIL_UPDATE = `${EVIL}<p onclick="x()">tail</p><iframe src="//e.example"></iframe>`;
const ID = { hospital: null, speciality: null, treatment: null, globalSpeciality: null, globalTreatment: null };
let db, cookie, userId, city, lang;

const H = (json) => ({ cookie, "x-forwarded-for": "203.0.113.151", ...(json ? { "content-type": "application/json" } : {}) });
const form = (o) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.append(k, v); return f; };
const send = (method, path, body, multipart) => fetch(BASE + path, { method, headers: H(!multipart), body: multipart ? form(body) : JSON.stringify(body) });
const parse = (v) => (typeof v === "string" ? JSON.parse(v) : v);

function assertClean(html, label) {
  assert.ok(typeof html === "string" && html.length > 0, `${label}: empty`);
  assert.doesNotMatch(html, /<script|onerror|onclick|javascript:|<iframe/i, `${label}: unsafe markup survived: ${html}`);
  for (const keep of ["<h2>Head</h2>", "<strong>bold</strong>", 'href="https://example.com"', "<li>one</li>"]) assert.ok(html.includes(keep), `${label}: lost ${keep} in ${html}`);
}

before(async () => {
  db = await mariadb.createConnection({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  const [role] = await db.query("select id from roles where name='Super Admin' limit 1");
  const email = `zz-sec-${RUN}-rm@example.invalid`;
  userId = Number((await db.query("insert into users (name,email,password,role_id,status) values (?,?,?,?,'active')", ["Sec RM", email, bcrypt.hashSync("Correct-Horse-9", 10), role.id])).insertId);
  const login = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.151" }, body: JSON.stringify({ email, password: "Correct-Horse-9" }) });
  cookie = login.headers.get("set-cookie").split(";")[0];
  [city] = await db.query("select id from cities where status='active' limit 1");
  [lang] = await db.query("select id from languages limit 1");
});

after(async () => {
  const run = (sql, p) => db.query(sql, p).catch((e) => console.error("cleanup", sql, e.message));
  if (ID.treatment) { await run("delete from treatment_sections where treatment_id=?", [ID.treatment]); await run("delete from treatments where id=?", [ID.treatment]); }
  if (ID.speciality) { await run("delete from speciality_sections where speciality_id=?", [ID.speciality]); await run("delete from specialities where id=?", [ID.speciality]); }
  if (ID.hospital) { await run("delete from hospital_sections where hospital_id=?", [ID.hospital]); await run("delete from hospitals where id=?", [ID.hospital]); }
  if (ID.globalTreatment) { await run("delete from global_treatment_sections where global_treatment_id=?", [ID.globalTreatment]); await run("delete from global_treatments where id=?", [ID.globalTreatment]); }
  if (ID.globalSpeciality) { await run("delete from global_speciality_sections where global_speciality_id=?", [ID.globalSpeciality]); await run("delete from global_specialities where id=?", [ID.globalSpeciality]); }
  await run("delete from users where id=?", [userId]);
  await run("delete from rate_limit_events where bucket like 'login:%'");
  await db.end();
});

test("speciality (multipart): description sanitized on create and update", async () => {
  const res = await send("POST", "/api/specialities", { speciality_name: `Sec Spec ${RUN}`, seo_url: `zz-sec-s-${RUN}`, city_id: city.id, description: EVIL, status: "inactive" }, true);
  assert.equal(res.status, 201, await res.text());
  const [row] = await db.query("select id, description from specialities where seo_url=?", [`zz-sec-s-${RUN}`]);
  ID.speciality = row.id;
  assertClean(row.description, "speciality create");
  const up = await send("PUT", `/api/specialities/${row.id}`, { description: EVIL_UPDATE }, true);
  assert.equal(up.status, 200, await up.text());
  assertClean((await db.query("select description d from specialities where id=?", [row.id]))[0].d, "speciality update");
});

test("treatment (multipart): description sanitized on create and update", async () => {
  assert.ok(ID.speciality, "needs the speciality from the previous test");
  const res = await send("POST", "/api/treatments", { speciality_id: ID.speciality, sub_speciality_name: `Sec Treat ${RUN}`, seo_url: `zz-sec-t-${RUN}`, language_id: lang.id, city_id: city.id, description: EVIL, status: "inactive" }, true);
  assert.equal(res.status, 201, await res.text());
  const [row] = await db.query("select id, description from treatments where seo_url=? and speciality_id=?", [`zz-sec-t-${RUN}`, ID.speciality]);
  ID.treatment = row.id;
  assertClean(row.description, "treatment create");
  const up = await send("PUT", `/api/treatments/${row.id}`, { description: EVIL_UPDATE }, true);
  assert.equal(up.status, 200, await up.text());
  assertClean((await db.query("select description d from treatments where id=?", [row.id]))[0].d, "treatment update");
});

test("global treatment: description sanitized on create and update", async () => {
  const res = await send("POST", "/api/global-treatments", { treatment_name: `Sec GT ${RUN}`, seo_url: `zz-sec-gt-${RUN}`, description: EVIL, status: "inactive" }, true);
  assert.equal(res.status, 201, await res.text());
  const [row] = await db.query("select id, description from global_treatments where seo_url=?", [`zz-sec-gt-${RUN}`]);
  ID.globalTreatment = row.id;
  assertClean(row.description, "global treatment create");
  const up = await send("PUT", `/api/global-treatments/${row.id}`, { description: EVIL_UPDATE }, true);
  assert.equal(up.status, 200, await up.text());
  assertClean((await db.query("select description d from global_treatments where id=?", [row.id]))[0].d, "global treatment update");
});

// --- sections ---------------------------------------------------------------------------------------------

async function jsonSectionTest(label, parentPath, table, parentColumn, parentId) {
  const created = await send("POST", `${parentPath}/${parentId}/sections`, { content: { title: "T", content: EVIL } });
  assert.equal(created.status, 201, `${label} create: ${await created.text()}`);
  const [row] = await db.query(`select id, content from ${table} where ${parentColumn}=? order by id desc limit 1`, [parentId]);
  const stored = parse(row.content);
  assertClean(stored.content, `${label} create`);
  assert.equal(stored.title, "T");
  const up = await send("PUT", `${parentPath}/${parentId}/sections/${row.id}`, { content: { title: "T2", content: EVIL_UPDATE } });
  assert.equal(up.status, 200, `${label} update: ${await up.text()}`);
  const after = parse((await db.query(`select content from ${table} where id=?`, [row.id]))[0].content);
  assertClean(after.content, `${label} update`);
  assert.equal(after.title, "T2");
}

test("speciality section (JSON content.content): sanitized on create and update", async () => {
  assert.ok(ID.speciality);
  await jsonSectionTest("speciality section", "/api/specialities", "speciality_sections", "speciality_id", ID.speciality);
});

test("treatment section (JSON content.content): sanitized on create and update", async () => {
  assert.ok(ID.treatment);
  await jsonSectionTest("treatment section", "/api/treatments", "treatment_sections", "treatment_id", ID.treatment);
});

test("hospital section (JSON content.content): sanitized on create and update", async () => {
  const res = await send("POST", "/api/hospitals", { hospital_name: `Sec Hosp ${RUN}`, city_id: city.id, seo_url: `zz-sec-h-${RUN}`, status: "inactive" }, true);
  assert.equal(res.status, 201, await res.text());
  ID.hospital = (await db.query("select id from hospitals where seo_url=?", [`zz-sec-h-${RUN}`]))[0].id;
  await jsonSectionTest("hospital section", "/api/hospitals", "hospital_sections", "hospital_id", ID.hospital);
});

async function flatSectionTest(label, parentPath, table, parentColumn, parentId) {
  const created = await send("POST", `${parentPath}/${parentId}/sections`, { title: "T", content: EVIL });
  assert.equal(created.status, 201, `${label} create: ${await created.text()}`);
  const [row] = await db.query(`select id, title, content from ${table} where ${parentColumn}=? order by id desc limit 1`, [parentId]);
  assertClean(row.content, `${label} create`);
  assert.equal(row.title, "T");
  const up = await send("PUT", `${parentPath}/${parentId}/sections/${row.id}`, { content: EVIL_UPDATE });
  assert.equal(up.status, 200, `${label} update: ${await up.text()}`);
  assertClean((await db.query(`select content c from ${table} where id=?`, [row.id]))[0].c, `${label} update`);
}

test("global treatment section (flat content): sanitized on create and update", async () => {
  assert.ok(ID.globalTreatment);
  await flatSectionTest("global treatment section", "/api/global-treatments", "global_treatment_sections", "global_treatment_id", ID.globalTreatment);
});

test("global speciality section (flat content): sanitized on create and update", async () => {
  const res = await send("POST", "/api/global-specialities", { speciality_name: `Sec GS ${RUN}`, seo_url: `zz-sec-gs-${RUN}`, status: "inactive" }, true);
  assert.equal(res.status, 201, await res.text());
  ID.globalSpeciality = (await db.query("select id from global_specialities where seo_url=?", [`zz-sec-gs-${RUN}`]))[0].id;
  await flatSectionTest("global speciality section", "/api/global-specialities", "global_speciality_sections", "global_speciality_id", ID.globalSpeciality);
});
