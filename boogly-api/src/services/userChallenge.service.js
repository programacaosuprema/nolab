
import { UserChallenge } from "../models/userChallenge.model.js";
import { Challenge } from "../models/challenge.model.js";


export const registerAbandonment = async (userId, challengeId) => {
  return registerAttempt(userId, challengeId);
};

export const recordChallengeResult = async (
  userId,
  challengeId,
  success
) => {
  const attempt = await registerAttempt(userId, challengeId);

  if (success) {
    return await markAsCompleted(userId, challengeId);
  }

  return attempt;
};


// REGISTRAR TENTATIVA
export const registerAttempt = async (userId, challengeId) => {
  const now = new Date();

  return await UserChallenge.findOneAndUpdate(
    { userId, challengeId },
    {
      $inc: { attempts: 1 },
      $setOnInsert: {
        status: "attempted",
        startedAt: now,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
};

// MARCAR COMO CONCLUÍDO
export const markAsCompleted = async (userId, challengeId) => {
  const now = new Date();

  const progress = await UserChallenge.findOneAndUpdate(
    { userId, challengeId },
    {
      $setOnInsert: {
        attempts: 0,
        startedAt: now,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  // Não sobrescreve a primeira conclusão
  if (progress.status === "completed") {
    return progress;
  }

  progress.status = "completed";

  if (!progress.completedAt) {
    progress.completedAt = now;
  }

  return await progress.save();
};

// CONSULTAR PROGRESSO
export const getUserProgress = async (userId, challengeId) => {
  return await UserChallenge.findOne({
    userId,
    challengeId,
  }).lean();
};

//  SERVICE PRINCIPAL
export const submitChallengeService = async ({ id, commandsRaw, userId }) => {
  const challenge = await findChallengeByIdOrPublicId(id);
  if (!challenge) {
    throw new Error("Desafio não encontrado");
  }

  const engine = new ExecutionEngine();

  // Todos os blocos enviados pelo Blockly
  const allCommands = Array.isArray(commandsRaw) ? commandsRaw : [];

  // Apenas os comandos executáveis
  const normalized = engine.normalize(allCommands);

  // Tipos de todos os blocos enviados
  const allUsedTypes = new Set(allCommands.map((cmd) => cmd.type));

  if (Array.isArray(challenge.requiredBlocks)) {
    for (const rule of challenge.requiredBlocks) {
      const count = allCommands.filter((cmd) => cmd.type === rule.type).length;

      if (count < (rule.min ?? 1)) {
        return {
          success: false,
          message: `Use o bloco obrigatório: ${translate(rule.type)}`,
          output: [],
          steps: [],
        };
      }
    }
  }

  const usedTypes = allUsedTypes;

  if (
    Array.isArray(challenge.forbiddenBlocks) &&
    challenge.forbiddenBlocks.length > 0
  ) {
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

  const execError = validateExecutionRules(
    normalized,
    challenge.executionRules,
  );

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

  let aggregated = {
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

    const passed =
      JSON.stringify(finalState) === JSON.stringify(testCase.expectedOutput);

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

  // Incrementa o contador global
  await Challenge.updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } });

  let userChallengeDoc = null;

  // Registra o resultado do usuário autenticado
  if (userId) {
    userChallengeDoc = await recordChallengeResult(
      userId,
      challenge._id,
      aggregated.success,
    );
  }

  return {
    ...aggregated,

    userAttempt: userChallengeDoc
      ? {
          status: userChallengeDoc.status,
          attempts: userChallengeDoc.attempts,
          startedAt: userChallengeDoc.startedAt,
          completedAt: userChallengeDoc.completedAt,
        }
      : null,
  };
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
