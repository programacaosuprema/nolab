export const LINKED_LIST_HEADER = `
#include <stdio.h>
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

/* ==================================================
   LISTA ENCADEADA
   ================================================== */

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

`;