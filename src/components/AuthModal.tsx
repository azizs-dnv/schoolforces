import React, { useState } from 'react';
import { X, LogIn, AlertCircle, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (handle: string, password: string) => Promise<void>;
  onOpenTeacherAuth: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onOpenTeacherAuth,
}) => {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanHandle = handle.trim();
    if (!cleanHandle) {
      setError('Enter your username (handle)');
      return;
    }

    if (!password) {
      setError('Enter your password');
      return;
    }

    try {
      await onLogin(cleanHandle, password);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sign-in failed.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
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
              Student sign-in to SchoolForces
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-blue-50/70 border-b border-blue-200 px-5 py-2.5 text-xs text-blue-900 flex items-center justify-between">
          <span>Ask your teacher to create your student account.</span>
          <button
            type="button"
            onClick={() => {
              handleClose();
              onOpenTeacherAuth();
            }}
            className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <KeyRound className="w-3 h-3" />
            <span>Teacher panel</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Student username:
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Your username"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password:</label>
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
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};
