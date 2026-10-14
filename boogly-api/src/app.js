import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import challengeRoutes from "./routes/challenge.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://nolab-k76qt6v51-nolab1.vercel.app", //precisa mudar isso
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

export default app;