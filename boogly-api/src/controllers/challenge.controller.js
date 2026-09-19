// src/controllers/challenge.controller.js
import mongoose from "mongoose";
import { Challenge } from "../models/challenge.model.js";
import { UserChallenge } from "../models/userChallenge.model.js";
import { nanoid } from "nanoid";

function formatValue(value) {
  if (value === null || value === undefined) return "nulo";
  return value;
}

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

/** Normaliza comandos vindos do workspace:
 * - remove blocos "valor" (base_number, base_text, base_variable, base_input...)
 * - remove blocos container/header (ex: list_container)
 * - mantém a ordem relativa dos comandos "reais"
 */
function normalizeCommands(commands = []) {
  const skipTypes = new Set([
    "base_number",
    "base_text",
    "base_variable",
    "base_input",
    "base_not",
    "list_container",
    "queue_container",
    "stack_container",
  ]);

  return (commands || []).filter((c) => !skipTypes.has(c.type));
}

/** Executa sequência de comandos sobre uma lista inicial (clonando sempre) */
function executeWithSteps(commands = [], startState = [], structure = "list") {
  const lista = Array.isArray(startState) ? [...startState] : [];
  const steps = [];

  for (const cmd of commands) {
    switch (cmd.type) {
      // aceitar variantes de nomes (por segurança)
      case "list_insert":
      case "insert":
      case "enqueue":
      case "push":
        // insere ao final
        if (cmd.value !== undefined && cmd.value !== null)
          lista.push(cmd.value);
        break;

      case "list_remove_first":
      case "remove_first":
      case "dequeue":
      case "pop_front":
        lista.shift();
        break;

      case "list_remove_last":
      case "remove_last":
      case "pop":
        lista.pop();
        break;

      case "list_invert":
      case "invert":
        lista.reverse();
        break;

      // consultas / não modificam: apenas registramos
      case "list_get":
      case "list_index":
      case "list_size":
      case "peek":
      case "queue_front":
      case "stack_peek":
        // não muta o estado
        break;

      default:
        // outros blocos ignorados (não lançamos erro aqui)
        break;
    }

    steps.push({
      command: cmd,
      state: [...lista],
    });
  }

  return steps;
}

/* ============================
   Controllers públicos
   ============================ */

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

/**
 * Registro de tentativa simples (POST /challenges/:id/attempt)
 * - se visitante (sem userId) apenas incrementa attempts global e retorna userAttempt: null
 * - se usuário logado cria/atualiza UserChallenge.status=attempted e increments attempts
 */
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

/**
 * incrementAttempts (admin helper)
 */
