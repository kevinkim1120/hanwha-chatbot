import { ChevronRight } from 'lucide-react';
import type { Product } from '../../types';

interface Props {
  product: Product;
  onDetail?: (code: string) => void;
  compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  '정기보험': '#3B82F6',
  '종신보험': '#8B5CF6',
  '암보험': '#EF4444',
  '건강보험': '#10B981',
  '연금저축보험': '#F59E0B',
  '저축보험': '#F97316',
  '간병보험': '#06B6D4',
  '실손보험': '#6366F1',
};

function getPremiumText(product: Product): string {
  const table = product.premium_table;
  const entries = table.순수보장형 || table.표준체;
  if (entries && entries.length > 0) {
    const entry = entries[0];
    return `${entry.age}세 남성 기준 월 ${entry.male.toLocaleString()}원~`;
  }
  if (table.환급률_예시) {
    return `10년 만기 시 환급률 ${table.환급률_예시[table.환급률_예시.length - 1]?.환급률 || ''}`;
  }
  if (table.연금수령_예시) {
    const ex = table.연금수령_예시[0];
    return `월 ${(ex.monthly / 10000).toLocaleString()}만원 납입 시 ${ex.estimated_monthly_pension}`;
  }
  return '';
}

export default function ProductCard({ product, onDetail, compact }: Props) {
  const categoryColor = CATEGORY_COLORS[product.category] || 'var(--color-primary)';

  return (
    <div
      style={{
        background: 'var(--color-bg-white)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        padding: compact ? '14px' : '18px',
        transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: onDetail ? 'pointer' : 'default',
        border: '1px solid var(--color-border-light)',
      }}
      onClick={() => onDetail?.(product.code)}
      onMouseEnter={e => {
        if (onDetail) {
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          padding: '3px 10px',
          borderRadius: 'var(--radius-full)',
          background: categoryColor + '18',
          color: categoryColor,
          fontSize: 'var(--font-size-xs)',
          fontWeight: 600,
        }}>
          {product.category}
        </span>
        <span style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-light)',
        }}>
          {product.code}
        </span>
      </div>

      <h3 style={{
        fontSize: compact ? 'var(--font-size-base)' : 'var(--font-size-lg)',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        marginBottom: 6,
        lineHeight: 1.4,
      }}>
        {product.name.replace('한화생명 ', '')}
      </h3>

      <p style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        marginBottom: 10,
        lineHeight: 1.5,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {product.purpose}
      </p>

      {!compact && (
        <ul style={{ marginBottom: 10, paddingLeft: 0, listStyle: 'none' }}>
          {product.features.slice(0, 2).map((f, i) => (
            <li key={i} style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              padding: '2px 0',
              display: 'flex',
              gap: 6,
              lineHeight: 1.5,
            }}>
              <span style={{ color: 'var(--color-primary)', flexShrink: 0 }}>&#10003;</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTop: '1px solid var(--color-border-light)',
      }}>
        <span style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-primary)',
          fontWeight: 600,
        }}>
          {getPremiumText(product)}
        </span>
        {onDetail && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-light)',
          }}>
            자세히 <ChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  );
}
