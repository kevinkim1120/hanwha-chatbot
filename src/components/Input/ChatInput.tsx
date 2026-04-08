import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        height: 'var(--input-height)',
        background: 'var(--color-bg-white)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-lg)',
        gap: 'var(--space-sm)',
        flexShrink: 0,
      }}
    >
      <div style={{
        flex: 1,
        maxWidth: 'var(--chat-max-width)',
        margin: '0 auto',
        display: 'flex',
        gap: 'var(--space-sm)',
        alignItems: 'center',
        width: '100%',
      }}>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder || '궁금한 점을 입력해 주세요...'}
          disabled={disabled}
          style={{
            flex: 1,
            height: 44,
            padding: '0 var(--space-md)',
            borderRadius: 'var(--radius-full)',
            border: '1.5px solid var(--color-border)',
            outline: 'none',
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-primary)',
            background: 'var(--color-bg-gray)',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: value.trim() ? 'var(--color-primary)' : 'var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          <Send size={18} color="white" />
        </button>
      </div>
    </form>
  );
}
