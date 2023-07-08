export const NODE_SIZE = 45;

export const DEFAULT_MODE = {
  default: [
    { type: 'drag-node', onlyChangeComboSize: true, optimize: true },
    {
      type: 'drag-combo',
      enableDelegate: true,
      activeState: 'actived',
      onlyChangeComboSize: true,
      shouldUpdate: () => true,
      optimize: true
    },
    { type: 'drag-canvas', optimize: true },
    { type: 'zoom-canvas', optimize: true }
  ]
};
