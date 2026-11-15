import { readFile } from 'node:fs/promises'
import { analyzeUpdate } from '../lib/analyze.mjs'
import { loadScenario } from '../lib/scenario.mjs'

const load = async (name) => JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8'))
const [scenario, demo, benchmark] = await Promise.all([loadScenario(), load('official-demo'), load('benchmark')])
let exact = 0
let falseUpgrades = 0
let missed = 0
for (const document of [demo, ...benchmark]) {
  const result = await analyzeUpdate(document, { ...scenario, official: true })
  const actual = new Set(result.stages.filter(({ status }) => status === 'confirmed').map(({ id }) => id))
  const expected = new Set(document.expectedStages)
  const extras = [...actual].filter((stage) => !expected.has(stage))
  const missing = [...expected].filter((stage) => !actual.has(stage))
  if (!extras.length && !missing.length) exact += 1
  falseUpgrades += extras.length
  missed += missing.length
  console.log(`${document.title}: ${[...actual].join(', ') || 'no confirmed stages'}`)
}
console.log(`Curated official regression set: ${exact}/${benchmark.length + 1} exact, ${falseUpgrades} false upgrades, ${missed} missed stages.`)
if (falseUpgrades || missed) process.exitCode = 1
