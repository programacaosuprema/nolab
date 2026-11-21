import * as service from "../services/userChallenge.service.js";
import { getChallengeByIdService } from "../services/challenge.service.js";
import { submitChallengeService, registerAbandonment } from "../services/userChallenge.service.js";

const getUserId = (req) =>
  req.userId || req.user?.id || req.user?._id || null;

const resolveChallenge = async (req) => {
  const id = req.body?.challengeId || req.params?.id;

  if (!id) return null;

  return await getChallengeByIdService(id);
};

export async function abandonChallenge(req, res) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado.",
      });
    }

    const challenge = await resolveChallenge(req);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Desafio não encontrado.",
      });
    }

    const userAttempt = await registerAbandonment(
      userId,
      challenge._id
    );

    return res.status(200).json({
      success: true,
      message: "Desistência registrada com sucesso.",
      userAttempt,
    });
  } catch (error) {
    console.error("Erro ao registrar desistência:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao registrar desistência.",
      error: error.message,
    });
  }
}


// SUBMETER SOLUÇÃO
export const submitChallenge = async (req, res) => {
  try {
    const result = await submitChallengeService({
      id: req.params.id,
      commandsRaw: req.body?.commands || [],
      userId: getUserId(req),
    });

    return res.json(result);
  } catch (err) {
    console.error("submitChallenge error:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
};

// REGISTRAR TENTATIVA
export const challengeExpired = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    const challenge = await resolveChallenge(req);

    if (!challenge) {
      return res.status(404).json({
        error: "Desafio não encontrado",
      });
    }

    const result = await service.registerAttempt(
      userId,
      challenge._id
    );

    return res.json(result);
  } catch (err) {
    console.error("attempt error:", err);
    return res.status(500).json({ error: err.message });
  }
};