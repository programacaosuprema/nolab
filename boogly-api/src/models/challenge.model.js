import mongoose from "mongoose";
import { nanoid } from "nanoid";

/* =========================
   TEST CASE
========================= */
const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: [Number],
      required: true,
      default: [],
    },
    expectedOutput: {
      type: [Number],
      required: true,
      default: [],
    },
  },
  { _id: false },
);

/* =========================
   RULES (exibição)
========================= */
const ruleSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

/* =========================
   INITIAL STATE (multi-estrutura)
========================= */
const initialStateSchema = new mongoose.Schema(
  {
    lista: { type: [Number], default: [] },
    fila: { type: [Number], default: [] },
    pilha: { type: [Number], default: [] },
  },
  { _id: false },
);

/* =========================
   VALIDATION (resultado final)
========================= */
const validationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["equals"],
      default: "equals",
    },
    expected: {
      type: [Number],
      default: [],
    },
  },
  { _id: false },
);

/* =========================
   REQUIRED BLOCKS 
========================= */
const requiredBlockSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // ex: list_remove_first
    min: { type: Number, default: 1 },
  },
  { _id: false },
);

/* =========================
   EXECUTION RULES (avançado)
========================= */
const executionRuleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["must_use_before", "must_not_use_after"],
      required: true,
    },
    block: { type: String, required: true },
    target: { type: String, required: true },
  },
  { _id: false },
);

/* =========================
   MAIN SCHEMA
========================= */
const challengeSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      unique: true,
      default: () => nanoid(10),
      index: true,
      immutable: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    structure: {
      type: String,
      enum: ["list", "stack", "queue"],
      required: true,
      index: true,
    },

    initialState: {
      type: initialStateSchema,
      default: () => ({ lista: [], fila: [], pilha: [] }),
    },

    validation: {
      type: validationSchema,
      default: () => ({ type: "equals", expected: [] }),
    },

    /*  TESTES */
    testCases: {
      type: [testCaseSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one test case is required",
      },
    },

    /*  REGRAS VISUAIS (UI) */
    rules: {
      type: [ruleSchema],
      default: [],
    },

    /*  BLOCO OBRIGATÓRIO */
    requiredBlocks: {
      type: [requiredBlockSchema],
      default: [],
    },

    /*  BLOCO PROIBIDO */
    forbiddenBlocks: {
      type: [String], // ex: ["list_invert"]
      default: [],
    },

    /*  REGRAS DE EXECUÇÃO */
    executionRules: {
      type: [executionRuleSchema],
      default: [],
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
      index: true,
    },

    timeLimit: {
      type: Number,
      default: 120,
      min: 10,
      max: 600,
    },

    solvedCount: {
      type: Number,
      default: 0,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Challenge = mongoose.model("Challenge", challengeSchema);
