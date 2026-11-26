const express = require("express");
const { verifyToken, readCookie } = require("./jwt");

const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const STYLE = `
  :root { --bg:#f4f6fb; --card:#fff; --text:#1f2937; --muted:#6b7280; --border:#e5e7eb;
          --primary:#2563eb; --primary-dark:#1d4ed8; --nav:#0f172a; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; flex-direction:column;
         font-family: system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif;
         background:var(--bg); color:var(--text); }
  header { background:var(--nav); color:#fff; padding:14px 24px;
           display:flex; align-items:center; justify-content:space-between; }
  .brand { font-weight:600; font-size:16px; }
  .brand span { color:#93c5fd; font-weight:400; }
  .nav-right { display:flex; align-items:center; gap:12px; font-size:14px; color:#cbd5e1; }
  .nav-right form { margin:0; }
  main { flex:1; display:flex; justify-content:center; align-items:flex-start; padding:56px 16px; }
  .card { background:var(--card); width:100%; max-width:440px; border:1px solid var(--border);
          border-radius:14px; padding:32px; box-shadow:0 12px 32px rgba(15,23,42,.07); }
  .card.wide { max-width:760px; overflow-x:auto; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th, td { text-align:left; padding:10px 8px; border-bottom:1px solid var(--border); }
  h1 { font-size:22px; margin:0 0 6px; }
  .sub { color:var(--muted); margin:0 0 24px; font-size:14px; }
  label { display:block; font-size:14px; font-weight:500; margin-bottom:6px; }
  input { width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:8px;
          font-size:15px; margin-bottom:18px; font-family:inherit; }
  input:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 3px rgba(37,99,235,.18); }
  .row { display:flex; gap:12px; }
  .row > div { flex:1; }
  .btn { width:100%; padding:11px; border:0; border-radius:8px; background:var(--primary);
         color:#fff; font-size:15px; font-weight:600; cursor:pointer; }
  .btn:hover { background:var(--primary-dark); }
  .btn-ghost { background:transparent; border:1px solid #475569; color:#e2e8f0;
               padding:6px 12px; border-radius:6px; font-size:13px; cursor:pointer; }
  .btn-ghost:hover { background:#1e293b; }
  .alert { padding:10px 12px; border-radius:8px; font-size:14px; margin-bottom:18px; }
  .alert.ok { background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; }
  .alert.err { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
  .switch { text-align:center; font-size:14px; color:var(--muted); margin:18px 0 0; }
  .switch a { color:var(--primary); }
  footer { text-align:center; color:var(--muted); font-size:12px; padding:20px; }
`;

const page = (title, body, user, wide) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Results Page</title><style>${STYLE}</style></head>
<body>
  <header>
    <div class="brand">Results Page <span>· Data Collection System</span></div>
    ${
      user
        ? `<div class="nav-right">Signed in as <strong>${escape(user)}</strong>
      <form method="post" action="/logout"><button class="btn-ghost">Log out</button></form></div>`
        : ""
    }
  </header>
  <main><div class="card${wide ? " wide" : ""}">${body}</div></main>
  <footer>ACIT3495 · Group 17</footer>
