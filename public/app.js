import { calculate, DEFAULTS, POLICY } from './model.mjs'

const text = {
  en: {
    title: 'ClimateCommit · Hong Kong electric buses',
    headline: 'How much carbon could electric buses cut?',
    subtitle: 'Hong Kong franchised buses · 600 replacements · illustrative annual operations',
    chartTitle: 'Annual operating emissions',
    unit: 'tCO₂e per year · same distance travelled',
    replay: 'Replay chart',
    sensitivityToggle: 'Try a lower energy-use case',
    sensitivityReset: 'Restore the historical energy-use case',
    diesel: 'Before · diesel buses',
    lower: 'After · CLP electricity (2025)',
    higher: 'After · HK Electric electricity (2025)',
    less: 'less',
    more: 'more',
    baselineMessage: 'Equal mileage isolates the effect of fuel and electricity.',
    lowerMessage: 'CLP’s 2025 factor gives an estimated reduction of {value} tCO₂e per year.',
    threshold: 'Operating emissions fall below diesel at grid intensities under {value} kg CO₂e/kWh.',
    evidenceTitle: 'Implementation evidence',
    evidenceIntro: 'Check an offline snapshot of a Legislative Council reply.',
    analyze: 'Analyze official update',
    pasteSummary: 'Try another document',
    analyzeRoadmap: 'Review the 2024 roadmap announcement',
    urlLabel: 'English press release from info.gov.hk',
    analyzeUrl: 'Analyze official link',
    pasteLabel: 'Paste the full text, including the scheme name.',
    analyzeText: 'Analyze pasted text',
    loading: 'Checking the source against the scheme milestones…',
    error: 'Could not complete the analysis. Try again.',
    pasted: 'User-provided text',
    paragraphs: '{value} paragraphs reviewed',
    modeCodex: 'Codex-assisted review',
    modeRecorded: 'Recorded Codex extraction · validated now',
    modeRecordedFallback: 'Live Codex unavailable · recorded extraction validated now',
    agentCounts: '{verified}/{proposed} Codex candidates passed validation',
    modeRules: 'Rules-based review',
    modeFallback: 'Rules-based review · Codex unavailable',
    before: 'Before',
    after: 'After',
    confirmed: 'Evidence found',
    pending: 'Pending evidence',
    orderTarget: 'Target · end of 2027',
    deliveryTarget: 'Target · end of 2029',
    unverified: 'Pasted text is unverified. Confirm the statement against the original before updating this milestone.',
    quoteLabel: 'Open official source ↗',
    excluded: 'Evidence limits',
    genericFinding: 'The cited material did not establish completion of this milestone.',
    targetFinding: 'A future deadline describes the schedule. Completed orders or deliveries need their own records.',
    scopeFinding: 'Figures for the wider fleet or a different scheme cannot verify this subsidised batch.',
    modelSeparate: 'The emissions chart remains an illustrative model with the same assumptions.',
    sources: 'Model assumptions and sources',
    assumptions: '64,000 km per bus per year uses Kowloon Motor Bus mileage as a proxy. A 96% double-decker share follows government fleet statistics. Energy use follows the 2022 road transport study. Charging efficiency is assumed at 90%. The 2025 per-kWh factors are 0.34 kg CO₂e for CLP and 0.59 kg CO₂e for HK Electric. The model covers diesel combustion and purchased electricity.',
    sensitivity: 'The historical case uses 2.34 kWh/km for double-deckers. At 1.77 kWh/km, annual emissions change by {clp} tCO₂e for CLP and {hke} tCO₂e for HK Electric relative to diesel.',
    sourcePolicy: 'Legislative Council · approximately 600 buses',
    sourceKm: 'Transport Department · Kowloon Motor Bus fleet and mileage',
    sourceMix: 'Environment and Ecology Bureau · double-decker share',
    sourceEnergy: 'Hong Kong road transport study · Table 12 energy-use inputs',
    sourceSensitivity: 'PolyU research archive · double-decker energy use',
    sourceDiesel: 'Environmental Protection Department · diesel emissions factor',
    sourceClp: 'CLP · 2025 sold-electricity factor',
    sourceHke: 'HK Electric · 2025 sold-electricity factor',
  },
  zh: {
    title: 'ClimateCommit · 香港电动巴士',
    headline: '换成电动巴士，能减多少碳？',
    subtitle: '香港专营巴士 · 替换 600 辆 · 年度运营情景估算',
    chartTitle: '年度运营排放',
    unit: '吨 CO₂e / 年 · 相同行驶里程',
    replay: '重播图表',
    sensitivityToggle: '试算更低的双层电巴能耗',
    sensitivityReset: '恢复历史能耗情景',
    diesel: '更换前 · 柴油巴士',
    lower: '更换后 · 中电供电（2025）',
    higher: '更换后 · 港灯供电（2025）',
    less: '少排',
    more: '多排',
    baselineMessage: '保持总里程相同，比较柴油与电力的运营排放。',
    lowerMessage: '使用中电 2025 年排放因子，估算每年少排 {value} 吨 CO₂e。',
    threshold: '供电强度低于 {value} kg CO₂e/kWh 时，换车带来运营净减排。',
    evidenceTitle: '执行证据',
    evidenceIntro: '用离线保存的立法会答复核验里程碑。',
    analyze: '分析官方更新',
    pasteSummary: '试用其他文档',
    analyzeRoadmap: '核查 2024 年路线图公告',
    urlLabel: 'info.gov.hk 英文新闻公报',
    analyzeUrl: '分析官方链接',
    pasteLabel: '粘贴正文，保留计划名称。',
    analyzeText: '分析粘贴的正文',
    loading: '正在逐项核验里程碑与原文…',
    error: '暂未完成分析，请重试。',
    pasted: '用户提供的正文',
    paragraphs: '已核验 {value} 个段落',
    modeCodex: 'Codex 辅助核验',
    modeRecorded: 'Codex 抽取记录 · 本次重新校验',
    modeRecordedFallback: '实时 Codex 暂不可用 · 本次重新校验抽取记录',
    agentCounts: '{proposed} 条 Codex 候选中 {verified} 条通过校验',
    modeRules: '规则核验',
    modeFallback: '规则核验 · Codex 当前不可用',
    before: '分析前',
    after: '分析后',
    confirmed: '有执行证据',
    pending: '待核查',
    orderTarget: '目标 · 2027 年底',
    deliveryTarget: '目标 · 2029 年底',
    unverified: '粘贴内容的来源待核查。请核对原文后再更新状态。',
    quoteLabel: '打开官方原文 ↗',
    excluded: '证据边界',
    genericFinding: '该材料尚未证实这项里程碑已经完成。',
    targetFinding: '未来期限描述计划时间。确认下单或交付需要对应记录。',
    scopeFinding: '全港车队或其他计划的统计无法验证本资助批次。',
    modelSeparate: '排放图继续反映原有假设下的情景估算。',
    sources: '模型假设与数据来源',
    assumptions: '每车每年 64,000 公里参考九巴运营统计。双层车占比 96% 参考政府车队统计。油耗与电耗取自 2022 年香港道路运输研究。充电效率假设为 90%。2025 年中电与港灯的每度电排放因子分别为 0.34、0.59 kg CO₂e。核算范围包括柴油燃烧与购电。',
    sensitivity: '历史情景采用双层电巴能耗 2.34 kWh/km。改用 1.77 kWh/km 时，年排放较柴油基线变化为中电 {clp} 吨、港灯 {hke} 吨 CO₂e。',
    sourcePolicy: '香港立法会 · 约 600 辆的计划规模',
    sourceKm: '香港运输署 · 九巴车队及里程',
    sourceMix: '香港环境及生态局 · 双层巴士占比',
    sourceEnergy: '香港道路运输研究 · 表 12 车型能耗',
    sourceSensitivity: '香港理工大学研究库 · 双层电巴能耗',
    sourceDiesel: '香港环境保护署 · 柴油排放因子',
    sourceClp: '中电 · 2025 年售电排放因子',
    sourceHke: '港灯 · 2025 年售电排放因子',
  },
}
const milestones = {
  funding_reserved: ['Funding reserved', '资金预留'],
  scheme_launched: ['Scheme launched', '计划推出'],
  procurement_preparation: ['Tender preparations', '招标准备'],
  ordered: ['Orders placed', '车辆订购'],
  delivered_registered: ['Delivery and registration', '交付及登记'],
}
const clp = calculate({ ...DEFAULTS, grid: 0.34 }, POLICY.vehicles)
const hke = calculate({ ...DEFAULTS, grid: 0.59 }, POLICY.vehicles)
const efficientClp = calculate({ ...DEFAULTS, grid: 0.34, doubleElectric: 1.77 }, POLICY.vehicles)
const efficientHke = calculate({ ...DEFAULTS, grid: 0.59, doubleElectric: 1.77 }, POLICY.vehicles)
const sensitivity = {
  clp: -efficientClp.reduction,
  hke: -efficientHke.reduction,
}
const baselineSeries = [
  { value: clp.dieselTonnes, tone: 'diesel' },
  { value: clp.electricTonnes, reduction: clp.reduction, tone: 'lower' },
  { value: hke.electricTonnes, reduction: hke.reduction, tone: 'higher' },
]
let series = baselineSeries
const maximum = Math.ceil(Math.max(...series.map(({ value }) => value)) / 10_000) * 10_000
const byId = (id) => document.getElementById(id)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let language = 'en'
let stageVisible = -1
let timers = []
let chartFrame
let analysisState = 'idle'
let analysis
let userProvided = false
let efficient = false

