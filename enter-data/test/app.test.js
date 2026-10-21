const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { createApp } = require('../src/app');
const { validateGrade } = require('../src/validate');

function fakePool() {
  const calls = [];
  return {
    calls,
    query: async () => [[{ 1: 1 }]],
    execute: async (sql, params) => { calls.push(params); return [{ insertId: 1 }]; },
  };
}
const make = (pool) => createApp({ pool, authUrl: 'http://auth', sessionSecret: 'test' });

test('validation rejects bad input', () => {
  assert.ok(validateGrade({ student_id: 'x', course_code: 'ACIT3495', score: '50' }).errors.length);
  assert.ok(validateGrade({ student_id: 'A01234567', course_code: 'ACIT3495', score: '150' }).errors.length);
  assert.equal(validateGrade({ student_id: 'a01234567', course_code: 'acit3495', score: '88' }).errors.length, 0);
});

test('/enter redirects to login when not logged in', async () => {
  const res = await request(make(fakePool())).get('/enter');
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/login');
});

test('bad credentials return 401', async (t) => {
  t.mock.method(global, 'fetch', async () => ({ status: 401 }));
  await request(make(fakePool())).post('/login').type('form')
    .send({ username: 'u', password: 'wrong' }).expect(401);
});

test('logged-in user can save a grade', async (t) => {
  t.mock.method(global, 'fetch', async () => ({ status: 200 }));
  const pool = fakePool();
  const agent = request.agent(make(pool));
  await agent.post('/login').type('form').send({ username: 'u', password: 'p' }).expect(302);
  await agent.post('/enter').type('form')
    .send({ student_id: 'A01234567', course_code: 'acit3495', score: '88.5' }).expect(201);
  assert.deepEqual(pool.calls[0], ['A01234567', 'ACIT3495', 88.5]);
});
