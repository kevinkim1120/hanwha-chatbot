import { useCallback } from 'react';
import { useChatState, useChatDispatch } from '../context/ChatContext';
import {
  getGreetingMessages,
  getInternalGreetingMessages,
  processInput,
  processInternalInput,
} from '../engine/flowController';
import { sendToClaude, resetConversation } from '../engine/claudeChat';
import type { Message, ChatMode } from '../types';

let msgCounter = 1000;

export function useChat() {
  const state = useChatState();
  const dispatch = useChatDispatch();

  const addBotMessage = useCallback(
    (content: string) => {
      const msg: Message = {
        id: `bot-${++msgCounter}`,
        sender: 'bot',
        type: 'text',
        content,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_MESSAGE', message: msg });
    },
    [dispatch]
  );

  const addBotMessages = useCallback(
    async (messages: Message[]) => {
      dispatch({ type: 'SET_TYPING', typing: true });
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
      dispatch({ type: 'SET_TYPING', typing: false });

      for (let i = 0; i < messages.length; i++) {
        dispatch({ type: 'ADD_MESSAGE', message: messages[i] });
        if (i < messages.length - 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
    },
    [dispatch]
  );

  const sendGreeting = useCallback(
    async (mode?: ChatMode) => {
      const m = mode || state.mode;
      const messages =
        m === 'internal' ? getInternalGreetingMessages() : getGreetingMessages();
      await addBotMessages(messages);
      dispatch({ type: 'SET_PHASE', phase: 'MAIN_MENU' });
    },
    [state.mode, addBotMessages, dispatch]
  );

  const switchMode = useCallback(
    async (mode: ChatMode) => {
      dispatch({ type: 'SET_MODE', mode });
      resetConversation();
      // sendGreeting will be triggered by ChatWindow via useEffect
    },
    [dispatch]
  );

  const sendMessage = useCallback(
    async (input: string) => {
      const userMsg: Message = {
        id: `user-${++msgCounter}`,
        sender: 'user',
        type: 'text',
        content: input,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_MESSAGE', message: userMsg });

      if (state.mode === 'customer') {
        // Claude API for customer mode
        dispatch({ type: 'SET_TYPING', typing: true });
        try {
          const reply = await sendToClaude(input);
          dispatch({ type: 'SET_TYPING', typing: false });
          addBotMessage(reply);
        } catch {
          dispatch({ type: 'SET_TYPING', typing: false });
          // Fallback to rule-based
          const result = processInput(input, state.phase, state.profile);
          if (result.profileUpdate) {
            dispatch({ type: 'UPDATE_PROFILE', profile: result.profileUpdate });
          }
          await addBotMessages(result.messages);
          dispatch({ type: 'SET_PHASE', phase: result.nextPhase });
        }
      } else {
        // Internal mode: rule-based
        const result = processInternalInput(input);
        if (result.profileUpdate) {
          dispatch({ type: 'UPDATE_PROFILE', profile: result.profileUpdate });
        }
        await addBotMessages(result.messages);
        dispatch({ type: 'SET_PHASE', phase: result.nextPhase });
      }
    },
    [state.mode, state.phase, state.profile, addBotMessage, addBotMessages, dispatch]
  );

  return {
    messages: state.messages,
    typing: state.typing,
    phase: state.phase,
    profile: state.profile,
    mode: state.mode,
    sendMessage,
    sendGreeting,
    switchMode,
  };
}
