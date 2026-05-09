import CGenerator from "./CGeneratorBase";

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
const header = `#include <stdio.h>
#include <malloc.h>

typedef int Elemento;

typedef struct No {
    Elemento elemento;
    struct No *proximo;
} No;

typedef No *Ponteiro;

typedef struct {
    int tamanho;
    No *primeiro;
} Lista;

const Elemento VALOR_NULO = 0;

typedef Lista ListaEncadeada;
typedef ListaEncadeada Fila;

/* =========================
   IMPLEMENTAÇÃO DA LISTA
   ========================= */

void inicializar_lista(ListaEncadeada *lista) {
    lista->primeiro = NULL;
    lista->tamanho = 0;
}

int inserir_elemento(ListaEncadeada *lista, int posicao, Elemento elemento) {
    Ponteiro no, auxiliar;

    if (posicao > 0 && posicao <= lista->tamanho + 1) {
        no = (Ponteiro) malloc(sizeof(No));

        if (no != NULL) {
            no->elemento = elemento;

            if (posicao == 1) {
                no->proximo = lista->primeiro;
                lista->primeiro = no;
            } else {
                auxiliar = lista->primeiro;

                for (int i = 2; i < posicao; i++) {
                    auxiliar = auxiliar->proximo;
                }

                no->proximo = auxiliar->proximo;
                auxiliar->proximo = no;
            }

            lista->tamanho++;
            return 1;
        }

        return 0;
    }

    return 0;
}

int remover_elemento(ListaEncadeada *lista, int posicao) {
    Ponteiro no, auxiliar;

    if (posicao > 0 && posicao <= lista->tamanho) {
        if (posicao == 1) {
            no = lista->primeiro;
            lista->primeiro = no->proximo;
        } else {
            auxiliar = lista->primeiro;

            for (int i = 2; i < posicao; i++) {
                auxiliar = auxiliar->proximo;
            }

            no = auxiliar->proximo;
            auxiliar->proximo = no->proximo;
        }

        free(no);
        lista->tamanho--;
        return 1;
    }

    return 0;
}

int obter_elemento(ListaEncadeada lista, int posicao, Elemento *e) {
    Ponteiro no;

    if (posicao > 0 && posicao <= lista.tamanho) {
        no = lista.primeiro;

        for (int i = 2; i <= posicao; i++) {
            no = no->proximo;
        }

        *e = no->elemento;
        return 1;
    }

    *e = VALOR_NULO;
    return 0;
}

/* =========================
   IMPLEMENTAÇÃO DA FILA
   ========================= */
`;

  // 🔹 FUNÇÕES CONDICIONAIS
  if (used.create) {
    functions += `
void inicializar_fila(Fila *f) {
    f->inicio = 0;
    f->fim = 0;
}
`;
  }

  if (used.enqueue) {
    functions += `
void enfileirar(Fila *f, int valor) {
    f->dados[f->fim++] = valor;
}
`;
  }

  if (used.dequeue) {
    functions += `
void desenfileirar(Fila *f) {
    if (f->inicio < f->fim) {
        f->inicio++;
    }
}
`;
  }

  if (used.front) {
    functions += `
int frente_fila(Fila *f) {
    if (f->inicio >= f->fim) {
        return 0;
    }

    return f->dados[f->inicio];
}
`;
  }

  if (used.size) {
    functions += `
int tamanho_fila(Fila *f) {
    return f->fim - f->inicio;
}
`;
  }

  if (used.empty) {
    functions += `
int fila_vazia(Fila *f) {
    return f->inicio == f->fim;
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