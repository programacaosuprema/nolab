export function translateToolbox(toolbox) {
  const map = {
    Logic: 'Lógica',
    Loops: 'Laços',
    Math: 'Matemática',
    Text: 'Texto',
    Lists: 'Listas',
    Variables: 'Variáveis',
    Functions: 'Funções',

    // custom
    Queue: 'Fila',
    Stack: 'Pilha',
  };

  function translateCategory(cat) {
    return {
      ...cat,
      name: map[cat.name] || cat.name,
      contents: cat.contents?.map((c) =>
        c.kind === 'category' ? translateCategory(c) : c
      ),
    };
  }

  return {
    ...toolbox,
    contents: toolbox.contents.map(translateCategory),
  };
}
