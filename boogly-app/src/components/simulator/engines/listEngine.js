import { executeCode } from "../executeCode";

export function runList(code, workspace) {
  return executeCode(code, "list", workspace);
}