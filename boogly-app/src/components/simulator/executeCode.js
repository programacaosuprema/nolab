import { executeList } from "./executeList";
import { executeQueue } from "./executeQueue";
import { executeStack } from "./executeStack";

export function executeCode(code, structure) {
  const executors = {
    list: executeList,
    queue: executeQueue,
    stack: executeStack
  };

  const executor = executors[structure];
  if (!executor) return [];

  return executor(code);
}