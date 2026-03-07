export const ADVISOR_WEIGHTS: Record<string, Record<string, number>> = {
  investment:    { financial: 30, strategic: 25, risk: 20, market: 10, operational: 10, other: 5 },
  expansion:     { market: 30, operational: 25, financial: 20, strategic: 10, risk: 10, other: 5 },
  product:       { market: 25, technical: 25, operational: 20, financial: 15, strategic: 10, other: 5 },
  pricing:       { financial: 30, market: 30, strategic: 20, operational: 10, risk: 10 },
  partnership:   { legal: 25, strategic: 25, financial: 20, market: 15, risk: 15 },
  restructuring: { operational: 30, financial: 25, strategic: 20, risk: 15, other: 10 },
  hiring:        { operational: 30, financial: 25, growth: 20, strategic: 15, other: 10 },
  technology:    { technical: 35, operational: 25, financial: 20, strategic: 10, risk: 10 },
  توسع:          { market: 30, operational: 25, financial: 20, strategic: 10, risk: 10, other: 5 },
  استثمار:       { financial: 30, strategic: 25, risk: 20, market: 10, operational: 10, other: 5 },
  منتج:          { market: 25, technical: 25, operational: 20, financial: 15, strategic: 10, other: 5 },
  تسعير:         { financial: 30, market: 30, strategic: 20, operational: 10, risk: 10 },
  شراكة:         { legal: 25, strategic: 25, financial: 20, market: 15, risk: 15 },
  توظيف:         { operational: 30, financial: 25, growth: 20, strategic: 15, other: 10 },
  تقنية:         { technical: 35, operational: 25, financial: 20, strategic: 10, risk: 10 },
}

export function getWeights(category: string): Record<string, number> {
  return ADVISOR_WEIGHTS[category] || ADVISOR_WEIGHTS['expansion']
}
