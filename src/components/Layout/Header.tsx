import { Shield, Headphones, Building2 } from 'lucide-react';
import type { ChatMode } from '../../types';

interface Props {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

const tabs: { mode: ChatMode; label: string; icon: typeof Headphones }[] = [
  { mode: 'customer', label: '고객 상담', icon: Headphones },
  { mode: 'internal', label: '사내 업무', icon: Building2 },
];

export default function Header({ mode, onModeChange }: Props) {
  return (
    <header style={{
      background: 'var(--color-bg-white)',
      borderBottom: '1px solid var(--color-border)',
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Top bar */}
      <div style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-lg)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          maxWidth: 'var(--chat-max-width)',
          margin: '0 auto',
          width: '100%',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: mode === 'customer' ? 'var(--color-primary)' : 'var(--color-bg-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}>
            <Shield size={22} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.3,
            }}>
              한화생명 {mode === 'customer' ? '보험상담' : '사내 어시스턴트'}
            </h1>
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-light)',
              lineHeight: 1.2,
            }}>
              {mode === 'customer' ? 'AI 챗봇 상담' : '사내 규정 검색'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        maxWidth: 'var(--chat-max-width)',
        margin: '0 auto',
        padding: '0 var(--space-lg)',
      }}>
        {tabs.map(tab => {
          const active = mode === tab.mode;
          const Icon = tab.icon;
          return (
            <button
              key={tab.mode}
              onClick={() => onModeChange(tab.mode)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 0',
                fontSize: 'var(--font-size-sm)',
                fontWeight: active ? 700 : 500,
                color: active
                  ? (tab.mode === 'customer' ? 'var(--color-primary)' : 'var(--color-bg-dark)')
                  : 'var(--color-text-light)',
                borderBottom: active
                  ? `2.5px solid ${tab.mode === 'customer' ? 'var(--color-primary)' : 'var(--color-bg-dark)'}`
                  : '2.5px solid transparent',
                background: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