const t = (key) => text[language][key]
const withValue = (key, value) => t(key).replace('{value}', value)
const format = (value, digits = 0) => new Intl.NumberFormat(
  language === 'en' ? 'en-HK' : 'zh-HK',
  { maximumFractionDigits: digits },
).format(value)

function element(tag, className, value) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (value !== undefined) node.textContent = value
  return node
}

const rows = series.map(({ value, tone }) => {
  const row = element('li', `row ${tone}`)
  const heading = element('div', 'row-heading')
  heading.append(element('span', 'name'))
  const result = element('div', 'row-result')
  result.append(element('strong', 'amount', format(value)))
  if (tone !== 'diesel') result.append(element('span', 'delta'))
  heading.append(result)
  const track = element('div', 'track')
  track.setAttribute('aria-hidden', 'true')
  const fill = element('span', 'fill')
  fill.style.setProperty('--length', `${value / maximum * 100}%`)
  track.append(fill)
  row.append(heading, track)
  return row
})
byId('bars').append(...rows)

function renderChartLabels() {
  for (const [index, { value, tone, reduction }] of series.entries()) {
    rows[index].querySelector('.name').textContent = t(tone)
    rows[index].querySelector('.amount').textContent = format(value)
    rows[index].querySelector('.fill').style.setProperty('--length', `${value / maximum * 100}%`)
    if (reduction === undefined) continue
    const count = format(Math.abs(reduction))
    const direction = t(reduction >= 0 ? 'less' : 'more')
    rows[index].querySelector('.delta').textContent = language === 'zh'
      ? `${direction} ${count} 吨`
      : `${count} t ${direction}`
  }
  if (stageVisible < 0) return
  const messages = [
    t('baselineMessage'),
    withValue('lowerMessage', format((efficient ? efficientClp : clp).reduction)),
    withValue('threshold', format((efficient ? efficientClp : clp).breakEvenGrid, 3)),
  ]
  byId('caption').textContent = messages[stageVisible]
}

