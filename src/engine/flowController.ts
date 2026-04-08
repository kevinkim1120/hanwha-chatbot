import type { ChatPhase, Message, QuickReply, UserProfile, Product, ComparisonTable } from '../types';
import { matchProducts, matchByKeyword } from './matcher';
import { findClosestScenario } from './recommender';
import { searchFAQ } from './faqSearch';
import { getProducts, getComparisons, getProductData as getDataRoot } from '../data/products';

let msgId = 0;
function createMsg(
  partial: Omit<Message, 'id' | 'timestamp' | 'sender'> & { sender?: 'bot' | 'user' }
): Message {
  return {
    id: `msg-${++msgId}`,
    sender: 'bot',
    timestamp: Date.now(),
    ...partial,
  } as Message;
}

function botText(content: string, quickReplies?: QuickReply[]): Message {
  return createMsg({ type: 'text', content, quickReplies });
}

// ── 비교 의도 감지 ──

const COMPARE_TRIGGERS = ['비교', '차이', 'vs', 'VS', '다른점', '다른 점', '뭐가 달라', '어떤 차이'];

const PRODUCT_KEYWORDS: { keywords: string[]; code: string; shortName: string }[] = [
  { keywords: ['정기', '정기보험', 'e정기'], code: 'DIR-001', shortName: 'e정기보험' },
  { keywords: ['종신', '종신보험', 'H종신'], code: 'DIR-002', shortName: 'H종신보험' },
  { keywords: ['암보험', 'e암', '암 보험'], code: 'DIR-003', shortName: 'e암보험' },
  { keywords: ['건강보험', 'e건강', '건강 보험', '암뇌심'], code: 'DIR-004', shortName: 'e건강보험(암뇌심)' },
  { keywords: ['연금', '연금저축', 'e연금'], code: 'DIR-005', shortName: 'e연금저축보험' },
  { keywords: ['재테크', '저축보험', 'e재테크'], code: 'DIR-006', shortName: 'e재테크저축보험' },
  { keywords: ['간병', '입원간병', 'e입원'], code: 'DIR-007', shortName: 'e입원간병비보험' },
  { keywords: ['실손', '실비', '실손보험', '의료비보험', 'e실손'], code: 'DIR-008', shortName: 'e실손의료비보험' },
];

function hasCompareIntent(text: string): boolean {
  return COMPARE_TRIGGERS.some(t => text.includes(t));
}

function detectProductsInText(text: string): { code: string; shortName: string }[] {
  const found: { code: string; shortName: string; index: number }[] = [];
  for (const entry of PRODUCT_KEYWORDS) {
    for (const kw of entry.keywords) {
      const idx = text.indexOf(kw);
      if (idx !== -1) {
        if (!found.some(f => f.code === entry.code)) {
          found.push({ code: entry.code, shortName: entry.shortName, index: idx });
        }
        break;
      }
    }
  }
  return found.sort((a, b) => a.index - b.index).map(({ code, shortName }) => ({ code, shortName }));
}

function buildDynamicComparison(p1: Product, p2: Product): ComparisonTable {
  const name1 = p1.name.replace('한화생명 ', '');
  const name2 = p2.name.replace('한화생명 ', '');

  const rows: string[][] = [
    ['카테고리', p1.category, p2.category],
    ['가입 나이', p1.entry_age, p2.entry_age],
    ['보험 기간', p1.insurance_period.join(', '), p2.insurance_period.join(', ')],
    ['납입 기간', p1.payment_period.join(', '), p2.payment_period.join(', ')],
    ['보장/가입 범위', p1.coverage_range, p2.coverage_range],
    ['상품 유형', p1.type, p2.type],
  ];

  // 보험료 비교 행 추가
  const prem1 = getRepPremiumText(p1);
  const prem2 = getRepPremiumText(p2);
  if (prem1 || prem2) {
    rows.push(['보험료 예시', prem1 || '-', prem2 || '-']);
  }

  // 핵심 특징 비교
  rows.push(['핵심 특징', p1.features.slice(0, 2).join(' / '), p2.features.slice(0, 2).join(' / ')]);
  rows.push(['추천 대상', p1.who_needs_this.slice(0, 50) + (p1.who_needs_this.length > 50 ? '...' : ''), p2.who_needs_this.slice(0, 50) + (p2.who_needs_this.length > 50 ? '...' : '')]);

  return {
    columns: ['항목', name1, name2],
    rows,
  };
}

