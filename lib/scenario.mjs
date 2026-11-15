import { readFile } from 'node:fs/promises'
import { buildReport, extractCandidates } from './pipeline.mjs'

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))

export async function loadScenario() {
  const [caseConfig, sources, candidates] = await Promise.all([
    readJson('../case.json'),
    readJson('../data/sources.json'),
    readJson('../data/candidates.json'),
  ])
  const baseline = buildReport({ caseConfig, sources, candidates })
  return { caseConfig, sources, candidates, baseline }
}

export function replay({ caseConfig, sources, candidates, baseline }) {
  const heldOut = sources.filter(({ phase }) => phase === 'holdout')
  const proposals = extractCandidates(heldOut, caseConfig.schemeId)
  const heldOutIds = new Set(heldOut.map(({ id }) => id))
  const baselineCandidates = candidates.filter(({ sourceId }) => !heldOutIds.has(sourceId))
  const report = buildReport({
    caseConfig,
    sources,
    candidates: [...baselineCandidates, ...proposals],
    includeHoldout: true,
  })
  const codexReference = candidates.filter(({ sourceId }) => heldOutIds.has(sourceId))
  const identity = ({ sourceId, chunkId, stage }) => JSON.stringify([sourceId, chunkId, stage])
  const predictedKeys = new Set(proposals.map(identity))
  const referenceKeys = new Set(codexReference.map(identity))
  const agreed = [...predictedKeys].filter((key) => referenceKeys.has(key)).length
  const delta = report.stageResults.flatMap(({ id, status }, index) => {
    const before = baseline.stageResults[index].status
    return before === status ? [] : [{ stage: id, before, after: status }]
  })
  const accepted = report.stageResults.reduce((total, stage) =>
    total + stage.evidence.filter(({ source }) => source.phase === 'holdout').length, 0)
  const trace = [
    { step: '导入', message: `读取 ${heldOut.length} 份增量文件，共 ${heldOut.reduce((sum, source) => sum + source.chunks.length, 0)} 个原文片段。` },
    { step: '候选抽取', message: `从增量原文生成 ${proposals.length} 条候选证据。` },
    { step: '证据校验', message: `${accepted} 条增量证据通过原文定位与阶段规则。` },
    ...(referenceKeys.size ? [{
      step: 'Codex 对照',
      message: `规则候选与资料子智能体独立标注对照，${agreed} 条一致。规则候选 ${predictedKeys.size} 条，子智能体标注 ${referenceKeys.size} 条。`,
    }] : []),
    { step: '状态更新', message: `${delta.length} 项里程碑状态变化。目标期限作为计划字段保留。` },
  ]
  return { report, delta, trace }
}
