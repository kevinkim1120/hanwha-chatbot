import type { ComparisonTable as CompTableType } from '../../types';

interface Props {
  title: string;
  table: CompTableType;
}

export default function ComparisonTable({ title, table }: Props) {
  return (
    <div style={{
      background: 'var(--color-bg-white)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden',
      border: '1px solid var(--color-border-light)',
    }}>
      <div style={{
        padding: '14px 18px',
        background: 'var(--color-primary)',
        color: 'white',
        fontWeight: 700,
        fontSize: 'var(--font-size-base)',
      }}>
        {title}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--font-size-sm)',
        }}>
          <thead>
            <tr>
              {table.columns.map((col, i) => (
                <th key={i} style={{
                  padding: '10px 14px',
                  background: 'var(--color-primary-lighter)',
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--color-border-light)',
                    background: ri % 2 === 0 ? 'var(--color-bg-white)' : 'var(--color-bg-gray)',
                    fontWeight: ci === 0 ? 600 : 400,
                    color: ci === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
