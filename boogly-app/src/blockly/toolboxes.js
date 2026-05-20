export const stackToolbox = {
  kind: "flyoutToolbox",
  contents: [
    { kind: "block", type: "push" },
    { kind: "block", type: "pop" }
  ]
};

export const queueToolbox = {
  list: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "queue_run_program" },
      { kind: "block", type: "queue_container" },
      { kind: "block", type: "queue_fixed" },
      { kind: "block", type: "enqueue" },
      { kind: "block", type: "dequeue" }
    ]
  },

  state: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "queue_front" },
      { kind: "block", type: "queue_size" },
      { kind: "block", type: "queue_is_empty" },
      { kind: "block", type: "base_show" },
      {kind: "block", type: "base_show_text"},
    ]
  },

  variables: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "base_variable" },
      { kind: "block", type: "base_text" },
      { kind: "block", type: "base_number"},
      { kind: "block", type: "base_input"},
      { kind: "block", type: "base_not"},
      
    ]
  },

  conditions: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "base_compare" },
      { kind: "block", type: "base_if" },
      { kind: "block", type: "base_if_else" }
    ]
  },

  loops: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "queue_for_each" }
    ]
  }
};

export const toolboxCategories = {

  // 🔵 LISTA (estrutura principal)
  list: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "list_run_program" },
      { kind: "block", type: "list_container" },
      { kind: "block", type: "list_fixed" },
      { kind: "block", type: "list_insert" },
      { kind: "block", type: "list_remove_last" },
      { kind: "block", type: "list_remove_first" },
      { kind: "block", type: "list_remove_item" },
      { kind: "block", type: "list_remove_index" },
      { kind: "block", type: "list_get" },
      { kind: "block", type: "list_sublist" },
      { kind: "block", type: "list_invert" },
    ]
  },

  // 🟢 CONSULTA / ESTADO
  state: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "list_is_empty" },
      { kind: "block", type: "list_size" },
      { kind: "block", type: "list_index" },
      { kind: "block", type: "list_item_position" },
      { kind: "block", type: "base_show" },
      { kind: "block", type: "base_show_text"},
    ]
  },

  // 🟣 ORDENAÇÃO
  sort: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "list_sort_ascending" },
      { kind: "block", type: "list_sort_descending" },
    ]
  },

  // 🟡 VARIÁVEIS
  variables: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "base_variable" },
      { kind: "block", type: "base_text" },
      { kind: "block", type: "base_number"},
      { kind: "block", type: "base_input"},
      { kind: "block", type: "base_not"},
    ]
  },

  // 🟢 CONDIÇÕES
  conditions: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "base_compare" },
      { kind: "block", type: "base_if" },
      { kind: "block", type: "base_if_else" },
    ]
  },

  // 🟠 LAÇOS
  loops: {
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "list_for_each" },
    ]
  }

};