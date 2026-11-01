import React from 'react';
import { BookOpen, Terminal, ShieldCheck, Lock } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Banner */}
      <div className="bg-white border border-[#b9c0c7] rounded p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-1 h-7">
            <span className="w-2 h-4 bg-amber-400 rounded-t-xs"></span>
            <span className="w-2 h-6 bg-blue-600 rounded-t-xs"></span>
            <span className="w-2 h-5 bg-red-600 rounded-t-xs"></span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight font-sans">
            ABOUT SCHOOLFORCES
          </h1>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          <b>SchoolForces</b> is a dedicated platform for school competitions and preparation for the All-Russian School Olympiad, municipal rounds, and competitive programming contests, with a Codeforces-inspired design.
        </p>
      </div>

      {/* Guide: How to write solutions */}
      <div className="bg-white border border-[#b9c0c7] rounded p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
          <Terminal className="w-4 h-4 text-blue-600" />
          <span>Supported languages: C++, Python 3, JavaScript</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* C++ */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>C++ (GCC)</span>
              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">
                Competitive programming standard
              </span>
            </div>
            <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded font-mono text-[11px] overflow-x-auto leading-relaxed">
{`#include <iostream>
using namespace std;

int main() {
    long long a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`}
            </pre>
          </div>

          {/* Python */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Python 3</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                Beginner-friendly
              </span>
            </div>
            <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded font-mono text-[11px] overflow-x-auto leading-relaxed">
{`# Read two numbers:
a, b = map(int, input().split())

# Print the answer:
print(a + b)`}
            </pre>
          </div>

          {/* JavaScript */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>JavaScript</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                Web Standard
              </span>
            </div>
            <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded font-mono text-[11px] overflow-x-auto leading-relaxed">
{`const fs = require('fs');
const [a, b] = fs
  .readFileSync(0, 'utf-8')
  .trim()
  .split(/\\s+/)
  .map(Number);

console.log(a + b);`}
            </pre>
          </div>
        </div>
      </div>

      {/* Security & Roles */}
      <div className="bg-white border border-[#b9c0c7] rounded p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Security and participant registration</span>
        </h2>
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <p>
            • <b>Student registration:</b> Student self-registration is disabled. Usernames and passwords are issued by a teacher through the secure teacher panel.
          </p>
          <p>
            • <b>Teacher panel security:</b> Teacher actions require an authenticated server session. Student passwords are stored as salted hashes on the server.
          </p>
          <p>
            • <b>Evaluation:</b> This version runs the judge in the browser. Hidden tests and verdicts are not tamper-proof, so use it for supervised LAN practice, not high-stakes contests.
          </p>
        </div>
      </div>
    </div>
  );
};