function getRepPremiumText(product: Product): string {
  const table = product.premium_table;
  const entries = table.순수보장형 || table.표준체;
  if (entries && entries.length > 0) {
    const e = entries[0];
    return `${e.age}세 남성 월 ${e.male.toLocaleString()}원`;
  }
  if (table.환급률_예시 && table.환급률_예시.length > 0) {
    const last = table.환급률_예시[table.환급률_예시.length - 1];
    return `만기 시 환급률 ${last.환급률}`;
  }
  if (table.연금수령_예시 && table.연금수령_예시.length > 0) {
    const ex = table.연금수령_예시[0];
    return `월 ${(ex.monthly / 10000).toLocaleString()}만원 납입 → ${ex.estimated_monthly_pension}`;
  }
  return '';
}

/** 사전 비교표 매칭 또는 동적 비교표 생성 */
function tryCompare(text: string): FlowResult | null {
  const comparisons = getComparisons();
  const products = getProducts();
  const detected = detectProductsInText(text);

  // 1) 사전 정의된 비교표 매칭 (키워드 기반)
  interface PresetEntry { keywords: string[]; key: string; title: string }
  const presets: PresetEntry[] = [
    { keywords: ['정기', '종신', '���망'], key: '사망보장_비교', title: '사망보장 비교: e정기보험 vs H종신보험' },
    { keywords: ['암보험', '건강보험', '암뇌심'], key: '건강보장_비교', title: '건강보장 비교: e암보험 vs e건강보험(암뇌심)' },
    { keywords: ['연금', '재테크', '저축'], key: '저축_비교', title: '저축 비교: e연금저축보험 vs e재테크저축보험' },
  ];

  for (const preset of presets) {
    const matchCount = preset.keywords.filter(kw => text.includes(kw)).length;
    if (matchCount >= 2 && comparisons[preset.key]) {
      return {
        messages: [
          createMsg({
            type: 'comparison_table',
            content: preset.title,
            comparison: comparisons[preset.key],
            comparisonTitle: preset.title,
            quickReplies: [
              { label: '다른 비교 보기', value: 'compare' },
              { label: '보험 추천받기', value: 'recommend' },
              { label: '처음으로', value: 'main_menu' },
            ],
          }),
        ],
        nextPhase: 'COMPARISON_MODE',
      };
    }
  }

  // 2) 상품 2개가 감지되면 동적 비교표 생성
  if (detected.length >= 2) {
    const p1 = products.find(p => p.code === detected[0].code);
    const p2 = products.find(p => p.code === detected[1].code);
    if (p1 && p2) {
      const title = `${detected[0].shortName} vs ${detected[1].shortName}`;
      const table = buildDynamicComparison(p1, p2);
      return {
        messages: [
          createMsg({
            type: 'comparison_table',
            content: title,
            comparison: table,
            comparisonTitle: title,
            quickReplies: [
              { label: '다른 비교 보기', value: 'compare' },
              { label: '보험 추천받기', value: 'recommend' },
              { label: '처음으로', value: 'main_menu' },
            ],
          }),
        ],
        nextPhase: 'COMPARISON_MODE',
      };
    }
  }

  // 3) 비교 의도는 있지만 상품이 1개 이하 → 비교 메뉴 안내
  if (hasCompareIntent(text)) {
    if (detected.length === 1) {
      const sameCategoryProducts = products.filter(
        pr => pr.code !== detected[0].code
      );
      const suggestions = sameCategoryProducts.slice(0, 3).map(pr => ({
        label: `${detected[0].shortName} vs ${pr.name.replace('한화생명 ', '')}`,
        value: `dyncompare_${detected[0].code}_${pr.code}`,
      }));
      return {
        messages: [
          botText(
            `${detected[0].shortName}을(를) 어떤 상품과 비교할까요?`,
            suggestions.length > 0
              ? [...suggestions, { label: '전체 비교 메뉴', value: 'compare' }]
              : [{ label: '비교 메뉴 보기', value: 'compare' }]
          ),
        ],
        nextPhase: 'COMPARISON_MODE',
      };
    }

    return {
      messages: [
        botText('어떤 상품을 비교해 볼까요?', [
          { label: '정기 vs 종신', value: 'compare_death' },
          { label: '암보험 vs 건강보험', value: 'compare_health' },
          { label: '연금 vs 재테크', value: 'compare_savings' },
        ]),
      ],
      nextPhase: 'COMPARISON_MODE',
    };
  }

  return null;
}

