import express from "express";
import * as controller from "../controllers/challenge.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js"; // optionalAuth deve setar req.userId quando houver token

const router = express.Router();

router.post("/", controller.create); // se deseja criar
router.get("/", optionalAuth, controller.getAll);
router.get("/:id", optionalAuth, controller.getChallenge);

// registro de tentativa (cria/atualiza UserChallenge.status=attempted)
router.post("/:id/attempt", optionalAuth, controller.recordAttempt);

// increment global attempts (admin)
router.patch("/:id/attempts", controller.incrementAttempts);

// submissão (testes)
router.post("/:id/submit", optionalAuth, controller.submitChallenge);

export default router;
