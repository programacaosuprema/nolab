import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI não definida");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || "boogly",
    });

    console.log("✅ MongoDB conectado");

  } catch (err) {
    console.error("❌ Erro MongoDB:", err.message);
    process.exit(1);
  }
};