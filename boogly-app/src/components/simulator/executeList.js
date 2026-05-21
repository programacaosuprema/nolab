import { ListSimulator } from "./ListSimulator";

function resolveCondition(condition, simulator) {
  let parsed = condition;

  // 🔥 substitui variáveis simples
  for (const key in simulator.variables) {
    const value = simulator.variables[key];

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

    if (char === "(") depth++;
    if (char === ")") depth--;

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

  // ======================
  // 🔥 get_var("x")
  // ======================
  if (value.startsWith('get_var(')) {
    const name =
      value.match(/get_var\("(.+)"\)/)?.[1];

    return simulator.get_var(name);
  }

  // ======================
  // 🔥 pegar(...)
  // ======================
  if (value.startsWith("pegar(")) {
    const match =
      value.match(/pegar\((.+?),\s*"(.+?)"\)/);

    if (match) {
      const posicao = Number(match[1]);
      const lista = match[2];

      return simulator.pegar(posicao, lista);
    }
  }

  // ======================
  // 🔥 NULL
  // ======================
  if (value === "null") {
    return null;
  }

  // ======================
  // 🔥 texto
  // ======================
  if (
    value.startsWith('"') &&
    value.endsWith('"')
  ) {
    return value.slice(1, -1);
  }

  // ======================
  // 🔥 número
  // ======================
  const num = Number(value);

  if (!Number.isNaN(num)) {
    return num;
  }

  // ======================
  // 🔥 variável simples
  // ======================
  if (
    simulator.variables &&
    value in simulator.variables
  ) {
    return simulator.get_var(value);
  }

  return value;
}

function executeBlock(
  lines,
  simulator,
  operationMap
) {

  let shouldExecute = true;

  let conditionStack = [];

  for (let i = 0; i < lines.length; i++) {

    let line = lines[i].trim();

    if (!line) continue;

    // ======================
    // 🔥 IF
    // ======================
    if (line.startsWith("if")) {

      const condition =
        line.match(/if\s*\((.*)\)/)?.[1];

      let result = false;

      try {

        const parsedCondition =
          resolveCondition(
            condition,
            simulator
          );

        result =
          eval(parsedCondition);

        simulator.steps.push({
          type: "condition",
          message:
            `teste: ${parsedCondition} => ${
              result
                ? "verdadeiro"
                : "falso"
            }`,
          state:
            simulator.getState()
        });

      } catch {

        result = false;

        simulator.steps.push({
          type: "error",
          message:
            `erro ao testar condição`,
          state:
            simulator.getState()
        });
      }

      conditionStack.push({
        result,
        executed: result
      });

      shouldExecute = result;

      continue;
    }

    // ======================
    // 🔥 ELSE
    // ======================
    if (line.startsWith("} else {")) {

      const current =
        conditionStack[
          conditionStack.length - 1
        ];

      // 🔥 IF já executou
      if (current.executed) {

        shouldExecute = false;

        current.result = false;

        continue;
      }

      // 🔥 IF foi falso
      shouldExecute = true;

      current.result = true;
      current.executed = true;

      continue;
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

      continue;
    }

    if (!shouldExecute) continue;

    // ======================
    // 🔥 PARA CADA
    // ======================
    if (
      line.startsWith(
        "para_cada("
      )
    ) {

      const match =
        line.match(
          /para_cada\("(.+?)",\s*"(.+?)"/
        );

      if (!match) continue;

      const variable =
        match[1];

      const listName =
        match[2];

      const list =
        simulator.lists[
          listName
        ];

      if (!list) continue;

      // 🔥 captura bloco interno
      const internalLines = [];

      let depth = 1;

      i++;

      while (
        i < lines.length &&
        depth > 0
      ) {

        const internal =
          lines[i];

        if (
          internal.includes("{")
        ) {
          depth++;
        }

        if (
          internal.includes("}")
        ) {
          depth--;
        }

        if (depth > 0) {
          internalLines.push(
            internal
          );
        }

        i++;
      }

      i--;

      // 🔥 percorre lista
      for (const item of [
        ...list.data
      ]) {

        simulator.set_var(
          variable,
          item
        );

        executeBlock(
          internalLines,
          simulator,
          operationMap
        );
      }

      continue;
    }

    // ======================
    // 🔥 EXECUÇÃO
    // ======================
    const match =
      line.match(
        /^(\w+)\((.*)\);?$/
      );

    if (!match) continue;

    const rawOperation =
      match[1];

    const operation =
      operationMap[
        rawOperation
      ] || rawOperation;

    const args = match[2]
      ? splitArguments(
          match[2]
        ).map(arg =>
          resolveArg(
            arg,
            simulator
          )
        )
      : [];

    if (
      typeof simulator[
        operation
      ] === "function"
    ) {

      // ======================
      // 🔥 INSERIR
      // ======================
      if (
        operation ===
        "inserir"
      ) {

        const [
          nome,
          valor
        ] = args;

        if (
          valor === null ||
          valor === undefined
        ) {

          simulator.steps.push({
            type: "warning",
            message:
              `valor nulo não pode ser inserido`,
            state:
              simulator.getState()
          });

          continue;
        }

        simulator.inserir(
          valor,
          nome
        );

        continue;
      }

      // ======================
      // 🔥 REMOVER ITEM
      // ======================
      if (
        operation ===
        "remover_item"
      ) {

        const [
          nome,
          valor
        ] = args;

        simulator.remover_item(
          valor,
          nome
        );

        continue;
      }

      // ======================
      // 🔥 REMOVER POSIÇÃO
      // ======================
      if (
        operation ===
        "remover_da_posicao"
      ) {

        const [
          indice,
          nome
        ] = args;

        simulator.remover_da_posicao(
          indice,
          nome
        );

        continue;
      }

      // ======================
      // 🔥 LISTA FIXA
      // ======================
      if (
        operation ===
        "criar_lista_limitada"
      ) {

        const [
          nome,
          tamanho
        ] = args;

        simulator
          .criar_lista_limitada(
            nome,
            tamanho
          );

        continue;
      }

      // ======================
      // 🔥 SUBLISTA
      // ======================
      if (
        operation ===
        "sublista"
      ) {

        const [
          nome,
          inicio,
          fim
        ] = args;

        simulator.sublista(
          inicio,
          fim,
          nome
        );

        continue;
      }

      // ======================
      // 🔥 VARIÁVEL
      // ======================
      if (
        operation ===
        "set_var"
      ) {

        const [
          name,
          value
        ] = args;

        simulator.set_var(
          name,
          value
        );

        continue;
      }

      // ======================
      // 🔥 EXECUÇÃO PADRÃO
      // ======================
      simulator[
        operation
      ](...args);
    }
  }
}

export function executeList(code) {

  const simulator =
    new ListSimulator();

  // ======================
  // 🔥 EXECUTAR
  // ======================
  if (
    !code.includes(
      "// INICIAR_EXECUCAO"
    )
  ) {

    return [
      {
        type: "error",
        message:
          "Adicione o bloco EXECUTAR.",
        state: {}
      }
    ];
  }

  const lines = code
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const start =
    lines.indexOf(
      "// INICIAR_EXECUCAO"
    );

  const end =
    lines.indexOf(
      "// FIM_EXECUCAO"
    );

  const executableLines =
    lines.slice(
      start + 1,
      end
    );

  // ======================
  // 🔥 MAPA
  // ======================
  const operationMap = {
    insert: "inserir",
    remove_last:
      "remover_ultimo",
    remove_first:
      "remover_primeiro",
    remove_item:
      "remover_item",
    remove_index:
      "remover_da_posicao",
    sublist:
      "sublista",
    invert:
      "inverter",
    sort_ascending:
      "ordenar_crescente",
    sort_descending:
      "ordenar_decrescente",
    list_container:
      "criar_lista",
    list_fixed:
      "criar_lista_limitada"
  };

  executeBlock(
    executableLines,
    simulator,
    operationMap
  );

  return simulator.steps;
}