export const incrementAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { publicId: id };
    const updated = await Challenge.findOneAndUpdate(
      filter,
      { $inc: { attempts: 1 } },
      { new: true },
    );
    if (!updated) return res.status(404).json({ error: "Challenge not found" });
    return res.json({ success: true, attempts: updated.attempts });
  } catch (err) {
    console.error("incrementAttempts error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* ============================
   Submissão / Execução
   ============================ */

/**
 * POST /challenges/:id/submit
 * Body: { commands: [...] }
 *
 * Regras principais:
 * - normalizeCommands() para filtrar blocos-valor que aparecem separados
 * - se o usuário inseriu comandos de insert -> executa exatamente a sequência do usuário
 * - se o usuário NÃO inseriu inserts -> pré-inicializa a lista com testCase.input antes de aplicar os comandos
 * - valida requiredBlocks (challenge.requiredBlocks)
 * - atualiza UserChallenge (attempts/status/completed) e Challenge.solvedCount quando apropriado
 */
export const submitChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const commandsRaw = req.body?.commands || [];

    const challenge = await findChallengeByIdOrPublicId(id);
    if (!challenge)
      return res.status(404).json({ message: "Challenge not found" });

    // normaliza (filtra blocos-valor que aparecem como top blocks)
    const normalized = normalizeCommands(commandsRaw);

    // checa requiredBlocks (se houver)
    if (
      Array.isArray(challenge.requiredBlocks) &&
      challenge.requiredBlocks.length > 0
    ) {
      for (const rule of challenge.requiredBlocks) {
        const count = normalized.filter((c) => c.type === rule.type).length;
        if (count < (rule.min || 1)) {
          return res.json({
            success: false,
            message: `Use o bloco obrigatório: ${rule.type}`,
            output: [],
            steps: [],
          });
        }
      }
    }

    // Prepara execução para cada testCase
    const testCases = challenge.testCases || [];
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res
        .status(400)
        .json({ message: "Challenge sem testCases definidos" });
    }

    const aggregated = {
      success: true,
      message: "Correto 🎉",
      output: null,
      expected: null,
      steps: null,
    };

    let userId = req.userId || null;

    // flag: detecta se o usuário forneceu inserts manualmente
    const userInsertedVals = normalized
      .filter((c) => /insert|enqueue|push/i.test(c.type))
      .map((c) => c.value);

    for (const testCase of testCases) {
      // Determine startState:
      // - se usuário incluiu inserts -> start vazio (eles inserem manualmente)
      // - caso contrário -> start = testCase.input (pré-inicializa)
      const startState =
        userInsertedVals.length > 0
          ? []
          : Array.isArray(testCase.input)
            ? [...testCase.input]
            : [];

      // Se o usuário não inseriu nada E usou apenas blocos de remoção (sem manipulacoes),
      // ainda permitimos (porque startState será preenchido com testCase.input).
      // Se você quiser proibir passar apenas com remove, adicione validação aqui.
      const steps = executeWithSteps(
        normalized,
        startState,
        challenge.structure,
      );

      const finalState = steps.at(-1)?.state || [];

      const passed =
        JSON.stringify(finalState) === JSON.stringify(testCase.expectedOutput);

      // se falhou, retorna imediatamente com steps e estado
      if (!passed) {
        aggregated.success = false;
        aggregated.message = "Incorreto ❌";
        aggregated.expected = testCase.expectedOutput;
        aggregated.output = finalState;
        aggregated.steps = steps;
        break;
      } else {
        // passou esse test -> continue
        aggregated.steps = steps;
        aggregated.output = finalState;
      }
    }

    // Sempre conta como uma tentativa global (cada submit)
    await Challenge.updateOne(
      { _id: challenge._id },
      { $inc: { attempts: 1 } },
    );

    // Atualiza UserChallenge conforme sucesso/falha
    let userChallengeDoc = null;
    if (userId) {
      if (aggregated.success) {
        // marca completed e incrementa attempts
        userChallengeDoc = await UserChallenge.findOneAndUpdate(
          { userId, challengeId: challenge._id },
          {
            $set: { status: "completed", completedAt: new Date() },
            $inc: { attempts: 1 },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        );

        // incrementa solvedCount apenas se o usuário não tinha completado antes
        const hadCompletedBefore = await UserChallenge.exists({
          userId,
          challengeId: challenge._id,
          status: "completed",
          _id: { $ne: userChallengeDoc._id },
        });
        if (!hadCompletedBefore) {
          await Challenge.updateOne(
            { _id: challenge._id },
            { $inc: { solvedCount: 1 } },
          );
        }
      } else {
        // falhou -> apenas incrementa attempts e set attempted
        userChallengeDoc = await UserChallenge.findOneAndUpdate(
          { userId, challengeId: challenge._id },
          {
            $set: { status: "attempted" },
            $inc: { attempts: 1 },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        );
      }
    }

    return res.json({
      success: aggregated.success,
      message: aggregated.message,
      output: formatValue(aggregated.output),
      expected: formatValue(aggregated.expected),
      steps: aggregated.steps,
      userAttempt: userChallengeDoc
        ? {
            attempts: userChallengeDoc.attempts,
            status: userChallengeDoc.status,
          }
        : null,
    });
  } catch (err) {
    console.error("submitChallenge error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = req.body;
    const challenge = await Challenge.create({ ...data, publicId: nanoid(10) });
    res.status(201).json(challenge);
  } catch (err) {
    console.error("create error:", err);
    res.status(500).json({ error: err.message });
  }
};
