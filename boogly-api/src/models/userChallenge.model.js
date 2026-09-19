// src/models/userChallenge.model.js
import mongoose from "mongoose";

const userChallengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "attempted", "completed"],
      default: "pending",
    },
    attempts: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// índice composto para garantir unicidade por (user, challenge)
userChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

export const UserChallenge = mongoose.model(
  "UserChallenge",
  userChallengeSchema,
);
