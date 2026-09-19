import { executeList } from '../list/executeList';
import { executeQueue } from '../queue/executeQueue';
import { executeStack } from '../stack/executeStack';

export function executeCode(code, structure) {
  const executors = {
    list: executeList,
    queue: executeQueue,
    stack: executeStack,
  };

  const executor = executors[structure];
  if (!executor) return [];

  return executor(code);
}
