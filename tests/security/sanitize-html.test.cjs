const test = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeHtmlServer, sanitizeOptionalHtml } = require("../../lib/sanitize-html.server.ts");

const DANGEROUS = [
  `<img src=x onerror="window.__x=1">`,
  `<script>window.__x=1</script>`,
  `<a href="javascript:alert(1)">x</a>`,
  `<a href="  JaVaScRiPt:alert(1)">x</a>`,
  `<a href="java&#x09;script:alert(1)">x</a>`,
  `<iframe src="https://evil.example"></iframe>`,
  `<svg onload="window.__x=1"><circle/></svg>`,
  `<math><mtext><script>window.__x=1</script></mtext></math>`,
  `<p style="background:url(javascript:alert(1))" onclick="window.__x=1">x</p>`,
  `<object data="x"></object><embed src="x"><form action="https://evil.example"><input name=a></form>`,
  `<img src="data:text/html;base64,PHNjcmlwdD4=">`,
  `<a href="data:text/html,<script>alert(1)</script>">x</a>`,
  `<base href="https://evil.example"><meta http-equiv="refresh" content="0;url=https://evil.example">`,
];

for (const payload of DANGEROUS) {
  test(`neutralizes: ${payload.slice(0, 60)}`, () => {
    const out = sanitizeHtmlServer(`<p>ok</p>${payload}`);
    assert.doesNotMatch(out, /<script|<iframe|<svg|<math|<object|<embed|<form|<input|<base|<meta|<style/i);
    assert.doesNotMatch(out, /\son\w+\s*=/i);
    assert.doesNotMatch(out, /javascript:|vbscript:|data:/i);
    assert.doesNotMatch(out, /\sstyle\s*=/i);
    assert.match(out, /<p>ok<\/p>/);
  });
}

test("keeps legitimate CMS formatting", () => {
  const html =
    `<h2>Title</h2><p>Some <strong>bold</strong>, <em>italic</em> and <u>underlined</u> text with a ` +
    `<a href="https://example.com/x?a=1" target="_blank">link</a> and <a href="/hospitals">internal</a> and <a href="mailto:a@b.co">mail</a>.</p>` +
    `<ul><li>One</li><li>Two</li></ul><ol><li>A</li></ol><blockquote><p>Quote</p></blockquote>` +
    `<img src="/uploads/pages/a.jpg" alt="A" class="rte-img" data-align="center"><hr>` +
    `<table><thead><tr><th colspan="2">H</th></tr></thead><tbody><tr><td>1</td><td rowspan="2">2</td></tr></tbody></table>`;
  const out = sanitizeHtmlServer(html);

  for (const fragment of ["<h2>Title</h2>", "<strong>bold</strong>", "<em>italic</em>", "<u>underlined</u>", `href="https://example.com/x?a=1"`, `href="/hospitals"`, `href="mailto:a@b.co"`, "<li>Two</li>", "<ol>", "<blockquote>", `src="/uploads/pages/a.jpg"`, `alt="A"`, `data-align="center"`, "<hr>", "<table>", `colspan="2"`, `rowspan="2"`]) {
    assert.ok(out.includes(fragment), `missing ${fragment} in ${out}`);
  }
});

test("external links get rel=noopener noreferrer", () => {
  const out = sanitizeHtmlServer(`<a href="https://example.com" target="_blank">x</a>`);
  assert.match(out, /rel="noopener noreferrer"/);
});

test("sanitizeOptionalHtml passes null/undefined through and cleans strings", () => {
  assert.equal(sanitizeOptionalHtml(undefined), undefined);
  assert.equal(sanitizeOptionalHtml(null), null);
  assert.equal(sanitizeOptionalHtml(`<p>a</p><script>x</script>`), "<p>a</p>");
});

test("is idempotent (legacy + re-saved content)", () => {
  const once = sanitizeHtmlServer(`<p>a</p><img src=x onerror=1><a href="https://e.com" target="_blank">l</a>`);
  assert.equal(sanitizeHtmlServer(once), once);
});

const { sanitizeHtmlFields, sanitizeSectionPayload } = require("../../lib/sanitize-html.server.ts");

test("sanitizeHtmlFields cleans only the named string fields", () => {
  const out = sanitizeHtmlFields({ description: `<p>a</p><script>x</script>`, short_description: `<b onclick=1>plain</b>`, n: null }, ["description", "n", "missing"]);
  assert.equal(out.description, "<p>a</p>");
  assert.equal(out.short_description, `<b onclick=1>plain</b>`);
  assert.equal(out.n, null);
});

test("sanitizeSectionPayload cleans content.content only and passes other shapes through", () => {
  const out = sanitizeSectionPayload({ content: { heading: "<i>h</i>", content: `<p>a</p><img src=x onerror=1>`, image: "/u/x.png" } });
  assert.deepEqual(out.content, { heading: "<i>h</i>", content: `<p>a</p><img src="x">`, image: "/u/x.png" });
  const untouched = { content: { items: [1, 2] } };
  assert.equal(sanitizeSectionPayload(untouched), untouched);
  assert.deepEqual(sanitizeSectionPayload({}), {});
});

const { shouldUseSecureCookie, sessionCookieOptions } = require("../../lib/session/cookie-options.ts");

test("session cookie: Secure by default in production, test and unknown environments", () => {
  for (const NODE_ENV of ["production", "test", undefined, "staging", "Production"]) {
    assert.equal(shouldUseSecureCookie({ NODE_ENV }), true, String(NODE_ENV));
  }
  assert.equal(shouldUseSecureCookie({ NODE_ENV: "development" }), true, "dev is Secure unless explicitly opted out");
});

test("session cookie: the opt-out works only in development and only with the exact flag", () => {
  assert.equal(shouldUseSecureCookie({ NODE_ENV: "development", ALLOW_INSECURE_SESSION_COOKIE: "true" }), false);
  for (const flag of ["1", "TRUE", "yes", "false", ""]) {
    assert.equal(shouldUseSecureCookie({ NODE_ENV: "development", ALLOW_INSECURE_SESSION_COOKIE: flag }), true, `flag ${flag}`);
  }
  for (const NODE_ENV of ["production", "test", undefined, "staging"]) {
    assert.equal(shouldUseSecureCookie({ NODE_ENV, ALLOW_INSECURE_SESSION_COOKIE: "true" }), true, `opt-out ignored for ${NODE_ENV}`);
  }
});

test("session cookie: HttpOnly, SameSite=lax, path / are always set", () => {
  for (const env of [{ NODE_ENV: "production" }, { NODE_ENV: "development", ALLOW_INSECURE_SESSION_COOKIE: "true" }]) {
    assert.deepEqual(sessionCookieOptions(60, env), { httpOnly: true, secure: shouldUseSecureCookie(env), sameSite: "lax", path: "/", maxAge: 60 });
  }
});
