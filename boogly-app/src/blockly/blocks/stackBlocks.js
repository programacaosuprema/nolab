import * as Blockly from "blockly";
import { normalizeIdentifier }from "../utils/normalizeIdentifier";


function blockSameName(block) {
  if (!block.workspace) return;

  const name = block.getFieldValue("NAME");
  const allBlocks = block.workspace.getAllBlocks();

  const sameName = allBlocks.filter(b =>
    (b.type === "stack_container" || b.type === "stack_fixed") &&
    b.id !== block.id &&
    b.getFieldValue("NAME") === name
  );

  if (sameName.length > 0) {
    block.setWarningText("Já existe uma lista com esse nome!");
    block.setColour(0);
  } else {
    block.setWarningText(null);
    block.setColour(230);
  }
}


export function getStacks(workspace) {

  const blocks =
    workspace.getAllBlocks(false);

  const stacks = [];

  blocks.forEach(block => {

    if (
      block.type === "stack_container" ||
      block.type === "stack_fixed"
    ) {

      const name =
        block.getFieldValue("NAME");

      stacks.push([
        name,
        name
      ]);
    }
  });

  return stacks.length
    ? stacks
    : [["minha_pilha","minha_pilha"]];
}

Blockly.Blocks["stack_run_program"] = {
  init: function () {
    this.appendDummyInput().appendField("🚩 Quando EXECUTAR for clicado");

    this.appendStatementInput("DO").setCheck(null);

    this.setColour(490);
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setDeletable(true);
    this.setMovable(true);
    this.setTooltip("Bloco inicial do programa");
  }
};

Blockly.Blocks['stack_container'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("criar pilha")
      .appendField(
        new Blockly.FieldTextInput(
          "minha_pilha",
          (text) =>
          normalizeIdentifier(
            text,
          "variavel"
        )
      ),
        "NAME"
      );

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(130);
  },

  onchange: function () {
    blockSameName(this);
  }
};

Blockly.Blocks["stack_fixed"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("criar pilha")
      .appendField(
        new Blockly.FieldTextInput(
          "minha_pilha_fixa",
          (text) =>
          normalizeIdentifier(
            text,
            "variavel"
          )
        ),
        "NAME"
      )
      .appendField("tamanho");

    this.appendValueInput("SIZE")
      .setCheck("Value");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setColour(130);
  },

  onchange: function () {
    blockSameName(this);
  }
};

Blockly.Blocks["push"] = {
  init: function () {

    this.appendValueInput("VALUE")
      .setCheck(["Value","Variable"])
      .appendField("empilhar");

    this.appendDummyInput()
      .appendField("na")
      .appendField(
        new Blockly.FieldDropdown(
          () => getStacks(this.workspace)
        ),
        "STACK"
      );

    this.setInputsInline(true);

    this.setPreviousStatement(true);
    this.setNextStatement(true);

    this.setColour(0);
  }
};

Blockly.Blocks["pop"] = {
  init: function () {

    this.appendDummyInput()
      .appendField("desempilhar")
      .appendField(
        new Blockly.FieldDropdown(
          () => getStacks(this.workspace)
        ),
        "STACK"
      );

    this.setPreviousStatement(true);
    this.setNextStatement(true);

    this.setColour(0);
  }
};

Blockly.Blocks["peek"] = {
  init: function () {

    this.appendDummyInput()
      .appendField("topo de")
      .appendField(
        new Blockly.FieldDropdown(
          () => getStacks(this.workspace)
        ),
        "STACK"
      );

    this.setOutput(true,"Value");

    this.setColour(160);
  }
};

Blockly.Blocks["stack_size"] = {
  init: function () {

    this.appendDummyInput()
      .appendField("tamanho da")
      .appendField(
        new Blockly.FieldDropdown(
          () => getStacks(this.workspace)
        ),
        "STACK"
      );

    this.setOutput(true,"Value");

    this.setColour(60);
  }
};

Blockly.Blocks["stack_empty"] = {
  init: function () {

    this.appendDummyInput()
      .appendField("pilha vazia")
      .appendField(
        new Blockly.FieldDropdown(
          () => getStacks(this.workspace)
        ),
        "STACK"
      );

    this.setOutput(true,"Boolean");

    this.setColour(60);
  }
};

Blockly.Blocks["stack_for_each"] = {
  init: function () {

    // 🔥 variável do loop
    this.appendValueInput("VARIABLE")
      .setCheck("Variable")
      .appendField("para cada");

    // 🔥 lista
    this.appendDummyInput()
      .appendField("em")
      .appendField(
        new Blockly.FieldDropdown(
          () => getStacks(this.workspace)
        ),
        "Stack"
      );

    // 🔥 corpo
    this.appendStatementInput("DO")
      .appendField("faça");

    this.setInputsInline(true);

    this.setPreviousStatement(true);
    this.setNextStatement(true);

    this.setColour(30);
  }
}