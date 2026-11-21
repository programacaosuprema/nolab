import {
  createChallengeService,
  getAllChallengesService,
  getChallengeByIdService,
} from "../services/challenge.service.js";
import { getUserProgress } from "../services/userChallenge.service.js";

const getUserId = (req) => req.userId || req.user?.id || req.user?._id || null;

// LISTAR DESAFIOS
export const getAll = async (req, res) => {
  try {
    const userId = getUserId(req);

    const challenges = await getAllChallengesService(userId, {
      structure: req.query.structure,
      difficulty: req.query.difficulty,
    });

    return res.json(challenges);
  } catch (err) {
    console.error("getAll error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// CONSULTAR DESAFIO
export const getChallenge = async (req, res) => {
  try {
    const challenge = await getChallengeByIdService(req.params.id);

    if (!challenge) {
      return res.status(404).json({
        error: "Challenge not found",
      });
    }

    const out = challenge.toObject();
    const userId = getUserId(req);

    const progress = userId
      ? await getUserProgress(userId, challenge._id)
      : null;

    return res.json({
      ...out,
      userStatus: progress?.status ?? "pending",
      userAttempts: progress?.attempts ?? 0,
      userStartedAt: progress?.startedAt ?? null,
      userCompletedAt: progress?.completedAt ?? null,
    });
  } catch (err) {
    console.error("getChallenge error:", err);
    return res.status(500).json({ error: err.message });
  }
};


// CRIAR DESAFIO
export const create = async (req, res) => {
  try {
    const challenge = await createChallengeService(req.body);

    return res.status(201).json(challenge);
  } catch (err) {
    console.error("create error:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
};
