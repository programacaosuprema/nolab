import express from "express";

import * as controller from "../controllers/userChallenge.controller.js";

import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

// Registra uma tentativa por tempo esgotado
router.post("/:id/expire", controller.challengeExpired);
// Submeter solução e registrar progresso
router.post("/:id/submit", controller.submitChallenge);

router.post("/:id/abandon", controller.abandonChallenge);

export default router;