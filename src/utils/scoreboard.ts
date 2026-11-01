import { Contest, Submission, User, ContestScoreboardRow, ContestTaskResult } from '../types';

export function calculateContestScoreboard(
  contest: Contest,
  submissions: Submission[],
  users: User[]
): ContestScoreboardRow[] {
  // Filter submissions for this contest
  const contestSubs = submissions.filter(s => s.contestId === contest.id);

  // Determine eligible participants:
  // Either explicitly allowed students, or anyone who submitted to this contest
  const participantsSet = new Set<string>();
  
  if (contest.allowedStudents.includes('*')) {
    users.forEach(u => participantsSet.add(u.handle));
  } else {
    contest.allowedStudents.forEach(h => participantsSet.add(h));
  }
  contestSubs.forEach(s => participantsSet.add(s.handle));

  const rows: ContestScoreboardRow[] = [];

  for (const handle of participantsSet) {
    const userSubs = contestSubs.filter(s => s.handle === handle);
    const tasks: Record<string, ContestTaskResult> = {};
    let solvedCount = 0;
    let totalPenalty = 0;

    for (const probId of contest.problemIds) {
      // Sort submissions by time ascending
      const probSubs = userSubs
        .filter(s => s.problemId === probId)
        .sort((a, b) => a.id - b.id);

      let isSolved = false;
      let failedAttempts = 0;
      let solvedAtMinutes = 0;
      let taskPenalty = 0;

      for (const sub of probSubs) {
        const subMin = sub.contestMinute !== undefined
          ? sub.contestMinute
          : contest.startedAt
          ? Math.max(1, Math.round((new Date(sub.submittedAt).getTime() || Date.now() - contest.startedAt) / 60000))
          : 1;

        if (sub.verdict === 'Accepted') {
          isSolved = true;
          solvedAtMinutes = subMin;
          taskPenalty = solvedAtMinutes + failedAttempts * 20; // ICPC 20 min penalty
          break;
        } else {
          failedAttempts++;
        }
      }

      tasks[probId] = {
        problemId: probId,
        isSolved,
        attempts: failedAttempts,
        solvedAtMinutes: isSolved ? solvedAtMinutes : undefined,
        penalty: taskPenalty
      };

      if (isSolved) {
        solvedCount++;
        totalPenalty += taskPenalty;
      }
    }

    rows.push({
      rank: 0,
      handle,
      solvedCount,
      totalPenalty,
      tasks
    });
  }

  // Sort rows: solvedCount DESC, totalPenalty ASC
  rows.sort((a, b) => {
    if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
    return a.totalPenalty - b.totalPenalty;
  });

  // Assign ranks
  let currentRank = 1;
  for (let i = 0; i < rows.length; i++) {
    if (i > 0) {
      const prev = rows[i - 1];
      const curr = rows[i];
      if (curr.solvedCount === prev.solvedCount && curr.totalPenalty === prev.totalPenalty) {
        curr.rank = prev.rank;
      } else {
        curr.rank = i + 1;
      }
    } else {
      rows[i].rank = 1;
    }
  }

  return rows;
}
