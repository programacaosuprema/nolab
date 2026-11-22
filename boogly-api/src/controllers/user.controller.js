// controllers/user.controller.js
import { User } from "../models/user.model.js";

export const setOnboardingDone = async (req, res) => {
  try {
    // ID fornecido pelo middleware requireAuth
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    const { onboardingDone } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          onboardingDone: Boolean(onboardingDone),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      onboardingDone: user.onboardingDone,
    });

  } catch (err) {
    console.error("[ONBOARDING] Erro:", err);

    return res.status(500).json({
      error: "Erro ao atualizar onboarding",
    });
  }
};