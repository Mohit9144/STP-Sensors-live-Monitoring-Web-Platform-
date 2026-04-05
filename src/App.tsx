import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SensorsManagement } from './components/SensorsManagement';
import { AlertsManagement } from './components/AlertsManagement';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <Layout activeSection={activeSection} setActiveSection={setActiveSection}>
      {activeSection === 'overview' && <Dashboard setActiveSection={setActiveSection} />}
      {activeSection === 'sensors' && <SensorsManagement />}
      {activeSection === 'alerts' && <AlertsManagement />}
      {activeSection === 'analytics' && <Analytics />}
      {activeSection === 'settings' && <Settings />}
    </Layout>
  );
}
