const scheme = /\b(?:electric bus subsidy scheme|(?:approximately |about )?600\s+(?:brand new )?(?:single-deck and double-deck )?(?:e-buses|electric (?:franchised )?buses))\b/i
const launch = /\b(?:has (?:also )?launched|launched|came into operation)\b/i
const buses = /\b(?:e-buses|e-FBs|electric (?:franchised )?buses)\b/i
const operators = /\b(?:FBOs|franchised bus operators)\b/i
const taxi = /\b(?:taxi|taxis|e-taxis)\b/i
const completed = {
  funding_reserved: /\b(?:earmarked|reserved|set aside)\b/i,
  scheme_launched: launch,
  procurement_preparation: /\b(?:commenced preparations for the tendering exercises|(?:are |is )?(?:currently )?preparing for (?:the )?tenders?|began tender preparations|started prepar(?:ing|ations) for (?:the )?tendering)\b/i,
  ordered: /\b(?:placed (?:purchase )?orders?|(?:purchase )?orders? (?:were|have been) placed|signed (?:purchase )?contracts?)\b/i,
  delivered_registered: /\b(?:delivered and registered|completed (?:vehicle )?delivery and registration)\b/i,
}
const negation = /\b(?:no|not|never|may|might|will|would|must|could|expect(?:ed|s)?|plan(?:ned|s)? to|aims? to|scheduled to|to be|pending)\b/i
const future = /\b(?:with a view to|by (?:the )?end|expected to|targets? for|will|deadlines?)\b/i
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—' }

const tidy = (text) => text.normalize('NFC').replace(/\s+/gu, ' ').trim()
export function htmlText(text) {
  return tidy(text.replace(/<[^>]*>/g, ' ').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code[0] !== '#') return entities[code.toLowerCase()] ?? entity
    const point = /^#x/i.test(code) ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1))
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity
  }))
}

