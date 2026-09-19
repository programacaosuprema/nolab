import { executeCode } from "../core/executeCode";

export function runQueue(code) {
  return executeCode(code, "queue");
}