export function getGreetingMessages(): Message[] {
  return [
    botText('안녕하세요! 한화생명 보험상담 챗봇입니다.'),
    botText(
      '궁금한 것이 있으시면 편하게 물어보세요.\n어떤 도움이 필요하신가요?',
      [
        { label: '보험 추천받기', value: 'recommend' },
        { label: '상품 비교하기', value: 'compare' },
        { label: '자주 묻는 질문', value: 'faq' },
        { label: '전체 상품 보기', value: 'all_products' },
      ]
    ),
  ];
}

export function getMainMenuReplies(): QuickReply[] {
  return [
    { label: '보험 추천받기', value: 'recommend' },
    { label: '상품 비교하기', value: 'compare' },
    { label: '자주 묻는 질문', value: 'faq' },
    { label: '전체 상품 보기', value: 'all_products' },
  ];
}

export interface FlowResult {
  messages: Message[];
  nextPhase: ChatPhase;
  profileUpdate?: Partial<UserProfile>;
}

export function processInput(
  input: string,
  phase: ChatPhase,
  profile: UserProfile
): FlowResult {
  // Main menu selections
  if (input === 'recommend' || input === '보험 추천받기') {
    return {
      messages: [
        botText('맞춤 보험을 추천해 드릴게요!\n먼저, 연령대를 알려주세요.', [
          { label: '20대', value: '20대' },
          { label: '30대', value: '30대' },
          { label: '40대', value: '40대' },
          { label: '50대', value: '50대' },
          { label: '60대', value: '60대' },
        ]),
      ],
      nextPhase: 'PRODUCT_CONSULT_AGE',
    };
  }

  if (input === 'compare' || input === '상품 비교하기') {
    return {
      messages: [
        botText('어떤 상품을 비교해 볼까요?', [
          { label: '정기 vs 종신', value: 'compare_death' },
          { label: '암보험 vs 건강보험', value: 'compare_health' },
          { label: '연금 vs 재테크', value: 'compare_savings' },
        ]),
      ],
      nextPhase: 'COMPARISON_MODE',
    };
  }

  if (input === 'faq' || input === '자주 묻는 질문') {
    return {
      messages: [
        botText(
          '자주 묻는 질문 목록입니다. 궁금한 항목을 선택하시거나, 직접 질문을 입력해 주세요.',
          [
            { label: '비갱신 vs 갱신', value: 'faq_비갱신형과 갱신형' },
            { label: '해약환급금이란?', value: 'faq_해약환급금 미지급형' },
            { label: '90일 면책기간', value: 'faq_90일 면책기간' },
            { label: '보험금 청구방법', value: 'faq_보험금 청구' },
          ]
        ),
      ],
      nextPhase: 'FAQ_MODE',
    };
  }

  if (input === 'all_products' || input === '전체 상품 보기') {
    const products = getProducts();
    return {
      messages: [
        botText('한화생명의 다이렉트 보험상품 8종입니다.\n관심 있는 상품을 선택해 주세요.'),
        createMsg({
          type: 'product_cards',
          content: '',
          products,
        }),
      ],
      nextPhase: 'PRODUCT_DETAIL',
    };
  }

  if (input === 'main_menu' || input === '처음으로') {
    return {
      messages: [
        botText('어떤 도움이 필요하신가요?', getMainMenuReplies()),
      ],
      nextPhase: 'MAIN_MENU',
    };
  }

  // Product detail
  if (input.startsWith('detail_')) {
    const code = input.replace('detail_', '');
    const product = getProducts().find(p => p.code === code);
    if (product) {
      return {
        messages: [
          createMsg({
            type: 'product_detail',
            content: '',
            product,
            quickReplies: [
              { label: '다른 상품 보기', value: 'all_products' },
              { label: '보험 추천받기', value: 'recommend' },
              { label: '처음으로', value: 'main_menu' },
            ],
          }),
        ],
        nextPhase: 'PRODUCT_DETAIL',
      };
    }
  }

  // Consultation flow
  if (phase === 'PRODUCT_CONSULT_AGE') {
    const ageGroups = ['20대', '30대', '40대', '50대', '60대'];
    if (ageGroups.includes(input)) {
      return {
        messages: [
          botText('성별을 알려주세요.', [
            { label: '남성', value: '남성' },
            { label: '여성', value: '여성' },
          ]),
        ],
        nextPhase: 'PRODUCT_CONSULT_GENDER',
        profileUpdate: { ageGroup: input },
      };
    }
  }

  if (phase === 'PRODUCT_CONSULT_GENDER') {
    if (input === '남성' || input === '여성') {
      return {
        messages: [
          botText('어떤 부분이 가장 걱정되시나요?\n여러 개를 선택하셔도 됩니다.', [
            { label: '암/건강', value: 'concern_암/건강' },
            { label: '사망보장', value: 'concern_사망보장' },
            { label: '노후/연금', value: 'concern_노후/연금' },
            { label: '저축/목돈', value: 'concern_저축/목돈' },
            { label: '입원/간병', value: 'concern_입원/간병' },
            { label: '의료비', value: 'concern_의료비' },
          ]),
        ],
        nextPhase: 'PRODUCT_CONSULT_CONCERN',
        profileUpdate: { gender: input as '남성' | '여성' },
      };
    }
  }

  if (phase === 'PRODUCT_CONSULT_CONCERN') {
    if (input.startsWith('concern_')) {
      const concern = input.replace('concern_', '');
      const currentConcerns = profile.concerns || [];
      const updated = [...currentConcerns, concern];
      return {
        messages: [
          botText(`"${concern}" 선택하셨습니다.\n\n매월 보험료 예산은 어느 정도 생각하고 계신가요?`, [
            { label: '10만원 이하', value: '10만원 이하' },
            { label: '10~30만원', value: '10~30만원' },
            { label: '30~50만원', value: '30~50만원' },
            { label: '50만원 이상', value: '50만원 이상' },
          ]),
        ],
        nextPhase: 'PRODUCT_CONSULT_BUDGET',
        profileUpdate: { concerns: updated },
      };
    }
  }

  if (phase === 'PRODUCT_CONSULT_BUDGET') {
    const budgets = ['10만원 이하', '10~30만원', '30~50만원', '50만원 이상'];
    if (budgets.includes(input)) {
      const updatedProfile = { ...profile, budget: input };
      const results = matchProducts(updatedProfile);
      const scenario = findClosestScenario(updatedProfile);

      const messages: Message[] = [];

      if (results.length > 0) {
        const products = results.map(r => r.product);
        const totalEst = results.reduce((s, r) => s + (r.estimatedPremium || 0), 0);

        messages.push(
          botText(
            `${profile.ageGroup || ''} ${profile.gender || ''}, ${(profile.concerns || []).join(' + ')} 관심, 월 ${input} 예산 기준으로\n추천 상품입니다.`
          )
        );
        messages.push(
          createMsg({
            type: 'product_cards',
            content: '',
            products,
            totalMonthly: totalEst,
          })
        );
      } else {
        messages.push(botText('조건에 맞는 상품을 찾기 어렵습니다. 다른 조건으로 다시 시도해 주세요.'));
      }

      if (scenario) {
        messages.push(
          botText('비슷한 상황의 고객 사례도 있어요!')
        );
        messages.push(
          createMsg({
            type: 'scenario_card',
            content: '',
            scenario,
            quickReplies: [
              { label: '다른 상품 보기', value: 'all_products' },
              { label: '상품 비교하기', value: 'compare' },
              { label: '처음으로', value: 'main_menu' },
            ],
          })
        );
      } else {
        messages.push(
          botText('더 궁금한 것이 있으시면 알려주세요!', [
            { label: '다른 상품 보기', value: 'all_products' },
            { label: '상품 비교하기', value: 'compare' },
            { label: '처음으로', value: 'main_menu' },
          ])
        );
      }

      return {
        messages,
        nextPhase: 'PRODUCT_CONSULT_RESULT',
        profileUpdate: { budget: input },
      };
    }
  }

  // Dynamic comparison (dyncompare_CODE1_CODE2)
  if (input.startsWith('dyncompare_')) {
    const parts = input.replace('dyncompare_', '').split('_');
    if (parts.length === 2) {
      const products = getProducts();
      const p1 = products.find(p => p.code === parts[0]);
      const p2 = products.find(p => p.code === parts[1]);
      if (p1 && p2) {
        const n1 = p1.name.replace('한화생명 ', '');
        const n2 = p2.name.replace('한화생명 ', '');
        const title = `${n1} vs ${n2}`;
        const table = buildDynamicComparison(p1, p2);
        return {
          messages: [
            createMsg({
              type: 'comparison_table',
              content: title,
              comparison: table,
              comparisonTitle: title,
              quickReplies: [
                { label: '다른 비교 보기', value: 'compare' },
                { label: '보험 추천받기', value: 'recommend' },
                { label: '처음으로', value: 'main_menu' },
              ],
            }),
          ],
          nextPhase: 'COMPARISON_MODE',
        };
      }
    }
  }

  // Comparison mode (button-driven)
  if (phase === 'COMPARISON_MODE' || input.startsWith('compare_')) {
    const comparisons = getComparisons();
    let key = '';
    let title = '';

    if (input === 'compare_death' || input === '정기 vs 종신') {
      key = '사망보장_비교';
      title = '사망보장 비교: e정기보험 vs H종신보험';
    } else if (input === 'compare_health' || input === '암보험 vs 건강보험') {
      key = '건강보장_비교';
      title = '건강보장 비교: e암보험 vs e건강보험(암뇌심)';
    } else if (input === 'compare_savings' || input === '연금 vs 재테크') {
      key = '저축_비교';
      title = '저축 비교: e연금저축보험 vs e재테크저축보험';
    }

    if (key && comparisons[key]) {
      return {
        messages: [
          createMsg({
            type: 'comparison_table',
            content: title,
            comparison: comparisons[key],
            comparisonTitle: title,
            quickReplies: [
              { label: '다른 비교 보기', value: 'compare' },
              { label: '보험 추천받기', value: 'recommend' },
              { label: '처음으로', value: 'main_menu' },
            ],
          }),
        ],
        nextPhase: 'COMPARISON_MODE',
      };
    }

    // COMPARISON_MODE에서 자유 텍스트 입력 시에도 비교 시도
    if (phase === 'COMPARISON_MODE') {
      const compareResult = tryCompare(input);
      if (compareResult) return compareResult;
    }
  }

  // FAQ mode
  if (phase === 'FAQ_MODE' || input.startsWith('faq_')) {
    const query = input.startsWith('faq_') ? input.replace('faq_', '') : input;
    const faq = searchFAQ(query);
    if (faq) {
      return {
        messages: [
          createMsg({
            type: 'faq_answer',
            content: '',
            faq,
            quickReplies: [
              { label: '다른 질문', value: 'faq' },
              { label: '보험 추천받기', value: 'recommend' },
              { label: '처음으로', value: 'main_menu' },
            ],
          }),
        ],
        nextPhase: 'FAQ_MODE',
      };
    }
  }

  // Free text: 비교 의도 감지 (FAQ보다 먼저 체크)
  const compareResult = tryCompare(input);
  if (compareResult) return compareResult;

  // Free text fallback
  const faq = searchFAQ(input);
  if (faq) {
    return {
      messages: [
        createMsg({
          type: 'faq_answer',
          content: '',
          faq,
          quickReplies: [
            { label: '다른 질문', value: 'faq' },
            { label: '보험 추천받기', value: 'recommend' },
            { label: '처음으로', value: 'main_menu' },
          ],
        }),
      ],
      nextPhase: 'FREE_QUESTION',
    };
  }

  const keywordResults = matchByKeyword(input);
  if (keywordResults.length > 0) {
    const products = keywordResults.map(r => r.product);
    return {
      messages: [
        botText(`"${input}"에 관련된 상품을 찾았어요!`),
        createMsg({
          type: 'product_cards',
          content: '',
          products,
          quickReplies: [
            { label: '보험 추천받기', value: 'recommend' },
            { label: '처음으로', value: 'main_menu' },
          ],
        }),
      ],
      nextPhase: 'FREE_QUESTION',
    };
  }

  // No match
  return {
    messages: [
      botText(
        '죄송해요, 잘 이해하지 못했어요.\n아래 메뉴에서 선택하시거나, 궁금한 보험 키워드를 입력해 주세요.',
        getMainMenuReplies()
      ),
    ],
    nextPhase: 'MAIN_MENU',
  };
}

