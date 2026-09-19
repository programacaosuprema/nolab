import * as service from "../services/userChallenge.service.js";

export const attempt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengeId } = req.body;

    const result = await service.registerAttempt(userId, challengeId);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const complete = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengeId } = req.body;

    const result = await service.markAsCompleted(userId, challengeId);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
