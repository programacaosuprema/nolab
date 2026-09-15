import { stackToolbox, queueToolbox, toolboxCategories } from "./toolboxes";
import { runStack } from "./engines/stackEngine";
import { runQueue } from "./engines/queueEngine";
import { runList } from "./engines/listEngine";

export const structures = {
  stack: {
    toolbox: stackToolbox,
    run: runStack,
  },
  queue: {
    toolbox: queueToolbox,
    run: runQueue,
  },
  list: {
    toolbox: toolboxCategories,
    run: runList,
  },
};