// ══════════════════════════════════════
// 사내 업무 모드
// ══════════════════════════════════════

export function getInternalGreetingMessages(): Message[] {
  return [
    botText('한화생명 사내 업무 어시스턴트입니다.'),
    botText(
      '인수심사 기준, 보험금 청구 절차, 민원 처리 등 사내 규정을 검색할 수 있습니다.',
      [
        { label: '인수심사 기준', value: 'int_underwriting' },
        { label: '보험금 청구 절차', value: 'int_claim' },
        { label: '민원 처리 절차', value: 'int_complaint' },
        { label: '상품 스펙 조회', value: 'int_product_spec' },
      ]
    ),
  ];
}

export function getInternalMenuReplies(): QuickReply[] {
  return [
    { label: '인수심사 기준', value: 'int_underwriting' },
    { label: '보험금 청구 절차', value: 'int_claim' },
    { label: '민원 처리 절차', value: 'int_complaint' },
    { label: '상품 스펙 조회', value: 'int_product_spec' },
  ];
}

export function processInternalInput(input: string): FlowResult {
  const data = getProductData();
  const guidelines = data?.internal_guidelines as any;

  if (input === 'main_menu' || input === '처음으로') {
    return {
      messages: [botText('어떤 규정을 확인하시겠습니까?', getInternalMenuReplies())],
      nextPhase: 'MAIN_MENU',
    };
  }

  // 인수심사 기준
  if (input === 'int_underwriting' || hasKeyword(input, ['인수심사', '심사', '언더라이팅', '가입 조건', '인수'])) {
    if (guidelines?.underwriting) {
      const uw = guidelines.underwriting;
      const rules = uw.rules as { condition: string; action: string }[];
      const text = `**${uw.title}**\n\n` +
        rules.map((r: any, i: number) => `${i + 1}. **${r.condition}**\n   → ${r.action}`).join('\n\n');
      return {
        messages: [
          botText(text, [
            { label: '보험금 청구 절차', value: 'int_claim' },
            { label: '민원 처리 절차', value: 'int_complaint' },
            { label: '처음으로', value: 'main_menu' },
          ]),
        ],
        nextPhase: 'FREE_QUESTION',
      };
    }
  }

  // 보험금 청구 절차
  if (input === 'int_claim' || hasKeyword(input, ['청구', '보험금', '지급', '클레임'])) {
    if (guidelines?.claim_process) {
      const cp = guidelines.claim_process;
      const steps = cp.steps as any[];
      const docs = cp.required_docs as string[];
      const text = `**${cp.title}**\n\n` +
        steps.map((s: any) =>
          `**Step ${s.step}. ${s.action}** (${s.timeline})\n` +
          (s.channel ? `채널: ${s.channel}\n` : '') +
          (s.detail ? `${s.detail}` : '')
        ).join('\n\n') +
        `\n\n---\n**필요 서류**\n` +
        docs.map((d: string) => `• ${d}`).join('\n');
      return {
        messages: [
          botText(text, [
            { label: '인수심사 기준', value: 'int_underwriting' },
            { label: '민원 처리 절차', value: 'int_complaint' },
            { label: '처음으로', value: 'main_menu' },
          ]),
        ],
        nextPhase: 'FREE_QUESTION',
      };
    }
  }

  // 민원 처리 절차
  if (input === 'int_complaint' || hasKeyword(input, ['민원', '컴플레인', '불만', '에스컬레이션'])) {
    if (guidelines?.complaint_handling) {
      const ch = guidelines.complaint_handling;
      const steps = ch.steps as any[];
      const esc = ch.escalation as Record<string, string>;
      const text = `**${ch.title}**\n\n` +
        steps.map((s: any) =>
          `**Step ${s.step}. ${s.action}** (${s.timeline})\n` +
          (s.channel ? `채널: ${s.channel}` : '')
        ).join('\n\n') +
        `\n\n---\n**에스컬레이션 기준**\n` +
        Object.entries(esc).map(([k, v]) => `• **${k.replace(/_/g, ' ')}**: ${v}`).join('\n');
      return {
        messages: [
          botText(text, [
            { label: '인수심사 기준', value: 'int_underwriting' },
            { label: '보험금 청구 절차', value: 'int_claim' },
            { label: '처음으로', value: 'main_menu' },
          ]),
        ],
        nextPhase: 'FREE_QUESTION',
      };
    }
  }

  // 상품 스펙 조회
  if (input === 'int_product_spec' || hasKeyword(input, ['스펙', '상품 정보', '상품 조회'])) {
    const products = getProducts();
    const text = products.map(p =>
      `**${p.code}** ${p.name.replace('한화생명 ', '')}\n` +
      `카테고리: ${p.category} | 가입: ${p.entry_age} | ${p.type}`
    ).join('\n\n');
    return {
      messages: [
        botText(text, [
          ...products.slice(0, 4).map(p => ({
            label: p.code,
            value: `detail_${p.code}`,
          })),
        ]),
      ],
      nextPhase: 'FREE_QUESTION',
    };
  }

  // 상품 상세 (detail_)
  if (input.startsWith('detail_')) {
    const code = input.replace('detail_', '');
    const product = getProducts().find(p => p.code === code);
    if (product) {
      return {
        messages: [
          createMsg({
            type: 'product_detail',
            content: '',
            product,
            quickReplies: getInternalMenuReplies(),
          }),
        ],
        nextPhase: 'FREE_QUESTION',
      };
    }
  }

  // 키워드 기반 상품 매칭
  const keywordResults = matchByKeyword(input);
  if (keywordResults.length > 0) {
    const products = keywordResults.map(r => r.product);
    const text = products.map(p => {
      const prem = p.premium_table.순수보장형 || p.premium_table.표준체;
      const premStr = prem ? ` | 보험료(${prem[0].age}세 남): ${prem[0].male.toLocaleString()}원` : '';
      return `**${p.code} ${p.name.replace('한화생명 ', '')}**\n${p.category}${premStr}`;
    }).join('\n\n');
    return {
      messages: [
        botText(`검색 결과:\n\n${text}`, getInternalMenuReplies()),
      ],
      nextPhase: 'FREE_QUESTION',
    };
  }

  // No match
  return {
    messages: [
      botText('해당 규정을 찾지 못했습니다. 아래 메뉴에서 선택하거나 키워드를 입력하세요.', getInternalMenuReplies()),
    ],
    nextPhase: 'MAIN_MENU',
  };
}

function hasKeyword(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}

function getProductData() {
  return getDataRoot();
}
