// End-to-end smoke test for the REST API.
// Start the backend first (npm run dev), then run:  npm run test:api
// Optionally point it elsewhere:  API_URL=http://your-server/api npm run test:api
//
// It creates a task, reads, updates, changes status, deletes it, and checks
// the error cases. It cleans up after itself, so it is safe to run repeatedly.

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

async function request(method, path, body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const response = await fetch(`${API_URL}${path}`, options);
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

function check(name, condition, info = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${info}`);
  }
}

async function run() {
  console.log(`Testing API at ${API_URL}\n`);

  // Health
  const health = await request('GET', '/health');
  check('GET /health returns 200', health.status === 200, JSON.stringify(health.json));
  if (health.status !== 200) {
    console.log('\nThe API or database is not healthy; stopping here.');
    process.exit(1);
  }

  // Create
  const created = await request('POST', '/tasks', {
    title: '  Smoke test task  ',
    description: 'Created by apiSmokeTest.js',
    priority: 'high',
    due_date: '2030-12-31',
  });
  const task = created.json?.data;
  check('POST /tasks returns 201', created.status === 201, JSON.stringify(created.json));
  check('title is trimmed', task?.title === 'Smoke test task');
  check('priority normalized to HIGH', task?.priority === 'HIGH');
  check('status defaults to PENDING', task?.status === 'PENDING');
  check('due_date stored as YYYY-MM-DD', task?.due_date === '2030-12-31', task?.due_date);
  if (!task) process.exit(1);

  // Read all / search / filter / stats
  const all = await request('GET', '/tasks');
  check('GET /tasks lists the new task', all.json?.data?.some((t) => t.id === task.id));

  const search = await request('GET', `/tasks?search=${encodeURIComponent('smoke TEST')}`);
  check('search by title is case-insensitive', search.json?.data?.some((t) => t.id === task.id));

  const filtered = await request('GET', '/tasks?status=COMPLETED');
  check('status filter excludes pending task', !filtered.json?.data?.some((t) => t.id === task.id));

  const stats = await request('GET', '/tasks/stats');
  const s = stats.json?.data;
  check('GET /tasks/stats returns numbers', s && s.total === s.completed + s.pending, JSON.stringify(s));

  // Read one
  const one = await request('GET', `/tasks/${task.id}`);
  check('GET /tasks/:id returns the task', one.status === 200 && one.json.data.id === task.id);

  // Update
  const updated = await request('PUT', `/tasks/${task.id}`, {
    title: 'Smoke test task (edited)',
    priority: 'LOW',
    due_date: null,
  });
  check('PUT /tasks/:id returns 200', updated.status === 200, JSON.stringify(updated.json));
  check('title updated', updated.json?.data?.title === 'Smoke test task (edited)');
  check('due_date cleared', updated.json?.data?.due_date === null);
  check('description kept when omitted', updated.json?.data?.description === 'Created by apiSmokeTest.js');

  // Status
  const completed = await request('PATCH', `/tasks/${task.id}/status`, { status: 'COMPLETED' });
  check('PATCH status -> COMPLETED', completed.json?.data?.status === 'COMPLETED');
  const pending = await request('PATCH', `/tasks/${task.id}/status`, { status: 'PENDING' });
  check('PATCH status -> PENDING', pending.json?.data?.status === 'PENDING');

  // Error cases
  const invalidId = await request('GET', '/tasks/abc');
  check('invalid id returns 400', invalidId.status === 400);
  const negativeId = await request('GET', '/tasks/-5');
  check('negative id returns 400', negativeId.status === 400);
  const missing = await request('GET', '/tasks/999999999');
  check('missing task returns 404', missing.status === 404);
  const noTitle = await request('POST', '/tasks', { description: 'no title' });
  check('missing title returns 400', noTitle.status === 400 && noTitle.json?.errors?.title);
  const badPriority = await request('POST', '/tasks', { title: 'x', priority: 'URGENT' });
  check('invalid priority returns 400', badPriority.status === 400);
  const badDate = await request('POST', '/tasks', { title: 'x', due_date: '2026-02-30' });
  check('impossible date returns 400', badDate.status === 400);
  const badStatus = await request('PATCH', `/tasks/${task.id}/status`, { status: 'DONE' });
  check('invalid status returns 400', badStatus.status === 400);
  const badJson = await request('POST', '/tasks', '{ "title": ');
  check('malformed JSON returns 400', badJson.status === 400);
  const injection = await request('GET', `/tasks?search=${encodeURIComponent("' OR 1=1 --")}`);
  check('SQL-injection-style search returns no rows', injection.status === 200 && injection.json.count === 0);
  const unknownRoute = await request('GET', '/does-not-exist');
  check('unknown route returns 404', unknownRoute.status === 404);
  const updateMissing = await request('PUT', '/tasks/999999999', { title: 'x' });
  check('updating missing task returns 404', updateMissing.status === 404);

  // Delete
  const deleted = await request('DELETE', `/tasks/${task.id}`);
  check('DELETE /tasks/:id returns 200', deleted.status === 200);
  const afterDelete = await request('GET', `/tasks/${task.id}`);
  check('deleted task returns 404', afterDelete.status === 404);
  const deleteAgain = await request('DELETE', `/tasks/${task.id}`);
  check('deleting again returns 404', deleteAgain.status === 404);

  console.log(`\n${passed} passed, ${failed} failed`);
  // Set the exit code instead of calling process.exit(), which can crash
  // Node on Windows while fetch's keep-alive sockets are still closing.
  process.exitCode = failed === 0 ? 0 : 1;
}

run().catch((error) => {
  console.error('Smoke test could not run:', error.message);
  console.error('Is the backend running at', API_URL, '?');
  process.exit(1);
});