function show(index) {
  rows[index].classList.add('visible')
  rows[index].removeAttribute('aria-hidden')
  stageVisible = index
  renderChartLabels()
}

function play() {
  for (const timer of timers) clearTimeout(timer)
  if (chartFrame !== undefined) cancelAnimationFrame(chartFrame)
  for (const row of rows) {
    row.classList.remove('visible')
    row.setAttribute('aria-hidden', 'true')
  }
  if (prefersReducedMotion.matches) {
    for (const index of rows.keys()) show(index)
    return
  }
  chartFrame = requestAnimationFrame(() => show(0))
  timers = [
    setTimeout(() => show(1), 1450),
    setTimeout(() => show(2), 3200),
  ]
}

function stageLabel(id, fallback) {
  return milestones[id]?.[language === 'en' ? 0 : 1] ?? fallback ?? id
}

function findingText(finding) {
  const localized = language === 'en' ? finding.reasonEn : finding.reasonZh
  if (localized) return localized
  const labels = {
    target_only: 'targetFinding',
    other_scope: 'scopeFinding',
    unverified_source: 'unverified',
    insufficient_evidence: 'genericFinding',
  }
  if (labels[finding.code]) return t(labels[finding.code])
  const reason = `${finding.code || ''} ${finding.reason || ''}`
  if (/future|deadline|target|未来|目标|期限/i.test(reason)) return t('targetFinding')
  if (/scope|fleet|unrelated|车队|批次|其他/i.test(reason)) return t('scopeFinding')
  return t('genericFinding')
}

