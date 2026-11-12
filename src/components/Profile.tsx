import React from 'react';
import { User, Problem, Submission } from '../types';
import { getRankInfo } from '../utils/ranks';
import {
  User as UserIcon,
  Award,
  CheckCircle2,
  Calendar,
  Flame,
  FileCode2,
  ArrowRight,
  TrendingUp,
  LogIn,
  Medal
} from 'lucide-react';

interface ProfileProps {
  currentUser: User | null;
  users: User[];
  problems: Problem[];
  submissions: Submission[];
  onSelectProblem: (problem: Problem) => void;
  onOpenLogin: () => void;
  onOpenSubmissionModal: (sub: Submission) => void;
}

export const Profile: React.FC<ProfileProps> = ({
  currentUser,
  users,
  problems,
  submissions,
  onSelectProblem,
  onOpenLogin,
  onOpenSubmissionModal
}) => {
  if (!currentUser) {
    return (
      <div className="bg-white border border-[#b9c0c7] rounded p-8 text-center max-w-md mx-auto shadow-2xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <UserIcon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Participant profile</h2>
        <p className="text-xs text-slate-600">
          You are signed in as a guest. Please sign in to track your rating, solved problems, and submission history.
        </p>
        <button
          onClick={onOpenLogin}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b5998] hover:bg-[#2b4270] text-white font-semibold text-xs rounded transition shadow-2xs cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign in / Register</span>
        </button>
      </div>
    );
  }

  const rankInfo = getRankInfo(currentUser.rating);
  const userSubmissions = submissions.filter(s => s.handle === currentUser.handle);
  const ratingChanges = [...(currentUser.ratingChanges ?? [])]
    .sort((a, b) => Date.parse(a.ratedAt) - Date.parse(b.ratedAt));
  const orderedUsers = [...users].sort((a, b) => b.rating - a.rating);
  const userIndex = orderedUsers.findIndex(user => user.handle === currentUser.handle);
  const ratingRank = userIndex < 0
    ? 0
    : orderedUsers.findIndex(user => user.rating === orderedUsers[userIndex].rating) + 1;
  const contestHistory = [...ratingChanges].reverse();
  const chartRatings = ratingChanges.length > 0
    ? [ratingChanges[0].oldRating, ...ratingChanges.map(change => change.newRating)]
    : [currentUser.rating];
  const chartWidth = 720;
  const chartHeight = 240;
  const chartPadding = { top: 20, right: 24, bottom: 32, left: 52 };
  const chartMin = Math.max(0, Math.min(...chartRatings) - 100);
  const chartMax = Math.max(...chartRatings) + 100;
  const chartRange = Math.max(200, chartMax - chartMin);
  const chartPoints = chartRatings.map((rating, index) => ({
    rating,
    x: chartRatings.length === 1
      ? (chartWidth - chartPadding.left - chartPadding.right) / 2 + chartPadding.left
      : chartPadding.left + index * (chartWidth - chartPadding.left - chartPadding.right) / (chartRatings.length - 1),
    y: chartPadding.top + (chartMax - rating) * (chartHeight - chartPadding.top - chartPadding.bottom) / chartRange
  }));
  const chartPath = chartPoints.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  // Solved problem objects
  const solvedProblemsList = problems.filter(p => currentUser.solvedProblems.includes(p.id));

  // Progress to next rank calculation
  let progressPercent = 100;
  let pointsToNext = 0;
  if (rankInfo.nextRankThreshold) {
    // Current tier floor:
    const floor =
      rankInfo.title === 'Newbie'
        ? 0
        : rankInfo.title === 'Pupil'
        ? 1200
        : rankInfo.title === 'Specialist'
        ? 1400
        : rankInfo.title === 'Expert'
        ? 1600
        : rankInfo.title === 'Candidate Master'
        ? 1900
        : 2200;

    const span = rankInfo.nextRankThreshold - floor;
    const currentOver = currentUser.rating - floor;
    progressPercent = Math.min(100, Math.max(5, Math.round((currentOver / span) * 100)));
    pointsToNext = Math.max(0, rankInfo.nextRankThreshold - currentUser.rating);
  }

  return (
    <div className="space-y-6">
      {/* Profile Big Card */}
      <div className="bg-white border border-[#b9c0c7] rounded p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {/* Avatar avatar block */}
            <div
              className="w-16 h-16 rounded border-2 flex items-center justify-center font-bold text-2xl uppercase select-none shadow-2xs"
              style={{
                borderColor: rankInfo.color,
                backgroundColor: `${rankInfo.color}15`,
                color: rankInfo.color
              }}
            >
              {currentUser.handle.slice(0, 2)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1
                  className="text-2xl font-black tracking-tight"
                  style={{ color: rankInfo.color }}
                >
                  {currentUser.handle}
                </h1>
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${rankInfo.badgeClass}`}>
                  {rankInfo.title}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Registered: {currentUser.registeredAt}
                </span>
                <span>•</span>
                <span>Organization: School of Programming</span>
              </div>
            </div>
          </div>

          {/* Rating counters */}
          <div className="flex items-center gap-6 bg-slate-50 p-3 rounded border border-slate-200 self-stretch md:self-auto justify-around">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Current rating
              </div>
              <div className="text-2xl font-mono font-black" style={{ color: rankInfo.color }}>
                {currentUser.rating}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Max rating
              </div>
              <div className="text-xl font-mono font-bold text-slate-700">
                {currentUser.maxRating}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Problems solved
              </div>
              <div className="text-xl font-mono font-bold text-emerald-700">
                {currentUser.solvedProblems.length}
              </div>
            </div>
          </div>
        </div>

        {/* Rank progress bar */}
        {rankInfo.nextRankThreshold && (
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">
                Progress to rank <b>{rankInfo.nextRankTitle}</b> ({rankInfo.nextRankThreshold}):
              </span>
              <span className="font-mono font-bold text-blue-700">
                {pointsToNext} rating points to the next rank
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full border border-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
        <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Rating history
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500">Global place</span>
            <span className="font-bold text-slate-800">#{ratingRank || '—'} of {users.length}</span>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 mb-2">
            <span>
              Rating: <b style={{ color: rankInfo.color }}>{currentUser.rating}</b>
            </span>
            <span>
              Best: <b className="text-slate-800">{currentUser.maxRating}</b>
            </span>
            <span>
              Rated contests: <b className="text-slate-800">{ratingChanges.length}</b>
            </span>
          </div>
          <p className="mb-2 text-[11px] text-slate-500">
            Rating changes are based on contest placement using an Elo-style calculation.
          </p>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label={`Rating history chart. Current rating ${currentUser.rating}.`}
              className="block w-full min-w-[22rem] h-48 sm:h-60"
            >
              {[0, 1, 2, 3, 4].map(tick => {
                const y = chartPadding.top + tick * (chartHeight - chartPadding.top - chartPadding.bottom) / 4;
                const value = Math.round(chartMax - tick * chartRange / 4);
                return (
                  <g key={tick}>
                    <line
                      x1={chartPadding.left}
                      x2={chartWidth - chartPadding.right}
                      y1={y}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="3 4"
                    />
                    <text x={chartPadding.left - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="11">
                      {value}
                    </text>
                  </g>
                );
              })}
              <path d={chartPath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              {chartPoints.map((point, index) => (
                <circle key={`${index}-${point.rating}`} cx={point.x} cy={point.y} r="4" fill="#2563eb" stroke="white" strokeWidth="2">
                  <title>{`${index === 0 ? 'Starting rating' : ratingChanges[index - 1]?.contestTitle}: ${point.rating}`}</title>
                </circle>
              ))}
              <text x={chartPadding.left} y={chartHeight - 8} fill="#64748b" fontSize="11">
                {ratingChanges.length ? new Date(ratingChanges[0].ratedAt).toLocaleDateString() : 'First rated contest'}
              </text>
              <text x={chartWidth - chartPadding.right} y={chartHeight - 8} textAnchor="end" fill="#64748b" fontSize="11">
                {ratingChanges.length ? new Date(ratingChanges[ratingChanges.length - 1].ratedAt).toLocaleDateString() : 'No contest results yet'}
              </text>
            </svg>
          </div>

          {contestHistory.length === 0 ? (
            <p className="mt-2 text-center text-xs text-slate-500">
              Your rating history will appear here after you participate in a finished contest.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Contest</th>
                    <th className="py-2 px-3 text-center font-semibold">Place</th>
                    <th className="py-2 px-3 text-right font-semibold">Old rating</th>
                    <th className="py-2 px-3 text-right font-semibold">Change</th>
                    <th className="py-2 pl-3 text-right font-semibold">New rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contestHistory.map(change => (
                    <tr key={`${change.contestId}-${change.ratedAt}`}>
                      <td className="py-2 pr-3">
                        <div className="font-semibold text-slate-800">{change.contestTitle}</div>
                        <div className="text-[11px] text-slate-500">{new Date(change.ratedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-2 px-3 text-center font-mono">
                        <span className="inline-flex items-center gap-1">
                          <Medal className="w-3.5 h-3.5 text-amber-500" />
                          {change.rank} / {change.participants}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{change.oldRating}</td>
                      <td className={`py-2 px-3 text-right font-mono font-bold ${change.delta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {change.delta > 0 ? '+' : ''}{change.delta}
                      </td>
                      <td className="py-2 pl-3 text-right font-mono font-bold">{change.newRating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solved Problems */}
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
          <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Solved problems ({solvedProblemsList.length})</span>
            </h2>
          </div>

          <div className="p-4">
            {solvedProblemsList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                You have not solved any problems yet. Go to the Problems tab and submit your first solution!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {solvedProblemsList.map(prob => (
                  <div
                    key={prob.id}
                    onClick={() => onSelectProblem(prob)}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-xs text-blue-800">
                        {prob.id}. {prob.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        *{prob.difficulty}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Submissions of User */}
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
          <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-blue-600" />
              <span>Submission history ({userSubmissions.length})</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {userSubmissions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                You have not submitted any solutions yet.
              </div>
            ) : (
              userSubmissions.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => onOpenSubmissionModal(sub)}
                  className="p-3 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800">
                      {sub.problemId}. {sub.problemTitle}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {sub.submittedAt} • {sub.language}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-bold font-mono text-xs ${
                        sub.verdict === 'Accepted' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {sub.verdict}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {sub.timeMs} ms
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
