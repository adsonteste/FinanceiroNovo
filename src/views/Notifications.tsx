import React from 'react';
import { useFinance } from '../context/FinanceContextSupabase';
import { SimpleCard } from '../components/Card';
import { Button } from '../components/Button';
import { Bell, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';

export const Notifications: React.FC = () => {
  const { notifications, markNotificationAsRead, clearNotifications } = useFinance();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />;
      case 'warning':
        return <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />;
      case 'info':
        return <Info size={20} className="text-blue-600 dark:text-blue-400" />;
      default:
        return <Bell size={20} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Notificações</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {notifications.length} notificação{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
        {notifications.length > 0 && (
          <Button
            onClick={clearNotifications}
            variant="secondary"
            size="sm"
            className="flex items-center"
          >
            <Trash2 size={16} className="mr-2" />
            Limpar tudo
          </Button>
        )}
      </div>

      <SimpleCard>
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markNotificationAsRead(notification.id)}
                className={`flex items-start space-x-4 p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${getBgColor(notification.type)} ${
                  notification.read ? 'opacity-60' : ''
                }`}
              >
                <div className="mt-1">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formatTime(notification.timestamp)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2"></div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Você não tem notificações no momento
              </p>
            </div>
          )}
        </div>
      </SimpleCard>
    </div>
  );
};
