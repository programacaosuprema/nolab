export function getDeclaredNames(workspace, ignoreBlockId = null) {
  const names = new Set();

  const blocks = workspace.getAllBlocks(false);

  for (const block of blocks) {
    if (ignoreBlockId && block.id === ignoreBlockId) continue;

    // base_input -> variável declarada à esquerda
    if (block.type === "base_input") {
      const varBlock = block.getInputTargetBlock("VARIABLE");
      const name = varBlock?.getFieldValue("VAR");
      if (name) names.add(name);
    }

    // listas, filas, pilhas
    if (
      block.type === "list_container" ||
      block.type === "list_fixed" ||
      block.type === "queue_container" ||
      block.type === "queue_fixed" ||
      block.type === "stack_container" ||
      block.type === "stack_fixed"
    ) {
      const name = block.getFieldValue("NAME");
      if (name) names.add(name);
    }

    // for_each / loops com variável declarada
    if (
      block.type === "list_for_each" ||
      block.type === "queue_for_each" ||
      block.type === "stack_for_each"
    ) {
      const varBlock = block.getInputTargetBlock("VARIABLE");
      const name = varBlock?.getFieldValue("VAR");
      if (name) names.add(name);
    }
  }

  return names;
}

export function hasDuplicateName(workspace, name, ignoreBlockId = null) {
  const names = getDeclaredNames(workspace, ignoreBlockId);
  return names.has(name);
}