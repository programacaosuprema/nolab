import { Generator } from "blockly";

export const CGenerator = new Generator("C");

CGenerator.forBlock['base_number'] = function(block) {
  const value = Number(block.getFieldValue('VALUE') || 0);
  return [value.toString(), CGenerator.ORDER_ATOMIC];
};

CGenerator.forBlock['base_variable'] = function(block) {
  return [block.getFieldValue('VAR'), CGenerator.ORDER_ATOMIC];
};

CGenerator.forBlock['base_text'] = function(block) {
  const text = block.getFieldValue('TEXT') || "";
  return [`"${text}"`, CGenerator.ORDER_ATOMIC];
};

CGenerator.forBlock['base_compare'] = function(block) {
  let aBlock = block.getInputTargetBlock("A");
  let bBlock = block.getInputTargetBlock("B");

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

  const op = block.getFieldValue("OP");

  return [`${a} ${op} ${b}`, CGenerator.ORDER_NONE];
};

export default CGenerator;