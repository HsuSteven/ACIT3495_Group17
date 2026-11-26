const { createApp } = require("./app");
const { createStore } = require("./db");

const required = ["AUTH_URL", "MONGO_URI", "JWT_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing environment variables:", missing.join(", "));
  process.exit(1);
}

const store = createStore(process.env.MONGO_URI);
if (Buffer.byteLength(process.env.JWT_SECRET) < 32) {
  console.error("JWT_SECRET must be at least 32 bytes");
  process.exit(1);
}

const app = createApp({
  authUrl: process.env.AUTH_URL,
  jwtSecret: process.env.JWT_SECRET,
  store,
});
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, () =>
  console.info(`show-results listening on port ${port}`),
);

process.on("SIGTERM", () =>
  server.close(() => store.close().then(() => process.exit(0))),
);
