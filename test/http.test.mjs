import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../server.mjs';
import { loadScenario } from '../lib/scenario.mjs';

test('HTTP endpoint serves the baseline and replays the official holdout without mutating it', async (t) => {
  const scenario = await loadScenario();
  const server = createApp(scenario).listen(0, '127.0.0.1');
  t.after(() => server.close());
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;

  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/i);
  assert.match(await page.text(), /ClimateCommit/i);

  const beforeResponse = await fetch(`${base}/api/case`);
  assert.equal(beforeResponse.status, 200);
  const before = await beforeResponse.json();
  assert.equal(before.case.schemeId, 'hk-e-bus-600');
  assert.equal(before.baseline.scope.phase, 'baseline');

  const replayResponse = await fetch(`${base}/api/replay`, { method: 'POST' });
  assert.equal(replayResponse.status, 200);
  const result = await replayResponse.json();
  assert.deepEqual(result.delta, [{ stage: 'procurement_preparation', before: 'not_found', after: 'confirmed' }]);
  assert.equal(result.report.scope.phase, 'holdout');
  assert.ok(result.trace.length > 0);

  const afterResponse = await fetch(`${base}/api/case`);
  assert.equal(afterResponse.status, 200);
  assert.deepEqual(await afterResponse.json(), before);
});
