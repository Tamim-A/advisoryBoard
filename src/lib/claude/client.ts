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

// ─── Call advisor and return parsed JSON ──────────
export async function callAdvisor(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4000,
  useSynthesisModel = false
): Promise<Record<string, unknown>> {
  const model = useSynthesisModel ? SYNTHESIS_MODEL : ADVISOR_MODEL

  const attempt = async () => {
    const response = await getClient().messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    // Strip any markdown code fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
    return JSON.parse(cleaned)
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
  maxTokens = 4000
): AsyncGenerator<string> {
  const stream = await getClient().messages.stream({
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
