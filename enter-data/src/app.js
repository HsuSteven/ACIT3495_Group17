const express = require("express");
const session = require("express-session");
const { validateGrade } = require("./validate");

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
  footer { text-align:center; color:var(--muted); font-size:12px; padding:20px; }
`;

const page = (title, body, user) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Grade Entry</title><style>${STYLE}</style></head>
<body>
  <header>
    <div class="brand">Grade Entry <span>· Data Collection System</span></div>
    ${
      user
        ? `<div class="nav-right">Signed in as <strong>${escape(user)}</strong>
      <form method="post" action="/logout"><button class="btn-ghost">Log out</button></form></div>`
        : ""
    }
  </header>
  <main><div class="card">${body}</div></main>
  <footer>ACIT3495 · Group 17</footer>
</body></html>`;

const alert = (msg, kind) =>
  msg ? `<div class="alert ${kind}">${escape(msg)}</div>` : "";

const loginForm = (msg = "") =>
  page(
    "Login",
    `
  <h1>Welcome back</h1>
  <p class="sub">Sign in to enter student grades.</p>
  ${alert(msg, "err")}
  <form method="post" action="/login">
    <label for="username">Username</label>
    <input id="username" name="username" required maxlength="50" autocomplete="username">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required maxlength="100" autocomplete="current-password">
    <button class="btn">Sign in</button>
  </form>`,
  );

const enterForm = (user, msg = "", kind = "ok") =>
  page(
    "Enter Grade",
    `
  <h1>Enter a grade</h1>
  <p class="sub">Grades are saved to the database and included in the next analytics run.</p>
  ${alert(msg, kind)}
  <form method="post" action="/enter">
    <label for="student_id">Student ID</label>
    <input id="student_id" name="student_id" required placeholder="A01234567" maxlength="9">
    <div class="row">
      <div>
        <label for="course_code">Course code</label>
        <input id="course_code" name="course_code" required placeholder="ACIT3495" maxlength="8">
      </div>
      <div>
        <label for="score">Score</label>
        <input id="score" name="score" type="number" min="0" max="100" step="0.01" required placeholder="0–100">
      </div>
    </div>
    <button class="btn">Save grade</button>
  </form>`,
    user,
  );

function createApp({ pool, authUrl, sessionSecret }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 1000 },
    }),
  );

  const requireAuth = (req, res, next) =>
    req.session.user ? next() : res.redirect("/login");

  // Health check: the app is only healthy if it can reach MySQL
  app.get("/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok" });
    } catch (err) {
      console.error("health: mysql unavailable:", err.code || err.message);
      res.status(503).json({ status: "mysql unavailable" });
    }
  });

  app.get("/", (req, res) =>
    res.redirect(req.session.user ? "/enter" : "/login"),
  );
  app.get("/login", (req, res) => res.send(loginForm()));

  app.post("/login", async (req, res) => {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    if (!username || !password)
      return res
        .status(400)
        .send(loginForm("Username and password are required"));

    let authRes;
    try {
      authRes = await fetch(`${authUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(3000),
      });
    } catch (err) {
      console.error("login: auth service unreachable:", err.message);
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

    req.session.regenerate((err) => {
      if (err) return res.status(500).send(loginForm("Session error"));
      req.session.user = username;
      console.info(`login ok for "${username}"`);
      res.redirect("/enter");
    });
  });

  app.post("/logout", (req, res) =>
    req.session.destroy(() => res.redirect("/login")),
  );

  app.get("/enter", requireAuth, (req, res) =>
    res.send(enterForm(req.session.user)),
  );

  app.post("/enter", requireAuth, async (req, res) => {
    const { errors, value } = validateGrade(req.body);
    if (errors.length)
      return res
        .status(400)
        .send(enterForm(req.session.user, errors.join(". "), "err"));

    try {
      // Parameterized query: protects against SQL injection
      await pool.execute(
        "INSERT INTO grades (student_id, course_code, score) VALUES (?, ?, ?)",
        [value.studentId, value.courseCode, value.score],
      );
      console.info(
        `grade saved by "${req.session.user}": ${value.courseCode} ${value.score}`,
      );
      res
        .status(201)
        .send(
          enterForm(
            req.session.user,
            `Saved ${value.studentId} / ${value.courseCode} = ${value.score}`,
          ),
        );
    } catch (err) {
      console.error("insert failed:", err.code || err.message);
      res
        .status(503)
        .send(
          enterForm(
            req.session.user,
            "Database unavailable, grade NOT saved. Try again shortly.",
            "err",
          ),
        );
    }
  });

  return app;
}

module.exports = { createApp };
