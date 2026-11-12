import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import Database from 'better-sqlite3';
import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { INITIAL_CONTESTS } from './src/data/mockData';
import { PROBLEMS } from './src/data/problems';
import { Contest, Problem, Submission, SubmissionRequest, TestCase, User } from './src/types';
import { JudgeResult } from './src/utils/judge';
import { calculateRatingChanges } from './src/utils/rating';
import { calculateContestScoreboard } from './src/utils/scoreboard';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const dataDirectory = path.resolve(process.env.DATA_DIR || '.data');
const dataFile = path.join(dataDirectory, 'schoolforces.sqlite');
const legacyDataFile = path.join(dataDirectory, 'schoolforces.json');
const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const loginWindowMs = 15 * 60 * 1000;
const loginAttemptLimit = 10;
const starterCodeVersion = 2;
const judgeImage = 'schoolforces-judge:local';
const judgeRuntime = process.env.JUDGE_RUNTIME || 'docker';
const maxConcurrentJudges = 2;
const maxQueuedJudges = 20;

type StoredUser = User & { passwordHash: string };
type Session = { role: 'teacher' } | { role: 'student'; handle: string };
type Store = {
  starterCodeVersion: number;
  teacherPasswordHash: string;
  users: StoredUser[];
  contests: Contest[];
  problems: Problem[];
  submissions: Submission[];
};

fs.mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
const database = new Database(dataFile);
fs.chmodSync(dataFile, 0o600);
database.pragma('journal_mode = WAL');
database.exec(`
  CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    handle TEXT PRIMARY KEY,
    data_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS contests (
    id TEXT PRIMARY KEY,
    data_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    data_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY,
    data_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    handle TEXT,
    expires_at INTEGER NOT NULL
  );
`);

const replaceMetadata = database.prepare(
  'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)'
);
const insertUser = database.prepare('INSERT INTO users (handle, data_json) VALUES (?, ?)');
const insertContest = database.prepare('INSERT INTO contests (id, data_json) VALUES (?, ?)');
const insertProblem = database.prepare('INSERT INTO problems (id, data_json) VALUES (?, ?)');
const insertSubmission = database.prepare('INSERT INTO submissions (id, data_json) VALUES (?, ?)');
const insertSession = database.prepare(
  'INSERT INTO sessions (token, role, handle, expires_at) VALUES (?, ?, ?, ?)'
);
const findSession = database.prepare(
  'SELECT role, handle, expires_at FROM sessions WHERE token = ?'
);
const deleteSession = database.prepare('DELETE FROM sessions WHERE token = ?');
const deleteStudentSessions = database.prepare(
  'DELETE FROM sessions WHERE role = ? AND handle = ?'
);
database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
const persistStoreTransaction = database.transaction((store: Store) => {
  database.exec('DELETE FROM users; DELETE FROM contests; DELETE FROM problems; DELETE FROM submissions;');
  replaceMetadata.run('teacherPasswordHash', store.teacherPasswordHash);
  replaceMetadata.run('starterCodeVersion', String(store.starterCodeVersion));
  for (const user of store.users) insertUser.run(user.handle, JSON.stringify(user));
  for (const contest of store.contests) insertContest.run(contest.id, JSON.stringify(contest));
  for (const problem of store.problems) insertProblem.run(problem.id, JSON.stringify(problem));
  for (const submission of store.submissions) insertSubmission.run(submission.id, JSON.stringify(submission));
});

const failedLoginAttempts = new Map<string, { count: number; resetAt: number }>();
let activeJudges = 0;
const judgeQueue: Array<() => void> = [];

async function withJudgeSlot<T>(run: () => Promise<T>): Promise<T> {
  if (activeJudges >= maxConcurrentJudges) {
    if (judgeQueue.length >= maxQueuedJudges) {
      throw Object.assign(new Error('The judging queue is full. Please try again shortly.'), { status: 503 });
    }
    await new Promise<void>(resolve => judgeQueue.push(resolve));
  }
  activeJudges++;
  try {
    return await run();
  } finally {
    activeJudges--;
    judgeQueue.shift()?.();
  }
}

