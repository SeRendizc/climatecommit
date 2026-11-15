const cohort = /(?:electric bus subsidy scheme|e-bus subsidy scheme|(?:\b600\b.{0,120}\b(?:electric|e-?)\s*-?\s*(?:franchised\s+)?bus(?:es)?\b)|(?:\b(?:electric|e-?)\s*-?\s*(?:franchised\s+)?bus(?:es)?\b.{0,120}\b600\b))/i

const stagePatterns = {
  funding_reserved: /\bearmark(?:ed|s|ing)?\b|\b(?:set aside|reserved|allocated)\b.{0,45}\b(?:HK\$|\$|million|funding)\b/i,
  scheme_launched: /\b(?:has launched|launched|was launched|is now open|came into operation)\b/i,
  procurement_preparation: /\b(?:preparations? for (?:the )?tender(?:ing)?|preparing (?:for )?(?:the )?tenders?|tender(?:ing)? preparations?)\b/i,
  ordered: /\b(?:placed (?:purchase )?orders?|(?:purchase )?orders? (?:has been |have been |was |were )?placed|signed (?:a |the )?(?:purchase )?contracts?|contracts? (?:has been |have been |was |were )?signed)\b/i,
  delivered_registered: /\b(?:were |was |have been |has been |already )?(?:delivered and registered|registered and delivered)\b|\bcompleted (?:vehicle )?delivery and registration\b/i,
}

const prospective = /\b(?:will|would|plans?|aims?|targets?|expects?|expected|by (?:the )?end|with a view to|to be|not yet|proposed|if|subject to)\b/i
const plannedAction = /\b(?:will|would|may|might|could|should|planned to|plans? to|aims? to|expects? to|expected to|scheduled to|proposed to|with a view to|to be|if|subject to)\b/i
const negated = /\b(?:not|never|no|pending)\b/i
const completionStages = new Set(['ordered', 'delivered_registered'])
const normalize = (text) => text.normalize('NFC').replace(/\s+/g, ' ').trim()

function statementFor(text, matchIndex) {
  const boundary = /[.!?;]\s+(?=[A-Z])|;\s*/g
  let start = 0
  for (const match of text.matchAll(boundary)) {
    if (match.index >= matchIndex) return text.slice(start, match.index)
    start = match.index + match[0].length
  }
  return text.slice(start)
}

function supportsStage(quote, sourceText, offset, stage) {
  const pattern = stagePatterns[stage]
  const match = pattern?.exec(quote)
  if (!match) return false

  const statement = statementFor(sourceText, offset + match.index)
  if (!cohort.test(statement)) return false
  const stageIndex = pattern.exec(statement)?.index ?? 0
  const before = statement.slice(0, stageIndex)
  if (negated.test(before) || plannedAction.test(before)) return false
  return !completionStages.has(stage) ||
    (!prospective.test(statement) && !stagePatterns.procurement_preparation.test(statement) &&
      !/\b(?:taxi(?:s)?|fleetwide|across the entire)\b/i.test(statement))
}

export function extractCandidates(sources, schemeId) {
  const candidates = []
  for (const source of sources) {
    for (const chunk of source.chunks) {
      const quote = normalize(chunk.text)
      for (const stage of Object.keys(stagePatterns)) {
        if (!supportsStage(quote, quote, 0, stage)) continue
        candidates.push({
          id: `auto:${source.id}:${chunk.id}:${stage}`,
          sourceId: source.id,
          chunkId: chunk.id,
          quote,
          stage,
          schemeId,
        })
      }
    }
  }
  return candidates
}

export function buildReport({ caseConfig, sources, candidates, includeHoldout = false }) {
  const visibleSources = sources.filter((source) => includeHoldout || source.phase !== 'holdout')
  const sourcesById = new Map(visibleSources.map((source) => [source.id, source]))
  const knownSources = new Set(sources.map((source) => source.id))
  const stages = new Map(caseConfig.stages.map(({ id }) => [id, {
    id,
    status: 'not_found',
    evidence: [],
  }]))
  const reviews = []

  for (const candidate of candidates) {
    const stage = stages.get(candidate.stage)
    const source = sourcesById.get(candidate.sourceId)
    if (!source && knownSources.has(candidate.sourceId)) continue
    const chunk = source?.chunks.find(({ id }) => id === candidate.chunkId)
    const quote = typeof candidate.quote === 'string' ? normalize(candidate.quote) : ''
    const sourceText = chunk && normalize(chunk.text)
    const offset = quote && sourceText ? sourceText.indexOf(quote) : -1
    let reason
    if (candidate.schemeId !== caseConfig.schemeId) reason = '候选证据属于其他计划'
    else if (!stage) reason = '里程碑类型未识别'
    else if (!chunk || offset < 0) reason = '无法在指定段落定位原文'
    else if (!supportsStage(quote, sourceText, offset, candidate.stage)) {
      reason = '原文对计划批次或所提议的执行阶段支持不足'
    }

    if (reason) {
      reviews.push({ id: candidate.id, reason })
      if (stage && stage.status === 'not_found') stage.status = 'review'
      continue
    }

    if (stage.evidence.some((evidence) => evidence.source.id === source.id &&
      evidence.locator === chunk.locator && evidence.quote === quote)) continue

    const { id, title, url, publishedAt, phase, language } = source
    stage.status = 'confirmed'
    stage.evidence.push({
      id: candidate.id,
      quote,
      note: candidate.note ?? '',
      source: { id, title, url, publishedAt, phase, language },
      locator: chunk.locator,
    })
  }

  return {
    stageResults: [...stages.values()],
    reviews,
    scope: { documents: visibleSources.length, phase: includeHoldout ? 'holdout' : 'baseline' },
  }
}
