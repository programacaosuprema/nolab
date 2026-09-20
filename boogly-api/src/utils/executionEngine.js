export class ExecutionEngine {
  constructor(startState = []) {
    this.state = Array.isArray(startState) ? [...startState] : [];
    this.steps = [];
  }

  // Comando que não executaveis
  normalize(commands = []) {
    const skipTypes = new Set([
      "base_number",
      "base_text",
      "base_variable",
      "base_not",

      "base_arithmetic",
      "base_compare",

      "list_container",
      "list_fixed",

      "queue_container",
      "queue_fixed",

      "stack_container",
      "stack_fixed",

      "list_run_program",
      "queue_run_program",
      "stack_run_program",
    ]);

    return (commands || []).filter((c) => !skipTypes.has(c.type));
  }

  // 🔥 EXECUTA UM COMANDO
  executeCommand(cmd) {
    switch (cmd.type) {
      case "list_insert":
      case "insert":
      case "enqueue":
      case "push":
        if (cmd.value !== undefined && cmd.value !== null) {
          this.state.push(cmd.value);
        }
        break;

      case "list_remove_first":
      case "remove_first":
      case "dequeue":
      case "pop_front":
        this.state.shift();
        break;

      case "list_remove_last":
      case "remove_last":
      case "pop":
        this.state.pop();
        break;

      case "list_invert":
      case "invert":
        this.state.reverse();
        break;

      // 👇 comandos que não alteram estado
      case "list_get":
      case "list_index":
      case "list_size":
      case "peek":
      case "queue_front":
      case "stack_peek":
        break;

      default:
        break;
    }

    this.addStep(cmd);
  }

  // 🔥 REGISTRA STEP
  addStep(cmd) {
    this.steps.push({
      command: cmd,
      state: [...this.state],
    });
  }

  // 🔥 EXECUTA TUDO
  run(commands = []) {
    const normalized = this.normalize(commands);

    for (const cmd of normalized) {
      this.executeCommand(cmd);
    }

    return this.steps;
  }

  // 🔥 RESET (útil pra replay)
  reset(startState = []) {
    this.state = Array.isArray(startState) ? [...startState] : [];
    this.steps = [];
  }
}