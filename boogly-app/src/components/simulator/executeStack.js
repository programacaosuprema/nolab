import { StackSimulator } from "./StackSimulator";

/* ==========================================================
   RESOLVE CONDITION
========================================================== */
function resolveCondition(condition, simulator) {

  let parsed = condition;

  // 🔥 substitui variáveis
  for (const key in simulator.variables) {

    const value =
      simulator.variables[key];

    parsed = parsed.replace(
      new RegExp(`\\b${key}\\b`, "g"),
      value
    );

  }

  parsed = parsed.replace(
      /tamanho_pilha\("(.+?)"\)/g,
      (_, stackName) => simulator.tamanho_pilha(stackName)
  );

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

    // STRING
    if (char === '"') {
      inString = !inString;
      current += char;
      continue;
    }

    if (!inString) {

      if (char === "(") depth++;

      if (char === ")") depth--;

    }

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

  while (
    value.startsWith("(") &&
    value.endsWith(")")
  ) {

    value =
      value.slice(1, -1).trim();

  }

  if (value.startsWith("tamanho_pilha(")) {

      const stackName =
          value.match(/tamanho_pilha\("(.+?)"\)/)?.[1];

      return simulator.tamanho_pilha(stackName);
  }

  // get_var("x")
  if (
    value.startsWith("get_var(")
  ) {

    const name =
      value.match(/get_var\("(.+)"\)/)?.[1];

    return simulator.get_var(name);

  }

  // null
  if (value === "null") {

    return null;

  }

  // string
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

/* ==========================================================
   EXECUTE BLOCK
========================================================== */
function executeBlock(
  lines,
  simulator
) {

  let shouldExecute = true;

  let conditionStack = [];

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    let line =
      lines[i].trim();

    if (!line)
      continue;

    /* ======================================================
       IF
    ====================================================== */

    if (
      line.startsWith("if")
    ) {

      const condition =
        line.match(
          /if\s*\((.*)\)/
        )?.[1];

      let result = false;

      try {

        const parsed =
          resolveCondition(
            condition,
            simulator
          );

        result =
          eval(parsed);

        simulator.steps.push({

          type: "condition",

          message:
            `teste: ${parsed} => ${
              result
                ? "verdadeiro"
                : "falso"
            }`,

          state:
            simulator.getState()

        });

      }
      catch {

        simulator.steps.push({

          type: "error",

          message:
            "erro ao testar condição",

          state:
            simulator.getState()

        });

      }

      conditionStack.push({

        result,

        executed: result

      });

      shouldExecute =
        result;

      continue;

    }

    /* ======================================================
       ELSE
    ====================================================== */

    if (
      line.startsWith("} else {")
    ) {

      const current =
        conditionStack[
          conditionStack.length - 1
        ];

      if (
        current.executed
      ) {

        shouldExecute = false;

        current.result = false;

        continue;

      }

      shouldExecute = true;

      current.executed = true;
      current.result = true;

      continue;

    }

    /* ======================================================
       FECHAMENTO
    ====================================================== */

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

    if (!shouldExecute)
      continue;

    /* ======================================================
       PARA CADA (STACK)
    ====================================================== */

    if (
      line.startsWith(
        "para_cada("
      )
    ) {

      const match =
        line.match(
          /para_cada\("(.+?)",\s*"(.+?)"/
        );

      if (!match)
        continue;

      const variable =
        match[1];

      const stackName =
        match[2];

      const stack =
        simulator.stacks[
          stackName
        ];

      if (!stack)
        continue;

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
        ) depth++;

        if (
          internal.includes("}")
        ) depth--;

        if (
          depth > 0
        ) {

          internalLines.push(
            internal
          );

        }

        i++;

      }

      i--;

      // 🔥 percorre da BASE para o TOPO
      for (
        const item of [...stack]
      ) {

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

        /* ==========================================================
       🔥 ATRIBUIÇÃO
       x = 10;
    ========================================================== */
    const assignment =
      line.match(/^(\w+)\s*=\s*(.+);?$/);

    if (assignment) {

      const variable =
        assignment[1];

      const rawValue =
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

    /* ==========================================================
       🔥 CHAMADA DE FUNÇÃO
    ========================================================== */

    const match =
      line.match(
        /^(\w+)\((.*)\);?$/
      );

    if (!match)
      continue;

    const operation =
      match[1];

    const args =
      match[2]
        ? splitArguments(match[2])
            .map(arg =>
              resolveArg(
                arg,
                simulator
              )
            )
        : [];

    /* ==========================================================
       🔥 EXECUÇÃO
    ========================================================== */

    if (
      typeof simulator[
        operation
      ] === "function"
    ) {

      // PUSH
      if (
        operation === "empilhar"
      ) {

        const [
          stackName,
          value
        ] = args;

        if (
          value === null ||
          value === undefined
        ) {

          simulator.steps.push({

            type: "warning",

            message:
              "valor nulo não pode ser empilhado",

            state:
              simulator.getState()

          });

          continue;

        }

        simulator.empilhar(
          stackName,
          value
        );

        continue;

      }

      // SET VAR
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
   EXECUTE STACK
========================================================== */

export function executeStack(code) {

  const simulator =
    new StackSimulator();

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

  const lines =
    code
      .split("\n")
      .map(line =>
        line.trim()
      )
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