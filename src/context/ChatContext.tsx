import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { ChatState, ChatAction } from '../types';

const initialState: ChatState = {
  messages: [],
  typing: false,
  phase: 'GREETING',
  profile: {},
  mode: 'customer',
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_TYPING':
      return { ...state, typing: action.typing };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.profile } };
    case 'SET_MODE':
      return { ...initialState, mode: action.mode };
    case 'RESET':
      return { ...initialState, mode: state.mode };
    default:
      return state;
  }
}

const ChatContext = createContext<ChatState>(initialState);
const ChatDispatchContext = createContext<Dispatch<ChatAction>>(() => {});

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  return (
    <ChatContext.Provider value={state}>
      <ChatDispatchContext.Provider value={dispatch}>
        {children}
      </ChatDispatchContext.Provider>
    </ChatContext.Provider>
  );
}

export function useChatState() {
  return useContext(ChatContext);
}

export function useChatDispatch() {
  return useContext(ChatDispatchContext);
}
