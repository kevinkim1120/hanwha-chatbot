import { User } from 'lucide-react';
import type { CustomerScenario } from '../../types';

interface Props {
  scenario: CustomerScenario;
}

export default function ScenarioCard({ scenario }: Props) {
  const { persona, background, concern, recommended } = scenario;

  return (
    <div style={{
      background: 'var(--color-bg-white)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden',
      border: '1px solid var(--color-border-light)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 18px',
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>{persona}</div>
          </div>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9, lineHeight: 1.5 }}>
          "{concern}"
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px' }}>
        <p style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
          marginBottom: 12,
          lineHeight: 1.5,
        }}>
          {background}
        </p>

        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 8 }}>
          추천 상품 조합
        </div>

        {recommended.products.map((p, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: i < recommended.products.length - 1 ? '1px solid var(--color-border-light)' : 'none',
          }}>
            <div>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}>
                {p.name}
              </span>
              <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-light)',
                marginTop: 2,
              }}>
                {p.reason.length > 40 ? p.reason.slice(0, 40) + '...' : p.reason}
              </p>
            </div>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-primary)',
              whiteSpace: 'nowrap',
              marginLeft: 12,
            }}>
              {p.monthly > 0 ? `월 ${p.monthly.toLocaleString()}원` : '일시납'}
            </span>
          </div>
        ))}

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          paddingTop: 12,
          borderTop: '2px solid var(--color-primary)',
        }}>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>
            합계
          </span>
          <span style={{
            fontWeight: 700,
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-primary)',
          }}>
            월 {recommended.total_monthly.toLocaleString()}원
          </span>
        </div>

        <p style={{
          marginTop: 12,
          padding: '10px 14px',
          background: 'var(--color-primary-lighter)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}>
          {recommended.summary}
        </p>
      </div>
    </div>
  );
}
