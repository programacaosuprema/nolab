import translate from "./translate.js"

export default function validateExecutionRules(commands, rules = []) {
  for (const rule of rules) {

    if (rule.type === "must_use_before") {
      const indexA = commands.findIndex(c => c.type === rule.block);
      const indexB = commands.findIndex(c => c.type === rule.target);

      if (indexA === -1 || indexB === -1 || indexA > indexB) {
        return `O bloco "${translate(rule.block)}" deve vir antes do bloco "${translate(rule.target)}"`;
      }
    }

  }

  return null;
}