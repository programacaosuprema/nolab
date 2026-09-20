import { Challenge } from "../models/challenge.model.js";
import { UserChallenge } from "../models/userChallenge.model.js";
import mongoose from "mongoose";
import { ExecutionEngine } from "../utils/executionEngine.js";
import  translate  from "../utils/translate.js"
import validateExecutionRules from "../utils/executionRules.js"
import { nanoid } from 'nanoid';

//  CRIAR
export const createChallengeService = async (data) => {
  return await Challenge.create({ ...data, publicId: nanoid(10) });
};

//  LISTAR COM STATUS + RESOLUÇÕES
export const getAllChallengesService = async (userId) => {
  const challenges = await Challenge.find();

  //  progresso do usuário
  let userProgress = [];

  if (userId) {
    userProgress = await UserChallenge.find({ userId });
  }

  const progressMap = {};

  userProgress.forEach((p) => {
    progressMap[p.challengeId.toString()] = p;
  });

  const result = await Promise.all(
    challenges.map(async (c) => {
      const progress = progressMap[c._id.toString()] || {};

      //  total de usuários que completaram
      const solvedCount = await UserChallenge.countDocuments({
        challengeId: c._id,
        status: "completed",
      });

      return {
        ...c.toObject(),

        userStatus: progress.status || "pending",
        attempts: progress.attempts || 0,

        solvedCount,
      };
    }),
  );

  return result;
};

export const getChallengeByIdService = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return await Challenge.findById(id);
  }

  return await Challenge.findOne({ publicId: id });
};

export const incrementAttemptsService = async (req) => {
  const { id } = req.params;
  const filter = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { publicId: id };
  const updated = await Challenge.findOneAndUpdate(
    filter,
    { $inc: { attempts: 1 } },
    { new: true },
  );
  return updated;
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

//  SERVICE PRINCIPAL
export const submitChallengeService = async ({ id, commandsRaw, userId }) => {
  const challenge = await findChallengeByIdOrPublicId(id);
  if (!challenge) {
    throw new Error("Desafio não encontrado");
  }

  const engine = new ExecutionEngine();

  const normalized = engine.normalize(commandsRaw);

  //  valida requiredBlocks
  if (Array.isArray(challenge.requiredBlocks)) {
    for (const rule of challenge.requiredBlocks) {
      const count = normalized.filter((c) => c.type === rule.type).length;

      if (count < (rule.min || 1)) {
        return {
          success: false,
          message: `Use o bloco obrigatório: ${translate(rule.type)}`,
          output: [],
          steps: [],
        };
      }
    }
  }

  const usedTypes = new Set(normalized.map(c => c.type));

  if (Array.isArray(challenge.forbiddenBlocks) && challenge.forbiddenBlocks.length > 0) {
    for (const forbidden of challenge.forbiddenBlocks) {
      if (usedTypes.has(forbidden)) {
        return {
          success: false,
          message: `Você não pode usar o bloco: ${translate(forbidden)}`,
          output: [],
          steps: [],
        };
      }
    }
  }

  const execError = validateExecutionRules(normalized, challenge.executionRules);

  if (execError) {
    return {
      success: false,
      message: execError,
      output: [],
      steps: [],
    };
  }

  const testCases = challenge.testCases || [];
  if (!testCases.length) {
    throw new Error("Desafio sem casos de testes");
  }

  const aggregated = {
    success: true,
    message: "Correto 🎉",
    output: null,
    expected: null,
    steps: null,
  };

  const userInsertedVals = normalized
    .filter((c) => /insert|enqueue|push/i.test(c.type))
    .map((c) => c.value);

  for (const testCase of testCases) {
    const startState =
      userInsertedVals.length > 0
        ? []
        : Array.isArray(testCase.input)
          ? [...testCase.input]
          : [];

    engine.reset(startState);

    const steps = engine.run(normalized);
    const finalState = steps.at(-1)?.state || [];

    const passed = JSON.stringify(finalState) === JSON.stringify(testCase.expectedOutput);

    if (!passed) {
      aggregated = {
        success: false,
        message: "Incorreto ❌",
        expected: testCase.expectedOutput,
        output: finalState,
        steps,
      };
      break;
    }

    aggregated.steps = steps;
    aggregated.output = finalState;
  }

  // 🔥 incrementa tentativas
  await Challenge.updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } });

  let userChallengeDoc = null;

  if (userId) {
    if (aggregated.success) {
      userChallengeDoc = await UserChallenge.findOneAndUpdate(
        { userId, challengeId: challenge._id },
        {
          $set: { status: "completed", completedAt: new Date() },
          $inc: { attempts: 1 },
        },
        { new: true, upsert: true },
      );

      const alreadyCompleted = await UserChallenge.exists({
        userId,
        challengeId: challenge._id,
        status: "completed",
      });

      if (!alreadyCompleted) {
        await Challenge.updateOne(
          { _id: challenge._id },
          { $inc: { solvedCount: 1 } },
        );
      }
    } else {
      userChallengeDoc = await UserChallenge.findOneAndUpdate(
        { userId, challengeId: challenge._id },
        {
          $set: { status: "attempted" },
          $inc: { attempts: 1 },
        },
        { new: true, upsert: true },
      );
    }
  }

  return {
    ...aggregated,
    userAttempt: userChallengeDoc
      ? {
          attempts: userChallengeDoc.attempts,
          status: userChallengeDoc.status,
        }
      : null,
  };
};