function runJudgeContainer(request: {
  language: SubmissionRequest['language'];
  code: string;
  tests: TestCase[];
  sampleCount: number;
  timeLimitMs: number;
}): Promise<JudgeResult> {
  return withJudgeSlot(() => new Promise((resolve, reject) => {
    const containerName = `schoolforces-judge-${crypto.randomUUID()}`;
    const args = [
      'run', '--rm', '--interactive', '--name', containerName,
      '--network=none',
      '--memory=512m', '--memory-swap=512m', '--cpus=1',
      '--pids-limit=64',
      '--read-only',
      '--tmpfs', '/tmp:rw,nosuid,nodev,exec,size=64m',
      '--cap-drop=ALL',
      '--cap-add=KILL',
      '--cap-add=SETUID',
      '--cap-add=SETGID',
      '--security-opt=no-new-privileges',
      '--user=0:0',
      '--ulimit', 'nofile=64:64',
      '--pull=never',
      judgeImage,
      request.language,
    ];
    const child = spawn(judgeRuntime, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let outputTooLarge = false;
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      const cleanup = spawn(judgeRuntime, ['rm', '--force', containerName], { stdio: 'ignore' });
      cleanup.on('error', error => console.error('Unable to stop timed-out judge container:', error));
      reject(Object.assign(new Error('Judging timed out. Check that the judge image is installed and retry.'), { status: 503 }));
    }, 60_000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout += chunk;
      if (stdout.length > 1_000_000) {
        outputTooLarge = true;
        child.kill('SIGKILL');
      }
    });
    child.stderr.on('data', chunk => {
      if (stderr.length < 16_000) stderr += chunk.slice(0, 16_000 - stderr.length);
    });
    child.on('error', error => {
      clearTimeout(timeout);
      reject(Object.assign(
        new Error(`Cannot start the ${judgeRuntime} judge runtime. Install Docker or Podman and build the judge image.`),
        { status: 503, cause: error }
      ));
    });
    child.on('close', code => {
      clearTimeout(timeout);
      if (outputTooLarge) {
        reject(Object.assign(new Error('Judge returned an oversized response.'), { status: 503 }));
        return;
      }
      if (code !== 0) {
        reject(Object.assign(
          new Error(`Judge container failed. Run "npm run judge:build" and check ${judgeRuntime} is running. ${stderr.trim()}`),
          { status: 503 }
        ));
        return;
      }
      try {
        const result = JSON.parse(stdout) as JudgeResult & { runnerError?: string };
        if (result.runnerError) {
          reject(Object.assign(new Error(`Judge runner failed: ${result.runnerError}`), { status: 503 }));
          return;
        }
        resolve(result);
      } catch (error) {
        reject(Object.assign(
          new Error(`Judge returned an invalid response. ${stderr.trim()}`),
          { status: 503, cause: error }
        ));
      }
    });
    child.stdin.on('error', error => {
      if ((error as NodeJS.ErrnoException).code !== 'EPIPE') {
        console.error('Unable to send source code to judge container:', error);
      }
    });
    child.stdin.end(JSON.stringify(request));
  }));
}

function loginClientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function isLoginBlocked(req: Request): boolean {
  const key = loginClientKey(req);
  const record = failedLoginAttempts.get(key);
  if (!record) return false;
  if (record.resetAt <= Date.now()) {
    failedLoginAttempts.delete(key);
    return false;
  }
  return record.count >= loginAttemptLimit;
}

function recordFailedLogin(req: Request): void {
  const key = loginClientKey(req);
  const existing = failedLoginAttempts.get(key);
  if (!existing || existing.resetAt <= Date.now()) {
    failedLoginAttempts.set(key, { count: 1, resetAt: Date.now() + loginWindowMs });
    return;
  }
  existing.count++;
}

