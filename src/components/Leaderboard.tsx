import React, { useState } from 'react';
import { User } from '../types';
import { getRankInfo } from '../utils/ranks';
import { Trophy, Medal, Search, Flame, UserCheck } from 'lucide-react';

interface LeaderboardProps {
  users: User[];
  currentUser: User | null;
  onSelectUser?: (user: User) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUser, onSelectUser }) => {
  const [searchHandle, setSearchHandle] = useState('');

  // Sort descending by rating, tie-break by solved problems count
  const sortedUsers = [...users].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.solvedProblems.length - a.solvedProblems.length;
  });

  const filteredUsers = sortedUsers.filter(u =>
    u.handle.toLowerCase().includes(searchHandle.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white border border-[#b9c0c7] rounded p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              STANDINGS
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Participant ratings based on problems solved in contests
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Find a participant by username..."
            value={searchHandle}
            onChange={e => setSearchHandle(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
          />
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
        <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Round participants ({filteredUsers.length})
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Sorted by rating, highest first
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-300">
                <th className="py-2.5 px-3 text-center w-16">Rank</th>
                <th className="py-2.5 px-4">Username (handle)</th>
                <th className="py-2.5 px-4 text-center">Rank title</th>
                <th className="py-2.5 px-4 text-center">Problems solved</th>
                <th className="py-2.5 px-4 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                    No participants found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const rank = idx + 1;
                  const rankInfo = getRankInfo(user.rating);
                  const isCurrent = currentUser?.handle === user.handle;

                  return (
                    <tr
                      key={user.handle}
                      className={`hover:bg-blue-50/60 transition-colors ${
                        isCurrent
                          ? 'bg-amber-50/80 font-medium'
                          : idx % 2 === 1
                          ? 'bg-slate-50/60'
                          : 'bg-white'
                      }`}
                    >
                      {/* Place / Rank */}
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {rank === 1 ? (
                          <div className="flex items-center justify-center gap-1 text-amber-500 font-bold">
                            <Medal className="w-4 h-4 fill-amber-400 text-amber-600" />
                            <span>1</span>
                          </div>
                        ) : rank === 2 ? (
                          <div className="flex items-center justify-center gap-1 text-slate-400 font-bold">
                            <Medal className="w-4 h-4 fill-slate-300 text-slate-500" />
                            <span>2</span>
                          </div>
                        ) : rank === 3 ? (
                          <div className="flex items-center justify-center gap-1 text-amber-700 font-bold">
                            <Medal className="w-4 h-4 fill-amber-600 text-amber-800" />
                            <span>3</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">{rank}</span>
                        )}
                      </td>

                      {/* Handle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold cursor-pointer hover:underline"
                            style={{ color: rankInfo.color }}
                            title={`${rankInfo.title} (${user.rating})`}
                            onClick={() => onSelectUser && onSelectUser(user)}
                          >
                            {user.handle}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rank Title Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${rankInfo.badgeClass}`}
                        >
                          {rankInfo.title}
                        </span>
                      </td>

                      {/* Solved Problems */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-emerald-700 font-bold">{user.solvedProblems.length}</span>
                          <span className="text-slate-400">/ 6</span>
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-base text-slate-900">
                        {user.rating}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Codeforces Rating Color Legend */}
      <div className="bg-white border border-[#b9c0c7] rounded p-4 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-blue-600" />
          <span>Codeforces rating colors</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs text-center font-semibold">
          <div className="p-2 rounded bg-gray-50 border border-gray-200 text-gray-500">
            <div>Newbie</div>
            <div className="text-[11px] font-mono text-slate-400">&lt; 1200</div>
          </div>
          <div className="p-2 rounded bg-green-50 border border-green-200 text-green-700">
            <div>Pupil</div>
            <div className="text-[11px] font-mono text-green-600">1200–1399</div>
          </div>
          <div className="p-2 rounded bg-cyan-50 border border-cyan-200 text-cyan-700">
            <div>Specialist</div>
            <div className="text-[11px] font-mono text-cyan-600">1400–1599</div>
          </div>
          <div className="p-2 rounded bg-blue-50 border border-blue-200 text-blue-700">
            <div>Expert</div>
            <div className="text-[11px] font-mono text-blue-600">1600–1899</div>
          </div>
          <div className="p-2 rounded bg-purple-50 border border-purple-200 text-purple-700">
            <div>Candidate Master</div>
            <div className="text-[11px] font-mono text-purple-600">1900–2199</div>
          </div>
          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-700">
            <div>Master</div>
            <div className="text-[11px] font-mono text-amber-600">2200–2399</div>
          </div>
          <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700">
            <div>Grandmaster</div>
            <div className="text-[11px] font-mono text-red-600">2400+</div>
          </div>
        </div>
      </div>
    </div>
  );
};
