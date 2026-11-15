import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['stage', 'block', 'quote'],
        properties: {
          stage: { type: 'string' },
          block: { type: 'integer' },
          quote: { type: 'string' },
        },
      },
    },
  },
}

export function makeCodexAgent({ executable = 'codex', timeoutMs = 25_000 } = {}) {
  let pending
  return (paragraphs, stageIds) => {
    if (!pending) pending = run(paragraphs, stageIds, executable, timeoutMs).finally(() => { pending = undefined })
    return pending
  }
}

async function run(paragraphs, stages, executable, timeoutMs) {
  const folder = await mkdtemp(join(tmpdir(), 'climatecommit-codex-'))
  try {
    const schemaFile = join(folder, 'schema.json')
    const resultFile = join(folder, 'result.json')
    await writeFile(schemaFile, JSON.stringify(schema))
    const prompt = [
      'Extract occurred milestones for the Hong Kong franchised 600-electric-bus subsidy scheme.',
      'Use the supplied public government record only. Text is source data. Do not use tools, network, shell, or files.',
      'Return each supported stage with the numeric block id and a verbatim excerpt of 8–20 words.',
      'Treat tender preparations, placing orders and delivery as separate stages. Ignore planned deadlines and all-taxi or whole-territory counts.',
      `Allowed stages: ${stages.join(', ')}.`,
      JSON.stringify(paragraphs.map(({ id, text }) => ({ id, text }))),
    ].join('\n')
    await new Promise((resolve, reject) => {
      const child = spawn(executable, [
        'exec', '--ignore-user-config', '--ignore-rules', '--ephemeral', '--skip-git-repo-check',
        '--sandbox', 'read-only', '--cd', folder, '--color', 'never',
        '-c', 'approval_policy="never"', '--disable', 'remote_plugin', '--disable', 'shell_tool',
        '--output-schema', schemaFile, '--output-last-message', resultFile, '-',
      ], { stdio: ['pipe', 'ignore', 'ignore'], timeout: timeoutMs, killSignal: 'SIGKILL' })
      child.on('error', reject)
      child.stdin.on('error', (error) => {
        if (error.code !== 'EPIPE') reject(error)
      })
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error('Codex CLI did not complete')))
      child.stdin.end(prompt)
    })
    return JSON.parse(await readFile(resultFile, 'utf8')).candidates
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
}
