import { Node, Visualization, EdgeStyle, EdgeAnimationSpeed } from '@patternfly/react-topology';

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

  // An external utility  store the nodes and their respective positions in the local storage.
  persistNodes(node: Node) {
    //nodes in the group
    const children = node.getChildren() as Node[];

    if (children.length) {
      const nodes = children.flatMap((child: Node) => {
        const { x, y } = child.getPosition();

        return { id: child.getId(), x, y };
      });
      GraphController.saveDataInLocalStorage(nodes);
    }

    const { x, y } = node.getPosition();
    GraphController.saveDataInLocalStorage([{ id: node.getId(), x, y }]);
  },

  // This behavior emulates the current mouseover effect in the current Skupper console.
  mouseOverNodeBehaviour(controller: Visualization, idSelected: string) {
    // should be placed in controller.graph this method?
    const nodeSelected = controller.getNodeById(idSelected);
    const allNodes = controller.getGraph().getNodes();

    const nodesFromSelectedNode = nodeSelected?.getSourceEdges().map((e) => e.getTarget()) || [];
    const nodesToSelectedNode = nodeSelected?.getTargetEdges().map((e) => e.getSource()) || [];

    const neighbors = [...nodesFromSelectedNode, ...nodesToSelectedNode];
    const neighborsIds = neighbors.map((edge) => edge.getId());

    //This is only a simulation if you click on the process frontend-xxxx or recommendation-service-xxx
    // after 6 seconds we restore the default state of the topology
    if (
      idSelected === '99d0b02a-5a1b-47e7-8687-2e6f8c7e8c8b' ||
      idSelected === '3861f850-687e-4f77-83cc-22074992c555'
    ) {
      controller
        .getGraph()
        .getEdges()
        .forEach((edge) => edge.setVisible(false));

      nodeSelected?.getSourceEdges().map((e) => {
        e.setVisible(true);
        e.setEdgeStyle(EdgeStyle.dashedMd);
        e.setEdgeAnimationSpeed(EdgeAnimationSpeed.fast);
      });
      nodeSelected?.getTargetEdges().map((e) => {
        e.setVisible(true);
        e.setEdgeStyle(EdgeStyle.dashedMd);
        e.setEdgeAnimationSpeed(EdgeAnimationSpeed.fast);
      });

      allNodes.forEach((group) => {
        (group.getChildren() as Node[]).map((childNode) => {
          if (![idSelected, ...neighborsIds].includes(childNode.getId())) {
            // It seems that this function messed up the position
            // In alternative (better) we can play with opacity but I didn't find a method to modify dynamically stiles or classes
            childNode.setVisible(false);
          }
        });
      });

      setTimeout(() => {
        controller
          .getGraph()
          .getEdges()
          .forEach((edge) => edge.setVisible(true));

        nodeSelected?.getSourceEdges().map((e) => e.setEdgeStyle(EdgeStyle.default));
        nodeSelected?.getTargetEdges().map((e) => e.setEdgeStyle(EdgeStyle.default));

        allNodes.forEach((group) => {
          (group.getChildren() as Node[]).forEach((childNode) => {
            if (![idSelected, ...neighborsIds].includes(childNode.getId())) {
              childNode.setVisible(true);
            }
          });
        });
      }, 6000);
    }
  }
};
