import React, { useState } from 'react';
import { User } from '../types';
import { X, LogIn, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  onOpenTeacherAuth: () => void;
  users: User[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onOpenTeacherAuth,
  users
}) => {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanHandle = handle.trim();
    if (!cleanHandle) {
      setError('Введите никнейм (handle)');
      return;
    }

    if (!password) {
      setError('Введите пароль');
      return;
    }

    const existingUser = users.find(
      u => u.handle.toLowerCase() === cleanHandle.toLowerCase()
    );

    if (!existingUser || existingUser.password !== password) {
      setError('Неверный никнейм или пароль. Убедитесь, что учитель зарегистрировал ваш аккаунт.');
      return;
    }

    onLogin(existingUser);
    onClose();
  };

  const handleQuickLogin = (demoUser: User) => {
    onLogin(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-[#b9c0c7] rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#3b5998] px-5 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            <span className="font-bold text-xs tracking-wide uppercase">
              Вход ученика в SchoolForces
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice that students are registered exclusively by teachers */}
        <div className="bg-blue-50/70 border-b border-blue-200 px-5 py-2.5 text-xs text-blue-900 flex items-center justify-between">
          <span>Регистрация учеников выполняется только учителем</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTeacherAuth();
            }}
            className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <KeyRound className="w-3 h-3" />
            <span>Панель учителя</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Никнейм ученика (Handle):
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="например: tourist_junior или coder_ivan"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Пароль:</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[#3b5998] hover:bg-[#2b4270] text-white font-bold rounded transition shadow-2xs cursor-pointer text-xs"
          >
            Войти в систему
          </button>
        </form>

        {/* Quick Demo Login selector */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-xs">
          <div className="font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Тестовые аккаунты учеников:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {users.slice(0, 4).map(u => (
              <button
                key={u.handle}
                type="button"
                onClick={() => handleQuickLogin(u)}
                className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-300 rounded text-[11px] font-medium text-slate-700 cursor-pointer"
              >
                {u.handle} ({u.rating})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
