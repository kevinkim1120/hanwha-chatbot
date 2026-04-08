import { getScenarios } from '../data/products';
import type { CustomerScenario, UserProfile } from '../types';

const AGE_MAP: Record<string, number> = {
  '20대': 25,
  '30대': 35,
  '40대': 40,
  '50대': 50,
  '60대': 60,
};

const CONCERN_KEYWORDS: Record<string, string[]> = {
  '암/건강': ['암', '건강', '가족력', '아프', '질병'],
  '사망보장': ['사망', '가장', '대출', '자녀'],
  '노후/연금': ['연금', '은퇴', '노후', '생활비'],
  '저축/목돈': ['저축', '목돈', '재테크', '퇴직금'],
  '입원/간병': ['간병', '입원', '1인가구', '혼자'],
  '의료비': ['의료비', '실손', '치료비'],
};

function scenarioAge(persona: string): number {
  const match = persona.match(/(\d+)세/);
  return match ? parseInt(match[1]) : 40;
}

function scenarioGender(persona: string): string {
  return persona.includes('여성') ? '여성' : '남성';
}

export function findClosestScenario(profile: UserProfile): CustomerScenario | null {
  const scenarios = getScenarios();
  if (!scenarios.length) return null;

  const userAge = profile.age || AGE_MAP[profile.ageGroup || ''] || 40;

  let bestScore = -1;
  let bestScenario: CustomerScenario | null = null;

  for (const scenario of scenarios) {
    let score = 0;
    const sAge = scenarioAge(scenario.persona);
    const sGender = scenarioGender(scenario.persona);

    // Age proximity (within 10 years)
    const ageDiff = Math.abs(userAge - sAge);
    if (ageDiff <= 5) score += 4;
    else if (ageDiff <= 10) score += 2;
    else if (ageDiff <= 15) score += 1;

    // Gender match
    if (profile.gender && profile.gender === sGender) score += 3;

    // Concern overlap
    if (profile.concerns) {
      for (const concern of profile.concerns) {
        const keywords = CONCERN_KEYWORDS[concern] || [];
        const scenarioText = scenario.concern + ' ' + scenario.background;
        for (const kw of keywords) {
          if (scenarioText.includes(kw)) {
            score += 2;
            break;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestScenario = scenario;
    }
  }

  return bestScore >= 3 ? bestScenario : null;
}
