// Save-time sanitization through the REAL create/update endpoints of the remaining rich-text resources
// (hospitals, health packages, testimonials: multipart; doctor pages, symptom parts, symptom articles: JSON).
// Local server + local DB only; synthetic records, deleted afterwards. Usage: npm run test:security:richtext
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
let db, cookie, userId;
const created = { hospitals: [], packages: [], testimonials: [], doctorPages: [], parts: [], symptoms: [], articles: [] };

const post = (path, body, multipart) =>
  fetch(BASE + path, { method: multipart ? "POST" : "POST", headers: { cookie, "x-forwarded-for": "203.0.113.150", ...(multipart ? {} : { "content-type": "application/json" }) }, body: multipart ? toForm(body) : JSON.stringify(body) });
const put = (path, body, multipart) =>
  fetch(BASE + path, { method: "PUT", headers: { cookie, "x-forwarded-for": "203.0.113.150", ...(multipart ? {} : { "content-type": "application/json" }) }, body: multipart ? toForm(body) : JSON.stringify(body) });
function toForm(o) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.append(k, v);
  return f;
}
function assertClean(html, label) {
  assert.ok(typeof html === "string" && html.length > 0, `${label}: empty`);
  assert.doesNotMatch(html, /<script|onerror|onclick|javascript:|<iframe/i, `${label}: unsafe markup survived: ${html}`);
  for (const keep of ["<h2>Head</h2>", "<strong>bold</strong>", 'href="https://example.com"', "<li>one</li>"]) assert.ok(html.includes(keep), `${label}: lost ${keep} in ${html}`);
}

