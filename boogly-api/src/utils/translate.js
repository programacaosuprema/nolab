export default function translate(blockName) {
    switch (blockName) {

        /* =========================
        BASE
        ========================= */
        case "base_not": return "não";
        case "base_show_text": return "exibir texto";
        case "base_input": return "atribuição";
        case "base_variable": return "variável";
        case "base_text": return "texto";
        case "base_number": return "de valor";
        case "base_compare": return "comparar";
        case "base_if": return "se";
        case "base_if_else": return "se / senão";
        case "base_show": return "exibir";
        case "base_arithmetic": return "operação aritmética";

        /* =========================
        LISTA
        ========================= */
        case "list_run_program": return "Executar (lista)";
        case "list_container": return "criar lista";
        case "list_fixed": return "criar lista com tamanho fixo";
        case "list_insert": return "inserir na lista";
        case "list_remove_last": return "remover último da lista";
        case "list_remove_first": return "remover primeiro da lista";
        case "list_remove_item": return "remover item da lista";
        case "list_remove_index": return "remover da posição";
        case "list_size": return "tamanho da lista";
        case "list_is_empty": return "lista está vazia";
        case "list_item_position": return "exbir item da posição";
        case "list_sublist": return "sublista";
        case "list_index": return "exibir posição do item";
        case "list_sort_ascending": return "ordenar (crescente)";
        case "list_sort_descending": return "ordenar (decrescente)";
        case "list_invert": return "inverter lista";
        case "list_for_each": return "para cada (lista)";
        case "list_get": return "pegar posição da lista";

        /* =========================
        FILA (QUEUE)
        ========================= */
        case "queue_run_program": return "Executar (fila)";
        case "queue_container": return "criar fila";
        case "queue_fixed": return "criar fila com tamanho fixo";
        case "enqueue": return "enfileirar";
        case "dequeue": return "desenfileirar";
        case "queue_front": return "ver início da fila";
        case "queue_size": return "tamanho da fila";
        case "queue_is_empty": return "fila está vazia";
        case "queue_for_each": return "para cada (fila)";

        /* =========================
        PILHA (STACK)
        ========================= */
        case "stack_run_program": return "Executar (pilha)";
        case "stack_container": return "criar pilha";
        case "stack_fixed": return "criar pilha com tamanho fixo";
        case "push": return "empilhar";
        case "pop": return "desempilhar";
        case "peek": return "topo de pilha";
        case "stack_size": return "tamanho da pilha";
        case "stack_empty": return "pilha vazia";
        case "stack_for_each": return "para cada (pilha)";

        default:
        return blockName;
    }
};
