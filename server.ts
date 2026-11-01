import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { INITIAL_CONTESTS } from './src/data/mockData';
import { PROBLEMS } from './src/data/problems';
import { Contest, Problem, Submission, User } from './src/types';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const dataDirectory = path.resolve(process.env.DATA_DIR || '.data');
const dataFile = path.join(dataDirectory, 'schoolforces.json');
const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const loginWindowMs = 15 * 60 * 1000;
const loginAttemptLimit = 10;

type StoredUser = User & { passwordHash: string };
type Session = { role: 'teacher' } | { role: 'student'; handle: string };
type Store = {
  teacherPasswordHash: string;
  users: StoredUser[];
  contests: Contest[];
  problems: Problem[];
  submissions: Submission[];
};

const sessions = new Map<string, { session: Session; expiresAt: number }>();
const failedLoginAttempts = new Map<string, { count: number; resetAt: number }>();

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
  fs.mkdirSync(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(store, null, 2), { mode: 0o600 });
  fs.renameSync(temporaryFile, dataFile);
}

function initialStore(): Store {
  const initialTeacherPassword = process.env.TEACHER_PASSWORD;
  if (!initialTeacherPassword || initialTeacherPassword.length < 12) {
    throw new Error('Set TEACHER_PASSWORD to a password of at least 12 characters in your .env file.');
  }
  return {
    teacherPasswordHash: hashPassword(initialTeacherPassword),
    users: [],
    contests: INITIAL_CONTESTS,
    problems: PROBLEMS,
    submissions: []
  };
}

function loadStore(): Store {
  if (!fs.existsSync(dataFile)) {
    const store = initialStore();
    saveStore(store);
    return store;
  }
  return JSON.parse(fs.readFileSync(dataFile, 'utf8')) as Store;
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
  return safeUser;
}

function publicState(session?: Session | null) {
  return {
    users: store.users.map(publicUser),
    contests: store.contests,
    problems: store.problems,
    submissions: store.submissions.map(submission => {
      const contest = submission.contestId
        ? store.contests.find(item => item.id === submission.contestId)
        : undefined;
      const mayViewCode = session?.role === 'teacher' ||
        (session?.role === 'student' && session.handle === submission.handle) ||
        !contest?.hideCodeDuringContest ||
        contest?.status !== 'running';
      return mayViewCode ? submission : { ...submission, code: '' };
    })
  };
}

function getSession(req: Request): Session | null {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  const entry = sessions.get(token);
  if (!entry || entry.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return entry.session;
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
  sessions.set(token, { session, expiresAt: Date.now() + sessionLifetimeMs });
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
  if (token) sessions.delete(token);
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
    passwordHash: hashPassword(password)
  };
  store.users.unshift(user);
  saveStore(store);
  res.status(201).json(publicState(res.locals.session));
});

app.delete('/api/teacher/students/:handle', requireRole('teacher'), (req, res) => {
  store.users = store.users.filter(user => user.handle !== req.params.handle);
  store.submissions = store.submissions.filter(submission => submission.handle !== req.params.handle);
  for (const [token, entry] of sessions) {
    if (entry.session.role === 'student' && entry.session.handle === req.params.handle) {
      sessions.delete(token);
    }
  }
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
    contest.status = 'finished';
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
    teacherPasswordHash: store.teacherPasswordHash,
    users: [],
    contests: INITIAL_CONTESTS,
    problems: PROBLEMS,
    submissions: []
  };
  saveStore(store);
  res.json(publicState(res.locals.session));
});

app.post('/api/submissions', requireRole('student'), (req, res) => {
  const session = res.locals.session as Extract<Session, { role: 'student' }>;
  const user = store.users.find(item => item.handle === session.handle);
  const problem = store.problems.find(item => item.id === req.body?.problemId);
  if (!user || !problem) {
    res.status(404).json({ error: 'Student or problem not found.' });
    return;
  }
  const contestId = typeof req.body?.contestId === 'string' ? req.body.contestId : undefined;
  const contest = contestId ? store.contests.find(item => item.id === contestId) : undefined;
  if (contestId && (!contest || contest.status !== 'running' ||
      !contest.problemIds.includes(problem.id) ||
      (!contest.allowedStudents.includes('*') && !contest.allowedStudents.includes(user.handle)))) {
    res.status(403).json({ error: 'You are not allowed to submit to this contest.' });
    return;
  }
  const submittedCode = typeof req.body?.code === 'string' ? req.body.code : '';
  if (submittedCode.length > 100_000) {
    res.status(413).json({ error: 'Submission code exceeds the 100 KB limit.' });
    return;
  }
  const isAccepted = req.body?.verdict === 'Accepted';
  const isFirstSolve = isAccepted && !user.solvedProblems.includes(problem.id);
  user.submissionsCount++;
  if (isFirstSolve) {
    user.solvedProblems.push(problem.id);
    user.rating += 50;
    user.maxRating = Math.max(user.maxRating, user.rating);
  }
  let submissionId = Date.now();
  while (store.submissions.some(item => item.id === submissionId)) submissionId++;
  const submission: Submission = {
    ...req.body,
    id: submissionId,
    handle: user.handle,
    problemTitle: problem.title,
    code: submittedCode,
    submittedAt: new Date().toISOString(),
    ...(contest ? {
      contestId: contest.id,
      contestMinute: Math.max(1, Math.round((Date.now() - (contest.startedAt || Date.now())) / 60_000))
    } : { contestId: undefined, contestMinute: undefined })
  };
  store.submissions.unshift(submission);
  saveStore(store);
  res.status(201).json({
    ...publicState(session),
    currentUser: publicUser(user),
    isFirstSolve
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
  console.log(`Shared application data is stored in ${dataFile}`);
});
