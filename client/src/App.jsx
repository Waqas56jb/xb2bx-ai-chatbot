import { useState, useCallback } from 'react';
import { CONFIG } from './config.js';
import { sendMessage, getSessionId } from './api.js';
import Header from './components/Header.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import MessageList from './components/MessageList.jsx';
import Composer from './components/Composer.jsx';

export default function App() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const start = () => {
    setStarted(true);
    setMessages([{ role: 'assistant', content: CONFIG.greeting }]);
  };

  const reset = () => {
    setStarted(false);
    setMessages([]);
    setConversationId(null);
    setLoading(false);
  };

  const send = useCallback(
    async (text) => {
      if (!text || loading) return;

      const nextMessages = [...messages, { role: 'user', content: text }];
      setMessages(nextMessages);
      setLoading(true);

      try {
        // Send only real turns to the backend (skip the static greeting).
        const payload = nextMessages.filter((m, i) => !(i === 0 && m.role === 'assistant'));
        const data = await sendMessage({
          messages: payload,
          sessionId: getSessionId(),
          conversationId
        });
        if (data.conversation_id) setConversationId(data.conversation_id);
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, agent: data.agent }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              `⚠️ ${err.message || 'Something went wrong.'}\n\nPlease try again in a moment.`
          }
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, conversationId]
  );

  const showQuickReplies = started && !messages.some((m) => m.role === 'user');

  return (
    <div className="app">
      <div className="widget">
        <Header onClose={reset} />

        <div className="body">
          {!started ? (
            <WelcomeScreen onStart={start} />
          ) : (
            <MessageList
              messages={messages}
              loading={loading}
              showQuickReplies={showQuickReplies}
              onQuickPick={send}
            />
          )}
        </div>

        {started && <Composer onSend={send} disabled={loading} />}

        <footer className="footer">{CONFIG.footer}</footer>
      </div>
    </div>
  );
}
