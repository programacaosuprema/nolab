import { generateListC } from "./CListGenerator";
import { generateQueueC } from "./CQueueGenerator";

export function generateC(workspace, structure) {
  if (structure === "list") return generateListC(workspace);
  if (structure === "queue") return generateQueueC(workspace);
  if (structure === "stack") return generateQueueC(workspace);
  return "";
}