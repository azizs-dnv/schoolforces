import { User, Submission, Contest } from '../types';

export const INITIAL_CONTESTS: Contest[] = [
  {
    id: 'round-1',
    title: '2026 All-Russian School Olympiad in Informatics: School Stage',
    description: 'The official school-stage olympiad round. Problems A, B, C, and D. ICPC / Codeforces scoring system.',
    durationMinutes: 120,
    status: 'running',
    startedAt: Date.now() - 35 * 60 * 1000, // Started 35 minutes ago
    endsAt: Date.now() + 85 * 60 * 1000,
    problemIds: ['A', 'B', 'C', 'D'],
    allowedStudents: ['tourist_junior', 'coder_ivan', 'anna_school9', 'newbie_petya'],
    hideCodeDuringContest: true,
    author: 'Computer Science Teacher'
  },
  {
    id: 'round-2',
    title: 'Practice Contest for Grades 7–9',
    description: 'Practice olympiad problems for beginners. Waiting to be started by the teacher.',
    durationMinutes: 90,
    status: 'upcoming',
    problemIds: ['A', 'B', 'C'],
    allowedStudents: ['*'], // Open to all students
    hideCodeDuringContest: true,
    author: 'Computer Science Teacher'
  },
  {
    id: 'round-autumn',
    title: 'Autumn School Olympiad (Finished)',
    description: 'A completed contest. Results have been finalized.',
    durationMinutes: 150,
    status: 'finished',
    startedAt: Date.now() - 86400 * 1000 * 5,
    endsAt: Date.now() - 86400 * 1000 * 5 + 150 * 60 * 1000,
    problemIds: ['A', 'B', 'C', 'D', 'E'],
    allowedStudents: ['*'],
    hideCodeDuringContest: false,
    author: 'Computer Science Teacher'
  }
];

export const INITIAL_USERS: User[] = [
  {
    handle: 'tourist_junior',
    password: 'password123',
    rating: 2150,
    maxRating: 2150,
    solvedProblems: ['A', 'B', 'C', 'D', 'E'],
    registeredAt: '2026-09-01',
    submissionsCount: 8,
    allowedContests: ['*']
  },
  {
    handle: 'coder_ivan',
    password: 'password123',
    rating: 1450,
    maxRating: 1480,
    solvedProblems: ['A', 'B', 'C'],
    registeredAt: '2026-09-12',
    submissionsCount: 6,
    allowedContests: ['round-1', 'round-2', 'round-autumn']
  },
  {
    handle: 'anna_school9',
    password: 'password123',
    rating: 1320,
    maxRating: 1320,
    solvedProblems: ['A', 'B'],
    registeredAt: '2026-09-20',
    submissionsCount: 4,
    allowedContests: ['round-1', 'round-2', 'round-autumn']
  },
  {
    handle: 'python_master',
    password: 'password123',
    rating: 1250,
    maxRating: 1250,
    solvedProblems: ['A'],
    registeredAt: '2026-10-02',
    submissionsCount: 3,
    allowedContests: ['round-2', 'round-autumn']
  },
  {
    handle: 'newbie_petya',
    password: 'password123',
    rating: 1180,
    maxRating: 1200,
    solvedProblems: [],
    registeredAt: '2026-10-15',
    submissionsCount: 2,
    allowedContests: ['round-1', 'round-2']
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 10842,
    handle: 'tourist_junior',
    problemId: 'D',
    problemTitle: 'Reverse a String',
    language: 'cpp',
    code: '#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nint main() {\n  string s;\n  cin >> s;\n  reverse(s.begin(), s.end());\n  cout << s << endl;\n  return 0;\n}',
    submittedAt: 'Today 14:22',
    verdict: 'Accepted',
    totalTests: 8,
    passedTests: 8,
    timeMs: 18,
    memoryKb: 1420,
    contestId: 'round-1',
    contestMinute: 22
  },
  {
    id: 10841,
    handle: 'coder_ivan',
    problemId: 'C',
    problemTitle: 'Find the Maximum of Three Numbers',
    language: 'python',
    code: 'a, b, c = map(int, input().split())\nprint(max(a, b, c))',
    submittedAt: 'Today 13:50',
    verdict: 'Accepted',
    totalTests: 8,
    passedTests: 8,
    timeMs: 25,
    memoryKb: 1350,
    contestId: 'round-1',
    contestMinute: 15
  },
  {
    id: 10840,
    handle: 'anna_school9',
    problemId: 'A',
    problemTitle: 'A + B',
    language: 'javascript',
    code: 'const fs = require("fs");\nconst [a, b] = fs.readFileSync(0, "utf-8").trim().split(/\\s+/).map(Number);\nconsole.log(a + b);',
    submittedAt: 'Today 13:38',
    verdict: 'Accepted',
    totalTests: 8,
    passedTests: 8,
    timeMs: 24,
    memoryKb: 1320,
    contestId: 'round-1',
    contestMinute: 8
  },
  {
    id: 10839,
    handle: 'coder_ivan',
    problemId: 'A',
    problemTitle: 'A + B',
    language: 'cpp',
    code: '#include <iostream>\nusing namespace std;\nint main() {\n  long long a, b;\n  cin >> a >> b;\n  cout << a + b << endl;\n  return 0;\n}',
    submittedAt: 'Today 13:35',
    verdict: 'Accepted',
    totalTests: 8,
    passedTests: 8,
    timeMs: 14,
    memoryKb: 1280,
    contestId: 'round-1',
    contestMinute: 5
  },
  {
    id: 10838,
    handle: 'newbie_petya',
    problemId: 'A',
    problemTitle: 'A + B',
    language: 'python',
    code: 'a, b = map(int, input().split())\nprint(a - b)', // wrong minus
    submittedAt: 'Today 13:34',
    verdict: 'Wrong Answer',
    testFailed: 1,
    totalTests: 8,
    passedTests: 0,
    timeMs: 20,
    memoryKb: 1300,
    errorMessage: 'Wrong answer on test 1',
    contestId: 'round-1',
    contestMinute: 4
  }
];
