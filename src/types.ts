export interface User {
  handle: string;
  rating: number;
  maxRating: number;
  ratingChanges?: RatingChange[];
  solvedProblems: string[]; // problem IDs
  registeredAt: string;
  submissionsCount: number;
  fullName?: string;
  allowedContests?: string[]; // IDs of contests accessible by student, or ['*']
}

export interface RatingChange {
  contestId: string;
  contestTitle: string;
  ratedAt: string;
  rank: number;
  participants: number;
  oldRating: number;
  newRating: number;
  delta: number;
}

export type StudentRegistration = User & { password: string };

export interface TestCase {
  id?: string;
  input: string;
  output: string;
  isSample?: boolean;
  outputHash?: string; // SHA-256 / hash for hidden tests protection
}

export interface Problem {
  id: string; // e.g., 'A', 'B', 'C', 'D', 'E', 'F'
  number: number;
  title: string;
  difficulty: number;
  tags: string[];
  timeLimit: string;
  memoryLimit: string;
  statement: string[];
  inputFormat: string[];
  outputFormat: string[];
  note?: string[];
  sampleTests: TestCase[];
  hiddenTests: TestCase[];
  starterCode: {
    javascript: string;
    python: string;
    cpp: string;
  };
  author?: string;
  createdAt?: string;
  contestId?: string; // If problem belongs to a specific contest
}

export type Verdict =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Output Limit Exceeded'
  | 'Runtime Error'
  | 'Compilation Error'
  | 'In queue'
  | 'Running';

export interface Submission {
  id: number;
  handle: string;
  problemId: string;
  problemTitle: string;
  language: 'cpp' | 'python' | 'javascript';
  code: string;
  submittedAt: string;
  verdict: Verdict;
  testFailed?: number;
  totalTests: number;
  passedTests: number;
  timeMs: number;
  memoryKb: number;
  errorMessage?: string;
  sampleFailedDetails?: {
    input: string;
    expected: string;
    actual: string;
  };
  contestId?: string;
  contestMinute?: number; // Minutes from contest start
}

export type SubmissionRequest = Pick<Submission, 'problemId' | 'language' | 'code'> & {
  contestId?: string;
};

export interface RankInfo {
  title: string;
  titleEn: string;
  color: string;
  textClass: string;
  badgeClass: string;
  nextRankThreshold?: number;
  nextRankTitle?: string;
}

export type ContestStatus = 'upcoming' | 'running' | 'finished';

export interface Contest {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: ContestStatus;
  startedAt?: number; // timestamp in ms
  endsAt?: number; // timestamp in ms
  problemIds: string[]; // e.g. ['A', 'B', 'C']
  allowedStudents: string[]; // Handles of students or ['*'] for all
  hideCodeDuringContest: boolean;
  author?: string;
  ratingAppliedAt?: number;
}

export interface ContestTaskResult {
  problemId: string;
  isSolved: boolean;
  attempts: number; // failed attempts before AC
  solvedAtMinutes?: number; // minutes from contest start
  penalty: number;
}

export interface ContestScoreboardRow {
  rank: number;
  handle: string;
  solvedCount: number;
  totalPenalty: number;
  tasks: Record<string, ContestTaskResult>;
}
