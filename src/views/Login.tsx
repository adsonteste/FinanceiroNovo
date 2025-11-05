import React, { useState, useEffect } from 'react';
import { Phone, DollarSign, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, SimpleCard } from '../components/Card';

interface LoginProps {
  onLogin: (userId: string, userName: string, phone: string, rememberMe: boolean) => void; 
}

const AUTHORIZED_USERS = {
  '11910110819': 'Adson Neres',
  '11912280324': 'Ruthe Cruz',
};

const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
};

const normalizePhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem('financecontrol_phone');
    const rememberMeFlag = localStorage.getItem('financecontrol_remember_me');

    if (rememberMeFlag === 'true' && savedPhone) {
      const lastLoginTime = localStorage.getItem('financecontrol_last_login');
      if (lastLoginTime) {
        const hoursPassed = (Date.now() - parseInt(lastLoginTime)) / (1000 * 60 * 60);
        if (hoursPassed < 24) {
          const userName = AUTHORIZED_USERS[savedPhone as keyof typeof AUTHORIZED_USERS];
          if (userName) {
            onLogin(savedPhone, userName, savedPhone, true);
          }
        } else {
          localStorage.removeItem('financecontrol_phone');
          localStorage.removeItem('financecontrol_remember_me');
          localStorage.removeItem('financecontrol_last_login');
        }
      }
    }
  }, [onLogin]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalized = normalizePhoneNumber(phone);

    if (normalized.length !== 11) {
      setError('Por favor, digite um telefone válido com 11 dígitos');
      setLoading(false);
      return;
    }

    const userName = AUTHORIZED_USERS[normalized as keyof typeof AUTHORIZED_USERS];

    if (!userName) {
      setError('Telefone não autorizado para acessar o sistema');
      setLoading(false);
      return;
    }

    if (rememberMe) {
      localStorage.setItem('financecontrol_phone', normalized);
      localStorage.setItem('financecontrol_remember_me', 'true');
      localStorage.setItem('financecontrol_last_login', Date.now().toString());
    } else {
      localStorage.removeItem('financecontrol_phone');
      localStorage.removeItem('financecontrol_remember_me');
      localStorage.removeItem('financecontrol_last_login');
    }

    setTimeout(() => {
      onLogin(normalized, userName, normalized, rememberMe);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
            <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Controle Financeiro </h1>
          <p className="text-gray-600 dark:text-gray-400">Gestão Financeira</p>
        </div>

        <SimpleCard>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 91234-5678"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Permanecer conectado
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center"
            >
              <LogIn size={18} className="mr-2" />
              {loading ? 'Conectando...' : 'Entrar'}
            </Button>
          </form>

         
        </SimpleCard>
      </div>
    </div>
  );
};
