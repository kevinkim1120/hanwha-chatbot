import { Shield } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 'var(--space-sm)',
      padding: '0 var(--space-lg)',
      marginBottom: 'var(--space-md)',
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Shield size={16} color="white" />
      </div>
      <div style={{
        background: 'var(--color-bg-white)',
        borderRadius: '18px 18px 18px 4px',
        padding: '12px 16px',
        display: 'flex',
        gap: 4,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--color-text-light)',
              display: 'inline-block',
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
