import { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContextSupabase';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Transactions } from './views/Transactions';
import { QuickAdd } from './views/QuickAdd';
import { History } from './views/History';
import { Notifications } from './views/Notifications';
import { Settings } from './views/Settings';
import { Login } from './views/Login';
import { useSmartAlerts } from './hooks/useSmartAlerts';
import { useAutoConvertPending } from './hooks/useAutoConvertPending';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { currentUser, setCurrentUser } = useFinance();
  useSmartAlerts();
  useAutoConvertPending();

  if (!currentUser) {
    return (
      <Login
        onLogin={(userId: string, userName: string, phone: string) => {
          setCurrentUser({ id: userId, phone, name: userName });
        }}
      />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'quickadd':
        return <QuickAdd />;
      case 'history':
        return <History />;
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}

export default App;
