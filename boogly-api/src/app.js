import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import challengeRoutes from "./routes/challenge.routes.js";
import userRoutes from "./routes/user.routes.js"

const app = express();

app.use(cors(cors({
  origin: [
    "http://localhost:5173",
    "https://seu-frontend.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
})));
app.use(express.json());

app.use("/auth", authRoutes);

app.use("/challenges", challengeRoutes);

app.use("/users", userRoutes);

export default app;