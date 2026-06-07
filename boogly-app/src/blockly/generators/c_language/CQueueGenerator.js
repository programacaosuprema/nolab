import CGenerator from "./CGeneratorBase";
import { LINKED_LIST_HEADER } from "./headers/LinkedListHeader";

// 🔹 EXPRESSÕES (retornam valores)
CGenerator.forBlock["queue_front"] = function (block) {
  const queue = block.getFieldValue("QUEUE") || "fila";
  return [`frente_fila(&${queue})`, CGenerator.ORDER_ATOMIC];
};

CGenerator.forBlock["queue_size"] = function (block) {
  const queue = block.getFieldValue("QUEUE") || "fila";
  return [`tamanho_fila(&${queue})`, CGenerator.ORDER_ATOMIC];
};

CGenerator.forBlock["queue_is_empty"] = function (block) {
  const queue = block.getFieldValue("QUEUE") || "fila";
  return [`fila_vazia(&${queue})`, CGenerator.ORDER_ATOMIC];
};

export function generateQueueC(workspace) {
  CGenerator.init(workspace);

  let indentLevel = 1;

  function indent() {
    return "    ".repeat(indentLevel);
  }

  function addLine(code, line) {
    return code + indent() + line + "\n";
  }

  function addGeneratedCode(code, generated) {
    const lines = generated
      .trim()
      .split("\n")
      .filter(Boolean);

    for (const line of lines) {
      code = addLine(code, line);
    }

    return code;
  }

  function blockToCodeValue(block, defaultValue = "0") {
    if (!block) return defaultValue;

    const result = CGenerator.blockToCode(block);
    return Array.isArray(result)
      ? result[0]
      : (result || defaultValue);
  }

  let functions = "";

  const used = {
    create: false,
    enqueue: false,
    dequeue: false,
    front: false,
    size: false,
    empty: false
  };

  // 🔹 Marca blocos usados (inclusive blocos conectados em inputs)
  function markUsed(block) {
    if (!block) return;

    switch (block.type) {
      case "queue_container":
      case "queue_fixed":
        used.create = true;
        break;

      case "enqueue":
        used.enqueue = true;
        break;

      case "dequeue":
        used.dequeue = true;
        break;

      case "queue_front":
        used.front = true;
        break;

      case "queue_size":
        used.size = true;
        break;

      case "queue_is_empty":
        used.empty = true;
        break;
    }

    // percorre inputs (VALUE, CONDITION, etc.)
    for (const input of block.inputList || []) {
      const child = input.connection?.targetBlock();
      if (child) markUsed(child);
    }

    // percorre próximo bloco
    const next = block.getNextBlock();
    if (next) markUsed(next);
  }

  function generateBlock(block) {
    let code = "";
    let current = block;

    while (current) {
      // 🔹 CREATE
      if (current.type === "queue_container") {
        const name = current.getFieldValue("NAME") || "fila";

        used.create = true;

        code = addLine(code, `Fila ${name};`);
        code = addLine(code, `inicializar_fila(&${name});`);
      }

      // 🔹 QUEUE FIXED
      // (mantém mesma implementação da fila simples)
      if (current.type === "queue_fixed") {
        const name = current.getFieldValue("NAME") || "fila";

        used.create = true;

        code = addLine(code, `Fila ${name};`);
        code = addLine(code, `inicializar_fila(&${name});`);
      }

      // 🔹 ENQUEUE
      if (current.type === "enqueue") {
        used.enqueue = true;

        const valueBlock =
          current.getInputTargetBlock("VALUE");
        const value =
          blockToCodeValue(valueBlock, "0");

        const queue =
          current.getFieldValue("QUEUE") || "fila";

        code = addLine(
          code,
          `enfileirar(&${queue}, ${value});`
        );
      }

      // 🔹 DEQUEUE
      if (current.type === "dequeue") {
        used.dequeue = true;

        const queue =
          current.getFieldValue("QUEUE") || "fila";

        code = addLine(
          code,
          `desenfileirar(&${queue});`
        );
      }

      // 🔹 SHOW
      if (
        current.type === "queue_show" ||
        current.type === "base_show"
      ) {
        let text = '""';
        let value = "0";

        const textBlock =
          current.getInputTargetBlock("TEXT");

        const valueBlock =
          current.getInputTargetBlock("VALUE");

        if (textBlock) {
          text = blockToCodeValue(textBlock, '""');
        }

        if (valueBlock) {
          value = blockToCodeValue(valueBlock, "0");
        }

        code = addLine(
          code,
          `printf("%s %d\\n", ${text}, ${value});`
        );
      }

      if (current.type === "queue_for_each") {
        const varName = current.getFieldValue("VAR");
        const list = current.getFieldValue("LIST");

        code = addLine(code, `Nodo *aux_${varName} = ${list}.inicio;`);
        code = addLine(code, `while (aux_${varName} != NULL) {`);
        indentLevel++;

        code = addLine(code, `int ${varName} = aux_${varName}->dado;`);

        const branch = current.getInputTargetBlock("DO");
        if (branch) code += generateBlock(branch);

        code = addLine(code, `aux_${varName} = aux_${varName}->proximo;`);

        indentLevel--;
        code = addLine(code, `}`);
      }

      if (current.type === "base_input") {
        const generated = CGenerator.blockToCode(current);
        code = addGeneratedCode(code, generated);
      }

      if (current.type === "base_show_text") {
        const generated = CGenerator.blockToCode(current);
        code = addGeneratedCode(code, generated);
      }

      // 🔹 IF
      if (current.type === "base_if") {
        const conditionBlock =
          current.getInputTargetBlock("CONDITION");

        const condition =
          blockToCodeValue(conditionBlock, "0");

        code = addLine(code, `if (${condition}) {`);
        indentLevel++;

        const branch =
          current.getInputTargetBlock("DO");

        if (branch) {
          code += generateBlock(branch);
        }

        indentLevel--;
        code = addLine(code, `}`);
      }

      // 🔹 IF ELSE
      if (current.type === "base_if_else") {
        const conditionBlock =
          current.getInputTargetBlock("CONDITION");

        const condition =
          blockToCodeValue(conditionBlock, "0");

        code = addLine(code, `if (${condition}) {`);
        indentLevel++;

        const doBlock =
          current.getInputTargetBlock("DO");

        if (doBlock) {
          code += generateBlock(doBlock);
        }

        indentLevel--;
        code = addLine(code, `} else {`);
        indentLevel++;

        const elseBlock =
          current.getInputTargetBlock("ELSE");

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

  // 🔹 Procura o bloco principal
  const blocks = workspace.getTopBlocks(true).filter(
    (b) => b.type === "queue_run_program"
  );

  if (!blocks.length) return "";

  // 🔹 Descobre quais funções serão necessárias
  for (const block of blocks) {
    const first = block.getInputTargetBlock("DO");
    if (first) {
      markUsed(first);
    }
  }

  // 🔹 Gera o conteúdo do main
  let main = "";

  for (const block of blocks) {
    const first = block.getInputTargetBlock("DO");
    if (first) {
      main += generateBlock(first);
    }
  }

  // 🔹 HEADER
  // 🔹 HEADER
// Fila implementada como adaptação da Lista Encadeada
// baseada no material enviado :contentReference[oaicite:0]{index=0}
    const header =
      LINKED_LIST_HEADER;

      // 🔹 FUNÇÕES CONDICIONAIS

functions += `
typedef ListaEncadeada Fila;
`;

if (used.create) {
  functions += `
void inicializar_fila(Fila *f) {
    inicializar_lista(f);
}
`;
}

if (used.enqueue) {
  functions += `
void enfileirar(Fila *f, int valor) {
    inserir_elemento(f, f->tamanho + 1, valor);
}
`;
}

if (used.dequeue) {
  functions += `
void desenfileirar(Fila *f) {

    if (f->tamanho > 0) {
      remover_elemento(f, 1);
    }
}
`;
}

if (used.front) {
  functions += `
int frente_fila(Fila *f) {

    Elemento e;

    if (obter_elemento(*f, 1, &e)) {
        return e;
    }

    return VALOR_NULO;
}
`;
}

if (used.size) {
  functions += `
int tamanho_fila(Fila *f) {
    return f->tamanho;
}
`;
}

if (used.empty) {
  functions += `
int fila_vazia(Fila *f) {
    return f->tamanho == 0;
}
`;
}


  // 🔹 CÓDIGO FINAL
  return (
    header +
    functions +
    "\nint main() {\n" +
    main +
    "    return 0;\n" +
    "}\n"
  );
}