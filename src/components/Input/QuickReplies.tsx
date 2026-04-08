import type { QuickReply } from '../../types';

interface Props {
  replies: QuickReply[];
  onSelect: (value: string) => void;
}

export default function QuickReplies({ replies, onSelect }: Props) {
  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      padding: '4px var(--space-lg)',
      paddingLeft: 'calc(32px + var(--space-lg) + var(--space-sm))',
    }}>
      {replies.map(reply => (
        <button
          key={reply.value}
          onClick={() => onSelect(reply.value)}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: '1.5px solid var(--color-primary)',
            color: 'var(--color-primary)',
            background: 'var(--color-bg-white)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-primary)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--color-bg-white)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}
