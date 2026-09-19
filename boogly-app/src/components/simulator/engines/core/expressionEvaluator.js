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

    if (value.startsWith('aritmetica(')) {
      const [a, op, b] = this.parseParams(value);

      const valA = this.resolveArg(a);
      const valB = this.resolveArg(b);

      const cleanOp = op.replace(/^"|"$/g, '');

      return this.resolveArithmetic(valA, cleanOp, valB);
    }

    if (value.startsWith('pegar_da_variavel(')) {
      const name = value.match(/pegar_da_variavel\("(.+?)"\)/)?.[1];
      return this.simulator.pegar_da_variavel(name);
    }

    if (value.startsWith('tamanho_lista(')) {
      const name = value.match(/tamanho_lista\("(.+?)"\)/)?.[1];
      return this.simulator.tamanho_lista(name);
    }

    if (value.startsWith('tamanho_pilha(')) {
      const name = value.match(/tamanho_pilha\("(.+?)"\)/)?.[1];
      return this.simulator.tamanho_pilha(name);
    }

    if (value.startsWith('tamanho_fila(')) {
      const name = value.match(/tamanho_fila\("(.+?)"\)/)?.[1];
      return this.simulator.tamanho_fila(name);
    }

    if (value.startsWith('pegar(')) {
      const match = value.match(/pegar\((.+?),\s*"(.+?)"\)/);

      if (match) {
        const pos = this.resolveArg(match[1]);
        const list = match[2];

        return this.simulator.pegar(pos, list);
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
    let parsed = condition;

    for (const key in this.variables) {
      const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      parsed = parsed.replace(
        new RegExp(`\\b${safeKey}\\b`, 'g'),
        this.variables[key]
      );
    }

    switch (structure) {
      case 'list':
        parsed = parsed.replace(/tamanho_lista\("(.+?)"\)/g, (_, listName) =>
          this.simulator.tamanho_lista(listName)
        );
        break;
      case 'stack':
        parsed = parsed.replace(/tamanho_pilha\("(.+?)"\)/g, (_, stackName) =>
          this.simulator.tamanho_pilha(stackName)
        );
        break;
      default:
        parsed = parsed.replace(/tamanho_fila\("(.+?)"\)/g, (_, queueName) =>
          this.simulator.tamanho_fila(queueName)
        );
        break;
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
    if (this.simulator.variables && Object.prototype.hasOwnProperty.call(this.simulator.variables, expr)) {
      return this.simulator.variables[expr];
    }

    return expr;
  }
}
