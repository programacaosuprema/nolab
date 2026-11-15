export class ExpressionEvaluator {
  constructor(simulator) {
    this.simulator = simulator;
    this.variables = simulator.variables || {};
  }

  stripParentheses(value) {
    while (value.startsWith('(') && value.endsWith(')')) {
      value = value.slice(1, -1).trim();
    }
    return value;
  }

  resolveArg(arg, simulator) {
    if (arg == null) return null;

    let value = arg.toString().trim();

    value = this.stripParentheses(value);

    if (value.startsWith('ta_vazia(')) {
      const match = value.match(/^ta_vazia\(\s*["']([^"']+)["']\s*\)$/);

      if (match) {
        const listName = match[1];
        const list = simulator.lists?.[listName];

        if (!list) {
          throw new Error(`Lista "${listName}" não encontrada`);
        }

        return list.data.length === 0;
      }
    }

    if (value.startsWith('aritmetica(')) {
      const [a, op, b] = this.parseParams(value);

      const valA = this.resolveArg(a, simulator);
      const valB = this.resolveArg(b, simulator);

      const cleanOp = op.replace(/^"|"$/g, '');

      return this.resolveArithmetic(valA, cleanOp, valB);
    }

    if (value.startsWith('ver_inicio(')) {
      const match = value.match(/^ver_inicio\(\s*["']([^"']+)["']\s*\)$/);

      if (match) {
        const queueName = match[1];
        const queue = simulator.queues?.[queueName];

        if (!queue) {
          throw new Error(`Fila "${queueName}" não encontrada`);
        }

        if (queue.length === 0) {
          throw new Error(`Fila "${queueName}" está vazia`);
        }

        return queue[0];
      }
    }

    if (value.startsWith('topo(')) {
      const match = value.match(/^topo\(\s*["']([^"']+)["']\s*\)$/);

      if (match) {
        const stackName = match[1];
        const stack = simulator.stacks?.[stackName];

        if (!stack) {
          throw new Error(`Pilha "${stackName}" não encontrada`);
        }

        if (stack.length === 0) {
          throw new Error(`Pilha "${stackName}" está vazia`);
        }

        return stack[stack.length - 1];
      }
    }

    if (value.startsWith('pegar_da_variavel(')) {
      const name = value.match(/pegar_da_variavel\("(.+?)"\)/)?.[1];

      return simulator.pegar_da_variavel(name);
    }

    if (value.startsWith('tamanho_lista(')) {
      const name = value.match(/tamanho_lista\("(.+?)"\)/)?.[1];

      return simulator.tamanho_lista(name);
    }

    if (value.startsWith('tamanho_pilha(')) {
      const name = value.match(/tamanho_pilha\("(.+?)"\)/)?.[1];

      return simulator.tamanho_pilha(name);
    }

    if (value.startsWith('tamanho_fila(')) {
      const name = value.match(/tamanho_fila\("(.+?)"\)/)?.[1];

      return simulator.tamanho_fila(name);
    }

    if (value.startsWith('pegar(')) {
      const match = value.match(/pegar\((.+?),\s*"(.+?)"\)/);

      if (match) {
        const pos = this.resolveArg(match[1], simulator);
        const list = match[2];

        return simulator.pegar(pos, list);
      }
    }

    if (value === 'null') return null;

    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    const num = Number(value);
    if (!Number.isNaN(num)) return num;

    if (
      simulator.variables &&
      Object.prototype.hasOwnProperty.call(simulator.variables, value)
    ) {
      return simulator.pegar_da_variavel(value);
    }

    return value;
  }

  resolveArithmetic(a, op, b) {
    a = Number(a);
    b = Number(b);

    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b !== 0 ? a / b : null;
      default:
        throw new Error(`Operador inválido: ${op}`);
    }
  }

  parseParams(linha) {
    const inside = linha.match(/\((.*)\)/)?.[1];
    if (!inside) return [];

    return this.splitArguments(inside);
  }

  //  substitui seu splitArguments
  splitArguments(argsString) {
    const args = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if (char === '(') depth++;
      if (char === ')') depth--;

      if (char === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      args.push(current.trim());
    }

    return args;
  }

  //  substitui resolveCondition

  resolveCondition(condition, structure) {
    let parsed = String(condition ?? '').trim();

    // Resolve as operações conforme a estrutura
    switch (structure) {
      case 'list':
        parsed = parsed.replace(
          /ta_vazia\(\s*["']([^"']+)["']\s*\)/g,
          (_, listName) => {
            const list = this.simulator.lists?.[listName];

            if (!list) {
              throw new Error(`Lista "${listName}" não encontrada`);
            }

            return String(list.data.length === 0);
          }
        );

        parsed = parsed.replace(
          /tamanho_lista\(\s*["']([^"']+)["']\s*\)/g,
          (_, listName) => String(this.simulator.tamanho_lista(listName))
        );
        break;

      case 'stack':
        // Verifica se a pilha está vazia
        parsed = parsed.replace(
          /pilha_vazia\(\s*["']([^"']+)["']\s*\)/g,
          (_, stackName) => String(this.simulator.pilha_vazia(stackName))
        );

        // Obtém o tamanho da pilha
        parsed = parsed.replace(
          /tamanho_pilha\(\s*["']([^"']+)["']\s*\)/g,
          (_, stackName) => String(this.simulator.tamanho_pilha(stackName))
        );

        // Obtém o elemento do topo
        parsed = parsed.replace(
          /topo\(\s*["']([^"']+)["']\s*\)/g,
          (_, stackName) => {
            const stack = this.simulator.stacks?.[stackName];

            if (!stack) {
              throw new Error(`Pilha "${stackName}" não encontrada`);
            }

            if (stack.length === 0) {
              throw new Error(`Pilha "${stackName}" está vazia`);
            }

            return JSON.stringify(stack[stack.length - 1]);
          }
        );

        break;

      case 'queue':
        // Verifica se a fila está vazia
        parsed = parsed.replace(
          /fila_vazia\(\s*["']([^"']+)["']\s*\)/g,
          (_, queueName) => {
            const queue = this.simulator.queues?.[queueName];

            if (!queue) {
              throw new Error(`Fila "${queueName}" não encontrada`);
            }

            return String(queue.length === 0);
          }
        );

        // Obtém o tamanho da fila
        parsed = parsed.replace(
          /tamanho_fila\(\s*["']([^"']+)["']\s*\)/g,
          (_, queueName) => String(this.simulator.tamanho_fila(queueName))
        );

        // Obtém o primeiro elemento da fila
        parsed = parsed.replace(
          /ver_inicio\(\s*["']([^"']+)["']\s*\)/g,
          (_, queueName) => {
            const queue = this.simulator.queues?.[queueName];

            if (!queue) {
              throw new Error(`Fila "${queueName}" não encontrada`);
            }

            if (queue.length === 0) {
              throw new Error(`Fila "${queueName}" está vazia`);
            }

            return JSON.stringify(queue[0]);
          }
        );

        break;
    }

    // Substitui variáveis por seus valores
    for (const [key, value] of Object.entries(this.simulator.variables || {})) {
      const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      parsed = parsed.replace(
        new RegExp(`\\b${safeKey}\\b`, 'g'),
        String(value)
      );
    }

    return parsed;
  }

  evaluate(expr) {
    if (expr == null) return null;

    if (typeof expr === 'number') return expr;

    expr = expr.toString().trim();

    // número
    if (!isNaN(expr)) return Number(expr);

    // string
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }

    //  aritmetica
    if (expr.startsWith('aritmetica')) {
      const [a, op, b] = this.parseParams(expr);

      const valA = this.evaluate(a);
      const valB = this.evaluate(b);

      const cleanOp = op?.replace(/^"|"$/g, '');

      return this.resolveArithmetic(valA, cleanOp, valB);
    }

    // variável
    if (
      this.simulator.variables &&
      Object.prototype.hasOwnProperty.call(this.simulator.variables, expr)
    ) {
      return this.simulator.variables[expr];
    }

    return expr;
  }

  evaluateCondition(condition, structure, alreadyParsed = false) {
    const parsed = alreadyParsed
      ? condition
      : this.resolveCondition(condition, structure);

    const strip = (text) => {
      let value = String(text).trim();

      while (value.startsWith('(') && value.endsWith(')')) {
        let depth = 0;
        let complete = true;

        for (let i = 0; i < value.length; i++) {
          if (value[i] === '(') depth++;
          if (value[i] === ')') depth--;

          if (depth === 0 && i < value.length - 1) {
            complete = false;
            break;
          }
        }

        if (!complete || depth !== 0) break;
        value = value.slice(1, -1).trim();
      }

      return value;
    };

    const evaluate = (text) => {
      const value = strip(text);

      if (value === 'true') return true;
      if (value === 'false') return false;
      if (value === 'null') return null;

      if (/^-?\d+(\.\d+)?$/.test(value)) {
        return Number(value);
      }

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        return value.slice(1, -1);
      }

      // Localiza comparação fora dos parênteses
      let depth = 0;
      const operators = ['===', '!==', '==', '!=', '>=', '<=', '>', '<'];

      for (let i = 0; i < value.length; i++) {
        if (value[i] === '(') depth++;
        else if (value[i] === ')') depth--;

        if (depth !== 0) continue;

        for (const op of operators) {
          if (value.startsWith(op, i)) {
            const left = evaluate(value.slice(0, i));
            const right = evaluate(value.slice(i + op.length));

            switch (op) {
              case '==':
              case '===':
                return left === right;
              case '!=':
              case '!==':
                return left !== right;
              case '>':
                return left > right;
              case '<':
                return left < right;
              case '>=':
                return left >= right;
              case '<=':
                return left <= right;
            }
          }
        }
      }

      throw new Error(`Condição não suportada: ${value}`);
    };

    const result = evaluate(parsed);

    if (typeof result !== 'boolean') {
      throw new Error(`Condição não é booleana: ${parsed}`);
    }

    return result;
  }
}
