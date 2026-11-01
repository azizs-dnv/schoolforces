import { Contest, Problem, Submission, User } from './types';

export const AUTH_TOKEN_KEY = 'schoolforces_auth_token';

export interface SharedState {
  users: User[];
  contests: Contest[];
  problems: Problem[];
  submissions: Submission[];
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (authenticated) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error || `Request failed (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function updateSharedState(
  state: SharedState,
  setters: {
    setUsers: (users: User[]) => void;
    setContests: (contests: Contest[]) => void;
    setProblems: (problems: Problem[]) => void;
    setSubmissions: (submissions: Submission[]) => void;
  }
): void {
  setters.setUsers(state.users);
  setters.setContests(state.contests);
  setters.setProblems(state.problems);
  setters.setSubmissions(state.submissions);
}
