import { executeCode } from "../core/executeCode";

export function runStack(code, workspace) {
  return executeCode(code, "stack", workspace);
}