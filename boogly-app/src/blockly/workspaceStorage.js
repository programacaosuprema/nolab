import * as Blockly from "blockly/core";

function getWorkspaceKey(userId, structure) {
  const id = userId || "guest";
  return `blockly_workspace_${id}_${structure}`;
}

/**
 * Salva o workspace no localStorage.
 */
export function saveWorkspace(workspace, structure, userId) {
  if (!workspace) return;

  try {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);

    localStorage.setItem(
      getWorkspaceKey(userId, structure),
      xmlText
    );

    console.log(`💾 Workspace "${structure}" salvo com sucesso.`);
  } catch (error) {
    console.error("Erro ao salvar workspace:", error);
  }
}

/**
 * Carrega o workspace salvo do localStorage.
 */
export function loadWorkspace(workspace, structure, userId) {
  if (!workspace) return;

   const xmlText = localStorage.getItem(
    getWorkspaceKey(userId, structure)
  );

  if (!xmlText) {
    console.log(`ℹ️ Nenhum workspace salvo para "${structure}".`);
    return;
  }

  try {
    // ✅ Método correto nas versões atuais do Blockly
    const xml = Blockly.utils.xml.textToDom(xmlText);

    Blockly.Xml.clearWorkspaceAndLoadFromXml(
      xml,
      workspace
    );

    console.log(`📂 Workspace "${structure}" restaurado com sucesso.`);
  } catch (error) {
    console.error("Erro ao carregar workspace:", error);
  }
}

/**
 * Remove o workspace salvo.
 */
export function clearSavedWorkspace(structure) {
  localStorage.removeItem(
    `blockly_workspace_${structure}`
  );

  console.log(`🗑️ Workspace "${structure}" removido.`);
}

export function clearGuestWorkspaces() {
  const keys = Object.keys(localStorage);

  keys.forEach((key) => {
    if (key.startsWith("blockly_workspace_guest_")) {
      localStorage.removeItem(key);
    }
  });
}