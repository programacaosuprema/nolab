import { javascriptGenerator } from "blockly/javascript";

javascriptGenerator.forBlock['list_run_program'] = function (block) {
  const statements = javascriptGenerator.statementToCode(block, "DO");

  return `// INICIAR_EXECUCAO\n${statements}// FIM_EXECUCAO\n`;
};

javascriptGenerator.forBlock["list_insert"] = function (block) {
  const value =
    javascriptGenerator.valueToCode(
      block,
      "VALUE",
      javascriptGenerator.ORDER_NONE
    ) || "0";

  const list = block.getFieldValue("LIST");

  return `inserir("${list}", ${value});\n`;
};

javascriptGenerator.forBlock["list_remove_last"] = function (block) {
   const listName = block.getFieldValue("LIST");

  return `remover_ultimo("${listName}")\n`;
};

javascriptGenerator.forBlock["list_remove_first"] = function (block) {
   const listName = block.getFieldValue("LIST");

  return `remover_primeiro("${listName}")\n`;
};

javascriptGenerator.forBlock["list_remove_item"] = function (block) {
  const value =
    javascriptGenerator.valueToCode(
      block,
      "VALUE",
      javascriptGenerator.ORDER_NONE
    ) || "0";

  const list = block.getFieldValue("LIST");

  return `remover_item("${list}", ${value});\n`;
};

javascriptGenerator.forBlock["list_remove_index"] = function (block) {
  const index =
    javascriptGenerator.valueToCode(
      block,
      "INDEX",
      javascriptGenerator.ORDER_NONE
    ) || "0";

  const listName = block.getFieldValue("LIST");

  return `remover_da_posicao(${index}, "${listName}")\n`;
};

