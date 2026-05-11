import CGenerator from "./CGeneratorBase";

CGenerator.forBlock['list_is_empty'] = function(block) {
  const list = block.getFieldValue("LIST");
  return [`(${list}.tamanho == 0)`, CGenerator.ORDER_ATOMIC];
};

CGenerator.forBlock['list_size'] = function(block) {
  const list = block.getFieldValue("LIST");
  return [`${list}.tamanho`, CGenerator.ORDER_ATOMIC];
};

// 🔹 GERADOR PRINCIPAL
export function generateListC(workspace) {
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

  // 🔹 CONTROLE DE FUNÇÕES USADAS
  let functions = "";
  let usedFunctions = {
    inicializar: false,
    inserir: false,
    remover_inicio: false,
    remover_final: false,
    remover_valor: false,
    remover_posicao: false,
    obter: false,
    buscar: false,
    inverter: false,
    vazia: false,
    ordenar_crescente: false,
    ordenar_decrescente: false,
    sublista: false,
    size: 0,
  };

  // 🔹 FUNÇÃO CENTRAL
  function generateBlock(block) {
    
    let code = "";
    let current = block;

    while (current) {
      // LISTA
      if (
        current.type === "list_container" ||
        current.type === "list_fixed"
      ) {
        const name = current.getFieldValue("NAME");

        if (current.type === "list_fixed") {
          usedFunctions.size = current.getFieldValue("SIZE");
        }

        usedFunctions.inicializar = true;

        code = addLine(code, `Lista ${name};`);
        code = addLine(code, `inicializar(&${name});`);
      }

      // INSERT
      if (current.type === "list_insert") {
        usedFunctions.inserir = true;

        const value = current.getFieldValue("VALUE");
        const list = current.getFieldValue("LIST");

        code = addLine(code, `inserir_inicio(&${list}, ${value});`);
      }

      // REMOVE FIRST
      if (current.type === "list_remove_first") {
        usedFunctions.remover_inicio = true;

        const list = current.getFieldValue("LIST");
        code = addLine(code, `remover_inicio(&${list});`);
      }

      // REMOVE LAST
      if (current.type === "list_remove_last") {
        usedFunctions.remover_final = true;

        const list = current.getFieldValue("LIST");
        code = addLine(code, `remover_final(&${list});`);
      }

      // REMOVE ITEM
      if (current.type === "list_remove_item") {
        usedFunctions.remover_valor = true;

        const value = current.getFieldValue("VALUE");
        const list = current.getFieldValue("LIST");
        code = addLine(code, `remover_valor(&${list}, ${value});`);
      }

      // REMOVE INDEX
      if (current.type === "list_remove_index") {
        usedFunctions.remover_posicao = true;

        const index = current.getFieldValue("INDEX");
        const list = current.getFieldValue("LIST");
        code = addLine(code, `remover_posicao(&${list}, ${index});`);
      }

      // GET
      if (current.type === "list_item_position") {
        usedFunctions.obter = true;

        const pos = current.getFieldValue("VALUE");
        const list = current.getFieldValue("LIST");
        code = addLine(code, `printf("%d\\n", obter_elemento(&${list}, ${pos}));`);
      }

      // BUSCAR
      if (current.type === "list_index") {
        usedFunctions.buscar = true;

        const value = current.getFieldValue("VALUE");
        const list = current.getFieldValue("LIST");
        code = addLine(code, `printf("%d\\n", buscar_posicao(&${list}, ${value}));`);
      }

      if (current.type === "base_input") {
        const generated = CGenerator.blockToCode(current);
        code = addGeneratedCode(code, generated);
      }

      if (current.type === "base_show_text") {
        const generated = CGenerator.blockToCode(current);
        code = addGeneratedCode(code, generated);
      }

      // SHOW
      if (current.type === "base_show") {

        let text = '""';
        let value = "0";

        const textBlock = current.getInputTargetBlock("TEXT");
        const valueBlock = current.getInputTargetBlock("VALUE");

        if (textBlock) {
          const result = CGenerator.blockToCode(textBlock);
          text = Array.isArray(result) ? result[0] : result;
        }

        if (valueBlock) {
          const result = CGenerator.blockToCode(valueBlock);
          value = Array.isArray(result) ? result[0] : result;
        }

        code = addLine(code, `printf("%s %d\\n", ${text}, ${value});`);
      }

      // IF
      if (current.type === "base_if") {
        let conditionBlock = current.getInputTargetBlock("CONDITION");

        let condition = "0";

        if (conditionBlock) {
          const result = CGenerator.blockToCode(conditionBlock);

          if (Array.isArray(result)) {
            condition = result[0];
          } else {
            condition = result;
          }
        }
        code = addLine(code, `if (${condition}) {`);
        indentLevel++;

        const branch = current.getInputTargetBlock("DO");
        if (branch) code += generateBlock(branch);

        indentLevel--;
        code = addLine(code, `}`);
      }

      // IF ELSE
      if (current.type === "base_if_else") {
        let conditionBlock = current.getInputTargetBlock("CONDITION");
        let condition = "0";

        if (conditionBlock) {
          const result = CGenerator.blockToCode(conditionBlock);
          condition = Array.isArray(result) ? result[0] : result;
        }

        code = addLine(code, `if (${condition}) {`);
        indentLevel++;

        const doBlock = current.getInputTargetBlock("DO");
        if (doBlock) code += generateBlock(doBlock);

        indentLevel--;
        code = addLine(code, `} else {`);
        indentLevel++;

        const elseBlock = current.getInputTargetBlock("ELSE");
        if (elseBlock) code += generateBlock(elseBlock);

        indentLevel--;
        code = addLine(code, `}`);
      }

      // FOR EACH
      if (current.type === "list_for_each") {
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

      // SORT
      if (current.type === "list_sort_ascending") {
        usedFunctions.ordenar_crescente = true;

        const list = current.getFieldValue("LIST");
        code = addLine(code, `ordenar_crescente(&${list});`);
      }

      if (current.type === "sort_descending") {
        usedFunctions.ordenar_decrescente = true;

        const list = current.getFieldValue("LIST");
        code = addLine(code, `ordenar_decrescente(&${list});`);
      }

      // INVERT
      if (current.type === "list_invert") {
        usedFunctions.inverter = true;

        const list = current.getFieldValue("LIST");
        code = addLine(code, `inverter(&${list});`);
      }

      current = current.getNextBlock();
    }

    return code;
  }

  // 🔹 PEGA APENAS O run_program
  const blocks = workspace.getTopBlocks(true).filter(
    (block) => block.type === "list_run_program"
  );

  if (!blocks || blocks.length === 0) return "";

  // 🔹 VERIFICA SE HÁ LISTA EM ALGUM LUGAR DO FLUXO
  function containsList(block) {
    let current = block;

    while (current) {
      if (
        current.type === "list_container" ||
        current.type === "list_fixed"
      ) {
        return true;
      }

      if (current.type === "base_if") {
        const doBlock = current.getInputTargetBlock("DO");
        if (doBlock && containsList(doBlock)) return true;
      }

      if (current.type === "base_if_else") {
        const doBlock = current.getInputTargetBlock("DO");
        const elseBlock = current.getInputTargetBlock("ELSE");

        if (doBlock && containsList(doBlock)) return true;
        if (elseBlock && containsList(elseBlock)) return true;
      }

      if (current.type === "list_for_each") {
        const doBlock = current.getInputTargetBlock("DO");
        if (doBlock && containsList(doBlock)) return true;
      }

      current = current.getNextBlock();
    }

    return false;
  }

  let hasList = false;
  for (const block of blocks) {
    const first = block.getInputTargetBlock("DO");
    if (first && containsList(first)) {
      hasList = true;
      break;
    }
  }

  if (!hasList) return "";

  // 🔹 HEADER
  const header = `#include <stdio.h>
#include <stdlib.h>

typedef struct Nodo {
    int dado;
    struct Nodo *proximo;
} Nodo;

typedef struct {
    int tamanho;
    Nodo *inicio;
} Lista;

`;

  // 🔹 PROCESSA APENAS UMA VEZ
  let main = "";
  for (const block of blocks) {
    const first = block.getInputTargetBlock("DO");
    if (first) {
      main += generateBlock(first);
    }
  }

  // 🔹 FUNÇÕES DINÂMICAS
  if (usedFunctions.inicializar) {
    functions += `
void inicializar(Lista *l) {
    l->inicio = NULL;
    l->tamanho = ${usedFunctions.size};
}

`;
  }

  if (usedFunctions.inserir) {
    functions += `
void inserir_inicio(Lista *l, int valor) {
    Nodo *novo = (Nodo*) malloc(sizeof(Nodo));
    novo->dado = valor;
    novo->proximo = l->inicio;
    l->inicio = novo;
    l->tamanho++;
}

`;
  }

  if (usedFunctions.remover_inicio) {
    functions += `
void remover_inicio(Lista *l) {
    if (l->inicio == NULL) return;

    Nodo *temp = l->inicio;
    l->inicio = temp->proximo;
    free(temp);
    l->tamanho--;
}

`;
  }

  if (usedFunctions.remover_final) {
    functions += `
void remover_final(Lista *l) {
    if (l->inicio == NULL) return;

    Nodo *atual = l->inicio;
    Nodo *anterior = NULL;

    while (atual->proximo != NULL) {
        anterior = atual;
        atual = atual->proximo;
    }

    if (anterior == NULL) {
        l->inicio = NULL;
    } else {
        anterior->proximo = NULL;
    }

    free(atual);
    l->tamanho--;
}

`;
  }

  if (usedFunctions.remover_valor) {
    functions += `
void remover_valor(Lista *l, int valor) {
    Nodo *atual = l->inicio;
    Nodo *anterior = NULL;

    while (atual != NULL && atual->dado != valor) {
        anterior = atual;
        atual = atual->proximo;
    }

    if (atual != NULL) {
        if (anterior == NULL) {
            l->inicio = atual->proximo;
        } else {
            anterior->proximo = atual->proximo;
        }

        free(atual);
        l->tamanho--;
    }
}

`;
  }

  if (usedFunctions.remover_posicao) {
    functions += `
void remover_posicao(Lista *l, int pos) {
    Nodo *atual = l->inicio;
    Nodo *anterior = NULL;

    for (int i = 1; i < pos && atual != NULL; i++) {
        anterior = atual;
        atual = atual->proximo;
    }

    if (atual != NULL) {
        if (anterior == NULL) {
            l->inicio = atual->proximo;
        } else {
            anterior->proximo = atual->proximo;
        }

        free(atual);
        l->tamanho--;
    }
}

`;
  }

  if (usedFunctions.obter) {
    functions += `
int obter_elemento(Lista *l, int pos) {
    Nodo *aux = l->inicio;

    for (int i = 1; i < pos && aux != NULL; i++) {
        aux = aux->proximo;
    }

    if (aux != NULL) return aux->dado;
    return -1;
}

`;
  }

  if (usedFunctions.buscar) {
    functions += `
int buscar_posicao(Lista *l, int valor) {
    Nodo *aux = l->inicio;
    int pos = 1;

    while (aux != NULL) {
        if (aux->dado == valor) return pos;
        aux = aux->proximo;
        pos++;
    }

    return -1;
}

`;
  }

  if (usedFunctions.vazia) {
    functions += `
int esta_vazia(Lista *l) {
    return l->tamanho == 0;
}

`;
  }

  if (usedFunctions.inverter) {
    functions += `
void inverter(Lista *l) {
    Nodo *prev = NULL;
    Nodo *current = l->inicio;
    Nodo *next = NULL;

    while (current != NULL) {
        next = current->proximo;
        current->proximo = prev;
        prev = current;
        current = next;
    }

    l->inicio = prev;
}
`;
  }

  if (usedFunctions.ordenar_crescente) {
    functions += `
void ordenar_crescente(Lista *l) {
    if (l->inicio == NULL) return;

    Nodo *i = l->inicio->proximo;

    while (i != NULL) {
        Nodo *j = l->inicio;

        while (j != i) {
            if (j->dado > i->dado) {
                int temp = j->dado;
                j->dado = i->dado;
                i->dado = temp;
            }
            j = j->proximo;
        }

        i = i->proximo;
    }
}
`;
  }

  if (usedFunctions.ordenar_decrescente) {
    functions += `
void ordenar_decrescente(Lista *l) {
    if (l->inicio == NULL) return;

    Nodo *i = l->inicio->proximo;

    while (i != NULL) {
        Nodo *j = l->inicio;

        while (j != i) {
            if (j->dado < i->dado) {
                int temp = j->dado;
                j->dado = i->dado;
                i->dado = temp;
            }
            j = j->proximo;
        }

        i = i->proximo;
    }
}
`;
  }

  if (usedFunctions.sublista) {
    functions += `
Lista sublista(Lista *l, int inicio, int fim) {
    Lista nova;
    nova.inicio = NULL;
    nova.tamanho = 0;

    if (inicio < 1 || fim > l->tamanho || inicio > fim) return nova;

    Nodo *aux = l->inicio;

    for (int i = 1; i < inicio; i++) {
        aux = aux->proximo;
    }

    for (int i = inicio; i <= fim && aux != NULL; i++) {
        Nodo *novo = (Nodo*) malloc(sizeof(Nodo));
        novo->dado = aux->dado;
        novo->proximo = nova.inicio;
        nova.inicio = novo;
        nova.tamanho++;

        aux = aux->proximo;
    }

    return nova;
}
`;
  }

  return header + functions + "\nint main() {\n" + main + "    return 0;\n}";
}