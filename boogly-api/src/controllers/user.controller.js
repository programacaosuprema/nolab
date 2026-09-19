// controllers/user.controller.js
import { User } from "../models/user.model.js";

export const setOnboardingDone = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { onboardingDone } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { onboardingDone: !!onboardingDone },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      success: true,
      onboardingDone: user.onboardingDone,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
