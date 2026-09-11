import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/user.model.js";
import { setOnboardingDone } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId) 
      .select("nickname email onboardingDone guest createdAt");

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔥 AGORA FUNCIONA
router.patch("/me/onboarding", requireAuth, setOnboardingDone);

export default router;