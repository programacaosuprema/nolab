import { executeCode } from "../executeCode";

export function runStack(code, workspace) {
  return executeCode(code, "stack", workspace);
}