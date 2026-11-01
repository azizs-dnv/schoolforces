import React from 'react';
import { User } from '../types';
import { getRankInfo } from '../utils/ranks';
import { LogIn, LogOut, Code2, Trophy, FileCode2, User as UserIcon, HelpCircle, ShieldAlert, KeyRound } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  isTeacherAuthenticated: boolean;
  activeTab: 'contests' | 'problems' | 'submissions' | 'leaderboard' | 'profile' | 'about' | 'teacher';
  setActiveTab: (tab: 'contests' | 'problems' | 'submissions' | 'leaderboard' | 'profile' | 'about' | 'teacher') => void;
  onOpenLogin: () => void;
  onOpenTeacherAuth: () => void;
  onLogout: () => void;
  onExitTeacherMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isTeacherAuthenticated,
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenTeacherAuth,
  onLogout,
  onExitTeacherMode
}) => {
  const rankInfo = currentUser ? getRankInfo(currentUser.rating) : null;

  return (
    <header className="bg-white border-b border-slate-300 shadow-xs">
      {/* Top micro bar with Codeforces color accent */}
      <div className="h-1 bg-gradient-to-r from-red-600 via-blue-600 to-amber-400 w-full" />

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('contests')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="flex items-end gap-1 h-9 px-1 py-0.5">
            <span className="w-2.5 h-5 bg-amber-400 rounded-t-xs transition-transform group-hover:scale-y-110"></span>
            <span className="w-2.5 h-8 bg-blue-600 rounded-t-xs transition-transform group-hover:scale-y-105"></span>
            <span className="w-2.5 h-6 bg-red-600 rounded-t-xs transition-transform group-hover:scale-y-110"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-800 font-sans">
                SCHOOL<span className="text-blue-700">FORCES</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200">
                School Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Programming contests and olympiads for students
            </p>
          </div>
        </div>

        {/* Auth / Teacher controls */}
        <div className="flex items-center gap-2.5 self-end md:self-auto text-sm">
          {/* Teacher panel button */}
          {isTeacherAuthenticated ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-2.5 py-1 text-xs">
              <span className="font-bold text-red-700 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Teacher active</span>
              </span>
              <button
                onClick={onExitTeacherMode}
                className="text-[11px] text-red-600 hover:underline cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenTeacherAuth}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition cursor-pointer"
              title="Sign in with the teacher master password"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Teacher panel</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-300" />

          {/* Student Auth status */}
          {currentUser ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Student:</span>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="hover:underline font-bold transition-colors cursor-pointer"
                  style={{ color: rankInfo?.color }}
                  title={`${rankInfo?.title} (${currentUser.rating})`}
                >
                  {currentUser.handle}
                </button>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  {currentUser.rating}
                </span>
              </div>

              <div className="h-4 w-px bg-slate-300" />

              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded transition shadow-2xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Student sign-in</span>
            </button>
          )}
        </div>
      </div>

      {/* Codeforces classic navigation bar */}
      <nav className="bg-[#3b5998] border-t border-[#2e477a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center overflow-x-auto scrollbar-none">
          {/* TAB 1: CONTESTS (BEFORE PROBLEMS) */}
          <button
            onClick={() => setActiveTab('contests')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold tracking-wide transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'contests'
                ? 'bg-[#2b4270] border-amber-400 text-white'
                : 'border-transparent text-slate-100 hover:bg-[#344e85] hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>CONTESTS</span>
          </button>

          {/* TAB 2: PROBLEMS */}
          <button
            onClick={() => setActiveTab('problems')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold tracking-wide transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'problems'
                ? 'bg-[#2b4270] border-amber-400 text-white'
                : 'border-transparent text-slate-100 hover:bg-[#344e85] hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>PROBLEMS</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold tracking-wide transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'submissions'
                ? 'bg-[#2b4270] border-amber-400 text-white'
                : 'border-transparent text-slate-100 hover:bg-[#344e85] hover:text-white'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>SUBMISSIONS</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold tracking-wide transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-[#2b4270] border-amber-400 text-white'
                : 'border-transparent text-slate-100 hover:bg-[#344e85] hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>STANDINGS</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold tracking-wide transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-[#2b4270] border-amber-400 text-white'
                : 'border-transparent text-slate-100 hover:bg-[#344e85] hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>MY PROFILE</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold tracking-wide transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'about'
                ? 'bg-[#2b4270] border-amber-400 text-white'
                : 'border-transparent text-slate-100 hover:bg-[#344e85] hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>ABOUT</span>
          </button>

          {isTeacherAuthenticated && (
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold tracking-wide transition border-b-2 cursor-pointer whitespace-nowrap bg-red-700/80 hover:bg-red-700 ${
                activeTab === 'teacher'
                  ? 'border-amber-300 text-white bg-red-800'
                  : 'border-transparent text-amber-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>TEACHER PANEL</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
