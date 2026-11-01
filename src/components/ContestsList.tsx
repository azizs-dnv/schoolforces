import React from 'react';
import { Contest, User } from '../types';
import {
  Trophy,
  Clock,
  Play,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Calendar,
  Users,
  Flame,
  ArrowRight
} from 'lucide-react';

interface ContestsListProps {
  contests: Contest[];
  currentUser: User | null;
  isTeacherAuthenticated: boolean;
  onSelectContest: (contest: Contest) => void;
  onStartContest?: (contestId: string) => void;
  onFinishContest?: (contestId: string) => void;
}

export const ContestsList: React.FC<ContestsListProps> = ({
  contests,
  currentUser,
  isTeacherAuthenticated,
  onSelectContest,
  onStartContest,
  onFinishContest
}) => {
  const isStudentAllowed = (contest: Contest) => {
    if (isTeacherAuthenticated) return true;
    if (!currentUser) return false;
    if (contest.allowedStudents.includes('*')) return true;
    return contest.allowedStudents.includes(currentUser.handle);
  };

  const runningContests = contests.filter(c => c.status === 'running');
  const upcomingContests = contests.filter(c => c.status === 'upcoming');
  const finishedContests = contests.filter(c => c.status === 'finished');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#b9c0c7] rounded p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-black text-slate-800 tracking-tight font-sans">
              CONTESTS AND COMPETITIONS
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live school contests with a timer, Codeforces/ICPC-style standings, and individual access control
          </p>
        </div>

        {isTeacherAuthenticated && (
          <div className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded self-start md:self-auto flex items-center gap-1.5">
            <Unlock className="w-3.5 h-3.5" />
            <span>Teacher mode: start contests and manage access</span>
          </div>
        )}
      </div>

      {/* 1. Current live contests */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            In progress (live contests)
          </h2>
        </div>

        {runningContests.length === 0 ? (
          <div className="bg-white border border-[#b9c0c7] rounded p-6 text-center text-xs text-slate-500 shadow-2xs">
            There are no active contests right now. Wait for your teacher to start one.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {runningContests.map(contest => {
              const allowed = isStudentAllowed(contest);
              const remainingMs = contest.endsAt ? Math.max(0, contest.endsAt - Date.now()) : 0;
              const remainingMin = Math.floor(remainingMs / 60000);
              const remainingSec = Math.floor((remainingMs % 60000) / 1000);

              return (
                <div
                  key={contest.id}
                  className="bg-white border-2 border-emerald-500 rounded overflow-hidden shadow-xs hover:shadow-md transition"
                >
                  <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px] uppercase">
                        Contest in progress
                      </span>
                      <span className="font-mono font-bold text-emerald-800">
                        Time left: {remainingMin} min {remainingSec} sec
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {allowed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Access granted</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Access restricted by teacher</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3
                        onClick={() => onSelectContest(contest)}
                        className="text-base font-bold text-slate-900 hover:text-blue-700 cursor-pointer transition"
                      >
                        {contest.title}
                      </h3>
                      <p className="text-xs text-slate-600">{contest.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Duration: {contest.durationMinutes} min
                        </span>
                        <span>•</span>
                        <span>Problems: {contest.problemIds.length}</span>
                        <span>•</span>
                        <span>Participants: {contest.allowedStudents.includes('*') ? 'All students' : `${contest.allowedStudents.length} students`}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isTeacherAuthenticated && onFinishContest && (
                        <button
                          onClick={() => {
                            if (confirm(`End contest "${contest.title}" early?`)) {
                              onFinishContest(contest.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded text-xs border border-red-300 transition cursor-pointer"
                        >
                          End contest
                        </button>
                      )}

                      <button
                        onClick={() => onSelectContest(contest)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Enter contest</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Upcoming contests (waiting to start) */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Waiting for the teacher to start</span>
        </h2>

        {upcomingContests.length === 0 ? (
          <div className="bg-white border border-[#b9c0c7] rounded p-4 text-center text-xs text-slate-500">
            No contests are scheduled.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {upcomingContests.map(contest => {
              const allowed = isStudentAllowed(contest);

              return (
                <div
                  key={contest.id}
                  className="bg-white border border-[#b9c0c7] rounded p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200">
                        Waiting to start
                      </span>
                      <h3
                        onClick={() => onSelectContest(contest)}
                        className="text-sm font-bold text-slate-800 hover:text-blue-700 cursor-pointer"
                      >
                        {contest.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">{contest.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Duration: {contest.durationMinutes} min</span>
                      <span>•</span>
                      <span>Problems in contest: {contest.problemIds.length}</span>
                      <span>•</span>
                      <span>
                        {allowed ? (
                          <span className="text-emerald-700 font-bold">You have access</span>
                        ) : (
                          <span className="text-slate-500">Teacher approval required</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isTeacherAuthenticated && onStartContest && (
                      <button
                        onClick={() => {
                          if (confirm(`Start contest "${contest.title}" now?`)) {
                            onStartContest(contest.id);
                          }
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Start contest</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectContest(contest)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs border border-slate-300 transition cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Completed contests */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Completed contests
        </h2>

        {finishedContests.length === 0 ? (
          <div className="bg-white border border-[#b9c0c7] rounded p-4 text-center text-xs text-slate-500">
            There are no completed contests yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {finishedContests.map(contest => (
              <div
                key={contest.id}
                className="bg-white border border-slate-300 rounded p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-90 hover:opacity-100 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-300">
                      Ended
                    </span>
                    <h3
                      onClick={() => onSelectContest(contest)}
                      className="text-sm font-bold text-slate-800 hover:text-blue-700 cursor-pointer"
                    >
                      {contest.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{contest.description}</p>
                </div>

                <button
                  onClick={() => onSelectContest(contest)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs border border-slate-300 transition cursor-pointer self-start md:self-auto"
                >
                  Standings
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
