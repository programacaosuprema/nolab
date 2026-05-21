import { ListSimulator } from "./ListSimulator";

function resolveCondition(condition, simulator) {
  let parsed = condition;

  // 🔥 substitui variáveis simples
  for (const key in simulator.variables) {
    const value = simulator.variables[key];

    // substitui apenas palavra inteira
    parsed = parsed.replace(
      new RegExp(`\\b${key}\\b`, "g"),
      value
    );
  }

  return parsed;
}

function splitArguments(argsString) {
  const args = [];

  let current = "";
  let depth = 0;

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    // 🔥 controla profundidade dos parênteses
    if (char === "(") depth++;
    if (char === ")") depth--;

    // 🔥 só separa vírgula fora dos parênteses
    if (char === "," && depth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function resolveArg(arg, simulator) {
  const value = arg.trim();

  // get_var("x")
  if (value.startsWith('get_var(')) {
    const name =
      value.match(/get_var\("(.+)"\)/)?.[1];

    return simulator.get_var(name);
  }

  // pegar(...)
  if (value.startsWith("pegar(")) {
    const match =
      value.match(/pegar\((.+?),\s*"(.+?)"\)/);

    if (match) {
      const posicao = Number(match[1]);
      const lista = match[2];

      return simulator.pegar(posicao, lista);
    }
  }

  // 🔥 NULL
  if (value === "null") {
    return null;
  }

  // texto
  if (
    value.startsWith('"') &&
    value.endsWith('"')
  ) {
    return value.slice(1, -1);
  }

  // número
  const num = Number(value);

  if (!Number.isNaN(num)) {
    return num;
  }

  // variável
  if (
    simulator.variables &&
    value in simulator.variables
  ) {
    return simulator.get_var(value);
  }

  return value;
}

export function executeList(code) {
  const simulator = new ListSimulator();

  // =========================
  // 🔥 BLOCO EXECUTAR
  // =========================
  if (!code.includes("// INICIAR_EXECUCAO")) {
    return [
      {
        type: "error",
        message: "Adicione o bloco EXECUTAR.",
        state: {}
      }
    ];
  }

  const lines = code.split("\n");

  let isRunning = false;
  let hasList = false;

  let shouldExecute = true;
  let conditionStack = [];

  // 🔥 mapa de tradução (Blockly → Simulator)
  const operationMap = {
    insert: "inserir",
    remove_last: "remover_ultimo",
    remove_first: "remover_primeiro",
    remove_item: "remover_item",
    remove_index: "remover_da_posicao",
    sublist: "sublista",
    invert: "inverter",
    sort_ascending: "ordenar_crescente",
    sort_descending: "ordenar_decrescente",
    list_container: "criar_lista",
    list_fixed: "criar_lista_limitada"
  };

  lines.forEach(line => {
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

    // =========================
    // 🔥 DETECTAR CRIAÇÃO
    // =========================
    if (
      line.includes("list_container") ||
      line.includes("list_fixed") ||
      line.includes("criar_lista")
    ) {
      hasList = true;
    }

    // =========================
    // 🔥 BLOQUEAR SEM LISTA
    // =========================
    const isListOperation =
      line.includes("insert(") ||
      line.includes("remove_last(") ||
      line.includes("remove_first(") ||
      line.includes("remove_item(") ||
      line.includes("remove_index(") ||
      line.includes("sublist(") ||
      line.includes("invert(") ||
      line.includes("sort_ascending(") ||
      line.includes("sort_descending(");

    if (isListOperation && !hasList) {
      return [
        {
          type: "error",
          message: "Crie a lista antes de usar operações.",
          state: {}
        }
      ];
    }

    // ======================
// 🔥 IF
// ======================
  if (line.startsWith("if")) {
    const condition =
      line.match(/if\s*\((.*)\)/)?.[1];

    let result = false;

    try {
      const parsedCondition =
        resolveCondition(condition, simulator);

      result = eval(parsedCondition);

      simulator.steps.push({
        type: "condition",
        message:
          `teste: ${parsedCondition} => ${result ? "verdadeiro" : "falso"}`,
        state: simulator.getState()
      });

    } catch {
      result = false;

      simulator.steps.push({
        type: "error",
        message: `erro ao testar condição`,
        state: simulator.getState()
      });
    }

    conditionStack.push({
      result,
      executed: result
    });

    shouldExecute = result;

    return;
  }

  // ======================
  // 🔥 ELSE
  // ======================
  if (line.startsWith("} else {")) {
    const current =
      conditionStack[conditionStack.length - 1];

    // 🔥 Se o IF já executou,
    // o ELSE NÃO deve executar
    if (current.executed) {
      shouldExecute = false;
      current.result = false;
      return;
    }

    // 🔥 IF foi falso -> ELSE executa
    shouldExecute = true;
    current.result = true;
    current.executed = true;

    return;
  }

  // ======================
  // 🔥 FECHAMENTO
  // ======================
  if (line === "}") {
    conditionStack.pop();

    shouldExecute =
      conditionStack.length === 0
        ? true
        : conditionStack[
            conditionStack.length - 1
          ].result;

    return;
  }

    if (!shouldExecute) return;

    // ======================
    // 🔥 EXECUÇÃO
    // ======================
    const match = line.match(/^(\w+)\((.*)\);?$/);
    if (!match) return;

    const rawOperation = match[1];
    const operation = operationMap[rawOperation] || rawOperation;

    const args = match[2]
      ? splitArguments(match[2]).map(arg =>
          resolveArg(arg, simulator)
        )
      : [];

    if (typeof simulator[operation] === "function") {
      // 🔹 inserir("minha_lista", 10)
      // Simulator espera: inserir(10, "minha_lista")
      if (operation === "inserir") {
        const [nome, valor] = args;

        // 🔥 não insere nulo
        if (valor === null || valor === undefined) {
          simulator.steps.push({
            type: "warning",
            message: `valor nulo não pode ser inserido`,
            state: simulator.getState()
          });

          return;
        }

        simulator.inserir(valor, nome);
        return;
      }

      if (operation === "remover_item") {
        const [nome, valor] = args;
        simulator.remover_item(valor, nome);
        return;
      }

      if (operation === "remover_da_posicao") {
        const [indice, nome] = args;
        simulator.remover_da_posicao(indice, nome);
        return;
      }

      if (operation === "criar_lista_limitada") {
        const [nome, tamanho] = args;
        simulator.criar_lista_limitada(nome, tamanho);
        return;
      }

      if (operation === "sublista") {
        const [nome, inicio, fim] = args;
        simulator.sublista(inicio, fim, nome);
        return;
      }

      if (operation === "set_var") {
        const [name, value] = args;
        simulator.set_var(name, value);
        return;
      }

      simulator[operation](...args);
    }
  });

  return simulator.steps;
}