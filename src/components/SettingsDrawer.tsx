import { AppConfigForm } from './Settings/AppConfigForm';
import { PersonaSettings } from './Settings/PersonaSettings';
import './Settings/Settings.css';

export function SettingsView() {
  return (
    <div class="settings-view">
      <div style="display: flex; flex-direction: column; gap: 2rem; width: 100%; max-width: 800px; margin: 0 auto; padding-bottom: 2rem;">
        
        {/* App Configuration Form */}
        <AppConfigForm />

        {/* Persona Switcher and Management Section */}
        <PersonaSettings />

      </div>
    </div>
  );
}


