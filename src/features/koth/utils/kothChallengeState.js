function normalizeIdentifier(identifier) {
  return identifier == null ? "" : String(identifier);
}

export function isKothChallengeSolved(challenge) {
  return challenge?.solved_at != null;
}

// 실제 구조는 6개 클럽(동아리) x 클럽당 문제 1개, 총 6문제다(클럽 자체가
// 곧 문제 1개 - club.koth_challenge_id/title/status 등이 club 객체에 바로
// 있다). "3동아리 x 2문제"로 clubs[].challenges[]에 중첩된다는 이전 가정은
// README Appendix B 오해에서 온 것이라 여기서 걷어냈다(2026-09-06 확인).
export function flattenKothChallenges(clubs = []) {
  return clubs
    .filter((club) => club?.koth_challenge_id != null)
    .map((club) => ({
      koth_challenge_id: club.koth_challenge_id,
      club_id: club.club_id,
      club_name: club.name,
      title: club.title,
      category: club.category,
      status: club.status,
      open_group: club.open_group,
      current_owner_team_id: club.current_owner_team_id,
      current_owner_team_name: club.current_owner_team_name,
      current_score: club.current_score,
      opened_at: club.opened_at,
      closed_at: club.closed_at,
    }));
}

export function createKothChallengeViewModels(visuals, clubs = [], teamChallenges = []) {
  const visualsByOpenGroup = new Map(
    visuals.map((visual) => [visual.openGroup, visual]),
  );
  const progressByChallengeId = new Map(
    teamChallenges.map((challenge) => [
      normalizeIdentifier(challenge.koth_challenge_id),
      challenge,
    ]),
  );

  return flattenKothChallenges(clubs).flatMap((challenge) => {
    const visual = visualsByOpenGroup.get(challenge.open_group);
    if (!visual) return [];

    const progress = progressByChallengeId.get(
      normalizeIdentifier(challenge.koth_challenge_id),
    );

    return [{
      ...visual,
      clubId: challenge.club_id,
      clubName: challenge.club_name,
      kothChallengeId: challenge.koth_challenge_id,
      title: challenge.title,
      status: challenge.status,
      openGroup: challenge.open_group,
      currentOwnerTeamName: challenge.current_owner_team_name,
      currentScore: challenge.current_score,
      openedAt: challenge.opened_at,
      closedAt: challenge.closed_at,
      earnedScore: progress?.earned_score ?? null,
      rank: progress?.rank ?? null,
      solvedAt: progress?.solved_at ?? null,
      solved: isKothChallengeSolved(progress),
    }];
  });
}

export function getUnmappedKothChallenges(visuals, clubs = []) {
  const visualOpenGroups = new Set(visuals.map((visual) => visual.openGroup));
  return flattenKothChallenges(clubs).filter(
    (challenge) => !visualOpenGroups.has(challenge.open_group),
  );
}