function clearFailedLogins(req: Request): void {
  failedLoginAttempts.delete(loginClientKey(req));
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function passwordMatches(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function saveStore(store: Store): void {
  persistStoreTransaction(store);
}

function initialStore(): Store {
  const initialTeacherPassword = process.env.TEACHER_PASSWORD;
  if (!initialTeacherPassword || initialTeacherPassword.length < 12) {
    throw new Error('Set TEACHER_PASSWORD to a password of at least 12 characters in your .env file.');
  }
  return {
    starterCodeVersion,
    teacherPasswordHash: hashPassword(initialTeacherPassword),
    users: [],
    contests: INITIAL_CONTESTS,
    problems: PROBLEMS,
    submissions: []
  };
}

function loadStore(): Store {
  const savedPassword = database.prepare(
    'SELECT value FROM metadata WHERE key = ?'
  ).get('teacherPasswordHash') as { value: string } | undefined;
  let store: Store;
  if (savedPassword) {
    const savedVersion = database.prepare(
      'SELECT value FROM metadata WHERE key = ?'
    ).get('starterCodeVersion') as { value: string } | undefined;
    store = {
      teacherPasswordHash: savedPassword.value,
      starterCodeVersion: Number(savedVersion?.value ?? 0),
      users: database.prepare('SELECT data_json FROM users ORDER BY rowid').all()
        .map(row => {
          const user = JSON.parse((row as { data_json: string }).data_json) as StoredUser;
          user.ratingChanges ??= [];
          return user;
        }),
      contests: database.prepare('SELECT data_json FROM contests ORDER BY rowid').all()
        .map(row => JSON.parse((row as { data_json: string }).data_json) as Contest),
      problems: database.prepare('SELECT data_json FROM problems ORDER BY rowid').all()
        .map(row => JSON.parse((row as { data_json: string }).data_json) as Problem),
      submissions: database.prepare('SELECT data_json FROM submissions ORDER BY rowid').all()
        .map(row => JSON.parse((row as { data_json: string }).data_json) as Submission)
    };
  } else if (fs.existsSync(legacyDataFile)) {
    store = JSON.parse(fs.readFileSync(legacyDataFile, 'utf8')) as Store;
  } else {
    store = initialStore();
  }
  if (store.starterCodeVersion !== starterCodeVersion) {
    store.problems = store.problems.map(problem => {
      const updatedProblem = PROBLEMS.find(item => item.id === problem.id);
      return updatedProblem ? { ...problem, starterCode: updatedProblem.starterCode } : problem;
    });
    store.starterCodeVersion = starterCodeVersion;
  }
  saveStore(store);
  return store;
}

let store: Store;
try {
  store = loadStore();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

function publicUser(user: StoredUser): User {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { ...safeUser, ratingChanges: safeUser.ratingChanges ?? [] };
}

function applyContestRatings(contest: Contest): void {
  const contestSubmissions = store.submissions.filter(submission => submission.contestId === contest.id);
  const submittedHandles = [...new Set(contestSubmissions.map(submission => submission.handle))];
  const participatingUsers = store.users.filter(user => submittedHandles.includes(user.handle));
  const ratedContest = { ...contest, allowedStudents: submittedHandles };
  const rows = calculateContestScoreboard(ratedContest, contestSubmissions, participatingUsers);
  const participants = rows.flatMap(row => {
    const user = store.users.find(item => item.handle === row.handle);
    return user ? [{ handle: user.handle, rank: row.rank, rating: user.rating }] : [];
  });
  const deltas = calculateRatingChanges(participants);
  const ratedAt = new Date().toISOString();

  for (const participant of participants) {
    const user = store.users.find(item => item.handle === participant.handle);
    if (!user) continue;

    const delta = deltas.get(user.handle) ?? 0;
    const oldRating = user.rating;
    user.rating = Math.max(0, oldRating + delta);
    user.maxRating = Math.max(user.maxRating, user.rating);
    user.ratingChanges ??= [];
    user.ratingChanges.push({
      contestId: contest.id,
      contestTitle: contest.title,
      ratedAt,
      rank: participant.rank,
      participants: participants.length,
      oldRating,
      newRating: user.rating,
      delta: user.rating - oldRating
    });
  }

  contest.ratingAppliedAt = Date.now();
}

function isContestActive(contest: Contest, now = Date.now()): boolean {
  return contest.status === 'running' &&
    (!contest.startedAt || contest.startedAt <= now) &&
    (!contest.endsAt || contest.endsAt > now);
}

function finalizeExpiredContests(): void {
  const now = Date.now();
  let changed = false;
  for (const contest of store.contests) {
    if (contest.status !== 'running' || !contest.endsAt || contest.endsAt > now) continue;
    contest.status = 'finished';
    if (!contest.ratingAppliedAt) applyContestRatings(contest);
    changed = true;
  }
  if (changed) saveStore(store);
}

function getActiveContestForProblem(problemId: string, now = Date.now()): Contest | undefined {
  return store.contests.find(contest =>
    isContestActive(contest, now) &&
    contest.problemIds.includes(problemId)
  );
}

function publicState(session?: Session | null) {
  finalizeExpiredContests();
  return {
    users: store.users.map(publicUser),
    contests: store.contests,
    problems: store.problems.map(problem =>
      session?.role === 'teacher' ? problem : { ...problem, hiddenTests: [] }
    ),
    submissions: store.submissions.map(submission => {
      const submissionContest = submission.contestId
        ? store.contests.find(item => item.id === submission.contestId)
        : undefined;
      const codeHiddenDuringContest = store.contests.some(contest =>
        isContestActive(contest) &&
        (contest.problemIds.includes(submission.problemId) ||
          submissionContest?.id === contest.id)
      );
      const mayViewCode = session?.role === 'teacher' ||
        (session?.role === 'student' && session.handle === submission.handle) ||
        !codeHiddenDuringContest;
      return mayViewCode ? submission : { ...submission, code: '' };
    })
  };
}

function getSession(req: Request): Session | null {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  const entry = findSession.get(token) as {
    role: 'teacher' | 'student';
    handle: string | null;
    expires_at: number;
  } | undefined;
  if (!entry || entry.expires_at <= Date.now()) {
    deleteSession.run(token);
    return null;
  }
  if (entry.role === 'student' && entry.handle) {
    return { role: 'student', handle: entry.handle };
  }
  if (entry.role === 'teacher') return { role: 'teacher' };
  deleteSession.run(token);
  return null;
}

function requireRole(role: Session['role']) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = getSession(req);
    if (!session || session.role !== role) {
      res.status(401).json({ error: 'Your session is invalid or has expired.' });
      return;
    }
    res.locals.session = session;
    next();
  };
}

function issueSession(session: Session): string {
  const token = crypto.randomBytes(32).toString('base64url');
  insertSession.run(
    token,
    session.role,
    session.role === 'student' ? session.handle : null,
    Date.now() + sessionLifetimeMs
  );
  return token;
}

function sendState(req: Request, res: Response): void {
  res.json(publicState(getSession(req)));
}

app.use(express.json({ limit: '1mb' }));

app.get('/api/state', sendState);

app.get('/api/session', (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'You are not signed in.' });
    return;
  }
  const user = session.role === 'student'
    ? store.users.find(item => item.handle === session.handle)
    : undefined;
  if (session.role === 'student' && !user) {
    res.status(401).json({ error: 'This student account no longer exists.' });
    return;
  }
  res.json({
    role: session.role,
    user: user ? publicUser(user) : null
  });
});

