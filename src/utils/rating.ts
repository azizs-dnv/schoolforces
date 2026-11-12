export interface RatedParticipant {
  handle: string;
  rank: number;
  rating: number;
}

export function calculateRatingChanges(
  participants: RatedParticipant[],
  kFactor = 48
): Map<string, number> {
  const changes = new Map<string, number>();

  for (const player of participants) {
    let expectedScore = 0;
    let actualScore = 0;

    for (const opponent of participants) {
      if (opponent.handle === player.handle) continue;

      expectedScore += 1 / (1 + 10 ** ((opponent.rating - player.rating) / 400));
      actualScore += player.rank < opponent.rank ? 1 : player.rank === opponent.rank ? 0.5 : 0;
    }

    const opponents = participants.length - 1;
    const delta = opponents > 0
      ? Math.round(kFactor * (actualScore - expectedScore) / opponents)
      : 0;
    changes.set(player.handle, delta);
  }

  return changes;
}
