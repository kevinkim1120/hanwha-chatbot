import { getFAQs } from '../data/products';
import type { FAQ } from '../types';

const PARTICLES = /[은는이가을를에의도로와과다면서고요]/g;

function tokenize(text: string): string[] {
  return text
    .replace(PARTICLES, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);
}

export function searchFAQ(query: string): FAQ | null {
  const faqs = getFAQs();
  if (!faqs.length) return null;

  const queryTokens = tokenize(query.toLowerCase());
  let bestScore = 0;
  let bestFAQ: FAQ | null = null;

  for (const faq of faqs) {
    const faqTokens = tokenize(faq.question.toLowerCase());
    let score = 0;

    for (const qt of queryTokens) {
      // Direct token match
      if (faqTokens.some(ft => ft.includes(qt) || qt.includes(ft))) {
        score += 3;
      }
      // Full text match
      if (faq.question.includes(qt)) {
        score += 2;
      }
      if (faq.answer.includes(qt)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestFAQ = faq;
    }
  }

  return bestScore >= 4 ? bestFAQ : null;
}

export function searchMultipleFAQs(query: string, limit = 3): FAQ[] {
  const faqs = getFAQs();
  const queryTokens = tokenize(query.toLowerCase());

  const scored = faqs.map(faq => {
    const faqTokens = tokenize(faq.question.toLowerCase());
    let score = 0;

    for (const qt of queryTokens) {
      if (faqTokens.some(ft => ft.includes(qt) || qt.includes(ft))) score += 3;
      if (faq.question.includes(qt)) score += 2;
      if (faq.answer.includes(qt)) score += 1;
    }

    return { faq, score };
  });

  return scored
    .filter(s => s.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.faq);
}