app.post('/api/auth/student', (req, res) => {
  if (isLoginBlocked(req)) {
    res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
    return;
  }
  const handle = typeof req.body?.handle === 'string' ? req.body.handle.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = store.users.find(item => item.handle.toLowerCase() === handle.toLowerCase());
  if (!user || !passwordMatches(password, user.passwordHash)) {
    recordFailedLogin(req);
    res.status(401).json({ error: 'Incorrect username or password.' });
    return;
  }
  clearFailedLogins(req);
  const token = issueSession({ role: 'student', handle: user.handle });
  res.json({ token, user: publicUser(user) });
});

app.post('/api/auth/teacher', (req, res) => {
  if (isLoginBlocked(req)) {
    res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
    return;
  }
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!passwordMatches(password, store.teacherPasswordHash)) {
    recordFailedLogin(req);
    res.status(401).json({ error: 'Incorrect teacher password.' });
    return;
  }
  clearFailedLogins(req);
  res.json({ token: issueSession({ role: 'teacher' }) });
});

app.post('/api/auth/logout', (req, res) => {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (token) deleteSession.run(token);
  res.status(204).end();
});

app.post('/api/teacher/students', requireRole('teacher'), (req, res) => {
  const { password, ...userData } = req.body ?? {};
  const handle = typeof userData.handle === 'string' ? userData.handle.trim() : '';
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(handle)) {
    res.status(400).json({ error: 'Usernames must be 3–32 characters and contain only letters, numbers, underscores, or hyphens.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Student passwords must be at least 8 characters long.' });
    return;
  }
  if (store.users.some(user => user.handle.toLowerCase() === handle.toLowerCase())) {
    res.status(409).json({ error: 'A student with this username already exists.' });
    return;
  }
  const user: StoredUser = {
    ...userData,
    handle,
    ratingChanges: userData.ratingChanges ?? [],
    passwordHash: hashPassword(password)
  };
  store.users.unshift(user);
  saveStore(store);
  res.status(201).json(publicState(res.locals.session));
});

