import { executeCode } from "../core/executeCode";

export function runList(code, workspace) {
  return executeCode(code, "list", workspace);
}