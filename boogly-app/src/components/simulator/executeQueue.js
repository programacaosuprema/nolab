import { QueueSimulator } from "./QueueSimulator";

function resolveArg(arg, simulator) {
  const value = arg.trim();

  if (value.startsWith('get_var(')) {
    const name = value.match(/get_var\("(.+)"\)/)?.[1];
    return simulator.get_var(name);
  }

  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  const num = Number(value);
  if (!Number.isNaN(num)) return num;

  return value;
}

export function executeQueue(code) {
  const simulator = new QueueSimulator();

  if (!code.includes("// INICIAR_EXECUCAO")) {
    return [
      {
        type: "error",
        message:
          "Adicione o bloco 'Quando EXECUTAR for clicado' para iniciar o programa.",
        state: {}
      }
    ];
  }

  const lines = code.split("\n");

  let isRunning = false;
  let shouldExecute = true;
  const conditionStack = [];

  lines.forEach((line) => {
    line = line.trim();

    if (line === "// INICIAR_EXECUCAO") {
      isRunning = true;
      return;
    }

    if (line === "// FIM_EXECUCAO") {
      isRunning = false;
      return;
    }

    if (!isRunning) return;

    // 🔹 IF
    if (line.startsWith("if")) {
      const condition = line.match(/if\s*\((.*)\)/)?.[1];
      let result = false;

      try {
        result = eval(condition);
      } catch {
        result = false;
      }

      conditionStack.push(result);
      shouldExecute = result;
      return;
    }

    // 🔹 ELSE
    if (line.startsWith("} else {")) {
      const last = conditionStack.pop();
      const result = !last;
      conditionStack.push(result);
      shouldExecute = result;
      return;
    }

    // 🔹 FECHAMENTO DE BLOCO
    if (line === "}") {
      conditionStack.pop();
      shouldExecute =
        conditionStack.length === 0
          ? true
          : conditionStack[conditionStack.length - 1];
      return;
    }

    if (!shouldExecute) return;

    // 🔹 CAPTURA FUNÇÃO E ARGUMENTOS
    // Exemplo:
    // enfileirar("minha_fila", (10));
    const match = line.match(/(\w+)\((.*)\);?/);
    if (!match) return;

    const operation = match[1];
    const rawArgs = match[2];

    // 🔹 SPLIT ROBUSTO (preserva strings com vírgulas)
    const args = match[2]
      ? match[2].split(",").map(arg =>
          resolveArg(arg, simulator)
        )
      : [];
      
    let current = "";
    let inString = false;

    for (let i = 0; i < rawArgs.length; i++) {
      const char = rawArgs[i];

      if (char === '"') {
        inString = !inString;
        current += char;
        continue;
      }

      if (char === "," && !inString) {
        args.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    if (current.trim() !== "") {
      args.push(current.trim());
    }

    // 🔹 CONVERTE ARGUMENTOS
    const parsedArgs = args.map((arg) => {
      let value = arg.trim();

      // Remove parênteses externos: (10) -> 10
      while (
        value.startsWith("(") &&
        value.endsWith(")")
      ) {
        value = value.slice(1, -1).trim();
      }

      // String
      if (
        value.startsWith('"') &&
        value.endsWith('"')
      ) {
        return value.slice(1, -1);
      }

      // Número
      const num = Number(value);
      if (!Number.isNaN(num)) {
        return num;
      }

      // Valor literal (variável, expressão, etc.)
      return value;
    });

    // 🔹 EXECUTA OPERAÇÃO
    if (typeof simulator[operation] === "function") {
      simulator[operation](...parsedArgs);
    }
    
    if (operation === "set_var") {
        const [name, value] = args;
        simulator.set_var(name, value);
        return;
      }
  });

  return simulator.steps;
}