function evidenceLink(url, quote) {
  if (userProvided || !url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return null
    const link = element('a', 'official-link', t('quoteLabel'))
    if (quote) parsed.hash = `:~:text=${encodeURIComponent(quote)}`
    link.href = parsed.href
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    return link
  } catch {
    return null
  }
}

function renderAnalysis() {
  const status = byId('analysis-status')
  status.hidden = !['loading', 'error'].includes(analysisState)
  if (!status.hidden) status.textContent = t(analysisState)
  byId('analyze-update').disabled = analysisState === 'loading'
  byId('analyze-roadmap').disabled = analysisState === 'loading'
  byId('analyze-text').disabled = analysisState === 'loading'
  byId('analyze-url').disabled = analysisState === 'loading'
  const output = byId('analysis-results')
  output.hidden = !analysis || analysisState !== 'ready'
  if (output.hidden) return

  const metadata = element('p', 'analysis-meta')
  const mode = analysis.mode === 'codex' ? t('modeCodex')
    : analysis.mode === 'recorded' ? t(analysis.agentStatus === 'unavailable' ? 'modeRecordedFallback' : 'modeRecorded')
    : t(analysis.agentStatus === 'unavailable' ? 'modeFallback' : 'modeRules')
  const metrics = [mode, withValue('paragraphs', format(analysis.reviewedParagraphs))]
  if (['codex', 'recorded'].includes(analysis.mode) && Number.isInteger(analysis.proposed) && Number.isInteger(analysis.verified)) {
    metrics.push(t('agentCounts').replace('{verified}', format(analysis.verified)).replace('{proposed}', format(analysis.proposed)))
  }
  metadata.textContent = metrics.join(' · ')
  const titles = element('p', 'analysis-source')
  const title = userProvided ? t('pasted') : [analysis.title, analysis.publishedAt].filter(Boolean).join(' · ')
  titles.append(element('span', '', title))
  const link = evidenceLink(analysis.url)
  if (link) titles.append(link)
  const stages = element('ul', 'analysis-stages')
  for (const stage of analysis.stages) {
    const item = element('li', 'analysis-stage')
    const row = element('div', 'evidence-row')
    const confirmed = stage.status === 'confirmed'
    row.append(element('strong', '', stageLabel(stage.id, stage.label)))
    const from = stage.previous ? t('confirmed') : t('pending')
    const to = confirmed ? t('confirmed') : from
    row.append(element('span', confirmed ? 'stage-status confirmed' : 'stage-status',
      `${t('before')} ${from} → ${t('after')} ${to}`))
    item.append(row)
    if (stage.quote && (!stage.previous || userProvided)) {
      item.append(element('blockquote', 'citation', stage.quote))
      if (stage.locator) item.append(element('p', 'location', stage.locator))
      const jump = evidenceLink(analysis.url, stage.quote)
      if (jump) item.append(jump)
    } else if (analysis.url && !confirmed && !stage.previous) {
      const target = stage.id === 'ordered' ? 'orderTarget'
        : stage.id === 'delivered_registered' ? 'deliveryTarget' : undefined
      if (target) item.append(element('p', 'location', t(target)))
    }
    stages.append(item)
  }

  const notes = element('div', 'findings')
  if (analysis.findings?.length) {
    notes.append(element('h3', '', t('excluded')))
    const findings = element('ul', '')
    const grouped = new Map()
    for (const finding of analysis.findings) {
      const reason = findingText(finding)
      if (!grouped.has(reason)) grouped.set(reason, new Set())
      if (milestones[finding.stage]) grouped.get(reason).add(stageLabel(finding.stage))
    }
    for (const [reason, scope] of grouped) {
      const context = [...scope].join(language === 'en' ? ' / ' : '、')
      findings.append(element('li', '', [context, reason].filter(Boolean).join(' · ')))
    }
    notes.append(findings)
  }
  output.replaceChildren(metadata, titles, stages, notes, element('p', 'model-note', t('modelSeparate')))
}

