import { getProducts } from '../data/products';
import type { Product, UserProfile } from '../types';

const KEYWORD_MAP: Record<string, string[]> = {
  '사망': ['DIR-001', 'DIR-002'],
  '정기': ['DIR-001'],
  '종신': ['DIR-002'],
  '평생': ['DIR-002'],
  '체증': ['DIR-002'],
  '암': ['DIR-003', 'DIR-004'],
  '뇌': ['DIR-004'],
  '심장': ['DIR-004'],
  '3대': ['DIR-004'],
  '건강': ['DIR-003', 'DIR-004', 'DIR-008'],
  '연금': ['DIR-005'],
  '저축': ['DIR-006'],
  '목돈': ['DIR-006'],
  '재테크': ['DIR-006'],
  '간병': ['DIR-007'],
  '입원': ['DIR-007', 'DIR-008'],
  '실손': ['DIR-008'],
  '실비': ['DIR-008'],
  '의료비': ['DIR-008'],
  '자녀': ['DIR-001'],
  '대출': ['DIR-001'],
  '은퇴': ['DIR-005', 'DIR-006'],
  '노후': ['DIR-005', 'DIR-006'],
  '절세': ['DIR-005', 'DIR-006'],
  '비과세': ['DIR-006'],
  '세액공제': ['DIR-005'],
  '1인가구': ['DIR-003', 'DIR-004', 'DIR-007'],
  '혼자': ['DIR-003', 'DIR-004', 'DIR-007'],
  '상속': ['DIR-002'],
  '유방암': ['DIR-003'],
  '가족력': ['DIR-003'],
};

const CONCERN_MAP: Record<string, string[]> = {
  '암/건강': ['DIR-003', 'DIR-004'],
  '사망보장': ['DIR-001', 'DIR-002'],
  '노후/연금': ['DIR-005', 'DIR-006'],
  '저축/목돈': ['DIR-006'],
  '입원/간병': ['DIR-007'],
  '의료비': ['DIR-008'],
};

const AGE_GROUP_MAP: Record<string, number> = {
  '20대': 25,
  '30대': 35,
  '40대': 40,
  '45대': 45,
  '50대': 50,
  '55대': 55,
  '60대': 60,
};

const BUDGET_MAP: Record<string, [number, number]> = {
  '10만원 이하': [0, 100000],
  '10~30만원': [100000, 300000],
  '30~50만원': [300000, 500000],
  '50만원 이상': [500000, Infinity],
};

function parseAge(ageStr: string): [number, number] {
  const match = ageStr.match(/(\d+)\s*세?\s*~\s*(\d+)\s*세?/);
  if (match) return [parseInt(match[1]), parseInt(match[2])];
  return [0, 100];
}

function getRepresentativePremium(product: Product, age: number, gender: '남성' | '여성'): number | null {
  const table = product.premium_table;
  const entries = table.순수보장형 || table.표준체 || table.만기환급형;
  if (!entries) return null;

  const genderKey = gender === '남성' ? 'male' : 'female';
  let closest = entries[0];
  let minDiff = Math.abs(entries[0].age - age);

  for (const entry of entries) {
    const diff = Math.abs(entry.age - age);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  return closest[genderKey];
}

export interface MatchResult {
  product: Product;
  score: number;
  estimatedPremium: number | null;
}

export function matchProducts(profile: UserProfile, freeText?: string): MatchResult[] {
  const products = getProducts();
  const scores: Map<string, number> = new Map();
  const age = profile.age || AGE_GROUP_MAP[profile.ageGroup || ''] || 35;

  // Initialize scores
  for (const p of products) scores.set(p.code, 0);

  // Keyword matching from free text
  if (freeText) {
    const text = freeText.toLowerCase();
    for (const [keyword, codes] of Object.entries(KEYWORD_MAP)) {
      if (text.includes(keyword)) {
        for (const code of codes) {
          scores.set(code, (scores.get(code) || 0) + 3);
        }
      }
    }
  }

  // Concern-based matching
  if (profile.concerns) {
    for (const concern of profile.concerns) {
      const codes = CONCERN_MAP[concern] || [];
      for (const code of codes) {
        scores.set(code, (scores.get(code) || 0) + 4);
      }
    }
  }

  // Age eligibility
  for (const p of products) {
    const [minAge, maxAge] = parseAge(p.entry_age);
    if (age >= minAge && age <= maxAge) {
      scores.set(p.code, (scores.get(p.code) || 0) + 2);
    } else {
      scores.set(p.code, -100); // ineligible
    }
  }

  // Budget filtering
  if (profile.budget) {
    const range = BUDGET_MAP[profile.budget];
    if (range) {
      const gender = profile.gender || '남성';
      for (const p of products) {
        const premium = getRepresentativePremium(p, age, gender);
        if (premium && premium >= range[0] * 0.1 && premium <= range[1] * 0.8) {
          scores.set(p.code, (scores.get(p.code) || 0) + 2);
        }
      }
    }
  }

  // Build results
  const results: MatchResult[] = products
    .filter(p => (scores.get(p.code) || 0) > 0)
    .map(p => ({
      product: p,
      score: scores.get(p.code) || 0,
      estimatedPremium: getRepresentativePremium(
        p,
        age,
        profile.gender || '남성'
      ),
    }))
    .sort((a, b) => b.score - a.score);

  return results.slice(0, 3);
}

export function matchByKeyword(text: string): MatchResult[] {
  return matchProducts({}, text);
}
