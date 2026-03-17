import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { hasSupabaseServerConfig } from '@/lib/supabase/admin'
import { getSessionDB } from '@/lib/db/sessions'
import { getSession } from '@/lib/storage'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const QUESTIONS_SYSTEM_PROMPT = `أنت مستشار استراتيجي متخصص في تحليل القرارات التجارية.
مهمتك: بناءً على بيانات الشركة والقرار المقدَّم، ولّد بالضبط 7 أسئلة توضيحية حادة وذكية.

هذه الأسئلة يجب أن:
- تستهدف المعلومات الناقصة التي تؤثر فعلاً على جودة التحليل
- تكون مختلفة عن بعضها (لا تكرار)
- تكون قصيرة وواضحة (جملة واحدة أو اثنتين)
- تغطي جوانب مختلفة: مالي، سوقي، تشغيلي، استراتيجي

أعد JSON صالح فقط بهذا الشكل:
[
  {"question": "نص السؤال", "hint": "مثال على إجابة مقبولة أو توضيح"},
  ...
]
لا تضف أي نص خارج الـ JSON.`

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check
  let session: Record<string, unknown> | null = null
  const useSupabase = hasSupabaseServerConfig()

  if (useSupabase) {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbSession = await getSessionDB(params.id)
    if (!dbSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (dbSession.user_id && dbSession.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    session = dbSession as unknown as Record<string, unknown>
  } else {
    session = getSession(params.id) as Record<string, unknown> | null
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const companyProfile = (session.company_profile ?? session.companyProfile ?? {}) as Record<string, string>
  const decision = (session.decision ?? {}) as Record<string, string>

  const userMessage = `## بيانات الشركة:
- الاسم: ${companyProfile.company_name || 'غير محدد'}
- القطاع: ${companyProfile.sector || 'غير محدد'}
- الحجم: ${companyProfile.company_size || 'غير محدد'}
- المرحلة: ${companyProfile.stage || 'غير محدد'}
- الإيرادات: ${companyProfile.annual_revenue || 'غير محددة'}
- حجم الفريق: ${companyProfile.team_size || 'غير محدد'}

## القرار:
- العنوان: ${decision.title || 'غير محدد'}
- الوصف: ${decision.description || 'غير محدد'}
- الفئة: ${decision.category || 'غير محدد'}
- الهدف الرئيسي: ${decision.primary_goal || 'غير محدد'}
- التكلفة المتوقعة: ${decision.estimated_cost || 'غير محددة'}
- الجدول الزمني: ${decision.expected_timeline || 'غير محدد'}

بناءً على هذه المعلومات، ما هي أهم 7 أسئلة توضيحية يجب طرحها على صاحب القرار؟`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: QUESTIONS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = (response.content[0] as { type: string; text: string }).text
    // Extract JSON array
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found')
    const questions = JSON.parse(match[0]) as { question: string; hint: string }[]

    return NextResponse.json({ questions: questions.slice(0, 7) })
  } catch (err) {
    console.error('[Questions Generate] Error:', err)
    // Fallback questions if AI fails
    return NextResponse.json({
      questions: [
        { question: 'ما هو حجم الاستثمار المتوقع لهذا القرار؟', hint: 'مثال: 500,000 ريال' },
        { question: 'ما المدة الزمنية المتوقعة لرؤية نتائج واضحة؟', hint: 'مثال: 6 أشهر' },
        { question: 'هل لديك منافسون مباشرون يقدمون نفس الخدمة؟', hint: 'اذكر أسماءهم إن أمكن' },
        { question: 'ما هي الموارد البشرية المتاحة لتنفيذ هذا القرار؟', hint: 'مثال: فريق من 3 أشخاص' },
        { question: 'هل هناك قيود تنظيمية أو قانونية تؤثر على هذا القرار؟', hint: 'تراخيص، اشتراطات حكومية...' },
        { question: 'ما البديل الأقوى لهذا القرار إذا لم ينجح؟', hint: 'خطة B' },
        { question: 'ما مصدر تمويل هذا القرار؟', hint: 'إيرادات داخلية، قرض، مستثمرين...' },
      ],
    })
  }
}
