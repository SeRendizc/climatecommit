import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { buildReport } from '../lib/pipeline.mjs';
import { loadScenario, replay } from '../lib/scenario.mjs';

const schemeId = 'hk-e-bus-600';
const stageIds = [
  'funding_reserved',
  'scheme_launched',
  'procurement_preparation',
  'ordered',
  'delivered_registered',
];
const caseConfig = {
  schemeId,
  stages: stageIds.map((id) => ({ id, label: id, target: null, description: '' })),
};

function fixture(text, stage, { sourceId = 'source', phase = 'baseline', ...overrides } = {}) {
  const source = {
    id: sourceId,
    title: 'Synthetic QA fixture',
    url: 'https://www.info.gov.hk/gia/general/202610/07/P2026100600231.htm',
    publishedAt: '2026-10-07',
    language: 'en',
    phase,
    chunks: [{ id: 'p1', locator: 'Paragraph 1', text }],
  };
  const candidate = {
    id: `${sourceId}-candidate`,
    sourceId,
    chunkId: 'p1',
    quote: text,
    stage,
    schemeId,
    note: 'Synthetic QA fixture',
    ...overrides,
  };
  return { source, candidate };
}

function run(fixtures, includeHoldout = false) {
  return buildReport({
    caseConfig,
    sources: fixtures.map(({ source }) => source),
    candidates: fixtures.map(({ candidate }) => candidate),
    includeHoldout,
  });
}

function resultFor(report, stage) {
  const result = report.stageResults.find(({ id }) => id === stage);
  assert.ok(result, `Missing stage ${stage}`);
  return result;
}

const positives = [
  ['funding_reserved', 'The government earmarked HK$470 million for procurement of about 600 electric buses.'],
  ['scheme_launched', 'The government launched the Electric Bus Subsidy Scheme for about 600 electric buses.'],
  ['procurement_preparation', 'The franchised bus operators commenced preparations for the tendering exercises for about 600 e-buses.'],
  ['ordered', 'The operators placed purchase orders for about 600 e-buses under the Electric Bus Subsidy Scheme.'],
  ['delivered_registered', 'The operators completed delivery and registration of about 600 e-buses under the Electric Bus Subsidy Scheme.'],
];

for (const [stage, text] of positives) {
  test(`confirms explicit ${stage} evidence and preserves the quote location`, () => {
    const input = fixture(text, stage);
    const report = run([input]);
    const result = resultFor(report, stage);

    assert.equal(result.status, 'confirmed');
    assert.equal(result.evidence.length, 1);
    assert.equal(result.evidence[0].quote, text);
    assert.equal(result.evidence[0].source.id, input.source.id);
    assert.equal(result.evidence[0].source.url, input.source.url);
    assert.equal(result.evidence[0].locator, 'Paragraph 1');
    assert.equal(report.stageResults.filter(({ status }) => status === 'confirmed').length, 1);
  });
}

const rejectedCandidates = [
  ['funding reservation as an order', 'ordered', positives[0][1], {}],
  ['tender preparations as an order', 'ordered', positives[2][1], {}],
  ['franchised fleet totals as scheme deliveries', 'delivered_registered', 'As at the end of the year, 600 electric buses had been registered across the entire Hong Kong bus fleet.', {}],
  ['future delivery date as an accomplishment', 'delivered_registered', 'The operators expect to complete delivery and registration of about 600 e-buses by the end of 2029.', {}],
  ['a future earmark as reserved funding', 'funding_reserved', 'HK$470 million will be earmarked for about 600 electric buses.', {}],
  ['a future announcement as scheme launch', 'scheme_launched', 'The Electric Bus Subsidy Scheme will be launched next month.', {}],
  ['planned preparations as ongoing preparations', 'procurement_preparation', 'The operators plan to commence preparations for the tendering exercises for about 600 e-buses.', {}],
  ['negated order language', 'ordered', 'No purchase orders were placed for the 600 e-buses under the Electric Bus Subsidy Scheme.', {}],
  ['negation omitted from an otherwise verbatim quote', 'ordered', 'No purchase orders were placed for the 600 e-buses under the Electric Bus Subsidy Scheme.', { quote: 'purchase orders were placed for the 600 e-buses under the Electric Bus Subsidy Scheme.' }],
  ['a completed taxi order mentioned next to the bus scheme', 'ordered', 'The Electric Bus Subsidy Scheme targets about 600 e-buses. Taxi operators placed purchase orders for 500 electric taxis.', { quote: 'Taxi operators placed purchase orders for 500 electric taxis.' }],
  ['fabricated quote', 'ordered', positives[2][1], { quote: positives[3][1] }],
  ['wrong chunk', 'ordered', positives[3][1], { chunkId: 'not-a-chunk' }],
  ['wrong source', 'ordered', positives[3][1], { sourceId: 'not-a-source' }],
  ['mismatched scheme', 'ordered', positives[3][1], { schemeId: 'hk-electric-taxi' }],
];

