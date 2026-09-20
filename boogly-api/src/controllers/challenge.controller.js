// src/controllers/challenge.controller.js
import mongoose from "mongoose";
import { Challenge } from "../models/challenge.model.js";
import { UserChallenge } from "../models/userChallenge.model.js";
import { createChallengeService, incrementAttemptsService, submitChallengeService} from "../services/challenge.service.js";


async function findChallengeByIdOrPublicId(id) {
  if (!id) return null;
  let challenge = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    challenge = await Challenge.findById(id);
  }
  if (!challenge) {
    challenge = await Challenge.findOne({ publicId: id });
  }
  return challenge;
}

export const getAll = async (req, res) => {
  try {
    const { structure, difficulty } = req.query;
    const filter = {};
    if (structure) filter.structure = structure;
    if (difficulty) filter.difficulty = difficulty;

    const challenges = await Challenge.find(filter).lean();

    const userId = req.userId || null;
    if (userId) {
      const ucs = await UserChallenge.find({ userId }).lean();
      const byChallenge = new Map(ucs.map((u) => [String(u.challengeId), u]));

      const merged = challenges.map((c) => {
        const uc = byChallenge.get(String(c._id));
        return {
          ...c,
          userStatus: uc?.status || "pending",
          userAttempts: uc?.attempts ?? 0,
        };
      });

      return res.json(merged);
    }

    const fallback = challenges.map((c) => ({ ...c, userStatus: "pending" }));
    return res.json(fallback);
  } catch (err) {
    console.error("getAll error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await findChallengeByIdOrPublicId(id);
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });

    const out = challenge.toObject ? challenge.toObject() : challenge;

    const userId = req.userId || null;
    if (userId) {
      const uc = await UserChallenge.findOne({
        userId,
        challengeId: challenge._id,
      }).lean();
      out.userStatus = uc?.status || "pending";
      out.userAttempts = uc?.attempts ?? 0;
    }

    return res.json(out);
  } catch (err) {
    console.error("getChallenge error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export async function recordAttempt(req, res) {
  try {
    const challengeId = req.params.id;
    const userId = req.userId || null;

    // visitante: incrementa apenas global
    if (!userId) {
      // tenta tratar id como publicId também
      const filter = mongoose.Types.ObjectId.isValid(challengeId)
        ? { _id: challengeId }
        : { publicId: challengeId };
      await Challenge.findOneAndUpdate(filter, { $inc: { attempts: 1 } });
      return res.json({ userAttempt: null });
    }

    // usuário autenticado
    // usar challenge _id internamente: resolve possível publicId -> _id
    let challenge = null;
    if (mongoose.Types.ObjectId.isValid(challengeId)) {
      challenge = await Challenge.findById(challengeId);
    }
    if (!challenge) {
      challenge = await Challenge.findOne({ publicId: challengeId });
    }
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const userChallenge = await UserChallenge.findOneAndUpdate(
      { userId, challengeId: challenge._id },
      {
        $setOnInsert: { status: "attempted", attempts: 0 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // incrementa tentativa local e marca attempted se não estiver completed
    userChallenge.attempts += 1;
    if (userChallenge.status !== "completed")
      userChallenge.status = "attempted";
    await userChallenge.save();

    // incrementa attempts global
    await Challenge.updateOne(
      { _id: challenge._id },
      { $inc: { attempts: 1 } },
    );

    return res.json({
      userAttempt: {
        status: userChallenge.status,
        attempts: userChallenge.attempts,
      },
    });
  } catch (err) {
    console.error("recordAttempt error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Erro ao registrar tentativa" });
  }
}

export const incrementAttempts = async (req, res) => {
  try {
    const updated = incrementAttemptsService(req);
    if (!updated) return res.status(404).json({ error: "Challenge not found" });
    return res.json({ success: true, attempts: updated.attempts });
  } catch (err) {
    console.error("incrementAttempts error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const submitChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const commandsRaw = req.body?.commands || [];
    const userId = req.userId || null;

    const result = await submitChallengeService({
      id,
      commandsRaw,
      userId,
    });

    return res.json(result);
  } catch (err) {
    console.error("submitChallenge error:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

export const create = async (req, res) => {
  try {
    const data = req.body;
    const challenge = await createChallengeService(data);
    res.status(201).json(challenge);
  } catch (err) {
    console.error("create error:", err);
    res.status(500).json({ error: err.message });
  }
};
