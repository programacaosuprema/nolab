import { UserChallenge } from "../models/userChallenge.model.js";

//  REGISTRAR TENTATIVA
export const registerAttempt = async (userId, challengeId) => {
  const existing = await UserChallenge.findOne({ userId, challengeId });

  //  se já concluiu → não faz nada
  if (existing?.status === "concluido") {
    return existing;
  }

  //  cria ou atualiza
  return await UserChallenge.findOneAndUpdate(
    { userId, challengeId },
    {
      $inc: { attempts: 1 },
      status: "tentando",
    },
    { upsert: true, new: true },
  );
};

export const markAsCompleted = async (userId, challengeId) => {
  const existing = await UserChallenge.findOne({ userId, challengeId });

  if (!existing) {
    return await UserChallenge.create({
      userId,
      challengeId,
      status: "concluido",
      attempts: 1,
      completedAt: new Date(),
    });
  }

  //  NÃO incrementa attempts aqui
  existing.status = "concluido";
  existing.completedAt = new Date();

  return await existing.save();
};