async function analyze(input = {}) {
  if (analysisState === 'loading') return
  analysisState = 'loading'
  analysis = undefined
  userProvided = Boolean(input.text)
  renderAnalysis()
  try {
    if (globalThis.climateCommitOfflineReview) {
      analysis = await globalThis.climateCommitOfflineReview(input)
    } else {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      analysis = await response.json()
    }
    analysisState = 'ready'
    renderAnalysis()
  } catch {
    analysisState = 'error'
    renderAnalysis()
  }
}

function setLanguage(nextLanguage) {
  language = nextLanguage
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN'
  document.title = t('title')
  for (const node of document.querySelectorAll('[data-label]')) node.textContent = t(node.dataset.label)
  const signed = (value) => new Intl.NumberFormat(language === 'en' ? 'en-HK' : 'zh-HK', {
    maximumFractionDigits: 0,
    signDisplay: 'exceptZero',
  }).format(value)
  byId('sensitivity').textContent = t('sensitivity')
    .replace('{clp}', signed(sensitivity.clp))
    .replace('{hke}', signed(sensitivity.hke))
  for (const button of document.querySelectorAll('[data-language]')) {
    button.setAttribute('aria-pressed', String(button.dataset.language === language))
  }
  byId('sensitivity-toggle').textContent = t(efficient ? 'sensitivityReset' : 'sensitivityToggle')
  renderChartLabels()
  renderAnalysis()
}

for (const button of document.querySelectorAll('[data-language]')) {
  button.addEventListener('click', () => setLanguage(button.dataset.language))
}
byId('analyze-update').addEventListener('click', () => analyze())
byId('official-url-form').hidden = Boolean(globalThis.climateCommitOfflineReview)
byId('analyze-roadmap').hidden = !globalThis.climateCommitOfflineReview
byId('analyze-roadmap').addEventListener('click', () => analyze({ sample: 'roadmap' }))
byId('official-url-form').addEventListener('submit', (event) => {
  event.preventDefault()
  const field = byId('official-url')
  const url = field.value.trim()
  if (url) analyze({ url })
  else field.focus()
})
byId('paste-form').addEventListener('submit', (event) => {
  event.preventDefault()
  const textarea = byId('document-text')
  const documentText = textarea.value.trim()
  if (documentText) analyze({ text: documentText })
  else textarea.focus()
})
byId('replay').disabled = false
byId('replay').addEventListener('click', play)
byId('sensitivity-toggle').addEventListener('click', (event) => {
  efficient = !efficient
  series = efficient ? [
    baselineSeries[0],
    { ...baselineSeries[1], value: efficientClp.electricTonnes, reduction: efficientClp.reduction },
    { ...baselineSeries[2], value: efficientHke.electricTonnes, reduction: efficientHke.reduction },
  ] : baselineSeries
  event.currentTarget.setAttribute('aria-pressed', String(efficient))
  event.currentTarget.textContent = t(efficient ? 'sensitivityReset' : 'sensitivityToggle')
  play()
})
setLanguage('en')
play()