app.delete('/api/teacher/students/:handle', requireRole('teacher'), (req, res) => {
  store.users = store.users.filter(user => user.handle !== req.params.handle);
  store.submissions = store.submissions.filter(submission => submission.handle !== req.params.handle);
  deleteStudentSessions.run('student', req.params.handle);
  saveStore(store);
  res.json(publicState(res.locals.session));
});

app.put('/api/teacher/contests/:id', requireRole('teacher'), (req, res) => {
  const contest = req.body as Contest;
  if (!contest || contest.id !== req.params.id || typeof contest.title !== 'string') {
    res.status(400).json({ error: 'Invalid contest data.' });
    return;
  }
  const index = store.contests.findIndex(item => item.id === contest.id);
  if (index >= 0) store.contests[index] = contest;
  else store.contests.unshift(contest);
  saveStore(store);
  res.json(publicState(res.locals.session));
});

app.delete('/api/teacher/contests/:id', requireRole('teacher'), (req, res) => {
  store.contests = store.contests.filter(contest => contest.id !== req.params.id);
  store.submissions = store.submissions.filter(submission => submission.contestId !== req.params.id);
  saveStore(store);
  res.json(publicState(res.locals.session));
});

app.post('/api/teacher/contests/:id/status', requireRole('teacher'), (req, res) => {
  const contest = store.contests.find(item => item.id === req.params.id);
  if (!contest || !['running', 'finished'].includes(req.body?.status)) {
    res.status(400).json({ error: 'Invalid contest status update.' });
    return;
  }
  if (req.body.status === 'running') {
    contest.status = 'running';
    contest.startedAt = Date.now();
    contest.endsAt = contest.startedAt + contest.durationMinutes * 60_000;
  } else {
    const shouldApplyRating = contest.status === 'running' && !contest.ratingAppliedAt;
    contest.status = 'finished';
    if (shouldApplyRating) applyContestRatings(contest);
  }
  saveStore(store);
  res.json(publicState(res.locals.session));
});

app.put('/api/teacher/problems/:id', requireRole('teacher'), (req, res) => {
  const problem = req.body as Problem;
  if (!problem || problem.id !== req.params.id || typeof problem.title !== 'string') {
    res.status(400).json({ error: 'Invalid problem data.' });
    return;
  }
  const index = store.problems.findIndex(item => item.id === problem.id);
  if (index >= 0) store.problems[index] = problem;
  else store.problems.push(problem);
  saveStore(store);
  res.json(publicState(res.locals.session));
});

app.delete('/api/teacher/problems/:id', requireRole('teacher'), (req, res) => {
  store.problems = store.problems.filter(problem => problem.id !== req.params.id);
  store.contests.forEach(contest => {
    contest.problemIds = contest.problemIds.filter(id => id !== req.params.id);
  });
  saveStore(store);
  res.json(publicState(res.locals.session));
});

app.post('/api/teacher/password', requireRole('teacher'), (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  if (!passwordMatches(currentPassword, store.teacherPasswordHash)) {
    res.status(401).json({ error: 'The current teacher password is incorrect.' });
    return;
  }
  if (newPassword.length < 12) {
    res.status(400).json({ error: 'Teacher passwords must be at least 12 characters long.' });
    return;
  }
  store.teacherPasswordHash = hashPassword(newPassword);
  saveStore(store);
  res.json({ message: 'Teacher password updated.' });
});

app.post('/api/teacher/reset', requireRole('teacher'), (_req, res) => {
  store = {
    starterCodeVersion,
    teacherPasswordHash: store.teacherPasswordHash,
    users: [],
    contests: INITIAL_CONTESTS,
    problems: PROBLEMS,
    submissions: []
  };
  saveStore(store);
  res.json(publicState(res.locals.session));
});

