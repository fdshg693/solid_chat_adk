import { AppConfigForm } from './Settings/AppConfigForm';
import { UserSettings } from './Settings/UserSettings';

export function SettingsView() {
  return (
    <div class="settings-view">
      <div style="display: flex; flex-direction: column; gap: 2rem; width: 100%; max-width: 800px; margin: 0 auto; padding-bottom: 2rem;">
        
        {/* App Configuration Form */}
        <AppConfigForm />

        {/* User Switcher and Management Section */}
        <UserSettings />

      </div>
    </div>
  );
}


