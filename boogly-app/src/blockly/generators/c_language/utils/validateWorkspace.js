export function validateWorkspace(workspace) {

  const identifiers = new Map();
  const errors = [];

  workspace.getAllBlocks(false).forEach(block => {

    let name = null;

    // Estruturas
    if (
      block.type === "list_container" ||
      block.type === "list_fixed" ||
      block.type === "queue_container" ||
      block.type === "queue_fixed" ||
      block.type === "stack_container" ||
      block.type === "stack_fixed"
    ) {
      name = block.getFieldValue("NAME");
    }

    // Variáveis declaradas
    else if (block.type === "base_input") {

      const variable =
        block.getInputTargetBlock("VARIABLE");

      name =
        variable?.getFieldValue("VAR");
    }

    // Variáveis do for_each
    else if (
      block.type === "list_for_each" ||
      block.type === "queue_for_each" ||
      block.type === "stack_for_each"
    ) {

      const variable =
        block.getInputTargetBlock("VARIABLE");

      name =
        variable?.getFieldValue("VAR");
    }

    if (!name) return;

    // Já existe?
    if (identifiers.has(name)) {

      const firstBlockId =
        identifiers.get(name);

      errors.push({
        blockId: block.id,
        firstBlockId,
        name,
        message:
          `Identificador duplicado: "${name}"`
      });

      return;
    }

    identifiers.set(name, block.id);
  });

  return errors;
}