import { javascriptGenerator } from "blockly/javascript";

function safeQueue(block) {
  const q = block.getFieldValue("QUEUE");
  return q && q !== "" ? `"${q}"` : `"default_queue"`;
}

javascriptGenerator.forBlock["queue_run_program"] = function (block) {
  const branch = javascriptGenerator.statementToCode(block, "DO") || "";
  return `// INICIAR_EXECUCAO\n${branch}// FIM_EXECUCAO\n`;
};

javascriptGenerator.forBlock["queue_container"] = function (block) {
  const name = block.getFieldValue("NAME");
  return `criar_fila("${name}");\n`;
};

javascriptGenerator.forBlock["queue_fixed"] = function (block) {
  const name = block.getFieldValue("NAME");
  const size = Number(block.getFieldValue("SIZE") || 0);
  return `criar_fila_fixa("${name}", ${size});\n`;
};

javascriptGenerator.forBlock["enqueue"] = function (block) {
  const value = javascriptGenerator.valueToCode(block, "VALUE", 0) || 0;
  const queue = safeQueue(block);
  return `enfileirar(${queue}, ${value});\n`;
};

javascriptGenerator.forBlock["dequeue"] = function (block) {
  const queue = safeQueue(block);
  return `desenfileirar(${queue});\n`;
};

javascriptGenerator.forBlock["queue_front"] = function (block) {
  const queue = safeQueue(block);
  return [`ver_inicio(${queue})`, 0];
};

javascriptGenerator.forBlock["queue_size"] = function (block) {
  const queue = safeQueue(block);
  return [`tamanho_fila(${queue})`, 0];
};

javascriptGenerator.forBlock["queue_is_empty"] = function (block) {
  const queue = safeQueue(block);
  return [`fila_vazia(${queue})`, 0];
};

javascriptGenerator.forBlock['queue_show'] = function (block) {
  const text =
    javascriptGenerator.valueToCode(block, "TEXT", javascriptGenerator.ORDER_NONE) || '""';

  const value =
    javascriptGenerator.valueToCode(block, "VALUE", javascriptGenerator.ORDER_NONE) || "0";

  return `exibir(${text}, ${value});\n`;
};

javascriptGenerator.forBlock["base_variable"] = function (block) {
  const name = block.getFieldValue("VAR");
  return [name, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['base_queue_text'] = function (block) {
  const text = block.getFieldValue('TEXT');
  return [`"${text}"`, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock["base_number"] = function (block) {
  const value = Number(block.getFieldValue("VALUE"));
  return [value || 0, javascriptGenerator.ORDER_NONE];
};

javascriptGenerator.forBlock["base_compare"] = function (block) {
  const A = javascriptGenerator.valueToCode(block, "A", 0) || 0;
  const B = javascriptGenerator.valueToCode(block, "B", 0) || 0;
  const op = block.getFieldValue("OP");

  return [`${A} ${op} ${B}`, javascriptGenerator.ORDER_NONE];
};


javascriptGenerator.forBlock["base_if"] = function (block) {
  const condition = javascriptGenerator.valueToCode(block, "CONDITION", 0) || "false";
  const statements = javascriptGenerator.statementToCode(block, "DO");

  return `if (${condition}) {\n${statements}}\n`;
};

javascriptGenerator.forBlock["base_if_else"] = function (block) {
  const condition = javascriptGenerator.valueToCode(block, "CONDITION", 0) || "false";
  const doStatements = javascriptGenerator.statementToCode(block, "DO");
  const elseStatements = javascriptGenerator.statementToCode(block, "ELSE");

  return `if (${condition}) {\n${doStatements}} else {\n${elseStatements}}\n`;
};

javascriptGenerator.forBlock["queue_for_each"] = function (block) {
  const variableBlock = block.getInputTargetBlock("VARIABLE");

  let variable = "item";

  if (variableBlock) {
    variable =
      variableBlock.getFieldValue("VAR") || "item";
  }
  
  const list = block.getFieldValue("QUEUE");
  const statements = javascriptGenerator.statementToCode(block, "DO");

    return `
      para_cada("${variable}", "${list}", function(${variable}) {
        ${statements}
      })
    `;
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
  const variable =
    javascriptGenerator.valueToCode(
      block,
      "VARIABLE",
      javascriptGenerator.ORDER_ASSIGNMENT
    ) || "variavel";

  const value =
    javascriptGenerator.valueToCode(
      block,
      "VALUE",
      javascriptGenerator.ORDER_ASSIGNMENT
    ) || "0";

  return `${variable} = ${value};\n`;
};