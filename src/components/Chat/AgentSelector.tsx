import { For, createSignal } from 'solid-js';
import { agents, selectedAgentId, setSelectedAgentId } from '../../store/appState';

export function AgentSelector() {
  const [isOpen, setIsOpen] = createSignal(false);

  const activeAgentName = () => {
    const id = selectedAgentId();
    if (!id) return 'Global Default';
    const agent = agents().find(a => a.id === id);
    return agent ? agent.name : 'Global Default';
  };

  const activeAgentIcon = () => {
    const id = selectedAgentId();
    if (!id) return '🤖';
    const agent = agents().find(a => a.id === id);
    return agent?.avatar || '🧠';
  };

  const selectAgent = (id: string) => {
    setSelectedAgentId(id);
    localStorage.setItem('active_agent_id', id);
    setIsOpen(false);
  };

  return (
    <div class="agent-selector-wrapper">
      <div class="agent-selector-label">Chatting with:</div>
      <div class="agent-dropdown" classList={{ 'open': isOpen() }}>
        <button 
          class="agent-dropdown-toggle" 
          onClick={() => setIsOpen(!isOpen())}
        >
          <span class="agent-icon">{activeAgentIcon()}</span>
          <span class="agent-name">{activeAgentName()}</span>
          <span class="agent-dropdown-arrow">▼</span>
        </button>

        {isOpen() && (
          <div class="agent-dropdown-menu">
            <div 
              class={`agent-option ${selectedAgentId() === '' ? 'selected' : ''}`}
              onClick={() => selectAgent('')}
            >
              <span class="agent-icon">🤖</span>
              <div class="agent-details">
                <div class="agent-name">Global Default</div>
                <div class="agent-desc">Uses system instruction from settings.</div>
              </div>
            </div>
            <For each={agents()}>
              {(agent) => (
                <div 
                  class={`agent-option ${selectedAgentId() === agent.id ? 'selected' : ''}`}
                  onClick={() => selectAgent(agent.id)}
                >
                  <span class="agent-icon">{agent.avatar || '🧠'}</span>
                  <div class="agent-details">
                    <div class="agent-name">{agent.name}</div>
                    <div class="agent-desc" title={agent.systemPrompt}>
                      {agent.systemPrompt.length > 40 ? agent.systemPrompt.substring(0, 40) + '...' : agent.systemPrompt}
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        )}
      </div>
      
      {/* Click outside overlay */}
      {isOpen() && (
        <div 
          class="dropdown-overlay" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
