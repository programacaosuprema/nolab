import * as Blockly from "blockly/core";
import "blockly/blocks";
import { normalizeIdentifier }from "../utils/normalizeIdentifier";

/* =====================================================
   🔹 UTIL: verificar nomes duplicados de filas
===================================================== */
function blockSameName(block) {
  if (!block.workspace) return;

  const name = block.getFieldValue("NAME");
  const allBlocks = block.workspace.getAllBlocks();

  const sameName = allBlocks.filter(
    (b) =>
      (b.type === "queue_container" || b.type === "queue_fixed") &&
      b.id !== block.id &&
      b.getFieldValue("NAME") === name
  );

  if (sameName.length > 0) {
    block.setWarningText("Já existe uma fila com esse nome!");
    block.setColour(0);
  } else {
    block.setWarningText(null);
    block.setColour(200);
  }
}

/* =====================================================
   🔹 UTIL: obter filas disponíveis
   Mesma lógica da lista: nunca retorna vazio
===================================================== */
function getQueues(workspace) {
  if (!workspace) return [["-", "-"]];

  const blocks = workspace.getAllBlocks(false);

  const queues = blocks
    .filter((b) => b.type === "queue_container" || b.type === "queue_fixed")
    .map((b) => b.getFieldValue("NAME"))
    .filter((name) => name && name.trim() !== "");

  if (queues.length === 0) return [["-", "-"]];

  return queues.map((name) => [name, name]);
}

/* =====================================================
   🔹 BLOCO: RUN PROGRAM
===================================================== */
Blockly.Blocks["queue_run_program"] = {
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

/* =====================================================
   🔹 BLOCO: CRIAR FILA
===================================================== */
Blockly.Blocks["queue_container"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("criar fila")
      .appendField(
        new Blockly.FieldTextInput(
        "minha_fila", 
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

/* =====================================================
   🔹 BLOCO: CRIAR FILA FIXA
===================================================== */
Blockly.Blocks["queue_fixed"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("criar fila")
      .appendField(
        new Blockly.FieldTextInput(
          "minha_fila_fixa", 
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
    this.setColour(130);
  },

  onchange: function () {
    blockSameName(this);
  }
};

/* =====================================================
   🔹 BLOCO: ENFILEIRAR
===================================================== */
Blockly.Blocks["enqueue"] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck(["Variable", "Value"])
      .appendField("enfileirar");

    this.appendDummyInput()
      .appendField("na")
      .appendField(new Blockly.FieldDropdown(() => getQueues(this.workspace)), "QUEUE");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setColour(160);
  }
};

/* =====================================================
   🔹 BLOCO: DESENFILEIRAR
===================================================== */
Blockly.Blocks["dequeue"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("desenfileirar da")
      .appendField(new Blockly.FieldDropdown(() => getQueues(this.workspace)), "QUEUE");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
  }
};

/* =====================================================
   🔹 BLOCO: VER INÍCIO DA FILA
===================================================== */
Blockly.Blocks["queue_front"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("ver início da")
      .appendField(new Blockly.FieldDropdown(() => getQueues(this.workspace)), "QUEUE");

    this.setOutput(true, null);
    this.setColour(60);
  }
};

/* =====================================================
   🔹 BLOCO: TAMANHO DA FILA
===================================================== */
Blockly.Blocks["queue_size"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("tamanho da")
      .appendField(new Blockly.FieldDropdown(() => getQueues(this.workspace)), "QUEUE");

    this.setOutput(true, "Number");
    this.setColour(60);
  }
};

/* =====================================================
   🔹 BLOCO: FILA ESTÁ VAZIA
===================================================== */
Blockly.Blocks["queue_is_empty"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("fila")
      .appendField(new Blockly.FieldDropdown(() => getQueues(this.workspace)), "QUEUE")
      .appendField("está vazia");

    this.setOutput(true, "Boolean");
    this.setColour(60);
  }
};

/* =====================================================
   🔹 BLOCO: EXIBIR
===================================================== */

Blockly.Blocks["queue_for_each"] = {
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
          () => getQueues(this.workspace)
        ),
        "Queue"
      );

    // 🔥 corpo
    this.appendStatementInput("DO")
      .appendField("faça");

    this.setInputsInline(true);

    this.setPreviousStatement(true);
    this.setNextStatement(true);

    this.setColour(30);
  }
};








