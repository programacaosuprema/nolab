export function buildToolbox(toolboxConfig) {
  if (!toolboxConfig) {
    return {
      kind: 'categoryToolbox',
      contents: [],
    };
  }

  return {
    kind: 'categoryToolbox',
    contents: Object.entries(toolboxConfig).map(([key, value]) => ({
      kind: 'category',
      name: key.toUpperCase(),
      contents: value.contents || [],
    })),
  };
}
