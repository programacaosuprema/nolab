export function mergeChallengesWithUser(data, userChallenges) {
  const byChallengeId = new Map();

  for (const uc of userChallenges) {
    const key =
      (uc.challengeId && (uc.challengeId._id || uc.challengeId)) ||
      uc.challengePublicId ||
      uc.challenge;

    if (key) byChallengeId.set(String(key), uc);
  }

  return data.map((c) => {
    const keys = [
      c._id && String(c._id),
      c.publicId && String(c.publicId)
    ].filter(Boolean);

    let uc = null;

    for (const k of keys) {
      if (byChallengeId.has(k)) {
        uc = byChallengeId.get(k);
        break;
      }
    }

    return {
      ...c,
      userStatus: uc?.status || c.userStatus || "pending",
      userAttempts: uc?.attempts ?? c.userAttempts ?? 0
    };
  });
}