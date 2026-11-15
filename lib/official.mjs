import { htmlText } from './analyze.mjs'

export function canonicalOfficialUrl(input) {
  try {
    const url = new URL(input)
    if (url.origin !== 'https://www.info.gov.hk' || url.username || url.password ||
      !/^\/gia\/general\/\d{6}\/\d{2}\/P\d{13}p?\.htm$/.test(url.pathname)) return null
    return `${url.origin}${url.pathname.replace(/p\.htm$/, '.htm')}`
  } catch {
    return null
  }
}

export function parseOfficialPage(html, url) {
  const title = htmlText(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '')
  const release = html.match(/<span\b[^>]*\bid=["']pressrelease["'][^>]*>([\s\S]*?)<\/span>\s*<\/div>/i)?.[1]
    ?? html.split(/<span\b[^>]*\bid=["']pressrelease["'][^>]*>/i)[1]?.split(/<div\b[^>]*class=["'][^"']*controlDisplay/i)[0]
  if (!title || !release) throw new Error('Cannot locate the official release body')
  const end = html.match(/Ends\/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*([A-Za-z]+ \d{1,2}, \d{4})/i)
  const date = end && new Date(`${end[1]} UTC`)
  const publishedAt = date && !Number.isNaN(date.valueOf()) ? date.toISOString().slice(0, 10) : null
  const reply = release.split(/\bReply:\s*<br\b[^>]*>/i)
  const answer = reply.at(-1)
  const sections = [reply.length > 1 ? '<h2>Reply</h2>' : '<h2>Press release</h2>']
  for (const part of answer.split(/(<table\b[^>]*>[\s\S]*?<\/table>)/gi)) {
    if (/^<table/i.test(part)) {
      sections.push(part)
      continue
    }
    for (const line of part.split(/<br\b[^>]*>/gi)) {
      if (htmlText(line)) sections.push(`<p>${line}</p>`)
    }
  }
  return { title, url, publishedAt, html: sections.join('\n') }
}

export async function downloadOfficial(url, request = fetch) {
  const response = await request(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(8_000),
    headers: { accept: 'text/html' },
  })
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
    await response.body?.cancel()
    throw new Error('Official release did not return HTML')
  }
  const chunks = []
  let size = 0
  for await (const chunk of response.body) {
    size += chunk.length
    if (size > 500_000) throw new Error('Official release is too large')
    chunks.push(chunk)
  }
  return parseOfficialPage(Buffer.concat(chunks).toString('utf8'), url)
}
