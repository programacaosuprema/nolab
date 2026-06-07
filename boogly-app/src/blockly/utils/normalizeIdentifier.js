export function normalizeIdentifier(
  text,
  fallback = "identificador"
) {

  const reservedWords = [
    "auto",
    "break",
    "case",
    "char",
    "const",
    "continue",
    "default",
    "do",
    "double",
    "else",
    "enum",
    "extern",
    "float",
    "for",
    "goto",
    "if",
    "int",
    "long",
    "register",
    "return",
    "short",
    "signed",
    "sizeof",
    "static",
    "struct",
    "switch",
    "typedef",
    "union",
    "unsigned",
    "void",
    "volatile",
    "while",

    // C99+
    "inline",
    "restrict",
    "_bool",
    "_complex",
    "_imaginary",

    // C11+
    "_alignas",
    "_alignof",
    "_atomic",
    "_generic",
    "_noreturn",
    "_static_assert",
    "_thread_local",

    // nomes internos do projeto
    "lista",
    "fila",
    "pilha",
    "nodo",
    "no",
    "ponteiro",
    "elemento",
    "main"
  ];

  text = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  text = text
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();

  // não pode iniciar com número
  if (/^[0-9]/.test(text)) {
    text = "_" + text;
  }

  // palavra reservada
  if (
    reservedWords.includes(text)
  ) {
    text = "_" + text;
  }

  // vazio
  if (!text) {
    text = fallback;
  }

  return text;
}