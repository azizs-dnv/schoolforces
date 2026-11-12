import React, { useState } from 'react';
import { Problem, User } from '../types';
import { CheckCircle2, Circle, Search, ArrowRight, Award, Flame, BookOpen } from 'lucide-react';

interface ProblemListProps {
  problems: Problem[];
  currentUser: User | null;
  onSelectProblem: (problem: Problem) => void;
  users: User[];
}

export const ProblemList: React.FC<ProblemListProps> = ({
  problems,
  currentUser,
  onSelectProblem,
  users
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');

  const solvedSet = new Set(currentUser?.solvedProblems || []);

  const filteredProblems = problems.filter(problem => {
    // Search
    const matchesSearch =
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      problem.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Difficulty
    const matchesDiff =
      selectedDifficulty === 'all' || problem.difficulty.toString() === selectedDifficulty;

    // Status
    const isSolved = solvedSet.has(problem.id);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'solved' && isSolved) ||
      (statusFilter === 'unsolved' && !isSolved);

    return matchesSearch && matchesDiff && matchesStatus;
  });

  // Calculate solver count for each problem
  const getSolverCount = (problemId: string) => {
    return users.filter(u => u.solvedProblems.includes(problemId)).length;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Problems Column (3 cols on desktop) */}
      <div className="lg:col-span-3 space-y-4">
        {/* Controls bar */}
        <div className="bg-white border border-slate-300 rounded p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title or tags (e.g., strings, 800)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            {/* Filter difficulty */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="all">All (800–1200)</option>
                <option value="800">800 (Beginner)</option>
                <option value="900">900</option>
                <option value="1000">1000</option>
                <option value="1100">1100</option>
                <option value="1200">1200</option>
              </select>
            </div>

            {/* Status filter if logged in */}
            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="all">All problems</option>
                  <option value="unsolved">Unsolved</option>
                  <option value="solved">Solved only</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Problems Table in Codeforces Style */}
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
          <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 tracking-wide">
              SCHOOL ROUND PROBLEM ARCHIVE
            </h2>
            <span className="text-xs text-slate-600 font-medium">
              Showing: {filteredProblems.length} of {problems.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-300">
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-3 text-center w-28">Difficulty</th>
                  <th className="py-2.5 px-3 text-center w-24">Solved by</th>
                  <th className="py-2.5 px-4 text-right w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProblems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                      No problems match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredProblems.map((problem, idx) => {
                    const isSolved = solvedSet.has(problem.id);
                    const solvers = getSolverCount(problem.id);

                    return (
                      <tr
                        key={problem.id}
                        className={`hover:bg-blue-50/60 transition-colors ${
                          idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                        } ${isSolved ? 'bg-green-50/40' : ''}`}
                      >
                        {/* ID & Solved indicator */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          <div className="flex items-center justify-center gap-1.5">
                            {isSolved ? (
                              <span title="Solved by you!">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              </span>
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            )}
                            <span>{problem.id}</span>
                          </div>
                        </td>

                        {/* Title & Tags */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <button
                              onClick={() => onSelectProblem(problem)}
                              className="font-medium text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer transition-colors"
                            >
                              {problem.title}
                            </button>
                            <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
                              {problem.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="hover:text-blue-700 cursor-pointer"
                                  onClick={() => setSearchQuery(tag)}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* Difficulty */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-semibold rounded font-mono ${
                              problem.difficulty <= 800
                                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                : problem.difficulty <= 1000
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                            }`}
                          >
                            *{problem.difficulty}
                          </span>
                        </td>

                        {/* Solvers count */}
                        <td className="py-3 px-3 text-center font-mono text-xs text-slate-600">
                          {solvers} users
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onSelectProblem(problem)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-[#3b5998] hover:bg-[#2b4270] text-white transition shadow-2xs cursor-pointer"
                          >
                            <span>{isSolved ? 'View' : 'Solve'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar Info (1 col on desktop) */}
      <div className="space-y-4">
        {/* Contest Info Box */}
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
          <div className="bg-[#e1e7ee] px-3.5 py-2 border-b border-[#b9c0c7] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#3b5998]" />
            <span className="text-xs font-bold text-slate-800 uppercase">
              School Contest #1
            </span>
          </div>
          <div className="p-3.5 text-xs text-slate-600 space-y-2.5">
            <p>
              Welcome to the school training platform <b>SchoolForces</b>!
            </p>
            <div className="border-t border-slate-200 pt-2 space-y-1">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-700">Always open</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Languages:</span>
                <span className="font-semibold text-slate-700">JS, Python 3</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Judge:</span>
                <span className="font-semibold text-emerald-700">In-Browser Judge</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating rules banner */}
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
          <div className="bg-[#e1e7ee] px-3.5 py-2 border-b border-[#b9c0c7] flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-800 uppercase">
              Rating system
            </span>
          </div>
          <div className="p-3.5 text-xs text-slate-600 space-y-2">
            <div className="flex items-start gap-2">
              <Flame className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
              Your rating changes after contests based on your place and opponents' ratings.
              </div>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] leading-relaxed">
            New participants usually start at <b>1200</b> (Pupil). Practice problems improve your skills; contest results affect your rating.
            </div>
          </div>
        </div>

        {/* Quick Top 3 */}
        <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
          <div className="bg-[#e1e7ee] px-3.5 py-2 border-b border-[#b9c0c7] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase">
              Round leaders
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {users
              .slice()
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 4)
              .map((u, i) => (
                <div key={u.handle} className="px-3 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 font-mono font-bold text-slate-400">#{i + 1}</span>
                    <span className="font-semibold text-blue-700">{u.handle}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-700">{u.rating}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
