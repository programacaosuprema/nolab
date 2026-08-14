import app from "./app.js";
import { connectDB } from "./config/database.js";

import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Erro ao iniciar o servidor:", error);
    process.exit(1); // importante pra mostrar erro no Railway
  }
})();