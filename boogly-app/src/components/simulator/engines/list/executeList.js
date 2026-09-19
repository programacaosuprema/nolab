import { ListSimulator } from '../../components/list/ListSimulator';
import { ExpressionEvaluator } from '../core/expressionEvaluator';

const structurename = 'list';

function executeBlock(lines, simulator, operationMap) {
  const evaluator = new ExpressionEvaluator(simulator.variables);

  let shouldExecute = true;

  let conditionStack = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) continue;

    // ======================
    //  IF
    // ======================
    if (line.startsWith('if')) {
      const condition = line.match(/if\s*\((.*)\)/)?.[1];

      let result = false;

      try {
        const parsedCondition = evaluator.resolveCondition(
          condition,
          simulator,
          structurename
        );

        result = eval(parsedCondition);

        simulator.steps.push({
          type: 'condition',
          message: `teste: ${parsedCondition} => ${
            result ? 'verdadeiro' : 'falso'
          }`,
          state: simulator.getState(),
        });
      } catch (e) {
        console.error(e);

        simulator.steps.push({
          type: 'error',
          message: e.message,
          state: simulator.getState(),
        });

        result = false;
      }

      conditionStack.push({
        result,
        executed: result,
      });

      shouldExecute = result;

      continue;
    }

    // ======================
    //  ELSE
    // ======================
    if (line.startsWith('} else {')) {
      const current = conditionStack[conditionStack.length - 1];

      //  IF já executou
      if (current.executed) {
        shouldExecute = false;

        current.result = false;

        continue;
      }

      //  IF foi falso
      shouldExecute = true;

      current.result = true;
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
          : conditionStack[conditionStack.length - 1].result;

      continue;
    }

    if (!shouldExecute) continue;

    // ======================
    //  PARA CADA
    // ======================
    if (line.startsWith('para_cada(')) {
      const match = line.match(/para_cada\("(.+?)",\s*"(.+?)"/);

      if (!match) continue;

      const variable = match[1];

      const listName = match[2];

      const list = simulator.lists[listName];

      if (!list) continue;

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

      //  percorre lista
      for (const item of [...list.data]) {
        simulator.inserir_em_variavel(variable, item);

        executeBlock(internalLines, simulator, operationMap);
      }

      continue;
    }

    // ==========================================================
    //  ATRIBUIÇÃO
    // x = 10;
    // ==========================================================
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

    const rawOperation = match[1];

    const operation = operationMap[rawOperation] || rawOperation;

    const args = match[2]
      ? evaluator
          .splitArguments(match[2])
          .map((arg) => evaluator.resolveArg(arg, simulator))
      : [];

    if (typeof simulator[operation] === 'function') {
      // ======================
      //  INSERIR
      // ======================
      if (operation === 'inserir') {
        const [nome, valor] = args;

        if (valor === null || valor === undefined) {
          simulator.steps.push({
            type: 'warning',
            message: `valor nulo não pode ser inserido`,
            state: simulator.getState(),
          });

          continue;
        }

        simulator.inserir(valor, nome);

        continue;
      }

      // ======================
      //  REMOVER ITEM
      // ======================
      if (operation === 'remover_item') {
        const [nome, valor] = args;

        simulator.remover_item(valor, nome);

        continue;
      }

      // ======================
      //  REMOVER POSIÇÃO
      // ======================
      if (operation === 'remover_da_posicao') {
        continue;
      }

      // ======================
      //  LISTA FIXA
      // ======================
      if (operation === 'criar_lista_limitada') {
        const [nome, tamanho] = args;

        simulator.criar_lista_limitada(nome, tamanho);

        continue;
      }

      // ======================
      //  SUBLISTA
      // ======================
      if (operation === 'sublista') {
        const [nome, inicio, fim] = args;

        simulator.sublista(inicio, fim, nome);

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

export function executeList(code) {
  const simulator = new ListSimulator();

  // ======================
  //  EXECUTAR
  // ======================
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

  // ======================
  //  MAPA
  // ======================
  const operationMap = {
    insert: 'inserir',
    remove_last: 'remover_ultimo',
    remove_first: 'remover_primeiro',
    remove_item: 'remover_item',
    remove_index: 'remover_da_posicao',
    sublist: 'sublista',
    invert: 'inverter',
    sort_ascending: 'ordenar_crescente',
    sort_descending: 'ordenar_decrescente',
    list_container: 'criar_lista',
    list_fixed: 'criar_lista_limitada',
  };

  executeBlock(executableLines, simulator, operationMap);

  return simulator.steps;
}
