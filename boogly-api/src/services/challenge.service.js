import { Challenge } from "../models/challenge.model.js";
import { UserChallenge } from "../models/userChallenge.model.js";
import mongoose from "mongoose";
import { ExecutionEngine } from "../utils/executionEngine.js";
import translate from "../utils/translate.js";
import validateExecutionRules from "../utils/executionRules.js";
import { nanoid } from "nanoid";
import { recordChallengeResult } from "./userChallenge.service.js";

//  CRIAR
export const createChallengeService = async (data) => {
  return await Challenge.create({ ...data, publicId: nanoid(10) });
};

export const getAllChallengesService = async (userId, filters = {}) => {
  const query = {};

  if (filters.structure) {
    query.structure = filters.structure;
  }

  if (filters.difficulty) {
    query.difficulty = filters.difficulty;
  }

  const challenges = await Challenge.find(query).lean();

  const userProgress = userId
    ? await UserChallenge.find({ userId }).lean()
    : [];

  const progressMap = new Map(
    userProgress.map((p) => [String(p.challengeId), p]),
  );

  const result = await Promise.all(
    challenges.map(async (challenge) => {
      const progress = progressMap.get(String(challenge._id));

      const solvedCount = await UserChallenge.countDocuments({
        challengeId: challenge._id,
        status: "completed",
      });

      return {
        ...challenge,

        // Progresso individual
        userStatus: progress?.status ?? "pending",
        userAttempts: progress?.attempts ?? 0,
        userStartedAt: progress?.startedAt ?? null,
        userCompletedAt: progress?.completedAt ?? null,

        // Estatísticas globais
        solvedCount,
      };
    }),
  );

  return result;
};

export const getChallengeByIdService = async (id) => {
  if (!id) return null;

  let challenge = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    challenge = await Challenge.findById(id);
  }

  if (!challenge) {
    challenge = await Challenge.findOne({
      publicId: id,
    });
  }

  return challenge;
};

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
