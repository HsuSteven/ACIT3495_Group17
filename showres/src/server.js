const { createApp } = require('./app');
const { createPool } = require('./db');

const required = ['AUTH_URL', 'SESSION_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing environment variables:', missing.join(', '));
  process.exit(1);
}

const pool = createPool();
const app = createApp({ pool, authUrl: process.env.AUTH_URL, sessionSecret: process.env.SESSION_SECRET });
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.info(`enter-data listening on port ${port}`));

process.on('SIGTERM', () => server.close(() => pool.end().then(() => process.exit(0))));

