import { For, Show, onMount } from 'solid-js';
import { WelcomeScreen } from './WelcomeScreen';
import { 
  messages, 
  loading, 
  setScrollerRef, 
  sessionId, 
  setMessages, 
  scrollToBottom,
  activePersona,
  agents,
  selectedAgentId
} from '../../store/appState';

export function MessageList() {
  // Lifecycle for initial history restore
  onMount(() => {
    // Check if we have history saved locally for this session
    const savedMessages = localStorage.getItem(`chat_history_${sessionId()}`);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
        scrollToBottom();
      } catch (e) {
        console.error('Failed to restore chat history', e);
      }
    }
  });

  const getAssistantAvatar = () => {
    const id = selectedAgentId();
    if (!id) return '🤖';
    const agent = agents().find(a => a.id === id);
    return agent?.avatar || '🤖';
  };

  return (
    <div class="messages-scroller" ref={(el) => setScrollerRef(el)}>
      <Show when={messages().length === 0}>
        <WelcomeScreen />
      </Show>

      {/* Render message list */}
      <For each={messages()}>
        {(msg) => (
          <div class={`message-row ${msg.role}`}>
            <div class="message-bubble-wrapper">
              <div class={`message-avatar ${msg.role}`}>
                {msg.role === 'user' ? activePersona().avatar : getAssistantAvatar()}
              </div>
              <div>
                <div class="message-bubble">
                  <div style="white-space: pre-wrap;">{msg.text}</div>
                </div>
                <div class="message-meta">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </For>

      {/* Typing status indicator */}
      <Show when={loading()}>
        <div class="message-row assistant">
          <div class="message-bubble-wrapper">
            <div class="message-avatar assistant">{getAssistantAvatar()}</div>
            <div>
              <div class="message-bubble">
                <div class="typing-indicator">
                  <div class="typing-dot"></div>
                  <div class="typing-dot"></div>
                  <div class="typing-dot"></div>
                </div>
              </div>
              <div class="message-meta">
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
