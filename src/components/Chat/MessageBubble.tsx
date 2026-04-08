import { Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../../types';
import ProductCard from '../Cards/ProductCard';
import ProductDetail from '../Cards/ProductDetail';
import ComparisonTableComp from '../Cards/ComparisonTable';
import ScenarioCard from '../Cards/ScenarioCard';
import QuickReplies from '../Input/QuickReplies';

interface Props {
  message: Message;
  onQuickReply: (value: string) => void;
  onProductDetail: (code: string) => void;
  isLast: boolean;
}

export default function MessageBubble({ message, onQuickReply, onProductDetail, isLast }: Props) {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="animate-slide-up" style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '4px var(--space-lg)',
        marginBottom: 'var(--space-sm)',
      }}>
        <div style={{
          maxWidth: '75%',
          padding: '10px 16px',
          borderRadius: '18px 18px 4px 18px',
          background: 'var(--color-user-bubble)',
          color: 'var(--color-user-text)',
          fontSize: 'var(--font-size-base)',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  // Bot message
  return (
    <div className="animate-slide-up" style={{ marginBottom: 'var(--space-sm)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-sm)',
        padding: '4px var(--space-lg)',
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
          marginTop: 2,
        }}>
          <Shield size={16} color="white" />
        </div>

        <div style={{ flex: 1, maxWidth: 'calc(100% - 44px)', minWidth: 0 }}>
          {/* Text content */}
          {message.type === 'text' && message.content && (
            <div className="bot-message-bubble" style={{
              display: 'inline-block',
              maxWidth: '85%',
              padding: '10px 16px',
              borderRadius: '18px 18px 18px 4px',
              background: 'var(--color-bot-bubble)',
              color: 'var(--color-bot-text)',
              fontSize: 'var(--font-size-base)',
              lineHeight: 1.6,
              boxShadow: 'var(--shadow-sm)',
              wordBreak: 'break-word',
            }}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{children}</strong>,
                  table: ({ children }) => (
                    <div style={{ overflowX: 'auto', margin: '8px 0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead>{children}</thead>,
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => <tr>{children}</tr>,
                  th: ({ children }) => (
                    <th style={{
                      padding: '8px 10px',
                      background: 'var(--color-primary-lighter)',
                      fontWeight: 600,
                      textAlign: 'left',
                      borderBottom: '2px solid var(--color-primary)',
                      whiteSpace: 'nowrap',
                      fontSize: 'var(--font-size-xs)',
                    }}>{children}</th>
                  ),
                  td: ({ children }) => (
                    <td style={{
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--color-border-light)',
                      fontSize: 'var(--font-size-xs)',
                    }}>{children}</td>
                  ),
                  ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                  h1: ({ children }) => <p style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', margin: '8px 0 4px' }}>{children}</p>,
                  h2: ({ children }) => <p style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', margin: '8px 0 4px' }}>{children}</p>,
                  h3: ({ children }) => <p style={{ fontWeight: 600, margin: '6px 0 4px' }}>{children}</p>,
                  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />,
                  blockquote: ({ children }) => (
                    <div style={{
                      borderLeft: '3px solid var(--color-primary)',
                      paddingLeft: '12px',
                      margin: '8px 0',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                    }}>{children}</div>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Product cards */}
          {message.type === 'product_cards' && message.products && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginTop: message.content ? 8 : 0,
              maxWidth: '100%',
            }}>
              {message.products.map(p => (
                <ProductCard
                  key={p.code}
                  product={p}
                  onDetail={onProductDetail}
                  compact={message.products!.length > 3}
                />
              ))}
              {message.totalMonthly != null && message.totalMonthly > 0 && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--color-primary-lighter)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                }}>
                  예상 합계: <span style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-lg)' }}>
                    월 {message.totalMonthly.toLocaleString()}원
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Product detail */}
          {message.type === 'product_detail' && message.product && (
            <div style={{ marginTop: message.content ? 8 : 0 }}>
              <ProductDetail product={message.product} />
            </div>
          )}

          {/* Comparison table */}
          {message.type === 'comparison_table' && message.comparison && (
            <div style={{ marginTop: 4 }}>
              <ComparisonTableComp
                title={message.comparisonTitle || ''}
                table={message.comparison}
              />
            </div>
          )}

          {/* Scenario card */}
          {message.type === 'scenario_card' && message.scenario && (
            <div style={{ marginTop: message.content ? 8 : 0 }}>
              <ScenarioCard scenario={message.scenario} />
            </div>
          )}

          {/* FAQ answer */}
          {message.type === 'faq_answer' && message.faq && (
            <div style={{
              background: 'var(--color-bg-white)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
              border: '1px solid var(--color-border-light)',
              marginTop: 4,
            }}>
              <div style={{
                padding: '12px 16px',
                background: 'var(--color-info)',
                color: 'white',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
              }}>
                Q. {message.faq.question}
              </div>
              <div style={{
                padding: '14px 16px',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.7,
                color: 'var(--color-text-secondary)',
              }}>
                {message.faq.answer}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick replies - only show for the last message */}
      {isLast && message.quickReplies && message.quickReplies.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <QuickReplies replies={message.quickReplies} onSelect={onQuickReply} />
        </div>
      )}
    </div>
  );
}
