import express from "express";
import {
  authenticate,
  getUsers,
  loginGuest,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/", authenticate); //  unificado
router.get("/users", getUsers);
router.post("/guest", loginGuest);
router.post("/logout", logout);

export default router;
