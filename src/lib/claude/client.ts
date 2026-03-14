import Anthropic from '@anthropic-ai/sdk'

const ADVISOR_MODEL = 'claude-sonnet-4-6'
const SYNTHESIS_MODEL = 'claude-sonnet-4-6'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ─── Repair truncated / malformed JSON ─────────────
function repairJSON(text: string): string {
  // Remove trailing commas before } or ]
  let s = text.replace(/,(\s*[}\]])/g, '$1')

  // Try to auto-close truncated JSON by balancing braces/brackets
  // Walk the string tracking open braces/brackets and unclosed strings
  const stack: string[] = []
  let inString = false
  let escaped = false
  for (const ch of s) {
    if (escaped) { escaped = false; continue }
    if (ch === '\\' && inString) { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') stack.pop()
  }
  // If we were inside a string when truncated, close it first
  if (inString) s += '"'
  // Close any open structures in reverse order
  s += stack.reverse().join('')
  return s
}

// ─── Parse JSON from Claude response with robust recovery ──
function parseAdvisorResponse(rawText: string): Record<string, unknown> {
  // 1. Strip all markdown code fences (handles multi-line variants too)
  let text = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  // 2. Extract the outermost { ... } block
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last > first) {
    text = text.slice(first, last + 1)
  }

  // 3. Try straight parse on extracted block
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch { /* continue */ }

  // 4. Remove trailing commas and retry
  const cleaned = text.replace(/,(\s*[}\]])/g, '$1')
  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch { /* continue */ }

  // 5. Auto-repair truncated JSON (add missing closing braces/brackets)
  try {
    return JSON.parse(repairJSON(cleaned)) as Record<string, unknown>
  } catch { /* continue */ }

  // 6. Signal parse failure — engine will use createFallbackReport with proper structure
  console.warn('[Claude] JSON parse failed — signaling fallback. Raw length:', rawText.length)
  return {
    _isFallback: true,
    verdict: 'APPROVE_WITH_CONDITIONS',
    confidence: 0,
    summary: '',
  }
}

// ─── Call advisor and return parsed JSON ──────────
export async function callAdvisor(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 6000,
  useSynthesisModel = false
): Promise<Record<string, unknown>> {
  const model = useSynthesisModel ? SYNTHESIS_MODEL : ADVISOR_MODEL

  const attempt = async () => {
    console.log(`[Claude] Calling advisor with system prompt length: ${systemPrompt.length}`)
    const response = await getClient().messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log(`[Claude] Raw response length: ${text.length}`)
    console.log(`[Claude] First 500 chars: ${text.substring(0, 500)}`)
    console.log(`[Claude] Last 200 chars: ${text.substring(text.length - 200)}`)
    return parseAdvisorResponse(text)
  }

  try {
    return await attempt()
  } catch (err: unknown) {
    const e = err as { status?: number; error?: { type?: string } }
    // Rate limit — wait 15 seconds then retry once
    if (e?.status === 429 || e?.error?.type === 'rate_limit_error') {
      console.log('[Claude] Rate limit hit — waiting 15 seconds before retry...')
      await delay(15000)
      return await attempt()
    }
    // Other transient error — short wait, retry once
    await delay(1500)
    return await attempt()
  }
}

// ─── Streaming call — returns async iterator of text chunks ──
export async function* callAdvisorStream(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 6000
): AsyncGenerator<string> {
  const stream = getClient().messages.stream({
    model: ADVISOR_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      yield chunk.delta.text
    }
  }
}
