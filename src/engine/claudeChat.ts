interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const conversationHistory: ChatMessage[] = [];

export async function sendToClaude(userMessage: string): Promise<string> {
  conversationHistory.push({ role: 'user', content: userMessage });

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const reply = data.reply;

    conversationHistory.push({ role: 'assistant', content: reply });

    return reply;
  } catch (err: any) {
    // Remove failed user message from history
    conversationHistory.pop();
    throw err;
  }
}

export function resetConversation() {
  conversationHistory.length = 0;
}
