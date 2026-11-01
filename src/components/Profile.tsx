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
  LogIn
} from 'lucide-react';

interface ProfileProps {
  currentUser: User | null;
  problems: Problem[];
  submissions: Submission[];
  onSelectProblem: (problem: Problem) => void;
  onOpenLogin: () => void;
  onOpenSubmissionModal: (sub: Submission) => void;
}

export const Profile: React.FC<ProfileProps> = ({
  currentUser,
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
        <h2 className="text-lg font-bold text-slate-800">Профиль участника</h2>
        <p className="text-xs text-slate-600">
          Вы вошли как гость. Пожалуйста, выполните вход или зарегистрируйтесь, чтобы отслеживать свой личный рейтинг, решённые задачи и историю посылок.
        </p>
        <button
          onClick={onOpenLogin}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b5998] hover:bg-[#2b4270] text-white font-semibold text-xs rounded transition shadow-2xs cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Войти / Зарегистрироваться</span>
        </button>
      </div>
    );
  }

  const rankInfo = getRankInfo(currentUser.rating);
  const userSubmissions = submissions.filter(s => s.handle === currentUser.handle);

  // Solved problem objects
  const solvedProblemsList = problems.filter(p => currentUser.solvedProblems.includes(p.id));

  // Progress to next rank calculation
  let progressPercent = 100;
  let pointsToNext = 0;
  if (rankInfo.nextRankThreshold) {
    // Current tier floor:
    const floor =
      rankInfo.title === 'Новичок'
        ? 0
        : rankInfo.title === 'Ученик'
        ? 1200
        : rankInfo.title === 'Специалист'
        ? 1400
        : rankInfo.title === 'Эксперт'
        ? 1600
        : rankInfo.title === 'Кандидат в мастера'
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
                  Регистрация: {currentUser.registeredAt}
                </span>
                <span>•</span>
                <span>Организация: Школа программирования</span>
              </div>
            </div>
          </div>

          {/* Rating counters */}
          <div className="flex items-center gap-6 bg-slate-50 p-3 rounded border border-slate-200 self-stretch md:self-auto justify-around">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Текущий рейтинг
              </div>
              <div className="text-2xl font-mono font-black" style={{ color: rankInfo.color }}>
                {currentUser.rating}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Макс. рейтинг
              </div>
              <div className="text-xl font-mono font-bold text-slate-700">
                {currentUser.maxRating}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Решено задач
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
                Прогресс до звания <b>{rankInfo.nextRankTitle}</b> ({rankInfo.nextRankThreshold}):
              </span>
              <span className="font-mono font-bold text-blue-700">
                Осталось {pointsToNext} очков (решите {Math.ceil(pointsToNext / 50)} задач)
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solved Problems */}
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
          <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Решённые задачи ({solvedProblemsList.length})</span>
            </h2>
          </div>

          <div className="p-4">
            {solvedProblemsList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Вы пока не решили ни одной задачи. Перейдите во вкладку «Задачи» и отправьте первое решение!
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
              <span>История посылок ({userSubmissions.length})</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {userSubmissions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                У вас пока нет отправленных посылок.
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
                      {sub.timeMs} мс
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
