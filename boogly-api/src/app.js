import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import challengeRoutes from "./routes/challenge.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (origin.includes("localhost") || origin.includes("vercel.app")) {
        return callback(null, true);
      }

      //  permite mesmo assim (evita erro em produção)
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser()); // obrigatório para ler cookies

// rotas
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/challenges", challengeRoutes);

export default app;
