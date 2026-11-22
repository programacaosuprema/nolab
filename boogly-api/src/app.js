import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import challengeRoutes from "./routes/challenge.routes.js";
import userRoutes from "./routes/user.routes.js";
import challengePlayRoutes from "./routes/challengePlay.routes.js"

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://nolab-qx1j7d82j-nolab1.vercel.app",
  "https://nolab-git-main-nolab1.vercel.app" //precisa mudar isso
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origem não permitida pelo CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/challenges", challengeRoutes);
app.use("/challenge-play", challengePlayRoutes);

export default app;