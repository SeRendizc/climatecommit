import { readFile, writeFile } from 'node:fs/promises'
import { loadScenario } from '../lib/scenario.mjs'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')
const embed = (value) => JSON.stringify(value).replaceAll('<', '\\u003c')
const localModule = (code, names) => `(() => {
${code.replace(/^export /gm, '')}
return { ${names.join(', ')} }
})()`

const [page, css, app, model, analyzer, snapshot, recording, benchmark, scenario] = await Promise.all([
  read('public/index.html'), read('public/styles.css'), read('public/app.js'), read('public/model.mjs'),
  read('lib/analyze.mjs'), read('data/official-demo.json'), read('data/agent-demo.json'),
  read('data/benchmark.json'), loadScenario(),
])
const recorded = JSON.parse(recording)
const official = JSON.parse(snapshot)
const roadmap = JSON.parse(benchmark).find(({ publishedAt, title }) =>
  publishedAt === '2024-12-10' && title.includes('Green Transformation Roadmap'))
if (official.url !== recorded.sourceUrl) throw new Error('Official snapshot and Codex recording refer to different documents')
if (!roadmap) throw new Error('The roadmap announcement snapshot is missing')
const script = `
const { calculate, DEFAULTS, POLICY } = ${localModule(model, ['calculate', 'DEFAULTS', 'POLICY'])}
const { analyzeUpdate } = ${localModule(analyzer, ['analyzeUpdate'])}
const officialSnapshot = ${embed(official)}
const roadmapSnapshot = ${embed(roadmap)}
const recordedCandidates = ${embed(recorded.candidates)}
const baselineConfig = ${embed({ caseConfig: scenario.caseConfig, baseline: scenario.baseline })}
globalThis.climateCommitOfflineReview = (input) => {
  const official = !('text' in input)
  const source = official
    ? (input.sample === 'roadmap' ? roadmapSnapshot : officialSnapshot)
    : { title: 'Pasted text', text: input.text }
  return analyzeUpdate(source, {
    ...baselineConfig, official,
    recordedCandidates: source === officialSnapshot ? recordedCandidates : undefined,
  })
}
${app.replace(/^import[^\n]*\n/, '')}
`
const html = page
  .replace('<link rel="stylesheet" href="/styles.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="/app.js"></script>', () => `<script type="module">\n${script}\n</script>`)
await writeFile(new URL('ClimateCommit-Demo.html', root), html)
console.log('Built ClimateCommit-Demo.html')
