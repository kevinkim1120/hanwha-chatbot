import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { Product } from '../../types';

interface Props {
  product: Product;
}

export default function ProductDetail({ product }: Props) {
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
        padding: '18px',
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
        color: 'white',
      }}>
        <div style={{
          fontSize: 'var(--font-size-xs)',
          opacity: 0.8,
          marginBottom: 4,
        }}>
          {product.category} | {product.code}
        </div>
        <h3 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          lineHeight: 1.3,
        }}>
          {product.name.replace('한화생명 ', '')}
        </h3>
        <p style={{
          fontSize: 'var(--font-size-sm)',
          opacity: 0.9,
          marginTop: 6,
          lineHeight: 1.5,
        }}>
          {product.purpose}
        </p>
      </div>

      <div style={{ padding: '18px' }}>
        {/* Basic Info */}
        <div style={{ marginBottom: 16 }}>
          <SectionTitle icon={<Info size={14} />} title="기본 정보" />
          <InfoRow label="가입 나이" value={product.entry_age} />
          <InfoRow label="보험 기간" value={product.insurance_period.join(', ')} />
          <InfoRow label="납입 기간" value={product.payment_period.join(', ')} />
          <InfoRow label="보장 범위" value={product.coverage_range} />
          <InfoRow label="상품 유형" value={product.type} />
        </div>

        {/* Features */}
        <div style={{ marginBottom: 16 }}>
          <SectionTitle icon={<CheckCircle size={14} />} title="주요 특징" />
          {product.features.map((f, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 8,
              padding: '6px 0',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
            }}>
              <span style={{ color: 'var(--color-success)', flexShrink: 0 }}>&#10003;</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Premium */}
        <div style={{ marginBottom: 16 }}>
          <SectionTitle icon={<Info size={14} />} title="보험료 안내" />
          <p style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-light)',
            marginBottom: 8,
          }}>
            {product.premium_table.기준}
          </p>
          {renderPremiumTable(product)}
          {product.premium_table.비고 && (
            <p style={{
              marginTop: 8,
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-light)',
              lineHeight: 1.5,
            }}>
              * {product.premium_table.비고}
            </p>
          )}
        </div>

        {/* Target */}
        <div style={{
          padding: '12px 14px',
          background: 'var(--color-primary-lighter)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 16,
          fontSize: 'var(--font-size-sm)',
          lineHeight: 1.6,
          color: 'var(--color-text-secondary)',
        }}>
          <strong style={{ color: 'var(--color-primary)' }}>이런 분께 추천</strong><br />
          {product.who_needs_this}
        </div>

        {/* Cautions */}
        <div>
          <SectionTitle icon={<AlertTriangle size={14} />} title="유의사항" />
          {product.cautions.map((c, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 8,
              padding: '4px 0',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-light)',
              lineHeight: 1.5,
            }}>
              <span style={{ color: 'var(--color-warning)', flexShrink: 0 }}>!</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
      fontSize: 'var(--font-size-sm)',
      fontWeight: 700,
      color: 'var(--color-text-primary)',
    }}>
      {icon}
      {title}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid var(--color-border-light)',
      fontSize: 'var(--font-size-sm)',
    }}>
      <span style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

function renderPremiumTable(product: Product) {
  const entries = product.premium_table.순수보장형 || product.premium_table.표준체;
  if (entries && entries.length > 0) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
          <thead>
            <tr>
              <th style={thStyle}>나이</th>
              <th style={thStyle}>남성</th>
              <th style={thStyle}>여성</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{e.age}세</td>
                <td style={tdStyle}>{e.male.toLocaleString()}원</td>
                <td style={tdStyle}>{e.female.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const refundEntries = product.premium_table.환급률_예시;
  if (refundEntries) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
          <thead>
            <tr>
              <th style={thStyle}>경과</th>
              <th style={thStyle}>환급률</th>
              <th style={thStyle}>환급금</th>
            </tr>
          </thead>
          <tbody>
            {refundEntries.map((e, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{e.경과}</td>
                <td style={tdStyle}>{e.환급률}</td>
                <td style={tdStyle}>{e.환급금}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const pensionEntries = product.premium_table.연금수령_예시;
  if (pensionEntries) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
          <thead>
            <tr>
              <th style={thStyle}>시작나이</th>
              <th style={thStyle}>월납입</th>
              <th style={thStyle}>예상연금</th>
            </tr>
          </thead>
          <tbody>
            {pensionEntries.map((e, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{e.age_start}세</td>
                <td style={tdStyle}>월 {(e.monthly / 10000).toLocaleString()}만원</td>
                <td style={tdStyle}>{e.estimated_monthly_pension}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  background: 'var(--color-bg-gray)',
  fontWeight: 600,
  textAlign: 'left',
  borderBottom: '1px solid var(--color-border)',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--color-border-light)',
};
