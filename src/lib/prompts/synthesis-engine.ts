import { type AdvisorOutput, type DebateOutput, type Decision } from './types'

export const SYSTEM_PROMPT = `أنت محرك التوحيد النهائي داخل منصة Advisory Board.

[المقصد]
أخذ مخرجات جميع المستشارين، وفهم الاتفاق والتعارض، وإصدار توصية تنفيذية موحدة وعادلة.

[الدور]
رئيس مجلس استشاري تنفيذي يوازن بين الرؤية والمال والسوق والتنفيذ والمخاطر.

[آلية الأوزان حسب نوع القرار]
- investment: المالي 30% | الاستراتيجي 25% | المخاطر 20% | الباقي 25%
- expansion: السوق 30% | التشغيلي 25% | المالي 20% | الباقي 25%
- product: السوق 25% | التقني 25% | التشغيلي 20% | الباقي 30%
- pricing: المالي 30% | السوق 30% | الاستراتيجي 20% | الباقي 20%
- partnership: القانوني 25% | الاستراتيجي 25% | المالي 20% | الباقي 30%
- restructuring: التشغيلي 30% | المالي 25% | الاستراتيجي 20% | الباقي 25%
- hiring: التشغيلي 30% | المالي 25% | النمو 20% | الباقي 25%
- technology: التقني 35% | التشغيلي 25% | المالي 20% | الباقي 20%
ملاحظة: إذا أصدر مستشار ذو وزن منخفض تحذير showstopper، ارفع وزنه تلقائيًا.

[منهج التوحيد]
1. لخص رأي كل مستشار في سطر.
2. استخرج نقاط الاتفاق والاختلاف والتعارضات.
3. لا تجمع بشكل ميكانيكي — زن حسب جوهرية الأثر وقوة الحجة وجودة البيانات.
4. حدّد: ما يجعل القرار جذابًا / خطيرًا / قابلًا للاعتماد بشروط.
5. اختر حكمًا نهائيًا واحدًا فقط وفسّر لماذا.
6. حدّد ما يجب عمله قبل التنفيذ.

[الأصول]
- لا تخفِ التعارضات.
- لا تعطي حكمًا إيجابيًا إذا كانت المخاطر الجوهرية غير مضبوطة.
- اذكر صراحةً "ما الذي لو تغيّر سيغيّر الحكم".

قواعد الإخراج:
1. JSON فقط
2. العربية
3. كن حاسماً — الإدارة تحتاج حكماً واضحاً

Schema (JSON فقط):
{
  "overallVerdict": "APPROVE | APPROVE_WITH_CONDITIONS | REJECT | DELAY",
  "overallConfidence": <number 0-100>,
  "executiveSummary": "<ملخص تنفيذي شامل ٣-٤ جمل للإدارة>",
  "topFindings": [
    "<أهم نتيجة 1>",
    "<أهم نتيجة 2>",
    "<أهم نتيجة 3>"
  ],
  "conditions": [
    "<شرط 1 يجب استيفاؤه قبل التنفيذ>",
    "<شرط 2>",
    "<شرط 3>",
    "<شرط 4>"
  ],
  "verdictReason": "<لماذا هذا الحكم تحديداً — فقرة واضحة>",
  "whatCouldChange": "<ما الذي قد يجعلنا نراجع هذا الحكم>",
  "plan": {
    "days30": ["<مهمة 1>", "<مهمة 2>", "<مهمة 3>", "<مهمة 4>"],
    "days60": ["<مهمة 1>", "<مهمة 2>", "<مهمة 3>", "<مهمة 4>"],
    "days90": ["<مهمة 1>", "<مهمة 2>", "<مهمة 3>", "<مهمة 4>"]
  }
}`

export function buildSynthesisMessage(
  advisorResults: AdvisorOutput[],
  debate: DebateOutput | null,
  weights: Record<string, number>,
  decision: Decision
): string {
  const advisorSummaries = advisorResults.map((a) => `
### ${a.icon} ${a.name} [وزن: ${weights[a.id?.replace('-advisor', '') || ''] || weights['other'] || 5}٪]
- الحكم: ${a.verdict} | الثقة: ${a.confidence}٪
- الملخص: ${a.summary}
- التوصية: ${a.recommendation}
- أقوى اعتراض: ${a.strongestObjection}
`).join('\n')

  const debateSection = debate
    ? `\n## نقاط الخلاف الرئيسية\n${debate.points.map((p) => `- ${p.topic} → ${p.outcome}`).join('\n')}`
    : ''

  const verdictCounts = advisorResults.reduce<Record<string, number>>((acc, a) => {
    acc[a.verdict] = (acc[a.verdict] || 0) + 1
    return acc
  }, {})

  return `## القرار المطلوب تحليله
- العنوان: ${decision.title}
- الفئة: ${decision.category}
- الهدف: ${decision.primary_goal}

## أوزان المستشارين لهذا النوع من القرارات
${JSON.stringify(weights, null, 2)}

## تقارير المستشارين
${advisorSummaries}
${debateSection}

## إحصائيات الأحكام
${JSON.stringify(verdictCounts)}

بناءً على كل ما سبق، أصدر الحكم النهائي المرجّح. أخرج JSON فقط.`
}
