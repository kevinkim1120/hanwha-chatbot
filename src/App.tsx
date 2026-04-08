import { ChatProvider } from './context/ChatContext';
import Header from './components/Layout/Header';
import ChatWindow from './components/Chat/ChatWindow';
import { useChat } from './hooks/useChat';

function AppContent() {
  const { mode, switchMode } = useChat();

  return (
    <>
      <Header mode={mode} onModeChange={switchMode} />
      <ChatWindow />
    </>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
