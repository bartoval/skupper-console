import {
  LocalStorageData,
  LocalStorageDataSaved,
  LocalStorageDataSavedPayload,
  LocalStorageDataWithNullXY
} from './Graph.interfaces';

const prefixLocalStorageItem = 'skupper';

export const GraphController = {
  saveDataInLocalStorage: (topologyNodes: LocalStorageData[]) => {
    const cache = JSON.parse(localStorage.getItem(prefixLocalStorageItem) || '{}');

    const topologyMap = topologyNodes.reduce((acc, { id, x, y }) => {
      if (id) {
        acc[id] = { x, y };
      }

      return acc;
    }, {} as LocalStorageDataSaved);

    localStorage.setItem(prefixLocalStorageItem, JSON.stringify({ ...cache, ...topologyMap }));
  },

  getPositionFromLocalStorage(id: string): LocalStorageDataWithNullXY {
    const cache = JSON.parse(localStorage.getItem(prefixLocalStorageItem) || '{}');
    const positions = cache[id] as LocalStorageDataSavedPayload | undefined;

    const x = positions ? positions.x : undefined;
    const y = positions ? positions.y : undefined;

    return { id, x, y };
  },

  cleanPositionsFromLocalStorage() {
    localStorage.removeItem(prefixLocalStorageItem);
  },

  cleanPositionsControlsFromLocalStorage(suffix: string) {
    Object.keys(localStorage)
      .filter((x) => x.endsWith(suffix))
      .forEach((x) => localStorage.removeItem(x));
  },

  calculateMaxIteration(nodeCount: number) {
    if (nodeCount > 900) {
      return 10;
    }

    if (nodeCount > 750) {
      return 10;
    }

    if (nodeCount > 600) {
      return 15;
    }

    if (nodeCount > 450) {
      return 20;
    }

    if (nodeCount > 300) {
      return 50;
    }

    if (nodeCount > 150) {
      return 75;
    }

    return 100;
  }
};
