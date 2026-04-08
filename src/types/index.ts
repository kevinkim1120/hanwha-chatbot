// ── Product Data Types ──

export interface PremiumEntry {
  age: number;
  male: number;
  female: number;
}

export interface RefundEntry {
  경과: string;
  환급률: string;
  환급금: string;
}

export interface PensionExample {
  age_start: number;
  monthly: number;
  period: string;
  pension_start: number;
  type: string;
  estimated_monthly_pension: string;
}

export interface Product {
  code: string;
  name: string;
  category: string;
  purpose: string;
  type: string;
  entry_age: string;
  insurance_period: string[];
  payment_period: string[];
  coverage_range: string;
  coverage_detail: Record<string, unknown>;
  premium_table: {
    기준: string;
    순수보장형?: PremiumEntry[];
    만기환급형?: PremiumEntry[];
    표준체?: PremiumEntry[];
    환급률_예시?: RefundEntry[];
    연금수령_예시?: PensionExample[];
    비고?: string;
  };
  features: string[];
  who_needs_this: string;
  cautions: string[];
}

export interface ScenarioProduct {
  code: string;
  name: string;
  monthly: number;
  reason: string;
}

export interface CustomerScenario {
  id: string;
  persona: string;
  background: string;
  concern: string;
  budget: string;
  recommended: {
    products: ScenarioProduct[];
    total_monthly: number;
    summary: string;
  };
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ComparisonTable {
  columns: string[];
  rows: string[][];
}

export interface ProductData {
  _meta: { description: string; source: string; note: string };
  products: Product[];
  customer_scenarios: CustomerScenario[];
  faq: FAQ[];
  internal_guidelines: Record<string, unknown>;
  product_comparison: Record<string, ComparisonTable>;
}

// ── Chat Types ──

export type Gender = '남성' | '여성';

export interface UserProfile {
  ageGroup?: string;
  age?: number;
  gender?: Gender;
  concerns?: string[];
  budget?: string;
}

export type ChatPhase =
  | 'GREETING'
  | 'MAIN_MENU'
  | 'PRODUCT_CONSULT_AGE'
  | 'PRODUCT_CONSULT_GENDER'
  | 'PRODUCT_CONSULT_CONCERN'
  | 'PRODUCT_CONSULT_BUDGET'
  | 'PRODUCT_CONSULT_RESULT'
  | 'FAQ_MODE'
  | 'COMPARISON_MODE'
  | 'SCENARIO_MODE'
  | 'PRODUCT_DETAIL'
  | 'FREE_QUESTION';

export interface QuickReply {
  label: string;
  value: string;
}

export type MessageType =
  | 'text'
  | 'quick_replies'
  | 'product_cards'
  | 'product_detail'
  | 'comparison_table'
  | 'scenario_card'
  | 'faq_answer';

export interface Message {
  id: string;
  sender: 'bot' | 'user';
  type: MessageType;
  content: string;
  quickReplies?: QuickReply[];
  products?: Product[];
  product?: Product;
  scenario?: CustomerScenario;
  comparison?: ComparisonTable;
  comparisonTitle?: string;
  faq?: FAQ;
  totalMonthly?: number;
  timestamp: number;
}

export type ChatMode = 'customer' | 'internal';

export type ChatAction =
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'SET_TYPING'; typing: boolean }
  | { type: 'SET_PHASE'; phase: ChatPhase }
  | { type: 'UPDATE_PROFILE'; profile: Partial<UserProfile> }
  | { type: 'SET_MODE'; mode: ChatMode }
  | { type: 'RESET' };

export interface ChatState {
  messages: Message[];
  typing: boolean;
  phase: ChatPhase;
  profile: UserProfile;
  mode: ChatMode;
}
