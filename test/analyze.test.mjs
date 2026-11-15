import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { loadScenario } from '../lib/scenario.mjs';
import { createApp } from '../server.mjs';

async function start(t, options) {
  const scenario = await loadScenario();
  const server = createApp(scenario, options).listen(0, '127.0.0.1');
  t.after(() => server.close());
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    getCase: () => fetch(`${base}/api/case`).then((response) => response.json()),
    analyze: (payload) => fetch(`${base}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  };
}

function stagesOf(result) {
  return Object.fromEntries(result.stages.map((stage) => [stage.id, stage]));
}

test('analyzes the bundled dated official reply and does not mutate the baseline', async (t) => {
  const app = await start(t);
  const initial = await app.getCase();
  const response = await app.analyze({});
  assert.equal(response.status, 200);
  const result = await response.json();
  const stages = stagesOf(result);

  assert.equal(result.mode, 'rules');
  assert.equal(result.publishedAt, '2026-10-07');
  assert.equal(result.url, 'https://www.info.gov.hk/gia/general/202610/07/P2026100600231.htm');
  assert.ok(result.reviewedParagraphs > 0);
  assert.equal(stages.funding_reserved.previous, true);
  assert.equal(stages.funding_reserved.status, 'unchanged');
  assert.equal(stages.procurement_preparation.previous, false);
  assert.equal(stages.procurement_preparation.status, 'confirmed');
  assert.match(stages.procurement_preparation.quote, /preparations for the tendering exercises/i);
  assert.ok(stages.procurement_preparation.locator);
  assert.doesNotMatch(stages.procurement_preparation.locator, /first registered EVs/i);
  assert.equal(stages.ordered.status, 'unchanged');
  assert.equal(stages.delivered_registered.status, 'unchanged');
  const findingCodes = result.findings.map(({ code, reason }) => code ?? reason);
  assert.ok(findingCodes.includes('target_only'));
  assert.ok(findingCodes.includes('other_scope'));
  assert.deepEqual(await app.getCase(), initial);
});

test('custom text is reviewed without assigning official source or promoting a milestone', async (t) => {
  const app = await start(t);
  const initial = await app.getCase();
  const text = [
    'The Electric Bus Subsidy Scheme targets about 600 e-buses. Taxi operators placed purchase orders for 500 electric taxis.',
    'The operators expect to complete delivery and registration of about 600 e-buses by the end of 2029.',
    'The operators placed purchase orders for about 600 e-buses under the Electric Bus Subsidy Scheme.',
  ].join('\n\n');
  const response = await app.analyze({ text });
  assert.equal(response.status, 200);
  const result = await response.json();
  const stages = stagesOf(result);

  assert.equal(result.mode, 'rules');
  assert.equal(result.reviewedParagraphs, 3);
  assert.ok(!result.url);
  assert.ok(!result.publishedAt);
  assert.equal(stages.ordered.status, 'unchanged');
  assert.equal(stages.delivered_registered.status, 'unchanged');
  assert.ok(result.findings.some(({ code }) => code === 'unverified_source'));
  assert.deepEqual(await app.getCase(), initial);
});

test('candidate adapter verifies exact evidence and rejects a fabricated completion', async (t) => {
  const app = await start(t, {
    agent: async (paragraphs) => {
      const { id } = paragraphs.find(({ text }) => text.includes('commenced preparations'));
      return [
        { stage: 'procurement_preparation', block: id, quote: 'commenced preparations for the tendering exercises' },
        { stage: 'delivered_registered', block: id, quote: 'completed vehicle delivery and registration of 600 electric buses' },
      ];
    },
  });
  const response = await app.analyze({});
  assert.equal(response.status, 200);
  const result = await response.json();
  const stages = stagesOf(result);

  assert.equal(result.mode, 'codex');
  assert.equal(result.proposed, 2);
  assert.equal(result.verified, 1);
  assert.equal(stages.procurement_preparation.origin, 'codex');
  assert.equal(stages.delivered_registered.status, 'unchanged');
  assert.ok(result.findings.some(({ code, stage }) => code === 'agent_rejected' && stage === 'delivered_registered'));
});

test('a rejected agent call returns an explicit rules result', async (t) => {
  const app = await start(t, { agent: async () => { throw new Error('Synthetic CLI failure'); } });
  const response = await app.analyze({});
  assert.equal(response.status, 200);
  const result = await response.json();

  assert.equal(result.mode, 'rules');
  assert.equal(result.agentStatus, 'unavailable');
  assert.equal(stagesOf(result).procurement_preparation.status, 'confirmed');
});

test('rejects unsupported text shape and oversized custom input', async (t) => {
  const app = await start(t);

  const invalid = await app.analyze({ text: 600 });
  assert.ok(invalid.status >= 400 && invalid.status < 500);
  const oversized = await app.analyze({ text: 'x'.repeat(32_001) });
  assert.ok(oversized.status >= 400 && oversized.status < 500);
});

test('disallows other hosts and simultaneous text and URL inputs', async (t) => {
  const app = await start(t);

  const unsupported = await app.analyze({ url: 'https://example.com/press-release.htm' });
  assert.equal(unsupported.status, 400);
  const ambiguous = await app.analyze({
    text: 'A pasted paragraph.',
    url: 'https://www.info.gov.hk/gia/general/202610/07/P2026100600231.htm',
  });
  assert.equal(ambiguous.status, 400);
});
