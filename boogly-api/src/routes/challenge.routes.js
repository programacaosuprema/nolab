import express from "express";

import * as controller from "../controllers/challenge.controller.js";

import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Criar desafio
router.post("/", requireAuth, controller.create);

// Listar desafios
router.get("/", optionalAuth, controller.getAll);

// Consultar desafio
router.get("/:id", optionalAuth, controller.getChallenge);

export default router;
