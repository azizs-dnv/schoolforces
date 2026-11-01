import React, { useState } from 'react';
import { ShieldAlert, KeyRound, X, Lock } from 'lucide-react';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (password: string) => Promise<void>;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSuccess(password);
      setPassword('');
      setError('');
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sign-in failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white border-2 border-red-700 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-red-700 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-300" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Teacher panel sign-in
            </span>
          </div>
          <button onClick={onClose} className="text-white hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              This panel is protected from unauthorized access. The teacher master password is required to sign in.
            </div>
          </div>

          {error && (
            <div className="p-2 bg-red-100 border border-red-300 rounded text-red-800 font-semibold text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Teacher master password:
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter the teacher password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full text-xs p-2 pl-8 border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-red-600 font-mono"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded transition shadow-sm cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
