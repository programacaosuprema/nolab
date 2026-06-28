import CGenerator from "./CGeneratorBase";
import { linkedListHeader }  from "./headers/LinkedListHeader";

let listSize = 0; 

CGenerator.forBlock["peek"] = function (block) {
  const stack = block.getFieldValue("STACK") || "pilha";

  return [`topo_pilha(&${stack})`, CGenerator.ORDER_ATOMIC];
};

CGenerator.forBlock["stack_size"] = function (block) {
  const stack = block.getFieldValue("STACK") || "pilha";

  return [`tamanho_pilha(&${stack})`, CGenerator.ORDER_ATOMIC];
};

CGenerator.forBlock["stack_empty"] = function (block) {
  const stack = block.getFieldValue("STACK") || "pilha";

  return [`pilha_vazia(&${stack})`, CGenerator.ORDER_ATOMIC];
};

export function generateStackC(workspace) {

  CGenerator.init(workspace);

  let indentLevel = 1;

  function indent() {
    return "    ".repeat(indentLevel);
  }

  function addLine(code, line) {
    return code + indent() + line + "\n";
  }

  function addGeneratedCode(code, generated) {

    const lines = generated.trim().split("\n").filter(Boolean);

    for (const line of lines) {
      code = addLine(code, line);
    }

    return code;
  }

  function blockToCodeValue(block, defaultValue = "0") {

    if (!block) return defaultValue;

    const result = CGenerator.blockToCode(block);

    return Array.isArray(result) ? result[0] : (result || defaultValue);
  }

  const used = {
    create: false,
    push: false,
    pop: false,
    peek: false,
    size: false,
    empty: false,
    for: false
  };

  let functions = "";

  /* ==========================================================
     DETECTA FUNÇÕES UTILIZADAS
     ========================================================== */

  function markUsed(block) {

    if (!block) return;

    switch (block.type) {

      case "stack_container":
      case "stack_fixed":
        used.create = true;
        break;

      case "push":
        used.push = true;
        break;

      case "pop":
        used.pop = true;
        break;

      case "peek":
        used.peek = true;
        break;

      case "stack_size":
        used.size = true;
        break;

      case "stack_empty":
        used.empty = true;
        break;

      case "stack_for_each":
        used.for = true;
        break;
    }

    for (const input of block.inputList || []) {
      const child = input.connection?.targetBlock();

      if (child) {
        markUsed(child);
      }
    }

    const next = block.getNextBlock();

    if (next) {
      markUsed(next);
    }
  }

  /* ==========================================================
     GERA CÓDIGO DOS BLOCOS
     ========================================================== */

  function generateBlock(block) {

    let code = "";
    let current = block;

    while (current) {

      if (current.type === "stack_container" || current.type === "stack_fixed") {

        const name = current.getFieldValue("NAME") || "pilha";

        code = addLine(code, `Pilha ${name};`);

        code = addLine(code, `inicializar_pilha(&${name});`);

        if (current.type === "stack_fixed"){
          const sizeBlock = current.getInputTargetBlock("SIZE");
          const size = blockToCodeValue(sizeBlock, "0");
          listSize = size;
        }
      }

      /* PUSH */

      if (current.type === "push") {

        const valueBlock = current.getInputTargetBlock("VALUE");

        const value = blockToCodeValue(valueBlock, "0");

        const stack = current.getFieldValue("STACK") || "pilha";

        code = addLine(code, `empilhar(&${stack}, ${value});`);
      }

      /* POP */

      if (current.type === "pop") {
        const stack = current.getFieldValue("STACK") || "pilha";

        code = addLine(code,`desempilhar(&${stack});`);
      }

      if (current.type === "stack_for_each") {
        const variableBlock = current.getInputTargetBlock("VARIABLE");

        let varName = "item";

        if (variableBlock) {
          varName = variableBlock.getFieldValue("VAR") || "item";
        }

        const list = current.getFieldValue("LIST");

        code = addLine(code, `Nodo *aux_${varName} = ${list}.inicio;`);

        code = addLine(code, `while (aux_${varName} != NULL) {`);

        indentLevel++;

        code = addLine(code, `int ${varName} = aux_${varName}->dado;`);

        const branch = current.getInputTargetBlock("DO");

        if (branch) {
          code += generateBlock(branch);
        }

        code = addLine(code, `aux_${varName} = aux_${varName}->proximo;`);

        indentLevel--;

        code = addLine(code, `}`);
      }

      // 🔹 SHOW
      if (current.type === "stack_show" || current.type === "base_show") {
        let text = '""';
        let value = "0";

        const textBlock = current.getInputTargetBlock("TEXT");

        const valueBlock = current.getInputTargetBlock("VALUE");

        if (textBlock) {
          text = blockToCodeValue(textBlock, '""');
        }

        if (valueBlock) {
          value = blockToCodeValue(valueBlock, "0");
        }

        code = addLine(code, `printf("%s %d\\n", ${text}, ${value});`);
      }

      /* BASE INPUT */

      if (current.type === "base_input") {

        const generated = CGenerator.blockToCode(current);

        code = addGeneratedCode(code, generated);
      }

      /* SHOW TEXT */

      if (current.type === "base_show_text") {

        const generated = CGenerator.blockToCode(current);

        const codeText = Array.isArray(generated) ? generated[0] : generated;

        code = addGeneratedCode(code, codeText);
        }

      /* IF */

      if (current.type === "base_if") {

        const conditionBlock = current.getInputTargetBlock("CONDITION");

        const condition = blockToCodeValue(conditionBlock, "0");

        code = addLine(code,`if (${condition}) {`);

        indentLevel++;

        const branch = current.getInputTargetBlock("DO");

        if (branch) {
          code += generateBlock(branch);
        }

        indentLevel--;

        code = addLine(code, `}`);
      }

      /* IF ELSE */

      if (current.type === "base_if_else") {

        const conditionBlock = current.getInputTargetBlock("CONDITION");

        const condition = blockToCodeValue(conditionBlock, "0");

        code = addLine(code, `if (${condition}) {`);

        indentLevel++;

        const doBlock = current.getInputTargetBlock("DO");

        if (doBlock) {
          code += generateBlock(doBlock);
        }

        indentLevel--;

        code = addLine(code, `} else {`);

        indentLevel++;

        const elseBlock = current.getInputTargetBlock("ELSE");

        if (elseBlock) {
          code += generateBlock(elseBlock);
        }

        indentLevel--;

        code = addLine(code, `}`);
      }

      current = current.getNextBlock();
    }

    return code;
  }

  /* ==========================================================
     BLOCO PRINCIPAL
     ========================================================== */

  const blocks = workspace.getTopBlocks(true).filter(b => b.type === "stack_run_program");

  if (!blocks.length) {
    return "";
  }

  for (const block of blocks) {

    const first = block.getInputTargetBlock("DO");

    if (first) {
      markUsed(first);
    }
  }

  let main = "";

  for (const block of blocks) {

    const first = block.getInputTargetBlock("DO");

    if (first) {
      main += generateBlock(first);
    }
  }

  /* ==========================================================
     HEADER
     ========================================================== */

  const header = linkedListHeader();

  /* ==========================================================
     FUNÇÕES DA PILHA
     ========================================================== */

  if (used.create) {
    functions += `
void inicializar_pilha(Pilha *p) {
    inicializar_lista(p, ${listSize});
}
`;
  }

  if (used.push) {
    functions += `
void empilhar(Pilha *p, int valor) {
    inserir_elemento(p, 1, valor);
}
`;
  }

  if (used.pop) {
    functions += `
void desempilhar(Pilha *p) {

    if (p->tamanho > 0) {
        remover_elemento(p, 1);
    }
}
`;
  }

  if (used.peek) {
    functions += `
int topo_pilha(Pilha *p) {

    Elemento e;

    if (obter_elemento(*p, 1, &e)) {
        return e;
    }

    return 0;
}
`;
  }

  if (used.size) {
    functions += `
int tamanho_pilha(Pilha *p) {
    return p->tamanho;
}
`;
  }

  if (used.empty) {
    functions += `
int pilha_vazia(Pilha *p) {
    return p->tamanho == 0;
}
`;
  }

  return (
    header +
    functions +
    "\nint main() {\n" +
    main +
    "    return 0;\n" +
    "}\n"
  );
}