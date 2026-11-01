import React, { useState } from 'react';
import { Submission } from '../types';
import { X, Copy, Check, Clock, Cpu, FileCode2, CheckCircle2, XCircle } from 'lucide-react';

interface SubmissionModalProps {
  submission: Submission | null;
  onClose: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ submission, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!submission) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(submission.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAccepted = submission.verdict === 'Accepted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-[#b9c0c7] rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#3b5998] px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Посылка #{submission.id} — {submission.problemId}. {submission.problemTitle}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Submission Details Bar */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Автор:</span>{' '}
            <span className="font-bold text-slate-800">{submission.handle}</span>
          </div>
          <div>
            <span className="text-slate-500">Язык:</span>{' '}
            <span className="font-semibold text-slate-800">
              {submission.language === 'javascript' ? 'JavaScript' : 'Python 3'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Время:</span>{' '}
            <span className="font-mono text-slate-800">{submission.timeMs} мс</span>
          </div>
          <div>
            <span className="text-slate-500">Память:</span>{' '}
            <span className="font-mono text-slate-800">{submission.memoryKb} КБ</span>
          </div>
        </div>

        {/* Verdict Badge */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAccepted ? (
              <div className="flex items-center gap-1.5 font-bold font-mono text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Accepted (тесты: {submission.passedTests}/{submission.totalTests})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-bold font-mono text-sm text-red-700 bg-red-50 px-3 py-1 rounded border border-red-300">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>
                  {submission.verdict} на тесте {submission.testFailed}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Скопировать код</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre overflow-x-auto">{submission.code}</pre>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-semibold rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
