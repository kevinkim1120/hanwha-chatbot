import { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { loadProductData } from '../../data/products';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from '../Input/ChatInput';

export default function ChatWindow() {
  const { messages, typing, mode, sendMessage, sendGreeting } = useChat();
  const scrollRef = useAutoScroll([messages.length, typing]);
  const initialized = useRef(false);
  const lastMode = useRef(mode);

  // Initial greeting
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadProductData().then(() => {
      sendGreeting(mode);
    });
  }, []);

  // Mode switch → re-greet
  useEffect(() => {
    if (!initialized.current) return;
    if (lastMode.current !== mode) {
      lastMode.current = mode;
      sendGreeting(mode);
    }
  }, [mode, sendGreeting]);

  const handleQuickReply = (value: string) => {
    sendMessage(value);
  };

  const handleProductDetail = (code: string) => {
    sendMessage(`detail_${code}`);
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      maxWidth: '100%',
    }}>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 'var(--space-lg) 0',
        }}
      >
        <div style={{
          maxWidth: 'var(--chat-max-width)',
          margin: '0 auto',
        }}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onQuickReply={handleQuickReply}
              onProductDetail={handleProductDetail}
              isLast={i === messages.length - 1}
            />
          ))}
          {typing && <TypingIndicator />}
        </div>
      </div>

      <ChatInput
        onSend={sendMessage}
        disabled={typing}
        placeholder={
          mode === 'customer'
            ? '궁금한 점을 입력해 주세요...'
            : '사내 규정 키워드를 입력하세요...'
        }
      />
    </div>
  );
}
