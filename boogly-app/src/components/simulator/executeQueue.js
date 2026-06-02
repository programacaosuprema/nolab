import { QueueSimulator } from "./QueueSimulator";

/* ==========================================================
   RESOLVE CONDITION
   ========================================================== */
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

/* ==========================================================
   SPLIT ARGUMENTS
   ========================================================== */
function splitArguments(argsString) {
  const args = [];

  let current = "";
  let depth = 0;
  let inString = false;

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    // 🔥 STRING
    if (char === '"') {
      inString = !inString;
      current += char;
      continue;
    }

    // 🔥 PROFUNDIDADE
    if (!inString) {
      if (char === "(") depth++;
      if (char === ")") depth--;
    }

    // 🔥 VÍRGULA FORA
    if (
      char === "," &&
      depth === 0 &&
      !inString
    ) {
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

/* ==========================================================
   RESOLVE ARG
   ========================================================== */
function resolveArg(arg, simulator) {
  let value = arg.trim();

  // 🔥 remove parênteses externos
  while (
    value.startsWith("(") &&
    value.endsWith(")")
  ) {
    value = value.slice(1, -1).trim();
  }

  // ==========================================================
  // 🔥 get_var("x")
  // ==========================================================
  if (value.startsWith('get_var(')) {
    const name =
      value.match(/get_var\("(.+)"\)/)?.[1];

    return simulator.get_var(name);
  }

  // ==========================================================
  // 🔥 NULL
  // ==========================================================
  if (value === "null") {
    return null;
  }

  // ==========================================================
  // 🔥 STRING
  // ==========================================================
  if (
    value.startsWith('"') &&
    value.endsWith('"')
  ) {
    return value.slice(1, -1);
  }

  // ==========================================================
  // 🔥 NUMBER
  // ==========================================================
  const num = Number(value);

  if (!Number.isNaN(num)) {
    return num;
  }

  // ==========================================================
  // 🔥 VARIABLE
  // ==========================================================
  if (
    simulator.variables &&
    value in simulator.variables
  ) {
    return simulator.get_var(value);
  }

  return value;
}

/* ==========================================================
   EXECUTE BLOCK
   ========================================================== */
function executeBlock(
  lines,
  simulator
) {

  let shouldExecute = true;

  let conditionStack = [];

  for (let i = 0; i < lines.length; i++) {

    let line = lines[i].trim();

    if (!line) continue;

    // ==========================================================
    // 🔥 IF
    // ==========================================================
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

    // ==========================================================
    // 🔥 ELSE
    // ==========================================================
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

    // ==========================================================
    // 🔥 FECHAMENTO
    // ==========================================================
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

    // ==========================================================
    // 🔥 PARA CADA
    // ==========================================================
    if (
      line.startsWith(
        "para_cada("
      )
    ) {
      
      const match = line.match(/para_cada\("(.+?)",\s*"(.+?)"/);

      if (!match) continue;

      const variable =
        match[1];

      const queueName =
        match[2];

      const queue =
        simulator.queues[
          queueName
        ];

      if (!queue) continue;

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

      // 🔥 percorre fila
      for (const item of [
        ...queue.data
      ]) {

        simulator.set_var(
          variable,
          item
        );

        executeBlock(
          internalLines,
          simulator
        );
      }

      continue;
    }

   // ==========================================================
    // 🔥 ATRIBUIÇÃO
    // x = 10;
    // ==========================================================
    const assignment =
      line.match(/^(\w+)\s*=\s*(.+);?$/);

    if (assignment) {

      const variable =
        assignment[1];

      let rawValue =
        assignment[2]
          .replace(/;$/, "")
          .trim();

      const value =
        resolveArg(
          rawValue,
          simulator
        );

      simulator.set_var(
        variable,
        value
      );

      continue;
    }
    
    const match =
      line.match(
        /^(\w+)\((.*)\);?$/
      );

    if (!match) continue;

    const operation =
      match[1];

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

    // ==========================================================
    // 🔥 EXECUTA
    // ==========================================================
    if (
      typeof simulator[
        operation
      ] === "function"
    ) {

      // 🔥 ENQUEUE
      if (
        operation ===
        "enqueue"
      ) {

        const [
          queueName,
          value
        ] = args;

        if (
          value === null ||
          value === undefined
        ) {

          simulator.steps.push({
            type: "warning",
            message:
              `valor nulo não pode ser enfileirado`,
            state:
              simulator.getState()
          });

          continue;
        }

        simulator.enqueue(
          queueName,
          value
        );

        continue;
      }

      // 🔥 SET VAR
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

      simulator[
        operation
      ](...args);
    }
  }
}

/* ==========================================================
   EXECUTE QUEUE
   ========================================================== */
export function executeQueue(code) {

  const simulator =
    new QueueSimulator();

  // ==========================================================
  // 🔥 EXECUTAR
  // ==========================================================
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

  executeBlock(
    executableLines,
    simulator
  );

  return simulator.steps;
}