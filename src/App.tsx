import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { AgentManager } from './components/AgentManager';
import { Sidebar } from './components/Sidebar';
import { MessageList } from './components/Chat/MessageList';
import { InputSection } from './components/Chat/InputSection';
import { AgentSelector } from './components/Chat/AgentSelector';
import { currentTab } from './store/appState';
import { Show } from 'solid-js';

function App() {
  return (
    <div class="app-container">
      {/* Background radial glows */}
      <div class="bg-glow-purple"></div>
      <div class="bg-glow-cyan"></div>

      {/* Header bar */}
      <Header />

      {/* Settings Drawer Panel */}
      <SettingsDrawer />

      <Show when={currentTab() === 'agents'}>
        <AgentManager />
      </Show>

      {/* Main workspace */}
      <Show when={currentTab() === 'chat'}>
        <div class="chat-workspace">
          {/* Left Sidebar details */}
          <Sidebar />

          {/* Right chat view */}
          <main class="chat-container">
            <AgentSelector />
            
            {/* Scrollable messages area */}
            <MessageList />

            {/* Footer Input block */}
            <InputSection />
          </main>
        </div>
      </Show>
    </div>
  );
}

export default App;