app.post('/api/submissions', requireRole('student'), async (req, res) => {
  const session = res.locals.session as Extract<Session, { role: 'student' }>;
  const user = store.users.find(item => item.handle === session.handle);
  const problem = store.problems.find(item => item.id === req.body?.problemId);
  if (!user || !problem) {
    res.status(404).json({ error: 'Student or problem not found.' });
    return;
  }
  const contestId = typeof req.body?.contestId === 'string' ? req.body.contestId : undefined;
  const requestedContest = contestId ? store.contests.find(item => item.id === contestId) : undefined;
  if (contestId && (!requestedContest ||
      !isContestActive(requestedContest) ||
      !requestedContest.problemIds.includes(problem.id) ||
      (!requestedContest.allowedStudents.includes('*') && !requestedContest.allowedStudents.includes(user.handle)))) {
    res.status(403).json({ error: 'You are not allowed to submit to this contest.' });
    return;
  }
  const activeContest = requestedContest || store.contests.find(item =>
    isContestActive(item) &&
    item.problemIds.includes(problem.id) &&
    (item.allowedStudents.includes('*') || item.allowedStudents.includes(user.handle))
  );
  const language = req.body?.language;
  const submittedCode = typeof req.body?.code === 'string' ? req.body.code : '';
  if (language !== 'cpp' && language !== 'python' && language !== 'javascript') {
    res.status(400).json({ error: 'Unsupported programming language.' });
    return;
  }
  if (!submittedCode.trim()) {
    res.status(400).json({ error: 'Source code cannot be empty.' });
    return;
  }
  if (submittedCode.length > 100_000) {
    res.status(413).json({ error: 'Submission code exceeds the 100 KB limit.' });
    return;
  }
  const tests = [...problem.sampleTests, ...problem.hiddenTests];
  if (tests.length === 0 || tests.length > 200) {
    res.status(400).json({ error: 'This problem has an invalid number of test cases.' });
    return;
  }

  const limitSeconds = Number(problem.timeLimit.match(/\d+(?:\.\d+)?/)?.[0] || 1);
  const startedAt = performance.now();
  let result: JudgeResult;
  try {
    result = await runJudgeContainer({
      language,
      code: submittedCode,
      tests,
      sampleCount: problem.sampleTests.length,
      timeLimitMs: Math.max(100, Math.min(5000, Math.round(limitSeconds * 1000)))
    });
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number(error.status)
      : 503;
    res.status(status).json({
      error: error instanceof Error ? error.message : 'The judging service is unavailable.'
    });
    return;
  }

  const isFirstSolve = result.verdict === 'Accepted' && !user.solvedProblems.includes(problem.id);
  const timeMs = result.timeMs || Math.max(1, Math.round(performance.now() - startedAt));
  user.submissionsCount++;
  if (isFirstSolve) {
    user.solvedProblems.push(problem.id);
  }
  let submissionId = Date.now();
  while (store.submissions.some(item => item.id === submissionId)) submissionId++;
  const submission: Submission = {
    id: submissionId,
    handle: user.handle,
    problemId: problem.id,
    problemTitle: problem.title,
    language,
    code: submittedCode,
    submittedAt: new Date().toISOString(),
    verdict: result.verdict,
    testFailed: result.testFailed,
    totalTests: result.totalTests,
    passedTests: result.passedTests,
    timeMs,
    memoryKb: result.memoryKb,
    errorMessage: result.errorMessage,
    sampleFailedDetails: result.sampleFailedDetails,
    ...(activeContest ? {
      contestId: activeContest.id,
      contestMinute: Math.max(1, Math.round((Date.now() - (activeContest.startedAt || Date.now())) / 60_000))
    } : { contestId: undefined, contestMinute: undefined })
  };
  store.submissions.unshift(submission);
  saveStore(store);
  res.status(201).json({
    ...publicState(session),
    currentUser: publicUser(user),
    isFirstSolve,
    submission
  });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

app.use(express.static(path.resolve('dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.resolve('dist/index.html'));
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.listen(port, host, () => {
  console.log(`SchoolForces is available on http://localhost:${port}`);
  console.log(`For LAN access, use this computer's local IP address on port ${port}.`);
  console.log(`Shared application data is stored in SQLite database ${dataFile}`);
});
