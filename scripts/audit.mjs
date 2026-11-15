import { readFile } from 'node:fs/promises'
import { buildReport } from '../lib/pipeline.mjs'
import { loadScenario } from '../lib/scenario.mjs'

const [sourceFile, candidateFile] = process.argv.slice(2)
if (Boolean(sourceFile) !== Boolean(candidateFile)) {
  console.error('用法：npm run audit [sources.json candidates.json]')
  process.exitCode = 2
} else {
  const scenario = await loadScenario()
  const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))
  const [sources, candidates] = sourceFile
    ? await Promise.all([readJson(sourceFile), readJson(candidateFile)])
    : [scenario.sources, scenario.candidates]
  const report = buildReport({
    caseConfig: scenario.caseConfig,
    sources,
    candidates,
    includeHoldout: true,
  })
  console.log(JSON.stringify(report, null, 2))
  if (report.reviews.length) process.exitCode = 1
}
