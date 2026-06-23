export class StackSimulator {

  constructor() {
    this.stacks = {};
    this.fixedSizes = {};
    this.variables = {};
    this.steps = [];
  }

  getState() {

    const state = {};

    for (const key in this.stacks) {
        state[key] = [...this.stacks[key]];
    }

    state.variables = {
        ...this.variables
    };

    return state;
  }

  set_var(name, value) {

    this.variables[name] = value;

    this.steps.push({
        type: "assign",
        message: `${name} = ${value}`,
        state: this.getState()
    });
  }

  get_var(name) {
      return this.variables[name];
  }

  snapshot() {
      return this.getState();
  }

  criar_pilha(name) {

    this.stacks[name] = [];

    this.steps.push({
        type: "create",
        message: `Pilha ${name} criada`,
        state: this.snapshot()
    });
  }

  criar_pilha_fixa(name, size) {

    this.stacks[name] = [];

    this.fixedSizes[name] = Number(size);

    this.steps.push({
        type: "create_fixed",
        message: `Pilha fixa ${name} criada com tamanho ${size}`,
        state: this.snapshot()
    });
  }

  empilhar(name, value) {

    if (!this.stacks[name]) return;

    const limit = this.fixedSizes[name];

    if (
        limit > 0 &&
        this.stacks[name].length >= limit
    ) {

        this.steps.push({
            type: "warning",
            message:
                `A pilha ${name} atingiu o tamanho máximo`,
            state: this.snapshot()
        });

        return;
    }

    this.stacks[name].push(value);

    this.steps.push({
        type: "push",
        value,
        message:
            `Elemento ${value} entrou na pilha ${name}`,
        state: this.snapshot()
    });
  }

  desempilhar(name) {

    if (
        !this.stacks[name] ||
        this.stacks[name].length === 0
    ) return;

    const index =
        this.stacks[name].length - 1;

    this.steps.push({

        type: "highlight_remove",

        index,

        stack: name,

        state: this.snapshot()

    });

    const removed =
        this.stacks[name].pop();

    this.steps.push({

        type: "pop",

        value: removed,

        message:
            `Elemento ${removed} saiu da pilha ${name}`,

        stack: name,

        state: this.snapshot()

    });

  }

  topo(name) {

    const value =
        this.stacks[name]?.[
            this.stacks[name].length - 1
        ];

    this.steps.push({

        type: "peek",

        value,

        message:
            `Topo da pilha ${name}: ${value}`,

        state: this.snapshot()

    });

    return value;

  }

  tamanho_pilha(name) {

    const size =
        this.stacks[name]?.length || 0;

    this.steps.push({

        type: "size",

        value: size,

        message:
            `Tamanho da pilha ${name}: ${size}`,

        state: this.snapshot()

    });

    return size;

  }

  pilha_vazia(name) {

    const empty =
        !this.stacks[name] ||
        this.stacks[name].length === 0;

    this.steps.push({

        type: "empty",

        value: empty,

        message:
            `Pilha ${name} ${
                empty
                    ? "está vazia"
                    : "não está vazia"
            }`,

        state: this.snapshot()

    });

    return empty;

  }

}