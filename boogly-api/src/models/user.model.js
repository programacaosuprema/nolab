// models/user.model.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    authCode: {
      type: String,
    },
    authCodeExpiresAt: {
      type: Date,
    },
    guest: {
      type: Boolean,
      default: false,
    },

    // novo campo para controlar o onboarding
    onboardingDone: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
