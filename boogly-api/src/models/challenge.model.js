import mongoose from "mongoose";
import { nanoid } from "nanoid";

// 🔹 TEST CASE
const testCaseSchema = new mongoose.Schema({
  input: {
    type: [Number],
    required: true,
    default: []
  },
  expectedOutput: {
    type: [Number],
    required: true,
    default: []
  }
}, { _id: false });

// 🔹 RULES
const ruleSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  required: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// 🔥 MAIN SCHEMA
const challengeSchema = new mongoose.Schema({

  // 🔥 ID PÚBLICO (IMPORTANTE)
  publicId: {
    type: String,
    unique: true,
    default: () => nanoid(10),
    index: true,
    immutable: true
  },

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },

  description: {
    type: String,
    default: "",
    trim: true,
    maxlength: 2000
  },

  structure: {
    type: String,
    enum: ["list", "stack", "queue"],
    required: true,
    index: true
  },

  testCases: {
    type: [testCaseSchema],
    required: true,
    validate: {
      validator: (arr) => arr.length > 0,
      message: "At least one test case is required"
    }
  },

  rules: {
    type: [ruleSchema],
    default: []
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
    index: true
  },

  timeLimit: {
    type: Number,
    default: 120,
    min: 10,
    max: 600
  },

  // 🔥 METRICS (pra sua tela já ficar mais rica)
  solvedCount: {
    type: Number,
    default: 0
  },

  attempts: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

export const Challenge = mongoose.model("Challenge", challengeSchema);