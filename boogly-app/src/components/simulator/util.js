export function calcularAritmetica(a, op, b) {
  a = Number(a);
  b = Number(b);

  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b !== 0 ? a / b : null;
    default:
      throw new Error(`Operador inválido: ${op}`);
  }
}