import { QueueSimulator } from '../../components/queue/QueueSimulator';
import { ExpressionEvaluator } from '../core/expressionEvaluator';
const structurename = 'queue';

function executeBlock(lines, simulator) {
  const evaluator = new ExpressionEvaluator(simulator);

  let shouldExecute = true;

  let conditionStack = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) continue;

    // ==========================================================
    //  IF
    // ==========================================================

    if (/^se\s*\(/.test(line)) {
      const condition = line
        .replace(/^se\s*/, '')
        .replace(/\{\s*$/, '')
        .trim();

      const parentActive = shouldExecute;
      let result = false;

      if (parentActive) {
        try {
          const parsed = evaluator.resolveCondition(condition, structurename);

          result = evaluator.evaluateCondition(parsed, structurename, true);

          simulator.steps.push({
            type: 'condition',
            message: `teste: ${parsed} => ${result ? 'verdadeiro' : 'falso'}`,
            state: simulator.getState(),
          });
        } catch (error) {
          simulator.steps.push({
            type: 'error',
            message: error.message,
            state: simulator.getState(),
          });
        }
      }

      conditionStack.push({
        result,
        executed: result,
        parentActive,
      });

      shouldExecute = parentActive && result;

      continue;
    }

    // ======================
    //  ELSE
    // ======================
    if (/^\}\s*senao\s*\{$/.test(line)) {
      const current = conditionStack[conditionStack.length - 1];

      if (!current) {
        throw new Error('senão sem se correspondente');
      }

      shouldExecute = current.parentActive && !current.executed;

      current.result = shouldExecute;
      current.executed = true;

      continue;
    }

    // ======================
    //  FECHAMENTO
    // ======================
    if (line === '}') {
      conditionStack.pop();

      shouldExecute =
        conditionStack.length === 0
          ? true
          : conditionStack[conditionStack.length - 1].parentActive &&
            conditionStack[conditionStack.length - 1].result;

      continue;
    }

    if (!shouldExecute) continue;

    // ==========================================================
    //  PARA CADA
    // ==========================================================
    if (line.startsWith('para_cada(')) {
      const match = line.match(/para_cada\("(.+?)",\s*"(.+?)"/);

      if (!match) continue;

      const variable = match[1];

      const queueName = match[2];

      const queue = simulator.queues[queueName];

      if (!queue) continue;

      //  captura bloco interno
      const internalLines = [];

      let depth = 1;

      i++;

      while (i < lines.length && depth > 0) {
        const internal = lines[i];

        if (internal.includes('{')) {
          depth++;
        }

        if (internal.includes('}')) {
          depth--;
        }

        if (depth > 0) {
          internalLines.push(internal);
        }

        i++;
      }

      i--;

      //  percorre fila
      for (const item of [...queue.data]) {
        simulator.inserir_em_variavel(variable, item);

        executeBlock(internalLines, simulator);
      }

      continue;
    }

    const assignment = line.match(/^(\w+)\s*=\s*(.+);?$/);

    if (assignment) {
      const variable = assignment[1];

      let rawValue = assignment[2].replace(/;$/, '').trim();

      const value = evaluator.resolveArg(rawValue, simulator);

      simulator.inserir_em_variavel(variable, value);

      continue;
    }

    const match = line.match(/^(\w+)\((.*)\);?$/);

    if (!match) continue;

    const operation = match[1];

    const args = match[2]
      ? evaluator
          .splitArguments(match[2])
          .map((arg) => evaluator.resolveArg(arg, simulator))
      : [];

    // ==========================================================
    //  EXECUTA
    // ==========================================================
    if (typeof simulator[operation] === 'function') {
      //  enfileirar
      if (operation === 'enfileirar') {
        let [queueName, value] = args;

        queueName = queueName.replace(/^"|"$/g, '');

        //  valor resolve (x → 2)
        const resolvedValue = evaluator.evaluate(value);

        if (resolvedValue === null || resolvedValue === undefined) {
          simulator.steps.push({
            type: 'warning',
            message: `valor nulo não pode ser enfileirado`,
            state: simulator.getState(),
          });

          continue;
        }

        simulator.enfileirar(queueName, resolvedValue);

        simulator.steps.push({
          type: 'enqueue',
          queue: queueName,
          value: resolvedValue,
          state: simulator.getState(),
        });

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
   EXECUTE QUEUE
   ========================================================== */
export function executeQueue(code) {
  const simulator = new QueueSimulator();

  // ==========================================================
  //  EXECUTAR
  // ==========================================================
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
