/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Problem, Submission, Contest, StudentRegistration, SubmissionRequest } from './types';
import { apiRequest, AUTH_TOKEN_KEY, SharedState, updateSharedState } from './api';
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
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { TeacherPanel } from './components/TeacherPanel';
import { SubmissionModal } from './components/SubmissionModal';
import { Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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

  const applySharedState = (state: SharedState) => {
    updateSharedState(state, { setUsers, setContests, setProblems, setSubmissions });
    setCurrentUser(previous =>
      previous ? state.users.find(user => user.handle === previous.handle) || null : null
    );
  };

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const state = await apiRequest<SharedState>('/api/state');
        if (active) {
          applySharedState(state);
          setServerError(null);
          setIsLoaded(true);
        }
      } catch (error) {
        if (active) {
          setServerError(error instanceof Error ? error.message : 'Unable to connect to the LAN server.');
          setIsLoaded(true);
        }
      }
    };

    void refresh();
    const syncInterval = setInterval(() => {
      void refresh();
    }, 2500);

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      void apiRequest<{ role: 'teacher' | 'student'; user: User | null }>('/api/session')
        .then(session => {
          if (!active) return;
          setIsTeacherAuthenticated(session.role === 'teacher');
          setCurrentUser(session.user);
        })
        .catch(() => {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        });
    }

    return () => {
      active = false;
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
      if (!isTeacherAuthenticated) {
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
  const handleLogin = async (handle: string, password: string) => {
    const result = await apiRequest<{ token: string; user: User }>('/api/auth/student', {
      method: 'POST',
      body: JSON.stringify({ handle, password })
    }, false);
    localStorage.setItem(AUTH_TOKEN_KEY, result.token);
    setCurrentUser(result.user);
    setIsTeacherAuthenticated(false);
    showToast(`Welcome back, ${result.user.handle}! Your rating: ${result.user.rating}`, 'info');
  };

  const handleLogout = () => {
    void apiRequest<void>('/api/auth/logout', { method: 'POST' }).catch(error => {
      console.error('Unable to close the server session:', error);
    });
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setCurrentUser(null);
    setIsTeacherAuthenticated(false);
    showToast('You have been logged out.', 'info');
  };

  // Teacher Handlers
  const handleTeacherAuthSuccess = async (password: string) => {
    const result = await apiRequest<{ token: string }>('/api/auth/teacher', {
      method: 'POST',
      body: JSON.stringify({ password })
    }, false);
    localStorage.setItem(AUTH_TOKEN_KEY, result.token);
    setCurrentUser(null);
    setIsTeacherAuthenticated(true);
    setActiveTab('teacher');
    showToast('Successfully signed in to the teacher panel.', 'success');
  };

  const handleExitTeacherMode = () => {
    handleLogout();
    if (activeTab === 'teacher') setActiveTab('contests');
  };

  const applyMutationResult = (state: SharedState) => {
    applySharedState(state);
    setServerError(null);
  };

  const performTeacherMutation = async (
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    body?: unknown
  ): Promise<SharedState> => {
    return apiRequest<SharedState>(endpoint, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
  };

  // Contest Actions (Teacher Launch, Finish, Save, Delete)
  const handleStartContest = async (contestId: string) => {
    try {
      applyMutationResult(await performTeacherMutation(
        `/api/teacher/contests/${encodeURIComponent(contestId)}/status`,
        'POST',
        { status: 'running' }
      ));
      showToast('🚀 Contest started! Participants can now access its problems.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to start the contest.', 'error');
    }
  };

  const handleFinishContest = async (contestId: string) => {
    try {
      applyMutationResult(await performTeacherMutation(
        `/api/teacher/contests/${encodeURIComponent(contestId)}/status`,
        'POST',
        { status: 'finished' }
      ));
      showToast('Contest ended. Results have been finalized.', 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to finish the contest.', 'error');
    }
  };

  const handleSaveContest = async (contest: Contest) => {
    try {
      applyMutationResult(await performTeacherMutation(
        `/api/teacher/contests/${encodeURIComponent(contest.id)}`,
        'PUT',
        contest
      ));
      showToast(`Contest "${contest.title}" saved!`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save the contest.', 'error');
      throw error;
    }
  };

  const handleDeleteContest = async (contestId: string) => {
    try {
      applyMutationResult(await performTeacherMutation(
        `/api/teacher/contests/${encodeURIComponent(contestId)}`,
        'DELETE'
      ));
      if (selectedContest?.id === contestId) setSelectedContest(null);
      showToast('Contest deleted.', 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to delete the contest.', 'error');
    }
  };

  // Problem management
  const handleSaveProblem = async (savedProb: Problem) => {
    try {
      applyMutationResult(await performTeacherMutation(
        `/api/teacher/problems/${encodeURIComponent(savedProb.id)}`,
        'PUT',
        savedProb
      ));
      showToast(`Problem "${savedProb.id}. ${savedProb.title}" saved!`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save the problem.', 'error');
      throw error;
    }
  };

  const handleDeleteProblem = async (problemId: string) => {
    try {
      applyMutationResult(await performTeacherMutation(
        `/api/teacher/problems/${encodeURIComponent(problemId)}`,
        'DELETE'
      ));
      if (selectedProblem?.id === problemId) setSelectedProblem(null);
      showToast(`Problem "${problemId}" deleted.`, 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to delete the problem.', 'error');
    }
  };

  const handleRegisterStudentByTeacher = async (newStudent: StudentRegistration): Promise<boolean> => {
    const state = await performTeacherMutation('/api/teacher/students', 'POST', newStudent);
    applyMutationResult(state);
    return true;
  };

  const handleDeleteStudent = async (handle: string) => {
    try {
      applyMutationResult(await performTeacherMutation(
        `/api/teacher/students/${encodeURIComponent(handle)}`,
        'DELETE'
      ));
      if (currentUser?.handle === handle) setCurrentUser(null);
      showToast(`Student "${handle}" deleted.`, 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to delete the student.', 'error');
    }
  };

  // Submission handler from ProblemDetail (with contest context)
  const handleSubmitSuccess = async (submission: SubmissionRequest): Promise<Submission> => {
    if (!currentUser) throw new Error('Sign in before submitting a solution.');
    const body = { ...submission };
    if (selectedContest && selectedContest.status === 'running') {
      body.contestId = selectedContest.id;
    }
    try {
      const result = await apiRequest<SharedState & {
        currentUser: User;
        isFirstSolve: boolean;
        submission: Submission;
      }>(
        '/api/submissions',
        { method: 'POST', body: JSON.stringify(body) }
      );
      applyMutationResult(result);
      setCurrentUser(result.currentUser);
      if (result.isFirstSolve) {
        showToast(`🎉 Congratulations! Problem ${submission.problemId} solved!`, 'success');
      }
      return result.submission;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to judge the submission.';
      showToast(message, 'error');
      throw error;
    }
  };

  const handleResetAllData = () => {
    if (confirm('Reset shared contests, problems, users, and submissions to the initial data?')) {
      void performTeacherMutation('/api/teacher/reset', 'POST')
        .then(applyMutationResult)
        .then(() => showToast('Shared application data has been reset.', 'info'))
        .catch(error => showToast(error instanceof Error ? error.message : 'Unable to reset data.', 'error'));
      setSelectedContest(null);
      setSelectedProblem(null);
      setActiveTab('contests');
    }
  };

  const handleChangeTeacherPassword = async (currentPassword: string, newPassword: string) => {
    await apiRequest<{ message: string }>('/api/teacher/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
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

  if (!isLoaded || serverError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-6 text-center">
        <div className="max-w-md bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-800">SchoolForces LAN</h1>
          <p className="mt-2 text-sm text-slate-600">
            {!isLoaded ? 'Connecting to the SchoolForces server…' : serverError}
          </p>
          {serverError && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm font-semibold"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

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
      <main className="app-main max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
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
                    onSubmitSuccess={sub => {
                      return handleSubmitSuccess(sub);
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
            users={users}
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
            onChangePassword={handleChangeTeacherPassword}
            onExitTeacherMode={handleExitTeacherMode}
          />
        )}
      </main>

      {/* Codeforces Style Footer */}
      <footer className="app-footer border-t border-[#b9c0c7] bg-white py-6 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1.5 h-2 bg-amber-400 rounded-t-xs"></span>
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-t-xs"></span>
              <span className="w-1.5 h-2.5 bg-red-600 rounded-t-xs"></span>
            </div>
            <span className="font-bold text-slate-700">SchoolForces 2.5</span>
            <span>— Programming contest platform for local networks</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>ICPC scoreboard • C++, Python, JavaScript • Contest timer</span>
            {isTeacherAuthenticated && (
              <>
                <span>•</span>
                <button
                  onClick={handleResetAllData}
                  className="text-slate-500 hover:text-red-600 underline cursor-pointer flex items-center gap-1"
                  title="Reset all shared data"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset shared data</span>
                </button>
              </>
            )}
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
