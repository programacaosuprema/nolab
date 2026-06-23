import { javascriptGenerator } from "blockly/javascript";

javascriptGenerator.forBlock["stack_run_program"] = function (block) {
  const branch = javascriptGenerator.statementToCode(block, "DO") || "";
  return `// INICIAR_EXECUCAO\n${branch}// FIM_EXECUCAO\n`;
};

/* ==========================================================
   CRIAR PILHA
   ========================================================== */
javascriptGenerator.forBlock["stack_container"] =
  function (block) {

    const name =
      block.getFieldValue("NAME");

    return `criar_pilha("${name}");\n`;
  };

/* ==========================================================
   CRIAR PILHA FIXA
   ========================================================== */
javascriptGenerator.forBlock["stack_fixed"] =
  function (block) {

    const name =
      block.getFieldValue("NAME");

    const sizeBlock =
      block.getInputTargetBlock("SIZE");

    let size = "0";

    if (sizeBlock) {
      const generated =
        javascriptGenerator.blockToCode(
          sizeBlock
        );

      size = Array.isArray(generated)
        ? generated[0]
        : generated;
    }

    return `criar_pilha_fixa("${name}", ${size});\n`;
  };

/* ==========================================================
   EMPILHAR
   ========================================================== */
javascriptGenerator.forBlock["push"] =
  function (block) {

    const valueBlock =
      block.getInputTargetBlock("VALUE");

    let value = "0";

    if (valueBlock) {
      const generated =
        javascriptGenerator.blockToCode(
          valueBlock
        );

      value = Array.isArray(generated)
        ? generated[0]
        : generated;
    }

    const stack =
      block.getFieldValue("STACK");

    return `empilhar("${stack}", ${value});\n`;
  };

/* ==========================================================
   DESEMPILHAR
   ========================================================== */
javascriptGenerator.forBlock["pop"] =
  function (block) {

    const stack =
      block.getFieldValue("STACK");

    return `desempilhar("${stack}");\n`;
  };

/* ==========================================================
   TOPO
   ========================================================== */
javascriptGenerator.forBlock["peek"] =
  function (block) {

    const stack =
      block.getFieldValue("STACK");

    return [
      `topo("${stack}")`,
      javascriptGenerator.ORDER_ATOMIC
    ];
  };

/* ==========================================================
   TAMANHO
   ========================================================== */
javascriptGenerator.forBlock["stack_size"] =
  function (block) {

    const stack =
      block.getFieldValue("STACK");

    return [
      `tamanho_pilha("${stack}")`,
      javascriptGenerator.ORDER_ATOMIC
    ];
  };

/* ==========================================================
   PILHA VAZIA
   ========================================================== */
javascriptGenerator.forBlock["stack_empty"] =
  function (block) {

    const stack =
      block.getFieldValue("STACK");

    return [
      `pilha_vazia("${stack}")`,
      javascriptGenerator.ORDER_ATOMIC
    ];
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

javascriptGenerator.forBlock['base_show'] = function (block) {
  const text =
    javascriptGenerator.valueToCode(block, "TEXT", javascriptGenerator.ORDER_NONE) || '""';

  const value =
    javascriptGenerator.valueToCode(block, "VALUE", javascriptGenerator.ORDER_NONE) || "0";

  return `exibir(${text}, ${value});\n`;
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

javascriptGenerator.forBlock["base_variable"] = function (block) {
  const name = block.getFieldValue("VAR");
  return [name, javascriptGenerator.ORDER_ATOMIC];
};

javascriptGenerator.forBlock['base_text'] = function (block) {
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

javascriptGenerator.forBlock["stack_for_each"] = function (block) {
  const variableBlock = block.getInputTargetBlock("VARIABLE");

  let variable = "item";

  if (variableBlock) {
    variable =
      variableBlock.getFieldValue("VAR") || "item";
  }
  
  const stack  = block.getFieldValue("STACK");
  const statements = javascriptGenerator.statementToCode(block, "DO");

    return `
      para_cada("${variable}", "${stack}", function(${variable}) {
        ${statements}
      })
    `;
};