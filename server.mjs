import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { loadScenario, replay } from './lib/scenario.mjs'
import { analyzeUpdate } from './lib/analyze.mjs'
import { makeCodexAgent } from './lib/codex.mjs'
import { canonicalOfficialUrl, downloadOfficial } from './lib/official.mjs'

const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/model.mjs', ['model.mjs', 'text/javascript']],
])
const json = (response, body, status = 200) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(body))
}

const demo = new URL('./data/official-demo.json', import.meta.url)

async function parseInput(request) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') return null
  const payload = []
  let size = 0
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length
    if (size > 256_000) return null
    payload.push(chunk)
  }
  try {
    const data = JSON.parse(Buffer.concat(payload).toString('utf8'))
    if (!data || Array.isArray(data) || typeof data !== 'object') return null
    if (Object.keys(data).some((key) => key !== 'text' && key !== 'url') || Object.keys(data).length > 1) return null
    if ('text' in data && (typeof data.text !== 'string' || data.text.length > 32_000 || !data.text.trim())) return null
    if ('url' in data) {
      if (typeof data.url !== 'string' || data.url.length > 500) return null
      data.url = canonicalOfficialUrl(data.url)
      if (!data.url) return null
    }
    return data
  } catch {
    return null
  }
}

export function createApp(scenario, { agent, recording } = {}) {
  return createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname
    try {
      if (request.method === 'GET' && pathname === '/api/case') {
        const { caseConfig, baseline } = scenario
        return json(response, { case: caseConfig, baseline })
      }
      if (request.method === 'POST' && pathname === '/api/replay') {
        return json(response, replay(scenario))
      }
      if (request.method === 'POST' && pathname === '/api/analyze') {
        const input = await parseInput(request)
        if (!input) return json(response, { error: 'Invalid analysis input' }, 400)
        const official = !('text' in input)
        let source
        if (input.url) {
          try {
            source = await downloadOfficial(input.url)
          } catch {
            return json(response, { error: 'Official page unavailable' }, 502)
          }
        } else {
          source = official ? JSON.parse(await readFile(demo, 'utf8')) : { title: 'Pasted text', text: input.text }
        }
        const recordedCandidates = !input.url && official && recording?.sourceUrl === source.url
          ? recording.candidates : undefined
        return json(response, await analyzeUpdate(source, { ...scenario, official, agent: input.url ? undefined : agent, recordedCandidates }))
      }
      const asset = files.get(pathname)
      if (request.method === 'GET' && asset) {
        const [file, type] = asset
        const body = await readFile(new URL(`./public/${file}`, import.meta.url))
        response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` })
        return response.end(body)
      }
      json(response, { error: '找不到此资源' }, 404)
    } catch (error) {
      console.error(error)
      json(response, { error: '无法读取案例或运行回放' }, 500)
    }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 4173)
  const scenario = await loadScenario()
  const recording = JSON.parse(await readFile(new URL('./data/agent-demo.json', import.meta.url), 'utf8'))
  const agent = process.env.CLIMATECOMMIT_CODEX === '1'
    ? makeCodexAgent({ timeoutMs: Number(process.env.CLIMATECOMMIT_CODEX_TIMEOUT ?? 25_000) })
    : undefined
  createApp(scenario, { agent, recording }).listen(port, '127.0.0.1', () => {
    console.log(`ClimateCommit AI http://127.0.0.1:${port}`)
  })
}