for (const [scenario, stage, text, overrides] of rejectedCandidates) {
  test(`does not accept ${scenario}`, () => {
    const input = fixture(text, stage);
    Object.assign(input.candidate, overrides);
    const report = run([input]);
    const result = resultFor(report, stage);

    assert.notEqual(result.status, 'confirmed');
    assert.equal(result.evidence.length, 0);
    assert.ok(report.reviews.some(({ id, reason }) => id === input.candidate.id && reason));
  });
}

test('does not treat an unsupported payment stage as a milestone', () => {
  const input = fixture(positives[0][1], 'funding_paid');
  const report = run([input]);

  assert.deepEqual(report.stageResults.map(({ id }) => id), stageIds);
  assert.equal(report.stageResults.filter(({ status }) => status === 'confirmed').length, 0);
  assert.ok(report.reviews.some(({ id }) => id === input.candidate.id));
});

test('baseline excludes held-out evidence, replay updates only the supported milestone', () => {
  const baselineSource = fixture(positives[1][1], 'scheme_launched');
  const heldOutSource = fixture(positives[2][1], 'procurement_preparation', {
    sourceId: 'new-doc',
    phase: 'holdout',
  });
  const before = run([baselineSource, heldOutSource]);
  const after = run([baselineSource, heldOutSource], true);

  assert.deepEqual(before.scope, { documents: 1, phase: 'baseline' });
  assert.deepEqual(after.scope, { documents: 2, phase: 'holdout' });
  assert.equal(resultFor(before, 'procurement_preparation').status, 'not_found');
  assert.equal(resultFor(after, 'procurement_preparation').status, 'confirmed');
  assert.equal(resultFor(after, 'procurement_preparation').evidence[0].source.phase, 'holdout');
  for (const stage of stageIds.filter((id) => id !== 'procurement_preparation')) {
    assert.deepEqual(resultFor(before, stage), resultFor(after, stage));
  }
});

test('official corpus establishes the expected baseline and holdout delta', async () => {
  const [sources, candidates] = await Promise.all(
    ['sources.json', 'candidates.json'].map(async (file) =>
      JSON.parse(await readFile(new URL(`../data/${file}`, import.meta.url), 'utf8')),
    ),
  );
  const before = buildReport({ caseConfig, sources, candidates });
  const after = buildReport({ caseConfig, sources, candidates, includeHoldout: true });

  assert.deepEqual(
    before.stageResults.filter(({ status }) => status === 'confirmed').map(({ id }) => id),
    ['funding_reserved', 'scheme_launched'],
  );
  assert.deepEqual(
    after.stageResults.filter(({ status }) => status === 'confirmed').map(({ id }) => id),
    ['funding_reserved', 'scheme_launched', 'procurement_preparation'],
  );
  assert.equal(resultFor(after, 'ordered').status, 'not_found');
  assert.equal(resultFor(after, 'delivered_registered').status, 'not_found');
  assert.equal(after.reviews.length, 0);
});

test('real replay extracts holdout candidates even if every precomputed holdout candidate is removed', async () => {
  const scenario = await loadScenario();
  const baselineIds = new Set(scenario.sources.filter(({ phase }) => phase === 'baseline').map(({ id }) => id));
  const withoutHoldoutCandidates = {
    ...scenario,
    candidates: scenario.candidates.filter(({ sourceId }) => baselineIds.has(sourceId)),
  };
  const actual = replay(withoutHoldoutCandidates);

  assert.deepEqual(actual.delta, [{ stage: 'procurement_preparation', before: 'not_found', after: 'confirmed' }]);
  assert.equal(resultFor(actual.report, 'ordered').status, 'not_found');
  assert.equal(resultFor(actual.report, 'delivered_registered').status, 'not_found');
  const [evidence] = resultFor(actual.report, 'procurement_preparation').evidence;
  assert.equal(evidence.source.phase, 'holdout');
  assert.match(evidence.quote, /preparations? for the tendering exercises/i);
  assert.equal(resultFor(scenario.baseline, 'procurement_preparation').status, 'not_found');
  assert.deepEqual(replay(withoutHoldoutCandidates), actual);
});