export function documentParagraphs(source) {
  const paragraphs = []
  let section = ''
  for (const match of (source.html ?? '').matchAll(/<(h[1-6]|p|tr)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const [, tag, block] = match
    const text = htmlText(block)
    if (tag.toLowerCase().startsWith('h')) {
      section = tag.toLowerCase() === 'h1' ? '' : text
      continue
    }
    if (text) paragraphs.push({ text, section, table: tag.toLowerCase() === 'tr' })
  }
  if (!source.html) {
    for (const text of (source.text ?? '').split(/\n+/).map(tidy).filter(Boolean)) {
      paragraphs.push({ text, section: '', table: false })
    }
  }
  return paragraphs.map((paragraph, index) => ({
    ...paragraph, id: index + 1,
    locator: [paragraph.section, paragraph.table ? `Table row · block ${index + 1}` : `Paragraph · block ${index + 1}`].filter(Boolean).join(' / '),
  }))
}

function sentences(text) {
  return text.split(/(?<=[.!?])\s+(?=[A-Z(])|;\s*/u).filter(Boolean)
}

function supports(stage, sentence, paragraph) {
  if (paragraph.table) return false
  const pattern = completed[stage]
  const match = pattern?.exec(sentence)
  if (!match || negation.test(sentence.slice(0, match.index))) return false
  const inScope = scheme.test(sentence) || (operators.test(sentence) && buses.test(sentence) && scheme.test(paragraph.text))
  if (!inScope) return false
  if (taxi.test(sentence) && stage !== 'funding_reserved') return false
  if (stage === 'funding_reserved') return /\$\s*470\s*million\b/i.test(sentence)
  if (stage === 'ordered' || stage === 'delivered_registered') {
    return scheme.test(sentence) && !future.test(sentence) && !/\b(?:all registered|first registrations?|fleetwide|tender preparations)\b/i.test(sentence)
  }
  return true
}

function shortQuote(sentence, stage) {
  if (stage === 'procurement_preparation') {
    const index = completed[stage].exec(sentence).index
    return sentence.slice(index).split(/\b(?:by (?:the )?end|with a view to)\b/i)[0].trim().split(' ').slice(0, 21).join(' ')
  }
  const parts = sentence.split(' ')
  if (parts.length <= 21) return sentence
  const index = completed[stage].exec(sentence).index
  const anchor = sentence.slice(0, index).split(' ').length - 1
  return parts.slice(Math.max(0, anchor - 2), Math.max(0, anchor - 2) + 21).join(' ')
}

export function extractRules(paragraphs, stageIds) {
  const hits = new Map()
  for (const paragraph of paragraphs) {
    for (const sentence of sentences(paragraph.text)) {
      for (const stage of stageIds) {
        if (!hits.has(stage) && supports(stage, sentence, paragraph)) {
          hits.set(stage, { quote: shortQuote(sentence, stage), locator: paragraph.locator, block: paragraph.id, origin: 'rules' })
        }
      }
    }
  }
  return hits
}

const findingsText = {
  target_only: ['A target date describes planned work. Completion requires a record of the action.', '目标日期属于计划信息，确认完成需要执行记录。'],
  other_scope: ['Taxi and territory-wide registration figures cover a different population.', '的士及全港登记统计来自不同范围。'],
  unverified_source: ['Pasted text can be inspected. Official status requires a verified source.', '粘贴文本可供初步核查，更新状态需要可验证的官方来源。'],
  insufficient_evidence: ['The checked material supplies no verified change for this stage.', '已核查材料尚未提供这个阶段的变更依据。'],
  agent_rejected: ['A proposed claim failed the quote or stage check.', '一条候选判断未通过原文或阶段校验。'],
}

function finding(stage, code) {
  const [reasonEn, reasonZh] = findingsText[code]
  return { stage, code, reason: reasonEn, reasonEn, reasonZh }
}

export async function analyzeUpdate(source, { caseConfig, baseline, agent, recordedCandidates, official }) {
  const paragraphs = documentParagraphs(source)
  const stageIds = caseConfig.stages.map(({ id }) => id)
  const rules = extractRules(paragraphs, stageIds)
  const hits = new Map(rules)
  const findings = []
  let agentStatus = 'off'
  let proposed = 0
  let verified = 0

  let candidates
  if (agent && official) {
    try {
      candidates = await agent(paragraphs, stageIds)
      if (!Array.isArray(candidates)) throw new Error('Expected candidate array')
      agentStatus = 'completed'
    } catch {
      candidates = undefined
      agentStatus = 'unavailable'
    }
  }
  const recorded = !candidates && official && Array.isArray(recordedCandidates)
  if (recorded) candidates = recordedCandidates
  if (candidates) {
    for (const candidate of candidates.slice(0, 15)) {
      if (!candidate || !stageIds.includes(candidate.stage)) continue
      proposed += 1
      const paragraph = paragraphs.find(({ id }) => id === candidate.block)
      const quote = typeof candidate.quote === 'string' ? tidy(candidate.quote) : ''
      const sentence = quote.length >= 12 && paragraph && sentences(paragraph.text).find((value) => value.includes(quote))
      const keyword = completed[candidate.stage].exec(quote)
      if (!sentence || !keyword || !supports(candidate.stage, sentence, paragraph)) {
        findings.push(finding(candidate.stage, 'agent_rejected'))
        continue
      }
      verified += 1
      hits.set(candidate.stage, {
        quote: quote.split(' ').length <= 21 && !future.test(quote) ? quote : shortQuote(sentence, candidate.stage),
        locator: paragraph.locator, block: paragraph.id, origin: recorded ? 'recorded' : 'codex',
      })
    }
  }

  const text = paragraphs.map((paragraph) => paragraph.text).join(' ')
  if (/\b(?:first registered|registered EVs|taxi subsidy)\b/i.test(text)) {
    findings.push(finding('delivered_registered', 'other_scope'))
  }
  if (/\b(?:orders?|procur(?:e|ement)).{0,130}\bby (?:the )?end(?: of |-)\d{4}/i.test(text)) {
    findings.push(finding('ordered', 'target_only'))
  }
  if (/\bdelivery and registration.{0,35}\bby (?:the )?end(?: of |-)\d{4}/i.test(text)) {
    findings.push(finding('delivered_registered', 'target_only'))
  }
  if (!official) {
    for (const stage of hits.size ? hits.keys() : [null]) findings.push(finding(stage, 'unverified_source'))
  }
  if (official && !hits.size) findings.push(finding(null, 'insufficient_evidence'))

  return {
    title: source.title, url: source.url ?? '', publishedAt: source.publishedAt ?? null,
    mode: recorded ? 'recorded' : agentStatus === 'completed' ? 'codex' : 'rules',
    agentStatus, proposed, verified, rulesStages: [...rules.keys()],
    reviewedParagraphs: paragraphs.filter(({ table }) => !table).length,
    stages: caseConfig.stages.map(({ id, label }) => {
      const previous = baseline.stageResults.some((stage) => stage.id === id && stage.status === 'confirmed')
      const evidence = hits.get(id)
      return { id, label, previous, status: official && evidence ? 'confirmed' : 'unchanged', ...evidence }
    }),
    findings,
    note: '进度核查独立于图表中的运营估算。',
    noteZh: '进度核查独立于图表中的运营估算。',
    noteEn: 'The emissions chart continues to use its scenario assumptions.',
  }
}
