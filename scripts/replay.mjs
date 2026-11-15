import { loadScenario, replay } from '../lib/scenario.mjs'

const scenario = await loadScenario()
console.log(JSON.stringify(replay(scenario), null, 2))
