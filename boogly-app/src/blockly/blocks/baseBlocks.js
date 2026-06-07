import * as Blockly from "blockly/core";
import "blockly/blocks";
import { normalizeIdentifier }from "../utils/normalizeIdentifier";
import { hasDuplicateName } from "../utils/normalizeNames";

/* ==========================================================
   BLOCO: NÃO (negação lógica)
   ========================================================== */
Blockly.Blocks["base_not"] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck(null)
      .appendField("não");

    this.setOutput(true, null);
    this.setColour(800);
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

Blockly.Blocks["base_input"] = {
  init: function () {
    this.appendValueInput("VARIABLE")
      .setCheck("Variable");

    this.appendDummyInput()
      .appendField("=");

    this.appendValueInput("VALUE")
      .setCheck(["Value", "Variable"]);

    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(60);
    this.setTooltip("Atribui um valor a uma variável.");

    this.setOnChange(function () {
      const variableBlock = this.getInputTargetBlock("VARIABLE");

      if (!variableBlock) {
        this.setWarningText("Conecte uma variável no lado esquerdo.");
        return;
      }

      const name = variableBlock.getFieldValue("VAR");

      if (!name) {
        this.setWarningText("Nome de variável inválido.");
        return;
      }

      if (hasDuplicateName(this.workspace, name, this.id)) {
        this.setWarningText(
          `Já existe uma variável/estrutura com o nome "${name}".`
        );
        return;
      }

      this.setWarningText(null);
    });
  }
};

// VARIABLE
Blockly.Blocks['base_variable'] = {
  init: function () {

    this.appendDummyInput()
      .appendField(
        new Blockly.FieldTextInput(
          "variavel",
          (text) =>
            normalizeIdentifier(
              text,
              "variavel"
            )
        ),
        "VAR"
      );

    this.setOutput(true, "Variable");
    this.setColour(988);
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

    this.setColour(130); // pode ajustar depois

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
      .setCheck(["Value", "Variable"]);

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