</body></html>`;

const alert = (msg, kind) =>
  msg ? `<div class="alert ${kind}">${escape(msg)}</div>` : "";

const loginForm = (msg = "", kind = "err") =>
  page(
    "Login",
    `
  <h1>Welcome back</h1>
  <p class="sub">Sign in to access student grades.</p>
  ${alert(msg, kind)}
  <form method="post" action="/login">
    <label for="username">Username</label>
    <input id="username" name="username" required maxlength="50" autocomplete="username">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required maxlength="100" autocomplete="current-password">
    <button class="btn">Sign in</button>
  </form>
  <p class="switch">No account? <a href="/register">Register</a></p>`,
  );

const registerForm = (msg = "") =>
  page(
    "Register",
    `
  <h1>Create an account</h1>
  <p class="sub">Register to access student grades.</p>
  ${alert(msg, "err")}
  <form method="post" action="/register">
    <label for="username">Username</label>
    <input id="username" name="username" required minlength="3" maxlength="50" pattern="[A-Za-z0-9_.\\-]+" autocomplete="username">
    <label for="password">Password (at least 8 characters)</label>
    <input id="password" name="password" type="password" required minlength="8" maxlength="100" autocomplete="new-password">
    <button class="btn">Register</button>
  </form>
  <p class="switch">Already registered? <a href="/login">Sign in</a></p>`,
  );

const resultsPage = (user, docs, error = "") => {
  const columns = [
    ["course_code", "Course"],
    ["total_submissions", "Count"],
    ["min_grade", "Min"],
    ["max_grade", "Max"],
    ["avg_grade", "Average"],
  ];
  const rows = docs
    .map((d) => `<tr>${columns.map(([k]) => `<td>${escape(d[k] ?? "")}</td>`).join("")}</tr>`)
    .join("");
  let content = `<table><thead><tr>${columns.map(([, label]) => `<th>${label}</th>`).join("")}</tr></thead>
  <tbody>${rows}</tbody></table>`;
  if (!docs.length) content = `<p class="sub">No results yet.</p>`;
  if (error) content = alert(error, "err");
  return page(
    "Results",
    `<h1>Course results</h1>
  <p class="sub">Grade statistics calculated by the analytics service.</p>
  ${content}`,
    user,
    true,
  );
};

const COOKIE = "results.token";
const COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax", path: "/" };

function createApp({ authUrl, jwtSecret, store }) {
  const app = express();
  app.disable("x-powered-by");
  // Health check: the app is only healthy if it can reach MongoDB
  app.get("/health", async (req, res) => {
    try {
      await store.ping();
      res.json({ status: "ok" });
    } catch (err) {
      console.error("health: mongodb unavailable:", err.message);
      res.status(503).json({ status: "mongodb unavailable" });
    }
  });

  app.use(express.urlencoded({ extended: false, limit: "10kb" }));

  // Logged out: everything except /register goes to /login.
  // Logged in: /login and /register go to the main page.
  app.use((req, res, next) => {
    // The JWT is checked on every request, so expired tokens stop working
    const claims = verifyToken(readCookie(req, COOKIE), jwtSecret);
    req.user = claims ? claims.sub : null;

    // Express ignores case and trailing slashes, so match the same way
    const path = req.path.toLowerCase().replace(/\/+$/, "");
    const isAuthPage = path === "/login" || path === "/register";
    if (req.user) {
      return isAuthPage ? res.redirect("/results") : next();
    }
    return isAuthPage ? next() : res.redirect("/login");
  });

  const callAuth = (route, body) =>
    fetch(`${authUrl}${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });

  app.get("/login", (req, res) =>
    res.send(
      req.query.registered
        ? loginForm("Account created. You can sign in now.", "ok")
        : loginForm(),
    ),
  );

  app.get("/register", (req, res) => res.send(registerForm()));

  app.post("/register", async (req, res) => {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const fail = (status, msg) => res.status(status).send(registerForm(msg));

    if (!/^[A-Za-z0-9_.-]{3,50}$/.test(username))
      return fail(400, "Username must be 3-50 letters, numbers, dots, dashes or underscores");
    if (password.length < 8 || password.length > 100)
      return fail(400, "Password must be 8-100 characters");

    let authRes;
    try {
      authRes = await callAuth("/register", { username, password });
    } catch (err) {
      console.error("register: auth service unreachable:", err.message);
      return fail(503, "Registration is temporarily unavailable, try again shortly");
    }

    if (authRes.status === 201) return res.redirect("/login?registered=1");
    if (authRes.status === 409) return fail(409, "That username is already taken");
    if (authRes.status === 400) return fail(400, "Registration details were rejected");
    console.error(`register: auth status ${authRes.status}`);
    return fail(503, "Registration is temporarily unavailable, try again shortly");
  });

  app.post("/login", async (req, res) => {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    if (!username || !password)
      return res
        .status(400)
        .send(loginForm("Username and password are required"));

    let authRes;
    try {
      authRes = await callAuth("/login", { username, password });
    } catch (err) {
      console.error("login: auth service unreachable:", err.message);
      return res
        .status(503)
        .send(loginForm("Login is temporarily unavailable, try again shortly"));
    }

    if (authRes.status >= 500) {
      console.error(`login: auth status ${authRes.status}`);
      return res
        .status(503)
        .send(loginForm("Login is temporarily unavailable, try again shortly"));
    }

    if (authRes.status !== 200) {
      console.warn(
        `login failed for "${username}" (auth status ${authRes.status})`,
      ); // never log the password
      return res.status(401).send(loginForm("Invalid username or password"));
    }

    const body = await authRes.json().catch(() => null);
    const claims = verifyToken(body?.token, jwtSecret);
    if (!claims) {
      console.error("login: invalid token from auth service, check that JWT_SECRET matches");
      return res
        .status(503)
        .send(loginForm("Login is temporarily unavailable, try again shortly"));
    }

    res.cookie(COOKIE, body.token, {
      ...COOKIE_OPTIONS,
      expires: new Date(claims.exp * 1000),
    });
    console.info(`login ok for "${claims.sub}"`);
    res.redirect("/results");
  });

  app.post("/logout", (req, res) => {
    res.clearCookie(COOKIE, COOKIE_OPTIONS);
    res.redirect("/login");
  });

  app.get("/results", async (req, res) => {
    try {
      const docs = await store.fetchMongoData();
      res.send(resultsPage(req.user, docs));
    } catch (err) {
      console.error("results: mongodb query failed:", err.message);
      res
        .status(503)
        .send(resultsPage(req.user, [], "Results are unavailable, try again shortly"));
    }
  });

  app.use((req, res) => res.redirect("/results"));

  return app;
}

module.exports = { createApp };