javascriptGenerator.forBlock["list_size"] = function (block) {

  const listName = block.getFieldValue("LIST");

  return [`tamanho("${listName}")`, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock["list_is_empty"] = function (block) {

 const listName = block.getFieldValue("LIST");

  return [`ta_vazia("${listName}")`, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock["list_container"] = function (block) {

  const name = block.getFieldValue("NAME");

  return `criar_lista("${name}")\n`;
};

javascriptGenerator.forBlock["list_fixed"] = function (block) {
  const name = block.getFieldValue("NAME");

  const size =
    javascriptGenerator.valueToCode(
      block,
      "SIZE",
      javascriptGenerator.ORDER_NONE
    ) || "0";

  return `criar_lista_limitada("${name}", ${size})\n`;
};

javascriptGenerator.forBlock["list_item_position"] = function (block) {
  const value =
    javascriptGenerator.valueToCode(
      block,
      "VALUE",
      javascriptGenerator.ORDER_NONE
    ) || "0";

  const listName = block.getFieldValue("LIST");

  return `exibir_item_pelo_indice(${value}, "${listName}")\n`;
};

javascriptGenerator.forBlock["list_sublist"] = function (block) {
  const firstValue =
    javascriptGenerator.valueToCode(
      block,
      "FIRST_VALUE",
      javascriptGenerator.ORDER_NONE
    ) || "0";

  const secondValue =
    javascriptGenerator.valueToCode(
      block,
      "SECOND_VALUE",
      javascriptGenerator.ORDER_NONE
    ) || "0";

  const listName = block.getFieldValue("LIST");

  return `sublista(${firstValue}, ${secondValue}, "${listName}")\n`;
};

javascriptGenerator.forBlock["list_index"] = function (block) { 

  const value =
    javascriptGenerator.valueToCode(
      block,
      "VALUE",
      javascriptGenerator.ORDER_NONE
    ) || "0";

  const listName = block.getFieldValue("LIST");

  return `exibir_indice_pelo_item(${value}, "${listName}")\n`;
};

javascriptGenerator.forBlock["list_sort_ascending"] = function (block) { 

  const listName = block.getFieldValue("LIST");

  return `ordenar_crescente("${listName}")\n`;
};

javascriptGenerator.forBlock["list_sort_descending"] = function (block) { 

  const listName = block.getFieldValue("LIST");

  return `ordenar_decrescente("${listName}")\n`;
};

javascriptGenerator.forBlock["list_invert"] = function (block) { 

  const listName = block.getFieldValue("LIST");

  return `inverter("${listName}")\n`;
};

javascriptGenerator.forBlock["list_for_each"] = function (block) {
  const variable = block.getFieldValue("VAR");
  const list = block.getFieldValue("LIST");
  const statements = javascriptGenerator.statementToCode(block, "DO");

    return `
      para_cada("${variable}", "${list}", function(${variable}) {
        ${statements}
      })
    `;
};

javascriptGenerator.forBlock["base_if"] = function (block) {
    const condition = javascriptGenerator.valueToCode(block, "CONDITION", 0) || "false";
    const statements = javascriptGenerator.statementToCode(block, "DO");

    return `
      if (${condition}) {
        ${statements}
      }
  `;
};

javascriptGenerator.forBlock["base_if_else"] = function (block) {
  const condition = javascriptGenerator.valueToCode(block, "CONDITION", 0) || "false";
  const doStatements = javascriptGenerator.statementToCode(block, "DO");
  const elseStatements = javascriptGenerator.statementToCode(block, "ELSE");

  return `
  if (${condition}) {
    ${doStatements}
  } else {
    ${elseStatements}
  }
  `;
};

javascriptGenerator.forBlock["base_compare"] = function (block) {
  const A = javascriptGenerator.valueToCode(block, "A", 0) || 0;
  const B = javascriptGenerator.valueToCode(block, "B", 0) || 0;
  const op = block.getFieldValue("OP");

  return [`${A} ${op} ${B}`, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock["base_variable"] = function (block) {
  const name = block.getFieldValue("VAR");
  return [name, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock['base_show'] = function (block) {

  const text =
    javascriptGenerator.valueToCode(block, "TEXT", javascriptGenerator.ORDER_NONE) || '""';

  const value =
    javascriptGenerator.valueToCode(block, "VALUE", javascriptGenerator.ORDER_NONE) || "0";
  return `exibir(${text}, ${value});\n`;
};

javascriptGenerator.forBlock['base_text'] = function (block) {
  const text = block.getFieldValue('TEXT');
  return [`"${text}"`, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock["base_number"] = function (block) {
  const value = Number(block.getFieldValue("VALUE"));
  return [value || 0, javascriptGenerator.ORDER_NONE];
};

/* ==========================================================
   NÃO (negação lógica)
   ========================================================== */
javascriptGenerator.forBlock["base_not"] = function (block) {
  const value =
    javascriptGenerator.valueToCode(
      block,
      "VALUE",
      javascriptGenerator.ORDER_LOGICAL_NOT
    ) || "false";

  return [
    `!(${value})`,
    javascriptGenerator.ORDER_LOGICAL_NOT
  ];
};

/* ==========================================================
   EXIBIR APENAS TEXTO
   ========================================================== */
javascriptGenerator.forBlock["base_show_text"] = function (block) {
  const text =
    javascriptGenerator.valueToCode(
      block,
      "TEXT",
      javascriptGenerator.ORDER_NONE
    ) || '""';

  return `exibir_texto(${text});\n`;
};

/* ==========================================================
   RECEBER VALOR
   ========================================================== */
javascriptGenerator.forBlock["base_input"] = function (block) {
  const variableBlock = block.getInputTargetBlock("VARIABLE");
  const valueBlock = block.getInputTargetBlock("VALUE");

  let variable = "variavel";
  let value = "0";

  if (variableBlock) {
    const result = javascriptGenerator.blockToCode(variableBlock);
    variable = Array.isArray(result) ? result[0] : result;
  }

  if (valueBlock) {
    const result = javascriptGenerator.blockToCode(valueBlock);
    value = Array.isArray(result) ? result[0] : result;
  }

  return `set_var("${variable}", ${value});\n`;
};

// listGenerator.js
javascriptGenerator.forBlock["list_get"] = function (block) {
  const index =
    javascriptGenerator.valueToCode(
      block,
      "INDEX",
      javascriptGenerator.ORDER_NONE
    ) || "0";

  const list =
    block.getFieldValue("LIST") || "minha_lista";

  // 🔥 Retorna expressão, sem ponto e vírgula
  return [
    `pegar(${index}, "${list}")`,
    javascriptGenerator.ORDER_ATOMIC
  ];
};

