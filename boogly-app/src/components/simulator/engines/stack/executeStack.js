import { StackSimulator } from '../../components/stack/StackSimulator';
import { ExpressionEvaluator } from '../core/expressionEvaluator';

const structurename = 'stack';

function executeBlock(lines, simulator) {
  const evaluator = new ExpressionEvaluator(simulator.variables);
  let shouldExecute = true;

  let conditionStack = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) continue;

    /* ======================================================
       IF
    ====================================================== */

    if (line.startsWith('if')) {
      const condition = line.match(/if\s*\((.*)\)/)?.[1];

      let result = false;

      try {
        const parsed = evaluator.resolveCondition(
          condition,
          simulator,
          structurename
        );

        result = eval(parsed);

        simulator.steps.push({
          type: 'condition',

          message: `teste: ${parsed} => ${result ? 'verdadeiro' : 'falso'}`,

          state: simulator.getState(),
        });
      } catch {
        simulator.steps.push({
          type: 'error',

          message: 'erro ao testar condição',

          state: simulator.getState(),
        });
      }

      conditionStack.push({
        result,

        executed: result,
      });

      shouldExecute = result;

      continue;
    }

    /* ======================================================
       ELSE
    ====================================================== */

    if (line.startsWith('} else {')) {
      const current = conditionStack[conditionStack.length - 1];

      if (current.executed) {
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

    if (line === '}') {
      conditionStack.pop();

      shouldExecute =
        conditionStack.length === 0
          ? true
          : conditionStack[conditionStack.length - 1].result;

      continue;
    }

    if (!shouldExecute) continue;

    /* ======================================================
       PARA CADA (STACK)
    ====================================================== */

    if (line.startsWith('para_cada(')) {
      const match = line.match(/para_cada\("(.+?)",\s*"(.+?)"/);

      if (!match) continue;

      const variable = match[1];

      const stackName = match[2];

      const stack = simulator.stacks[stackName];

      if (!stack) continue;

      const internalLines = [];

      let depth = 1;

      i++;

      while (i < lines.length && depth > 0) {
        const internal = lines[i];

        if (internal.includes('{')) depth++;

        if (internal.includes('}')) depth--;

        if (depth > 0) {
          internalLines.push(internal);
        }

        i++;
      }

      i--;

      //  percorre da BASE para o TOPO
      for (const item of [...stack]) {
        simulator.inserir_em_variavel(variable, item);

        executeBlock(internalLines, simulator);
      }

      continue;
    }

    /* ==========================================================
        ATRIBUIÇÃO
       x = 10;
    ========================================================== */
    const assignment = line.match(/^(\w+)\s*=\s*(.+);?$/);

    if (assignment) {
      const variable = assignment[1];

      const rawValue = assignment[2].replace(/;$/, '').trim();

      const value = evaluator.resolveArg(rawValue, simulator);

      simulator.inserir_em_variavel(variable, value);

      continue;
    }

    /* ==========================================================
        CHAMADA DE FUNÇÃO
    ========================================================== */

    const match = line.match(/^(\w+)\((.*)\);?$/);

    if (!match) continue;

    const operation = match[1];

    const args = match[2]
      ? evaluator
          .splitArguments(match[2])
          .map((arg) => evaluator.resolveArg(arg, simulator))
      : [];

    if (typeof simulator[operation] === 'function') {
      // PUSH
      if (operation === 'empilhar') {
        const [stackName, value] = args;

        if (value === null || value === undefined) {
          simulator.steps.push({
            type: 'warning',

            message: 'valor nulo não pode ser empilhado',

            state: simulator.getState(),
          });

          continue;
        }

        simulator.empilhar(stackName, value);

        continue;
      }

      if (operation === 'inserir_em_variavel') {
        let [name, value] = args;

        // remove aspas do nome
        name = name?.replace(/^"|"$/g, '');

        // resolve expressão (aqui está a mágica)
        const evaluatedValue = evaluator.evaluate(value, simulator.variables);

        simulator.inserir_em_variavel(name, evaluatedValue);

        continue;
      }

      if (operation === 'aritmetica') {
        const result = evaluator.evaluate(`aritmetica(${args.join(',')})`);

        this.steps.push({
          type: 'operation',
          operation: 'aritmetica',
          expression: args,
          result,
        });

        continue;
      }
      simulator[operation](...args);
    }
  }
}

/* ==========================================================
   EXECUTE STACK
========================================================== */

export function executeStack(code) {
  const simulator = new StackSimulator();

  if (!code.includes('// INICIAR_EXECUCAO')) {
    return [
      {
        type: 'error',
        message: 'Adicione o bloco EXECUTAR.',
        state: {},
      },
    ];
  }

  const lines = code
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const start = lines.indexOf('// INICIAR_EXECUCAO');

  const end = lines.indexOf('// FIM_EXECUCAO');

  const executableLines = lines.slice(start + 1, end);

  executeBlock(executableLines, simulator);

  return simulator.steps;
}
