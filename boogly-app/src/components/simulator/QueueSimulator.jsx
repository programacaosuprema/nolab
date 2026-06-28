export class QueueSimulator {
  constructor() {
    this.queues = {};
    this.fixedSizes = {};
    this.variables = {};
    this.steps = [];
  }

   set_var(name, value) {
    this.variables[name] = value;
    this.steps.push({
      type: "assign",
      message: `${name} = ${value}`,
      state: this.getState()
    });
  }
  
  getState() {
    const state = {};

    // 🔥 copia filas
    for (const key in this.queues) {
      state[key] = [...this.queues[key]];
    }

    // 🔥 copia variáveis
    state.variables = {
      ...this.variables
    };

    return state;
  }

  get_var(name) {
    return this.variables[name];
  }

  pegar(posicao, nome) {
    const fila = this.queues[nome];

    // 🔥 fila não existe
    if (!fila) {
      this.steps.push({
        type: "error",
        message: `fila "${nome}" não existe`,
        state: this.getState()
      });

      return null;
    }

    // 🔥 posição inválida
    if (
      posicao < 0 ||
      posicao >= fila.length
    ) {
      this.steps.push({
        type: "warning",
        message: `posição ${posicao} é nula`,
        state: this.getState()
      });

      return null;
    }

    return fila[posicao];
  }

  criar_fila(name) {
    this.queues[name] = [];

    this.steps.push({
      type: "create",
      message: `Fila ${name} criada`,
      state: this.snapshot()
    });
  }

  criar_fila_fixa(name, size) {
    this.queues[name] = [];
    this.fixedSizes[name] = Number(size) || 0;

    this.steps.push({
      type: "create_fixed",
      message: `Fila fixa ${name} criada com tamanho ${size}`,
      state: this.snapshot()
    });
  }

  enfileirar(name, value) {
    if (!this.queues[name]) return;

    const limit = this.fixedSizes[name];
    if (limit > 0 && this.queues[name].length >= limit) {
      this.steps.push({
        type: "warning",
        message: `A fila ${name} atingiu o tamanho máximo`,
        state: this.snapshot()
      });
      return;
    }

    this.queues[name].push(value);

    this.steps.push({
      type: "enqueue",
      value,
      message: `Elemento ${value} entrou na fila ${name}`,
      state: this.snapshot()
    });
  }

  snapshot() {
    return this.getState();
  }

  desenfileirar(name) {
    if (!this.queues[name] || this.queues[name].length === 0) return;

    // 🔥 PASSO 1 → highlight (ANTES de remover)
    this.steps.push({
      type: "highlight_remove",
      index: 0,
      queue: name, // importante se tiver múltiplas filas
      state: this.snapshot()
    });

    const removed = this.queues[name].shift();

    // 🔥 PASSO 2 → estado atualizado
    this.steps.push({
      type: "dequeue",
      value: removed,
      message: `Elemento ${removed} saiu da fila ${name}`,
      queue: name,
      state: this.snapshot()
    });
  }

  ver_inicio(name) {
    const value = this.queues[name]?.[0];

    this.steps.push({
      type: "front",
      value,
      message: `Primeiro elemento da fila ${name}: ${value}`,
      state: this.snapshot()
    });

    return value;
  }

  tamanho_fila(name) {

    const queue = this.queues[name];

    if (!queue) {

        this.steps.push({
            type: "warning",
            message: `Fila ${name} não existe.`,
            state: this.snapshot()
        });

        return 0;
    }

    const size = queue.length;

    this.steps.push({
        type: "size",
        value: size,
        message: `Tamanho da fila ${name}: ${size}`,
        state: this.snapshot()
    });

    return size;
  }

  fila_vazia(name) {
    const empty = !this.queues[name] || this.queues[name].length === 0;

    this.steps.push({
      type: "empty",
      value: empty,
      message: `Fila ${name} ${empty ? "está vazia" : "não está vazia"}`,
      state: this.snapshot()
    });

    return empty;
  }
}