import React, { useState, useEffect } from 'react';
import { Contest, Problem, User, Submission } from '../types';
import { calculateContestScoreboard } from '../utils/scoreboard';
import { getRankInfo } from '../utils/ranks';
import {
  Trophy,
  Clock,
  Play,
  StopCircle,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileCode2,
  Code2,
  ArrowLeft,
  Medal,
  Eye,
  ShieldAlert
} from 'lucide-react';

interface ContestViewProps {
  contest: Contest;
  allProblems: Problem[];
  currentUser: User | null;
  isTeacherAuthenticated: boolean;
  submissions: Submission[];
  users: User[];
  onBack: () => void;
  onSelectProblem: (problem: Problem) => void;
  onOpenSubmissionModal: (sub: Submission) => void;
  onStartContest?: (contestId: string) => void;
  onFinishContest?: (contestId: string) => void;
}

export const ContestView: React.FC<ContestViewProps> = ({
  contest,
  allProblems,
  currentUser,
  isTeacherAuthenticated,
  submissions,
  users,
  onBack,
  onSelectProblem,
  onOpenSubmissionModal,
  onStartContest,
  onFinishContest
}) => {
  const [activeSubtab, setActiveSubtab] = useState<'problems' | 'standings' | 'submissions'>('problems');
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');

  // Check access permission
  const isAllowed =
    isTeacherAuthenticated ||
    (currentUser &&
      (contest.allowedStudents.includes('*') || contest.allowedStudents.includes(currentUser.handle)));

  // Contest timer tick
  useEffect(() => {
    const updateTimer = () => {
      if (contest.status === 'running' && contest.endsAt) {
        const diff = contest.endsAt - Date.now();
        if (diff <= 0) {
          setTimeRemainingText('Contest time is up');
        } else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeRemainingText(
            `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          );
        }
      } else if (contest.status === 'upcoming') {
        setTimeRemainingText('Waiting to start');
      } else {
        setTimeRemainingText('Contest ended');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  // Problems in this contest
  const contestProblems = allProblems.filter(p => contest.problemIds.includes(p.id));

  // Contest submissions
  const contestSubmissions = submissions.filter(s => s.contestId === contest.id);

  // Scoreboard calculation
  const scoreboardRows = calculateContestScoreboard(contest, submissions, users);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all contests</span>
        </button>

        {isTeacherAuthenticated && (
          <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
            🔒 Teacher mode: full access and control
          </span>
        )}
      </div>

      {/* Main Contest Header Banner */}
      <div className="bg-white border-2 border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
        <div className="bg-[#3b5998] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-300" />
              <h1 className="text-xl font-bold tracking-tight">{contest.title}</h1>
            </div>
            <p className="text-xs text-blue-100">{contest.description}</p>
          </div>

          {/* Timer block */}
          <div className="bg-[#2b4270] border border-[#4466aa] p-3 rounded text-center self-start md:self-auto min-w-44">
            <div className="text-[10px] uppercase font-bold text-slate-300">
              {contest.status === 'running'
                ? 'Time remaining'
                : contest.status === 'upcoming'
                ? 'Contest status'
                : 'Contest'}
            </div>
            <div className="text-xl font-mono font-bold text-amber-300 tracking-wider">
              {timeRemainingText}
            </div>
          </div>
        </div>

        {/* Teacher Action Controls Bar */}
        {isTeacherAuthenticated && (
          <div className="bg-red-50 px-5 py-2.5 border-b border-red-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-red-900">
              Contest controls for teachers:
            </span>
            <div className="flex items-center gap-2">
              {contest.status === 'upcoming' && onStartContest && (
                <button
                  onClick={() => {
                    if (confirm(`Start contest "${contest.title}"?`)) {
                      onStartContest(contest.id);
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start contest now</span>
                </button>
              )}

              {contest.status === 'running' && onFinishContest && (
                <button
                  onClick={() => {
                    if (confirm(`End contest "${contest.title}" early?`)) {
                      onFinishContest(contest.id);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  <span>End contest</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sub-tabs within Contest */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveSubtab('problems')}
            className={`flex items-center gap-1.5 px-5 py-3 border-b-2 cursor-pointer transition ${
              activeSubtab === 'problems'
                ? 'border-blue-700 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Contest problems ({contestProblems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubtab('standings')}
            className={`flex items-center gap-1.5 px-5 py-3 border-b-2 cursor-pointer transition ${
              activeSubtab === 'standings'
                ? 'border-blue-700 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard (scoreboard)</span>
          </button>

          <button
            onClick={() => setActiveSubtab('submissions')}
            className={`flex items-center gap-1.5 px-5 py-3 border-b-2 cursor-pointer transition ${
              activeSubtab === 'submissions'
                ? 'border-blue-700 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Contest submissions ({contestSubmissions.length})</span>
          </button>
        </div>
      </div>

      {/* Permission Check: If student is NOT allowed */}
      {!isAllowed && (
        <div className="bg-red-50 border border-red-300 rounded p-6 text-center space-y-2 max-w-lg mx-auto">
          <Lock className="w-8 h-8 text-red-600 mx-auto" />
          <h2 className="text-base font-bold text-red-900">Contest access restricted</h2>
          <p className="text-xs text-red-700">
            Your account is not on the participant list for this contest. Contact your teacher to request access.
          </p>
        </div>
      )}

      {/* If contest is upcoming and not teacher */}
      {isAllowed && contest.status === 'upcoming' && (
        <div className="bg-amber-50 border border-amber-300 rounded p-6 text-center space-y-2">
          <Clock className="w-8 h-8 text-amber-600 mx-auto" />
          <h2 className="text-base font-bold text-amber-900">The contest has not started yet</h2>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            Your teacher will start the contest from their workstation. Once it starts, the problems and submission form will become available automatically.
          </p>
        </div>
      )}

      {/* SUBTAB 1: Contest problems (available after start or to teachers) */}
      {isAllowed && (contest.status !== 'upcoming' || isTeacherAuthenticated) && activeSubtab === 'problems' && (
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
          <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wide">
              Contest problems
            </span>
            <span className="text-slate-500">
              Languages: C++, Python 3, JavaScript
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-300">
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-3 text-center w-28">Difficulty</th>
                  <th className="py-2.5 px-4 text-right w-28">Solution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {contestProblems.map(prob => {
                  const userSub = contestSubmissions.find(
                    s => s.handle === currentUser?.handle && s.problemId === prob.id && s.verdict === 'Accepted'
                  );
                  const isSolved = Boolean(userSub);

                  return (
                    <tr key={prob.id} className={`hover:bg-slate-50 ${isSolved ? 'bg-green-50/50' : ''}`}>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <div className="flex items-center justify-center gap-1">
                          {isSolved ? (
                            <span title="Solved!">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </span>
                          ) : (
                            <span className="text-slate-400">•</span>
                          )}
                          <span>{prob.id}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectProblem(prob)}
                          className="font-medium text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer"
                        >
                          {prob.title}
                        </button>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded font-mono font-semibold text-xs text-slate-700 border border-slate-200">
                          *{prob.difficulty}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectProblem(prob)}
                          className="px-3 py-1 bg-[#3b5998] hover:bg-[#2b4270] text-white font-semibold rounded text-xs transition cursor-pointer"
                        >
                          {isSolved ? 'View' : 'Solve'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Contest standings (ICPC / Codeforces scoreboard) */}
      {isAllowed && activeSubtab === 'standings' && (
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs space-y-4">
          <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wide">
              Contest standings (ACM/ICPC)
            </span>
            <span className="text-slate-500">
              Penalty: submission time + 20 minutes for each incorrect attempt
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <th className="py-2.5 px-3 text-center w-14">Rank</th>
                  <th className="py-2.5 px-4">Participant</th>
                  <th className="py-2.5 px-3 text-center w-16">Solved (=)</th>
                  <th className="py-2.5 px-3 text-center w-20">Penalty</th>

                  {/* Columns for each problem in contest */}
                  {contest.problemIds.map(probId => (
                    <th key={probId} className="py-2.5 px-3 text-center w-16 border-l border-slate-300">
                      {probId}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {scoreboardRows.length === 0 ? (
                  <tr>
                    <td colSpan={4 + contest.problemIds.length} className="py-8 text-center text-slate-500">
                      Participants have not submitted any solutions in this contest yet.
                    </td>
                  </tr>
                ) : (
                  scoreboardRows.map(row => {
                    const isCurrent = currentUser?.handle === row.handle;
                    const uObj = users.find(u => u.handle === row.handle);
                    const rankInfo = getRankInfo(uObj ? uObj.rating : 1200);

                    return (
                      <tr
                        key={row.handle}
                        className={`hover:bg-slate-50 transition-colors ${
                          isCurrent ? 'bg-amber-50/80 font-medium' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          {row.rank === 1 ? (
                            <span className="text-amber-500 font-bold">1</span>
                          ) : row.rank === 2 ? (
                            <span className="text-slate-400 font-bold">2</span>
                          ) : row.rank === 3 ? (
                            <span className="text-amber-700 font-bold">3</span>
                          ) : (
                            <span className="text-slate-600">{row.rank}</span>
                          )}
                        </td>

                        {/* Handle */}
                        <td className="py-2.5 px-4">
                          <span
                            className="font-bold cursor-pointer hover:underline"
                            style={{ color: rankInfo.color }}
                          >
                            {row.handle}
                          </span>
                          {isCurrent && (
                            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                              YOU
                            </span>
                          )}
                        </td>

                        {/* Total Solved (=) */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-sm text-emerald-700">
                          {row.solvedCount}
                        </td>

                        {/* Total Penalty */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {row.totalPenalty}
                        </td>

                        {/* Problem cells */}
                        {contest.problemIds.map(probId => {
                          const task = row.tasks[probId];
                          if (!task) return <td key={probId} className="text-center border-l border-slate-200 text-slate-300">.</td>;

                          if (task.isSolved) {
                            return (
                              <td
                                key={probId}
                                className="py-2 px-2 text-center border-l border-slate-200 bg-emerald-50 text-emerald-800"
                              >
                                <div className="font-bold font-mono text-sm leading-tight">
                                  {task.attempts > 0 ? `+${task.attempts}` : '+'}
                                </div>
                                <div className="text-[10px] text-emerald-600 font-mono">
                                  {task.solvedAtMinutes !== undefined ? `0:${String(task.solvedAtMinutes).padStart(2, '0')}` : ''}
                                </div>
                              </td>
                            );
                          }

                          if (task.attempts > 0) {
                            return (
                              <td
                                key={probId}
                                className="py-2 px-2 text-center border-l border-slate-200 bg-red-50 text-red-700 font-bold font-mono text-xs"
                              >
                                -{task.attempts}
                              </td>
                            );
                          }

                          return (
                            <td key={probId} className="py-2 px-2 text-center border-l border-slate-200 text-slate-300 font-mono">
                              .
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-300 rounded inline-block text-center text-[10px] font-bold text-emerald-800">+</span>
              Problem solved (the number shows incorrect attempts before acceptance)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-red-100 border border-red-300 rounded inline-block text-center text-[10px] font-bold text-red-800">-1</span>
              Incorrect attempts; problem not solved
            </span>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Contest submissions (code is hidden to prevent copying) */}
      {isAllowed && activeSubtab === 'submissions' && (
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
          <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wide">
              Contest submissions ({contestSubmissions.length})
            </span>
            {contest.hideCodeDuringContest && !isTeacherAuthenticated && (
              <span className="text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Other participants’ code is hidden during the contest</span>
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                  <th className="py-2.5 px-3 text-center w-16">#</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-4">Author</th>
                  <th className="py-2.5 px-3">Problem</th>
                  <th className="py-2.5 px-3 text-center">Language</th>
                  <th className="py-2.5 px-4">Verdict</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                  <th className="py-2.5 px-3 text-center w-14">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {contestSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      There are no submissions in this contest yet.
                    </td>
                  </tr>
                ) : (
                  contestSubmissions.map(sub => {
                    const isAc = sub.verdict === 'Accepted';
                    const canViewCode = isTeacherAuthenticated || sub.handle === currentUser?.handle;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{sub.id}</td>
                        <td className="py-2.5 px-3 text-slate-600">{sub.submittedAt}</td>
                        <td className="py-2.5 px-4 font-bold text-blue-700">{sub.handle}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{sub.problemId}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{sub.language}</td>
                        <td className="py-2.5 px-4">
                          <span className={`font-bold ${isAc ? 'text-emerald-700' : 'text-red-600'}`}>
                            {sub.verdict}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">{sub.timeMs} ms</td>
                        <td className="py-2.5 px-3 text-center">
                          {canViewCode ? (
                            <button
                              onClick={() => onOpenSubmissionModal(sub)}
                              className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                              title="View code"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span title="Code is hidden during the contest" className="inline-flex justify-center w-full">
                              <Lock className="w-3.5 h-3.5 text-slate-300" />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
