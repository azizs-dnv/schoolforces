import React, { useState } from 'react';
import { Submission, User } from '../types';
import { getRankInfo } from '../utils/ranks';
import { FileCode2, CheckCircle2, XCircle, Clock, Eye, Filter } from 'lucide-react';

interface SubmissionsListProps {
  submissions: Submission[];
  users: User[];
  onOpenSubmissionModal: (sub: Submission) => void;
  onSelectProblemById?: (problemId: string) => void;
}

export const SubmissionsList: React.FC<SubmissionsListProps> = ({
  submissions,
  users,
  onOpenSubmissionModal,
  onSelectProblemById
}) => {
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [filterAuthor, setFilterAuthor] = useState<string>('');

  const getUserRank = (handle: string) => {
    const user = users.find(u => u.handle === handle);
    return getRankInfo(user ? user.rating : 1200);
  };

  const filtered = submissions.filter(sub => {
    const matchesVerdict =
      filterVerdict === 'all' ||
      (filterVerdict === 'Accepted' && sub.verdict === 'Accepted') ||
      (filterVerdict === 'Failed' && sub.verdict !== 'Accepted');

    const matchesAuthor =
      !filterAuthor || sub.handle.toLowerCase().includes(filterAuthor.toLowerCase());

    return matchesVerdict && matchesAuthor;
  });

  return (
    <div className="space-y-4">
      {/* Header and filters */}
      <div className="bg-white border border-[#b9c0c7] rounded p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-bold text-slate-800 tracking-tight uppercase">
            SUBMISSION QUEUE (STATUS)
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Verdict:</span>
          <select
            value={filterVerdict}
            onChange={e => setFilterVerdict(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">All verdicts</option>
            <option value="Accepted">Accepted only</option>
            <option value="Failed">With errors</option>
          </select>

          <input
            type="text"
            placeholder="Filter by author..."
            value={filterAuthor}
            onChange={e => setFilterAuthor(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 w-36 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Submissions Table in Codeforces style */}
      <div className="bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs">
        <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Latest submissions ({filtered.length})
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Click a verdict to view the code
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-300">
                <th className="py-2.5 px-3 text-center w-20">#</th>
                <th className="py-2.5 px-3 w-32">Time</th>
                <th className="py-2.5 px-4">Author</th>
                <th className="py-2.5 px-4">Problem</th>
                <th className="py-2.5 px-3 text-center">Language</th>
                <th className="py-2.5 px-4">Verdict</th>
                <th className="py-2.5 px-3 text-right">Time (ms)</th>
                <th className="py-2.5 px-3 text-right">Memory</th>
                <th className="py-2.5 px-3 text-center w-16">Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-sm">
                    No submissions found.
                  </td>
                </tr>
              ) : (
                filtered.map((sub, idx) => {
                  const rankInfo = getUserRank(sub.handle);
                  const isAccepted = sub.verdict === 'Accepted';

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-blue-50/60 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-3 text-center font-mono text-xs text-slate-500">
                        {sub.id}
                      </td>

                      {/* Submitted At */}
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                        {sub.submittedAt}
                      </td>

                      {/* Author */}
                      <td className="py-3 px-4">
                        <span
                          className="font-bold cursor-pointer hover:underline text-xs"
                          style={{ color: rankInfo.color }}
                        >
                          {sub.handle}
                        </span>
                      </td>

                      {/* Problem */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectProblemById && onSelectProblemById(sub.problemId)}
                          className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer"
                        >
                          {sub.problemId}. {sub.problemTitle}
                        </button>
                      </td>

                      {/* Language */}
                      <td className="py-3 px-3 text-center text-xs font-mono text-slate-600">
                        {sub.language === 'javascript' ? 'JavaScript' : 'Python 3'}
                      </td>

                      {/* Verdict */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onOpenSubmissionModal(sub)}
                          className="cursor-pointer group flex items-center gap-1.5"
                        >
                          {isAccepted ? (
                            <span className="font-bold text-xs text-emerald-700 group-hover:underline flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Accepted</span>
                            </span>
                          ) : (
                            <span className="font-bold text-xs text-red-600 group-hover:underline flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>
                                {sub.verdict}
                                {sub.testFailed ? ` on test ${sub.testFailed}` : ''}
                              </span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-700">
                        {sub.timeMs} ms
                      </td>

                      {/* Memory */}
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-600">
                        {sub.memoryKb} KB
                      </td>

                      {/* Inspect Code button */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenSubmissionModal(sub)}
                          className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                          title="View source code"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
  );
};
