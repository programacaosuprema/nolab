import * as Blockly from "blockly/core";
import "blockly/blocks";

/* ==========================================================
   BLOCO: NÃO (negação lógica)
   ========================================================== */
Blockly.Blocks["base_not"] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck(null)
      .appendField("não");

    this.setOutput(true, null);
    this.setColour(210);
    this.setTooltip("Inverte o valor lógico.");
  }
};

/* ==========================================================
   BLOCO: EXIBIR TEXTO
   Exemplo: exibir "Olá Mundo"
   ========================================================== */
Blockly.Blocks["base_show_text"] = {
  init: function () {
    this.appendValueInput("TEXT")
      .setCheck(null)
      .appendField("exibir texto");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
    this.setTooltip("Exibe apenas um texto.");
  }
};

/* ==========================================================
   BLOCO: RECEBER VALOR
   Exemplo: receber valor
   Usado como expressão para leitura do teclado.
   ========================================================== */
Blockly.Blocks["base_input"] = {
  init: function () {
    // 🔹 Lado esquerdo: aceita SOMENTE blocos do tipo "Variable"
    this.appendValueInput("VARIABLE")
      .setCheck("Variable");

    this.appendDummyInput()
      .appendField("=");

    // 🔹 Lado direito: aceita qualquer bloco do tipo "Value"
    this.appendValueInput("VALUE")
      .setCheck("Value");

    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(60);
    this.setTooltip("Atribui um valor a uma variável.");

    // 🔥 Validação extra para garantir que o lado esquerdo
    // seja exclusivamente um bloco base_variable.
    this.setOnChange(function () {
      const variableBlock =
        this.getInputTargetBlock("VARIABLE");

      if (
        variableBlock &&
        variableBlock.type !== "base_variable"
      ) {
        this.unplug(true);
        this.setWarningText(
          "O lado esquerdo deve conter apenas uma variável."
        );
      } else {
        this.setWarningText(null);
      }
    });
  }
};

// VARIABLE
Blockly.Blocks['base_variable'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(new Blockly.FieldTextInput("variável"), "VAR");

    this.setOutput(true, null);
    this.setColour(60);
  }
};

// TEXT
Blockly.Blocks['base_text'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('"')
      .appendField(new Blockly.FieldTextInput("texto"), "TEXT")
      .appendField('"');

    this.setOutput(true, "String"); // 🔥 IMPORTANTE

    this.setColour(160); // pode ajustar depois

    this.setTooltip("Texto");
    this.setHelpUrl("");
  }
};

// NUMBER
Blockly.Blocks["base_number"] = {
  init: function () {
    this.appendDummyInput()
      .appendField(new Blockly.FieldNumber(0), "VALUE");

    this.setOutput(true, null);
    this.setColour(60);
  }
};

// COMPARE
Blockly.Blocks["base_compare"] = {
  init: function () {
    this.appendValueInput("A")
      // 🔥 Aceita qualquer bloco que retorne "Value"
      .setCheck("Value");

    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["=", "=="],
          ["≠", "!="],
          [">", ">"],
          ["<", "<"],
          ["≥", ">="],
          ["≤", "<="]
        ]),
        "OP"
      );

    this.appendValueInput("B")
      // 🔥 Aceita qualquer bloco que retorne "Value"
      .setCheck("Value");

    this.setInputsInline(true);

    // 🔥 Resultado da comparação é booleano
    this.setOutput(true, "Boolean");

    this.setColour(210);

    this.setOnChange(function () {
      const a = this.getInputTargetBlock("A");
      const b = this.getInputTargetBlock("B");

      if (!a || !b) {
        this.setWarningText(
          "Preencha os dois lados da comparação"
        );
      } else {
        this.setWarningText(null);
      }
    });
  }
};

// IF
Blockly.Blocks['base_if'] = {
  init: function () {
    this.appendValueInput("CONDITION")
      .setCheck("Boolean")
      .appendField("se");

    this.appendStatementInput("DO")
      .appendField("faça");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(289);

    this.setOnChange(function() {
      const condition = this.getInputTargetBlock("CONDITION");

      if (!condition) {
        this.setWarningText("Adicione uma condição");
      } else {
        this.setWarningText(null);
      }
      });
    }
};

// IF ELSE
Blockly.Blocks['base_if_else'] = {
  init: function () {
    this.appendValueInput("CONDITION")
      .setCheck("Boolean") // 🔥 FALTAVA ISSO
      .appendField("se");

    this.appendStatementInput("DO")
      .appendField("faça");

    this.appendStatementInput("ELSE")
      .appendField("senão");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(289);  

    this.setOnChange(function() {
      const condition = this.getInputTargetBlock("CONDITION");

      if (!condition) {
        this.setWarningText("Adicione uma condição");
      } else {
        this.setWarningText(null);
      }
    }); 
  }
};

Blockly.Blocks["base_show"] = {
  init: function () {

    this.appendValueInput("TEXT")
      .setCheck("String")
      .appendField("exibir");

    this.appendDummyInput().
    appendField("+");

    this.appendValueInput("VALUE").setCheck(null);

    this.setInputsInline(true);

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);

    this.setColour(200);

    this.setTooltip("Exibe texto + valor");
    this.setHelpUrl("");
  }
};