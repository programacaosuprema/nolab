import * as Blockly from "blockly/core";
import "blockly/blocks";

/* =====================================================
   🔹 UTIL: verificar nomes duplicados de listas
===================================================== */
function blockSameName(block) {
  if (!block.workspace) return;

  const name = block.getFieldValue("NAME");
  const allBlocks = block.workspace.getAllBlocks();

  const sameName = allBlocks.filter(b =>
    (b.type === "list_container" || b.type === "list_fixed") &&
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

/* =====================================================
   🔹 UTIL: obter listas disponíveis
===================================================== */
function getLists(workspace) {
  if (!workspace) return [["-", "-"]];

  const blocks = workspace.getAllBlocks();

  const lists = blocks
    .filter(b => b.type === "list_container" || b.type === "list_fixed")
    .map(b => b.getFieldValue("NAME"))
    .filter(name => name && name.trim() !== "");

  if (lists.length === 0) return [["-", "-"]];

  return lists.map(name => [name, name]);
}

Blockly.Blocks['list_run_program'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("🚩 Quando EXECUTAR for clicado");

    this.appendStatementInput("DO")
      .setCheck(null);

    this.setColour(490);

    // 🔥 IMPORTANTE
    this.setPreviousStatement(false); // não conecta acima
    this.setNextStatement(false);     // não conecta abaixo

    this.setDeletable(true);
    this.setMovable(true);

    this.setTooltip("Bloco inicial do programa");
  }
};

/* =====================================================
   🔹 BLOCO: LISTA SIMPLES
===================================================== */
Blockly.Blocks['list_container'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("criar lista")
      .appendField(new Blockly.FieldTextInput("minha_lista"), "NAME");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(130);
  },

  onchange: function () {
    blockSameName(this);
  }
};

/* =====================================================
   🔹 BLOCO: LISTA FIXA
===================================================== */
Blockly.Blocks['list_fixed'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("criar lista")
      .appendField(new Blockly.FieldTextInput("minha_lista_fixa"), "NAME")
      .appendField("tamanho")
      .appendField(new Blockly.FieldNumber(3, 0), "SIZE");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(130);
  },

  onchange: function () {
    blockSameName(this);
  }
};

/* =====================================================
   🔹 BLOCO: INSERIR
===================================================== */
Blockly.Blocks['list_insert'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("inserir")
      .appendField(new Blockly.FieldNumber(0), "VALUE")
      .appendField("em")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(100, 100, 100);
  } 
};

/* =====================================================
   🔹 BLOCO: REMOVER (último)
===================================================== */
Blockly.Blocks['list_remove_last'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("remover último de")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(0);
  }
};

Blockly.Blocks['list_remove_first'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("remover primeiro de")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(0);
  }
};

/* =====================================================
   🔹 BLOCO: REMOVER ITEM (valor)
===================================================== */
Blockly.Blocks['list_remove_item'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("remover item")
      .appendField(new Blockly.FieldNumber(0), "VALUE")
      .appendField("de")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(0);
  }
};

/* =====================================================
   🔹 BLOCO: REMOVER POR ÍNDICE
===================================================== */
Blockly.Blocks['list_remove_index'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("remover posição")
      .appendField(new Blockly.FieldNumber(0, 0), "INDEX")
      .appendField("de")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(0);
  }
};

/* =====================================================
   🔹 BLOCO: TAMANHO
===================================================== */
Blockly.Blocks['list_size'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("tamanho de")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST");
    this.setOutput(true, "Number"); // 🔥 AGORA É VALOR
    this.setColour(60);
  }
};

/* =====================================================
   🔹 BLOCO: VERIFICAR SE VAZIA
===================================================== */
Blockly.Blocks['list_is_empty'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("lista")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST")
      .appendField("está vazia");

    this.setOutput(true, "Boolean");
    
    this.setColour(60);
  }
};

Blockly.Blocks['list_item_position'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("exibir item da posição ")
      .appendField(new Blockly.FieldNumber(0), "VALUE")
      .appendField("de")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(200);
  }
};

Blockly.Blocks['list_sublist'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("sublista de")
      .appendField(new Blockly.FieldNumber(0), "FIRST_VALUE")
      .appendField("até")
      .appendField(new Blockly.FieldNumber(0), "SECOND_VALUE")
      .appendField("de")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(200);
  }
};

Blockly.Blocks['list_index'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("exibir posição do item ")
      .appendField(new Blockly.FieldNumber(0), "VALUE")
      .appendField("de")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(200);
  }
};

Blockly.Blocks['list_sort_ascending'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("ordenar ")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST")
      .appendField(" (crescente)");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(490);
  }
};

Blockly.Blocks['list_sort_descending'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("ordenar ")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST")
      .appendField(" (decrescente)");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(490);
  }
};

Blockly.Blocks['list_invert'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("inverter ")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST")

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(490);
  }
};

Blockly.Blocks['list_for_each'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("para cada")
      .appendField(new Blockly.FieldTextInput("item"), "VAR")
      .appendField("em")
      .appendField(new Blockly.FieldDropdown(() => getLists(this.workspace)), "LIST");

    this.appendStatementInput("DO")
      .appendField("faça");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(30);
  }
};


