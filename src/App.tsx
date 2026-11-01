/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Problem, Submission, Contest } from './types';
import { PROBLEMS as INITIAL_PROBLEMS } from './data/problems';
import { INITIAL_USERS, INITIAL_SUBMISSIONS, INITIAL_CONTESTS } from './data/mockData';
import { Header } from './components/Header';
import { ContestsList } from './components/ContestsList';
import { ContestView } from './components/ContestView';
import { ProblemList } from './components/ProblemList';
import { ProblemDetail } from './components/ProblemDetail';
import { Leaderboard } from './components/Leaderboard';
import { SubmissionsList } from './components/SubmissionsList';
import { Profile } from './components/Profile';
import { AboutView } from './components/AboutView';
import { AuthModal } from './components/AuthModal';
import { TeacherAuthModal, TEACHER_TOKEN_KEY } from './components/TeacherAuthModal';
import { TeacherPanel } from './components/TeacherPanel';
import { SubmissionModal } from './components/SubmissionModal';
import { Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

const STORAGE_KEY_CONTESTS = 'sf_contests_v2';
const STORAGE_KEY_USERS = 'sf_users_v2';
const STORAGE_KEY_PROBLEMS = 'sf_problems_v2';
const STORAGE_KEY_CURRENT_USER = 'sf_current_user_v2';
const STORAGE_KEY_SUBMISSIONS = 'sf_submissions_v2';

export default function App() {
  // 1. Initialize Contests
  const [contests, setContests] = useState<Contest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONTESTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading contests:', e);
    }
    return INITIAL_CONTESTS;
  });

  // 2. Initialize Problems
  const [problems, setProblems] = useState<Problem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROBLEMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading problems:', e);
    }
    return INITIAL_PROBLEMS;
  });

  // 3. Initialize Users
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading users:', e);
    }
    return INITIAL_USERS;
  });

  // 4. Current User
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedHandle = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (savedHandle) {
        const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
        const usersList: User[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
        const found = usersList.find(u => u.handle === savedHandle);
        if (found) return found;
      }
    } catch (e) {
      console.error('Error loading current user:', e);
    }
    return null;
  });

  // 5. Submissions
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading submissions:', e);
    }
    return INITIAL_SUBMISSIONS;
  });

  // 6. Teacher session verification
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(TEACHER_TOKEN_KEY) !== null;
  });

  // Navigation & View state
  // The default tab is contests, before the problems tab.
  const [activeTab, setActiveTab] = useState<
    'contests' | 'problems' | 'submissions' | 'leaderboard' | 'profile' | 'about' | 'teacher'
  >('contests');

  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTeacherAuthOpen, setIsTeacherAuthOpen] = useState(false);
  const [inspectedSubmission, setInspectedSubmission] = useState<Submission | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  // Synchronize state changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTESTS, JSON.stringify(contests));
    } catch (e) {
      console.error('Failed to save contests to LocalStorage:', e);
    }
  }, [contests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROBLEMS, JSON.stringify(problems));
    } catch (e) {
      console.error('Failed to save problems to LocalStorage:', e);
    }
  }, [problems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to LocalStorage:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, currentUser.handle);
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.error('Failed to save current user to LocalStorage:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
    } catch (e) {
      console.error('Failed to save submissions to LocalStorage:', e);
    }
  }, [submissions]);

  // LAN / Multi-tab Synchronization:
  // Listens to changes made by other tabs/clients (e.g. teacher starts contest, students immediately see it!)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_CONTESTS && e.newValue) {
        setContests(JSON.parse(e.newValue));
      }
      if (e.key === STORAGE_KEY_SUBMISSIONS && e.newValue) {
        setSubmissions(JSON.parse(e.newValue));
      }
      if (e.key === STORAGE_KEY_PROBLEMS && e.newValue) {
        setProblems(JSON.parse(e.newValue));
      }
      if (e.key === STORAGE_KEY_USERS && e.newValue) {
        setUsers(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Periodic check for LAN synchronization
    const syncInterval = setInterval(() => {
      try {
        const cSaved = localStorage.getItem(STORAGE_KEY_CONTESTS);
        if (cSaved) {
          const parsed = JSON.parse(cSaved);
          setContests(prev => (JSON.stringify(prev) !== cSaved ? parsed : prev));
        }
        const sSaved = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
        if (sSaved) {
          const parsedSubs = JSON.parse(sSaved);
          setSubmissions(prev => (JSON.stringify(prev) !== sSaved ? parsedSubs : prev));
        }
      } catch (err) {}
    }, 2500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(syncInterval);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Safe navigation with route guard
  const handleNavigate = (
    tab: 'contests' | 'problems' | 'submissions' | 'leaderboard' | 'profile' | 'about' | 'teacher'
  ) => {
    if (tab === 'teacher') {
      const hasToken = sessionStorage.getItem(TEACHER_TOKEN_KEY) !== null;
      if (!hasToken) {
        showToast('Access denied. The teacher master password is required.', 'error');
        setIsTeacherAuthOpen(true);
        return;
      }
    }
    setActiveTab(tab);
    if (tab !== 'problems') {
      setSelectedProblem(null);
    }
  };

  // Auth Handlers for students
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.handle}! Your rating: ${user.rating}`, 'info');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('You have been logged out.', 'info');
  };

  // Teacher Handlers
  const handleTeacherAuthSuccess = () => {
    setIsTeacherAuthenticated(true);
    setActiveTab('teacher');
    showToast('Successfully signed in to the teacher panel.', 'success');
  };

  const handleExitTeacherMode = () => {
    sessionStorage.removeItem(TEACHER_TOKEN_KEY);
    setIsTeacherAuthenticated(false);
    if (activeTab === 'teacher') {
      setActiveTab('contests');
    }
    showToast('Teacher session ended.', 'info');
  };

  // Contest Actions (Teacher Launch, Finish, Save, Delete)
  const handleStartContest = (contestId: string) => {
    setContests(prev =>
      prev.map(c => {
        if (c.id === contestId) {
          const startedAt = Date.now();
          const endsAt = startedAt + c.durationMinutes * 60000;
          return { ...c, status: 'running', startedAt, endsAt };
        }
        return c;
      })
    );
    showToast('🚀 Contest started! Participants can now access its problems.', 'success');
  };

  const handleFinishContest = (contestId: string) => {
    setContests(prev =>
      prev.map(c => (c.id === contestId ? { ...c, status: 'finished' } : c))
    );
    showToast('Contest ended. Results have been finalized.', 'info');
  };

  const handleSaveContest = (contest: Contest) => {
    setContests(prev => {
      const idx = prev.findIndex(c => c.id === contest.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = contest;
        return copy;
      }
      return [contest, ...prev];
    });
    showToast(`Contest "${contest.title}" saved!`, 'success');
  };

  const handleDeleteContest = (contestId: string) => {
    setContests(prev => prev.filter(c => c.id !== contestId));
    if (selectedContest?.id === contestId) {
      setSelectedContest(null);
    }
    showToast('Contest deleted.', 'info');
  };

  // Problem management
  const handleSaveProblem = (savedProb: Problem) => {
    setProblems(prev => {
      const idx = prev.findIndex(p => p.id === savedProb.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = savedProb;
        return copy;
      }
      return [...prev, savedProb];
    });
    showToast(`Problem "${savedProb.id}. ${savedProb.title}" saved!`, 'success');
  };

  const handleDeleteProblem = (problemId: string) => {
    setProblems(prev => prev.filter(p => p.id !== problemId));
    if (selectedProblem?.id === problemId) {
      setSelectedProblem(null);
    }
    showToast(`Problem "${problemId}" deleted.`, 'info');
  };

  const handleRegisterStudentByTeacher = (newStudent: User): boolean => {
    const exists = users.some(u => u.handle.toLowerCase() === newStudent.handle.toLowerCase());
    if (exists) return false;
    setUsers(prev => [newStudent, ...prev]);
    return true;
  };

  const handleDeleteStudent = (handle: string) => {
    setUsers(prev => prev.filter(u => u.handle !== handle));
    if (currentUser?.handle === handle) {
      setCurrentUser(null);
    }
    showToast(`Student "${handle}" deleted.`, 'info');
  };

  // Submission handler from ProblemDetail (with contest context)
  const handleSubmitSuccess = (newSub: Submission, isFirstSolve: boolean) => {
    // If inside a contest, attach contestId and contestMinute
    let subToRecord = { ...newSub };
    if (selectedContest && selectedContest.status === 'running') {
      const startMs = selectedContest.startedAt || Date.now();
      const currentMinute = Math.max(1, Math.round((Date.now() - startMs) / 60000));
      subToRecord.contestId = selectedContest.id;
      subToRecord.contestMinute = currentMinute;
    }

    setSubmissions(prev => [subToRecord, ...prev]);

    if (!currentUser) return;

    let updatedUser = { ...currentUser, submissionsCount: currentUser.submissionsCount + 1 };

    if (isFirstSolve) {
      const newRating = currentUser.rating + 50;
      const newMaxRating = Math.max(currentUser.maxRating, newRating);
      const newSolved = [...currentUser.solvedProblems, newSub.problemId];

      updatedUser = {
        ...updatedUser,
        rating: newRating,
        maxRating: newMaxRating,
        solvedProblems: newSolved
      };

      showToast(`🎉 Congratulations! Problem ${newSub.problemId} solved! Rating: +50 (now ${newRating})`, 'success');
    }

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => (u.handle === updatedUser.handle ? updatedUser : u)));
  };

  const handleResetAllData = () => {
    if (confirm('Reset all contests, problems, and accounts to the initial demo data?')) {
      localStorage.removeItem(STORAGE_KEY_CONTESTS);
      localStorage.removeItem(STORAGE_KEY_USERS);
      localStorage.removeItem(STORAGE_KEY_PROBLEMS);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      localStorage.removeItem(STORAGE_KEY_SUBMISSIONS);
      sessionStorage.removeItem(TEACHER_TOKEN_KEY);
      setContests(INITIAL_CONTESTS);
      setProblems(INITIAL_PROBLEMS);
      setUsers(INITIAL_USERS);
      setCurrentUser(null);
      setSubmissions(INITIAL_SUBMISSIONS);
      setIsTeacherAuthenticated(false);
      setSelectedContest(null);
      setSelectedProblem(null);
      setActiveTab('contests');
      showToast('All data has been reset to the initial values.', 'info');
    }
  };

  const handleSelectProblemById = (problemId: string) => {
    const prob = problems.find(p => p.id === problemId);
    if (prob) {
      setSelectedProblem(prob);
      setActiveTab('problems');
    }
  };

  // Currently active contest for selected contest view
  const activeContestObj = selectedContest
    ? contests.find(c => c.id === selectedContest.id) || selectedContest
    : null;

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-800 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded shadow-lg border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-700 text-white border-emerald-800'
                : toast.type === 'error'
                ? 'bg-red-700 text-white border-red-800'
                : 'bg-slate-800 text-white border-slate-900'
            }`}
          >
            {toast.type === 'success' && <Sparkles className="w-4 h-4 text-amber-300" />}
            {toast.type === 'info' && <CheckCircle2 className="w-4 h-4 text-blue-300" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main App Header with Contests tab before Problems */}
      <Header
        currentUser={currentUser}
        isTeacherAuthenticated={isTeacherAuthenticated}
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenTeacherAuth={() => setIsTeacherAuthOpen(true)}
        onLogout={handleLogout}
        onExitTeacherMode={handleExitTeacherMode}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* 1. CONTESTS (FIRST TAB) */}
        {activeTab === 'contests' && (
          <>
            {activeContestObj ? (
              <>
                {selectedProblem ? (
                  <ProblemDetail
                    problem={selectedProblem}
                    currentUser={currentUser}
                    onBack={() => setSelectedProblem(null)}
                    onOpenLogin={() => setIsAuthModalOpen(true)}
                    onSubmitSuccess={(sub, isFirst) => {
                      handleSubmitSuccess(sub, isFirst);
                      setSelectedProblem(null);
                    }}
                  />
                ) : (
                  <ContestView
                    contest={activeContestObj}
                    allProblems={problems}
                    currentUser={currentUser}
                    isTeacherAuthenticated={isTeacherAuthenticated}
                    submissions={submissions}
                    users={users}
                    onBack={() => setSelectedContest(null)}
                    onSelectProblem={problem => setSelectedProblem(problem)}
                    onOpenSubmissionModal={sub => setInspectedSubmission(sub)}
                    onStartContest={handleStartContest}
                    onFinishContest={handleFinishContest}
                  />
                )}
              </>
            ) : (
              <ContestsList
                contests={contests}
                currentUser={currentUser}
                isTeacherAuthenticated={isTeacherAuthenticated}
                onSelectContest={c => setSelectedContest(c)}
                onStartContest={handleStartContest}
                onFinishContest={handleFinishContest}
              />
            )}
          </>
        )}

        {/* 2. PROBLEMS (ARCHIVE) */}
        {activeTab === 'problems' && (
          <>
            {selectedProblem ? (
              <ProblemDetail
                problem={selectedProblem}
                currentUser={currentUser}
                onBack={() => setSelectedProblem(null)}
                onOpenLogin={() => setIsAuthModalOpen(true)}
                onSubmitSuccess={handleSubmitSuccess}
              />
            ) : (
              <ProblemList
                problems={problems}
                currentUser={currentUser}
                onSelectProblem={problem => setSelectedProblem(problem)}
                users={users}
              />
            )}
          </>
        )}

        {/* 3. SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <SubmissionsList
            submissions={submissions}
            users={users}
            onOpenSubmissionModal={sub => setInspectedSubmission(sub)}
            onSelectProblemById={handleSelectProblemById}
          />
        )}

        {/* 4. LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <Leaderboard
            users={users}
            currentUser={currentUser}
            onSelectUser={u => {
              if (currentUser && u.handle === currentUser.handle) {
                setActiveTab('profile');
              }
            }}
          />
        )}

        {/* 5. MY PROFILE */}
        {activeTab === 'profile' && (
          <Profile
            currentUser={currentUser}
            problems={problems}
            submissions={submissions}
            onSelectProblem={problem => {
              setSelectedProblem(problem);
              setActiveTab('problems');
            }}
            onOpenLogin={() => setIsAuthModalOpen(true)}
            onOpenSubmissionModal={sub => setInspectedSubmission(sub)}
          />
        )}

        {/* 6. ABOUT THE PLATFORM */}
        {activeTab === 'about' && <AboutView />}

        {/* 7. TEACHER PANEL */}
        {activeTab === 'teacher' && (
          <TeacherPanel
            problems={problems}
            users={users}
            contests={contests}
            onSaveProblem={handleSaveProblem}
            onDeleteProblem={handleDeleteProblem}
            onRegisterStudent={handleRegisterStudentByTeacher}
            onDeleteStudent={handleDeleteStudent}
            onSaveContest={handleSaveContest}
            onDeleteContest={handleDeleteContest}
            onStartContest={handleStartContest}
            onFinishContest={handleFinishContest}
            onExitTeacherMode={handleExitTeacherMode}
          />
        )}
      </main>

      {/* Codeforces Style Footer */}
      <footer className="border-t border-[#b9c0c7] bg-white py-6 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1.5 h-2 bg-amber-400 rounded-t-xs"></span>
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-t-xs"></span>
              <span className="w-1.5 h-2.5 bg-red-600 rounded-t-xs"></span>
            </div>
            <span className="font-bold text-slate-700">SchoolForces 2.5</span>
            <span>— Programming contest platform (LAN &amp; offline ready)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>ICPC scoreboard • C++, Python, JavaScript • Contest timer</span>
            <span>•</span>
            <button
              onClick={handleResetAllData}
              className="text-slate-500 hover:text-red-600 underline cursor-pointer flex items-center gap-1"
              title="Reset all data to the initial demo values"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset demo data</span>
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-5 border-t border-[#e5e7eb] pt-4 text-[11px]">
          <div>ALL RIGHTS RESERVED</div>
          <div className="mt-1 flex items-center gap-3">
            <span>Aziz Sadonov</span>
            <a
              href="https://github.com/azizs-dnv"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* Student Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onOpenTeacherAuth={() => setIsTeacherAuthOpen(true)}
        users={users}
      />

      {/* Teacher Authentication Modal */}
      <TeacherAuthModal
        isOpen={isTeacherAuthOpen}
        onClose={() => setIsTeacherAuthOpen(false)}
        onSuccess={handleTeacherAuthSuccess}
      />

      {/* Submission Inspector Modal */}
      <SubmissionModal
        submission={inspectedSubmission}
        onClose={() => setInspectedSubmission(null)}
      />
    </div>
  );
}
