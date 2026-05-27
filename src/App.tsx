import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { Sidebar } from './components/Sidebar';
import { MessageList } from './components/Chat/MessageList';
import { InputSection } from './components/Chat/InputSection';

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

      {/* Main workspace */}
      <div class="chat-workspace">
        {/* Left Sidebar details */}
        <Sidebar />

        {/* Right chat view */}
        <main class="chat-container">
          {/* Scrollable messages area */}
          <MessageList />

          {/* Footer Input block */}
          <InputSection />
        </main>
      </div>
    </div>
  );
}

export default App;
