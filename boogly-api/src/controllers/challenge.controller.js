import * as service from "../services/challenge.service.js";
import { Challenge } from "../models/challenge.model.js"; // 🔥 ajuste o caminho
import mongoose from "mongoose";

export const create = async (req, res) => {
  try {
    const { title, description, structure, testCases, rules, difficulty } = req.body;

    const challenge = await Challenge.create({
      title,
      description,
      structure,
      testCases,
      rules,
      difficulty
    });

    res.json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔥 LISTAR DESAFIOS (COM STATUS + RESOLUÇÕES)
export const getAll = async (req, res) => {
  try {
    const { structure, difficulty } = req.query;

    const filter = {};

    // 🔥 filtro por estrutura
    if (structure) {
      filter.structure = structure;
    }

    // 🔥 filtro opcional por dificuldade
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    const challenges = await Challenge.find(filter);

    return res.json(challenges);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { structure } = req.query; // 👈 opcional

    let challenge;

    if (mongoose.Types.ObjectId.isValid(id)) {
      challenge = await Challenge.findById(id);
    } else {
      challenge = await Challenge.findOne({ publicId: id });
    }

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    // 🔥 valida estrutura (opcional)
    if (structure && challenge.structure !== structure) {
      return res.status(400).json({
        error: "Estrutura não corresponde ao desafio"
      });
    }

    res.json(challenge);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function executeCommands(commands, input) {
  let lista = [...input];  // começa com input

  for (const cmd of commands) {
    switch (cmd.type) {
      case "criar_lista":
        lista = [];
        break;

      case "inserir":
        lista.push(cmd.value);
        break;

      case "remover_inicio":
        lista.shift();
        break;

      case "reverse":
        lista.reverse();
        break;

      default:
        throw new Error(`Comando desconhecido: ${cmd.type}`);
    }
  }

  return lista;
}

function arraysAreEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

export const submitChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, commands } = req.body;

    const challenge = await service.getChallengeById(id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    let passedAll = true;
    let failedCase = null;
    let finalOutput = null;

    for (const testCase of challenge.testCases) {
      const output = executeCommands(commands, testCase.input);

      finalOutput = output;

      if (!arraysAreEqual(output, testCase.expectedOutput)) {
        passedAll = false;
        failedCase = {
          input: testCase.input,
          expected: testCase.expectedOutput,
          received: output
        };
        break;
      }
    }

    return res.json({
      success: passedAll,
      output: finalOutput,
      ...(passedAll
        ? { message: "Correto 🎉" }
        : { message: "Incorreto ❌", failedCase })
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};