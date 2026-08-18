import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import challengeRoutes from "./routes/challenge.routes.js";
import userRoutes from "./routes/user.routes.js"

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      origin.includes("localhost") ||
      origin.includes("vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("CORS bloqueado"));
  }
}));

app.use(express.json());

app.use("/auth", authRoutes);

app.use("/challenges", challengeRoutes);

app.use("/users", userRoutes);

export default app;