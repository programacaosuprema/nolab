
//Este código bloqueia o bloco base_iput dentro do for_each das estruturas

import * as Blockly from "blockly/core";

export class CustomConnectionChecker extends Blockly.ConnectionChecker {
  doTypeChecks(a, b) {
    if (!super.doTypeChecks(a, b)) return false;

    const forEachBlocks = [
      "list_for_each",
      "queue_for_each",
      "stack_for_each",
    ];

    const isInsideForEach = (block) => {
      let current = block;

      while (current) {
        if (forEachBlocks.includes(current.type)) {
          return true;
        }

        current = current.getParent();
      }

      return false;
    };

    const containsBaseInput = (block) => {
      return block.getDescendants(false).some(
        (child) => child.type === "base_input"
      );
    };

    const checkConnection = (inserted, target) => {
      if (
        isInsideForEach(target.getSourceBlock()) &&
        containsBaseInput(inserted.getSourceBlock())
      ) {
        return false;
      }

      return true;
    };

    if (
      a.type === Blockly.PREVIOUS_STATEMENT ||
      a.type === Blockly.OUTPUT_VALUE
    ) {
      return checkConnection(a, b);
    }

    if (
      b.type === Blockly.PREVIOUS_STATEMENT ||
      b.type === Blockly.OUTPUT_VALUE
    ) {
      return checkConnection(b, a);
    }

    return true;
  }
}
