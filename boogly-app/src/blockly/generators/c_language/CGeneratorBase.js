import { Generator } from "blockly";

export const CGenerator = new Generator("C");

/* ==========================================================
   BASE NUMBER
   ========================================================== */
CGenerator.forBlock["base_number"] = function (block) {
  const value = Number(block.getFieldValue("VALUE") || 0);
  return [value.toString(), CGenerator.ORDER_ATOMIC];
};

/* ==========================================================
   BASE VARIABLE
   ========================================================== */
CGenerator.forBlock["base_variable"] = function (block) {
  const name = block.getFieldValue("VAR") || "variavel";
  return ["let " + name, CGenerator.ORDER_ATOMIC];
};

/* ==========================================================
   BASE TEXT
   ========================================================== */
CGenerator.forBlock["base_text"] = function (block) {
  const text = block.getFieldValue("TEXT") || "";
  return [`"${text}"`, CGenerator.ORDER_ATOMIC];
};

/* ==========================================================
   BASE COMPARE
   ========================================================== */
CGenerator.forBlock["base_compare"] = function (block) {
  const aBlock = block.getInputTargetBlock("A");
  const bBlock = block.getInputTargetBlock("B");

  let a = "0";
  let b = "0";

  if (aBlock) {
    const result = CGenerator.blockToCode(aBlock);
    a = Array.isArray(result) ? result[0] : result;
  }

  if (bBlock) {
    const result = CGenerator.blockToCode(bBlock);
    b = Array.isArray(result) ? result[0] : result;
  }

  const op = block.getFieldValue("OP") || "==";

  return [`${a} ${op} ${b}`, CGenerator.ORDER_NONE];
};

/* ==========================================================
   BASE NOT
   ========================================================== */
CGenerator.forBlock["base_not"] = function (block) {
  const valueBlock = block.getInputTargetBlock("VALUE");

  let value = "0";

  if (valueBlock) {
    const result = CGenerator.blockToCode(valueBlock);
    value = Array.isArray(result) ? result[0] : result;
  }

  return [`!(${value})`, CGenerator.ORDER_UNARY_PREFIX];
};

/* ==========================================================
   BASE INPUT
   Exemplo:
   x = 10
   ========================================================== */
CGenerator.forBlock["base_input"] = function (block) {
  const variableBlock =
    block.getInputTargetBlock("VARIABLE");

  const valueBlock =
    block.getInputTargetBlock("VALUE");

  let variable = "variavel";
  let value = "0";

  if (variableBlock) {
    const result = CGenerator.blockToCode(variableBlock);
    variable = Array.isArray(result)
      ? result[0]
      : result;
  }

  if (valueBlock) {
    const result = CGenerator.blockToCode(valueBlock);
    value = Array.isArray(result)
      ? result[0]
      : result;
  }

  return `${variable} = ${value};\n`;
};

/* ==========================================================
   BASE SHOW TEXT
   Exemplo:
   printf("%s\n", "Olá");
   ========================================================== */
CGenerator.forBlock["base_show_text"] = function (block) {
  const textBlock =
    block.getInputTargetBlock("TEXT");

  let text = '""';

  if (textBlock) {
    const result = CGenerator.blockToCode(textBlock);
    text = Array.isArray(result)
      ? result[0]
      : result;
  }

  return `printf("%s\\n", ${text});\n`;
};


CGenerator.forBlock["list_get"] = function (block) {
  const indexBlock = block.getInputTargetBlock("INDEX");

  let index = "0";

  if (indexBlock) {
    const result = CGenerator.blockToCode(indexBlock);
    index = Array.isArray(result) ? result[0] : result;
  }

  const list = block.getFieldValue("LIST") || "lista";

  return [
    `pegar(${index}, &${list})`,
    CGenerator.ORDER_ATOMIC
  ];
};

export default CGenerator;