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
              ОЛИМПИАДЫ И СОРЕВНОВАНИЯ (CONTESTS)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Школьные контесты в режиме реального времени с таймером, таблицей лидеров по правилам Codeforces/ICPC и персональным допуском
          </p>
        </div>

        {isTeacherAuthenticated && (
          <div className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded self-start md:self-auto flex items-center gap-1.5">
            <Unlock className="w-3.5 h-3.5" />
            <span>Режим учителя: запуск и контроль доступа</span>
          </div>
        )}
      </div>

      {/* 1. Текущие активные олимпиады (LIVE) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Идут сейчас (Live / Активные состязания)
          </h2>
        </div>

        {runningContests.length === 0 ? (
          <div className="bg-white border border-[#b9c0c7] rounded p-6 text-center text-xs text-slate-500 shadow-2xs">
            Сейчас нет активных соревнований. Ожидайте запуска контеста преподавателем.
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
                        Идёт соревнование
                      </span>
                      <span className="font-mono font-bold text-emerald-800">
                        Осталось: {remainingMin} мин {remainingSec} сек
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {allowed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Доступ открыт</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Доступ ограничен учителем</span>
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
                          Длительность: {contest.durationMinutes} мин
                        </span>
                        <span>•</span>
                        <span>Задач: {contest.problemIds.length}</span>
                        <span>•</span>
                        <span>Участники: {contest.allowedStudents.includes('*') ? 'Все ученики' : `${contest.allowedStudents.length} учеников`}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isTeacherAuthenticated && onFinishContest && (
                        <button
                          onClick={() => {
                            if (confirm(`Завершить соревнование "${contest.title}" досрочно?`)) {
                              onFinishContest(contest.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded text-xs border border-red-300 transition cursor-pointer"
                        >
                          Завершить контест
                        </button>
                      )}

                      <button
                        onClick={() => onSelectContest(contest)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Войти в олимпиаду</span>
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

      {/* 2. Предстоящие олимпиады (Ожидают старта) */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Ожидают запуска преподавателем</span>
        </h2>

        {upcomingContests.length === 0 ? (
          <div className="bg-white border border-[#b9c0c7] rounded p-4 text-center text-xs text-slate-500">
            Нет запланированных контестов.
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
                        Ожидает старта
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
                      <span>Длительность: {contest.durationMinutes} мин</span>
                      <span>•</span>
                      <span>Задач в контесте: {contest.problemIds.length}</span>
                      <span>•</span>
                      <span>
                        {allowed ? (
                          <span className="text-emerald-700 font-bold">Вам разрешён доступ</span>
                        ) : (
                          <span className="text-slate-500">Требуется разрешение учителя</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isTeacherAuthenticated && onStartContest && (
                      <button
                        onClick={() => {
                          if (confirm(`Запустить соревнование "${contest.title}" прямо сейчас?`)) {
                            onStartContest(contest.id);
                          }
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Запустить олимпиаду</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectContest(contest)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs border border-slate-300 transition cursor-pointer"
                    >
                      Подробнее
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Завершённые олимпиады */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Завершённые контесты
        </h2>

        {finishedContests.length === 0 ? (
          <div className="bg-white border border-[#b9c0c7] rounded p-4 text-center text-xs text-slate-500">
            Завершённых олимпиад пока нет.
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
                      Завершён
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
                  Таблица результатов
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