before(async () => {
  db = await mariadb.createConnection({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  const [role] = await db.query("select id from roles where name='Super Admin' limit 1");
  const res = await db.query("insert into users (name,email,password,role_id,status) values (?,?,?,?,'active')", ["Sec RT", `zz-sec-${RUN}-rt@example.invalid`, bcrypt.hashSync("Correct-Horse-9", 10), role.id]);
  userId = Number(res.insertId);
  const login = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.150" }, body: JSON.stringify({ email: `zz-sec-${RUN}-rt@example.invalid`, password: "Correct-Horse-9" }) });
  cookie = login.headers.get("set-cookie").split(";")[0];
});

after(async () => {
  const del = async (sql, ids) => { for (const id of ids) await db.query(sql, [id]).catch((e) => console.error("cleanup", sql, e.message)); };
  await del("delete from symptom_articles where id=?", created.articles);
  await del("delete from symptoms where id=?", created.symptoms);
  await del("delete from symptom_parts where id=?", created.parts);
  await del("delete from doctor_pages where id=?", created.doctorPages);
  await del("delete from testimonials where id=?", created.testimonials);
  await del("delete from healthcheck_packs where id=?", created.packages);
  await del("delete from hospital_sections where hospital_id=?", created.hospitals);
  await del("delete from hospitals where id=?", created.hospitals);
  await db.query("delete from users where id=?", [userId]);
  await db.query("delete from rate_limit_events where bucket like 'login:%'");
  await db.end();
});

test("hospital (multipart): long_description sanitized on create and update", async () => {
  const [city] = await db.query("select id from cities where status='active' limit 1");
  const res = await post("/api/hospitals", { hospital_name: `Sec Hospital ${RUN}`, city_id: city.id, seo_url: `zz-sec-h-${RUN}`, long_description: EVIL, status: "inactive" }, true);
  assert.equal(res.status, 201, await res.text());
  const [row] = await db.query("select id, long_description from hospitals where seo_url=?", [`zz-sec-h-${RUN}`]);
  created.hospitals.push(row.id);
  assertClean(row.long_description, "hospital create");
  const up = await put(`/api/hospitals/${row.id}`, { long_description: EVIL_UPDATE }, true);
  assert.equal(up.status, 200, await up.text());
  assertClean((await db.query("select long_description d from hospitals where id=?", [row.id]))[0].d, "hospital update");
});

test("health package (multipart): package_inclusions sanitized on create and update", async () => {
  const res = await post("/api/health-packages", { package_title: `Sec Package ${RUN}`, seo_url: `zz-sec-hp-${RUN}`, package_inclusions: EVIL, status: "inactive" }, true);
  assert.equal(res.status, 201, await res.text());
  const [row] = await db.query("select id, package_inclusions from healthcheck_packs where seo_url=?", [`zz-sec-hp-${RUN}`]);
  created.packages.push(row.id);
  assertClean(row.package_inclusions, "package create");
  const up = await put(`/api/health-packages/${row.id}`, { package_inclusions: EVIL_UPDATE }, true);
  assert.equal(up.status, 200, await up.text());
  assertClean((await db.query("select package_inclusions d from healthcheck_packs where id=?", [row.id]))[0].d, "package update");
});

test("testimonial (multipart): description sanitized on create and update", async () => {
  const [lang] = await db.query("select id from languages limit 1");
  const [city] = await db.query("select id from cities where status='active' limit 1");
  const res = await post("/api/testimonials", { language_id: lang.id, testimonial_name: `Sec Testimonial ${RUN}`, seo_url: `zz-sec-t-${RUN}`, city_id: city.id, description: EVIL, status: "inactive" }, true);
  assert.equal(res.status, 201, await res.text());
  const [row] = await db.query("select id, description from testimonials where seo_url=?", [`zz-sec-t-${RUN}`]);
  created.testimonials.push(row.id);
  assertClean(row.description, "testimonial create");
  const up = await put(`/api/testimonials/${row.id}`, { description: EVIL_UPDATE }, true);
  assert.equal(up.status, 200, await up.text());
  assertClean((await db.query("select description d from testimonials where id=?", [row.id]))[0].d, "testimonial update");
});

test("doctor page (JSON): description sanitized on create and update", async () => {
  const [city] = await db.query("select id from cities where status='active' limit 1");
  const [speciality] = await db.query("select id from specialities where status='active' limit 1");
  const res = await post("/api/doctor-pages", { pagename: `Sec DP ${RUN}`, seo_url: `zz-sec-dp-${RUN}`, city_id: city.id, speciality_id: speciality.id, description: EVIL, status: "inactive" });
  assert.equal(res.status, 201, await res.text());
  const [row] = await db.query("select id, description from doctor_pages where seo_url=?", [`zz-sec-dp-${RUN}`]);
  created.doctorPages.push(row.id);
  assertClean(row.description, "doctor page create");
  const up = await put(`/api/doctor-pages/${row.id}`, { description: EVIL_UPDATE });
  assert.equal(up.status, 200, await up.text());
  assertClean((await db.query("select description d from doctor_pages where id=?", [row.id]))[0].d, "doctor page update");
});

test("symptom part (JSON): part_description sanitized on create and update", async () => {
  const res = await post("/api/symptom-parts", { part_name: `Sec Part ${RUN}`, seo_url: `zz-sec-sp-${RUN}`, part_description: EVIL });
  assert.equal(res.status, 201, await res.text());
  const [row] = await db.query("select id, part_description from symptom_parts where seo_url=?", [`zz-sec-sp-${RUN}`]);
  created.parts.push(row.id);
  assertClean(row.part_description, "symptom part create");
  const up = await put(`/api/symptom-parts/${row.id}`, { part_description: EVIL_UPDATE });
  assert.equal(up.status, 200, await up.text());
  assertClean((await db.query("select part_description d from symptom_parts where id=?", [row.id]))[0].d, "symptom part update");
});

test("symptom article (JSON): description sanitized on create and update", async () => {
  const partId = created.parts[0];
  assert.ok(partId, "needs the symptom part from the previous test");
  const sym = await db.query("insert into symptoms (part_id, symptom_name) values (?,?)", [partId, `Sec Symptom ${RUN}`]);
  created.symptoms.push(Number(sym.insertId));
  const res = await post("/api/symptom-articles", { article_name: `Sec Article ${RUN}`, part_id: partId, symptom_id: Number(sym.insertId), seo_url: `zz-sec-sa-${RUN}`, description: EVIL, status: "inactive" });
  assert.equal(res.status, 201, await res.text());
  const [row] = await db.query("select id, description from symptom_articles where seo_url=?", [`zz-sec-sa-${RUN}`]);
  created.articles.push(row.id);
  assertClean(row.description, "symptom article create");
  const up = await put(`/api/symptom-articles/${row.id}`, { description: EVIL_UPDATE });
  assert.equal(up.status, 200, await up.text());
  assertClean((await db.query("select description d from symptom_articles where id=?", [row.id]))[0].d, "symptom article update");
});
