import { javascriptGenerator } from "blockly/javascript";

javascriptGenerator.forBlock['list_run_program'] = function (block) {
  const statements = javascriptGenerator.statementToCode(block, "DO");

  return `// INICIAR_EXECUCAO\n${statements}// FIM_EXECUCAO\n`;
};

javascriptGenerator.forBlock["list_insert"] = function (block) {

  const value = block.getFieldValue("VALUE");
  const listName = block.getFieldValue("LIST");

  return `inserir(${value}, "${listName}")\n`;
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
  const value = block.getFieldValue("VALUE");
  const listName = block.getFieldValue("LIST");

  return `remover_item(${value}, "${listName}")\n`;
};

javascriptGenerator.forBlock["list_remove_index"] = function (block) {
  const index = block.getFieldValue("INDEX");
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
  const size = block.getFieldValue("SIZE");

  return `criar_lista_limitada("${name}", ${size})\n`;
};

javascriptGenerator.forBlock["list_item_position"] = function (block) { /*  */

  const value = block.getFieldValue("VALUE");
  const listName = block.getFieldValue("LIST");

  return `exibir_item_pelo_indice(${value}, "${listName}")\n`;
};

javascriptGenerator.forBlock["list_sublist"] = function (block) { 

  const first_value = block.getFieldValue("FIRST_VALUE");
  const second_value = block.getFieldValue("SECOND_VALUE");
  const listName = block.getFieldValue("LIST");

  return `sublista(${first_value}, ${second_value}, "${listName}")\n`;
};

javascriptGenerator.forBlock["list_index"] = function (block) { 

  const value = block.getFieldValue("VALUE");

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