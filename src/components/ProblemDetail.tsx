import React, { useState, useEffect } from 'react';
import { Problem, User, Verdict, Submission, SubmissionRequest } from '../types';
import { executeCode } from '../utils/judge';
import {
  ArrowLeft,
  Copy,
  Check,
  Play,
  Send,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  LogIn
} from 'lucide-react';

interface ProblemDetailProps {
  problem: Problem;
  currentUser: User | null;
  onBack: () => void;
  onOpenLogin: () => void;
  onSubmitSuccess: (submission: SubmissionRequest) => Promise<Submission>;
}

export const ProblemDetail: React.FC<ProblemDetailProps> = ({
  problem,
  currentUser,
  onBack,
  onOpenLogin,
  onSubmitSuccess
}) => {
  const [language, setLanguage] = useState<'cpp' | 'python' | 'javascript'>('cpp');
  const [code, setCode] = useState<string>(problem.starterCode.cpp || problem.starterCode.python);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Local testing workbench
  const [customInput, setCustomInput] = useState<string>(problem.sampleTests[0]?.input || '');
  const [customOutput, setCustomOutput] = useState<string>('');
  const [customError, setCustomError] = useState<string>('');
  const [customTime, setCustomTime] = useState<number | null>(null);
  const [isLocalRunning, setIsLocalRunning] = useState<boolean>(false);

  // Submission judge state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [latestVerdict, setLatestVerdict] = useState<{
    verdict: Verdict;
    testFailed?: number;
    passedTests: number;
    totalTests: number;
    timeMs: number;
    errorMessage?: string;
    sampleFailedDetails?: { input: string; expected: string; actual: string };
  } | null>(null);

  const handleLanguageChange = (newLang: 'cpp' | 'python' | 'javascript') => {
    setLanguage(newLang);
    setCode(problem.starterCode[newLang] || '');
    setLatestVerdict(null);
  };

  const handleResetCode = () => {
    if (confirm('Reset the code to the original template?')) {
      setCode(problem.starterCode[language] || '');
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRunCustom = () => {
    setIsLocalRunning(true);
    setCustomError('');
    setCustomOutput('');

    setTimeout(() => {
      const res = executeCode(language, code, customInput);
      setIsLocalRunning(false);
      setCustomTime(res.timeMs);
      if (res.error) {
        setCustomError(res.error);
      } else {
        setCustomOutput(res.output);
      }
    }, 50);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    if (!code.trim()) {
      alert('Please write your solution before submitting!');
      return;
    }

    setIsSubmitting(true);
    setLatestVerdict(null);
    setSubmissionError(null);
    try {
      const submission = await onSubmitSuccess({ problemId: problem.id, language, code });
      setLatestVerdict({
        verdict: submission.verdict,
        testFailed: submission.testFailed,
        passedTests: submission.passedTests,
        totalTests: submission.totalTests,
        timeMs: submission.timeMs,
        errorMessage: submission.errorMessage,
        sampleFailedDetails: submission.sampleFailedDetails
      });
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'The server could not judge this submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const isSolved = currentUser?.solvedProblems.includes(problem.id);

  return (
    <div className="space-y-6">
      {/* Top back & status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-300 rounded p-3 shadow-2xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-700 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to problem list</span>
        </button>

        <div className="flex items-center gap-2">
          {isSolved && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Solved by you</span>
            </span>
          )}
          <span className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-slate-100 text-slate-800 border border-slate-300">
            Difficulty: *{problem.difficulty}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Problem Statement in Codeforces format */}
        <div className="lg:col-span-7 space-y-6">
          <div className="app-problem-statement bg-white border border-[#b9c0c7] rounded p-6 shadow-2xs">
            {/* Header info */}
            <div className="text-center pb-5 mb-5 border-b border-slate-200">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
                {problem.id}. {problem.title}
              </h1>

              <div className="mt-3 text-xs text-slate-600 space-y-1 font-serif">
                <div>
                  <span className="text-slate-500">time limit per test:</span>{' '}
                  <span className="font-semibold text-slate-800">{problem.timeLimit}</span>
                </div>
                <div>
                  <span className="text-slate-500">memory limit per test:</span>{' '}
                  <span className="font-semibold text-slate-800">{problem.memoryLimit}</span>
                </div>
                <div>
                  <span className="text-slate-500">input:</span>{' '}
                  <span className="font-semibold text-slate-800">standard input (stdin)</span>
                </div>
                <div>
                  <span className="text-slate-500">output:</span>{' '}
                  <span className="font-semibold text-slate-800">standard output (stdout)</span>
                </div>
              </div>
            </div>

            {/* Statement text */}
            <div className="space-y-3 text-sm text-slate-800 leading-relaxed">
              {problem.statement.map((par, i) => (
                <p key={i}>{par}</p>
              ))}
            </div>

            {/* Input Format */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase border-b border-slate-200 pb-1 mb-2">
                Input
              </h3>
              <div className="space-y-2 text-sm text-slate-800 leading-relaxed">
                {problem.inputFormat.map((par, i) => (
                  <p key={i}>{par}</p>
                ))}
              </div>
            </div>

            {/* Output Format */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase border-b border-slate-200 pb-1 mb-2">
                Output
              </h3>
              <div className="space-y-2 text-sm text-slate-800 leading-relaxed">
                {problem.outputFormat.map((par, i) => (
                  <p key={i}>{par}</p>
                ))}
              </div>
            </div>

            {/* Sample Tests in Codeforces dual box style */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase border-b border-slate-200 pb-1 mb-3">
                Examples
              </h3>

              <div className="space-y-4">
                {problem.sampleTests.map((sample, idx) => (
                  <div key={idx} className="border border-[#b9c0c7] rounded overflow-hidden text-xs">
                    <div className="bg-[#e1e7ee] px-3 py-1.5 border-b border-[#b9c0c7] flex items-center justify-between font-mono font-semibold text-slate-700">
                      <span>Example #{idx + 1}</span>
                      <button
                        onClick={() => copyToClipboard(sample.input, idx)}
                        className="flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 cursor-pointer font-sans"
                        title="Copy input"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy input</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#b9c0c7]">
                      <div className="p-2.5 bg-[#fcfcfc]">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Input
                        </div>
                        <pre className="font-mono text-slate-900 whitespace-pre overflow-x-auto p-1.5 bg-white border border-slate-200 rounded">
                          {sample.input}
                        </pre>
                      </div>

                      <div className="p-2.5 bg-[#fcfcfc]">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Output
                        </div>
                        <pre className="font-mono text-slate-900 whitespace-pre overflow-x-auto p-1.5 bg-white border border-slate-200 rounded">
                          {sample.output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            {problem.note && problem.note.length > 0 && (
              <div className="mt-6 p-3 bg-blue-50/60 border border-blue-200 rounded text-xs text-slate-700 leading-relaxed">
                <div className="font-bold text-blue-900 uppercase tracking-wide mb-1">
                  Note
                </div>
                {problem.note.map((n, i) => (
                  <p key={i}>{n}</p>
                ))}
              </div>
            )}
          </div>

          {/* Quick local testing workbench */}
          <div className="bg-white border border-[#b9c0c7] rounded p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick run with your own input</span>
              </h3>
              {customTime !== null && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Time: {customTime} ms
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">
                  Test input (stdin):
                </label>
                <textarea
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  rows={2}
                  className="w-full font-mono text-xs p-2 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                  placeholder="Enter numbers or strings..."
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleRunCustom}
                  disabled={isLocalRunning}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isLocalRunning ? 'Running...' : 'Check output'}</span>
                </button>
              </div>

              {customError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-mono">
                  {customError}
                </div>
              )}

              {customOutput && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Program output (stdout):
                  </div>
                  <pre className="font-mono text-xs text-slate-900 whitespace-pre">
                    {customOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Code Editor & Submission Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="app-code-editor bg-white border border-[#b9c0c7] rounded overflow-hidden shadow-2xs sticky top-4">
            <div className="bg-[#e1e7ee] px-4 py-2.5 border-b border-[#b9c0c7] flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                SUBMIT SOLUTION
              </h2>
              <button
                onClick={handleResetCode}
                className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Reset code template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Template</span>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!currentUser && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      You are not signed in. To submit solutions, sign in with an account provided by your teacher.
                    </span>
                  </div>
                  <button
                    onClick={onOpenLogin}
                    className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs transition cursor-pointer shadow-2xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign in</span>
                  </button>
                </div>
              )}

              {/* Language Selector: C++, Python, JavaScript */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Programming language:
                </label>
                <select
                  value={language}
                  onChange={e => handleLanguageChange(e.target.value as any)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="cpp">C++ (GCC / In-Browser Sandbox)</option>
                  <option value="python">Python 3 (In-Browser Execution)</option>
                  <option value="javascript">JavaScript (Node.js 20)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {language === 'cpp'
                    ? 'Input: cin >> a >> b; or getline(cin, s); Output: cout << res << endl;'
                    : language === 'python'
                    ? 'Input: a, b = map(int, input().split()). Output: print(a + b).'
                    : 'Input: fs.readFileSync(0, "utf-8"). Output: console.log().'}
                </p>
              </div>

              {/* Code Textarea Editor */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Source code:
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    The Tab key is supported
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={15}
                    spellCheck={false}
                    className="w-full font-mono text-xs leading-relaxed p-3 bg-slate-900 text-emerald-400 rounded border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 selection:bg-blue-600"
                    placeholder="Write your solution here..."
                  />
                </div>
              </div>

              {/* Testing Animation / Progress */}
              {isSubmitting && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-center space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-800 font-mono">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                    Compiling and testing on the server, including hidden tests...
                  </div>
                  <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-150"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {submissionError && !isSubmitting && (
                <div className="p-3 bg-red-50 border border-red-300 rounded text-xs text-red-800">
                  {submissionError}
                </div>
              )}

              {/* Latest Verdict Banner */}
              {latestVerdict && !isSubmitting && (
                <div
                  className={`p-3.5 rounded border text-xs leading-relaxed ${
                    latestVerdict.verdict === 'Accepted'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold font-mono text-sm">
                      {latestVerdict.verdict === 'Accepted' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700">Accepted</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-700">
                            {latestVerdict.verdict} on test {latestVerdict.testFailed}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {latestVerdict.timeMs} ms
                      </span>
                    </div>
                  </div>

                  <p className="text-xs">
                    {latestVerdict.verdict === 'Accepted'
                      ? `Tests passed: ${latestVerdict.passedTests}/${latestVerdict.totalTests}. Great solution!`
                      : `Tests passed: ${latestVerdict.passedTests} of ${latestVerdict.totalTests}. ${
                          latestVerdict.errorMessage || ''
                        }`}
                  </p>

                  {latestVerdict.sampleFailedDetails && (
                    <div className="mt-2.5 pt-2 border-t border-red-200 text-[11px] space-y-1 font-mono">
                      <div className="font-sans font-bold text-red-800">
                        Error details for the sample:
                      </div>
                      <div>
                        <span className="text-slate-500">Input:</span>{' '}
                        {latestVerdict.sampleFailedDetails.input}
                      </div>
                      <div>
                        <span className="text-slate-500">Expected:</span>{' '}
                        <span className="text-emerald-700">
                          {latestVerdict.sampleFailedDetails.expected}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Program output:</span>{' '}
                        <span className="text-red-700">
                          {latestVerdict.sampleFailedDetails.actual}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded text-sm font-bold tracking-wide transition shadow-sm cursor-pointer ${
                  isSubmitting
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#3b5998] hover:bg-[#2b4270] text-white active:scale-[0.99]'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Checking...' : 'Submit solution'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
