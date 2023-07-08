import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DefaultEdge,
  DefaultGroup,
  DefaultNode,
  Edge,
  Graph,
  GraphComponent,
  graphDropTargetSpec,
  groupDropTargetSpec,
  Layout,
  LayoutFactory,
  Model,
  ModelKind,
  Node,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  NodeModel,
  SELECTION_EVENT,
  GRAPH_LAYOUT_END_EVENT,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
  withDndDrop,
  withDragNode,
  WithDndDropProps,
  WithDragNodeProps,
  withPanZoom,
  withSelection,
  WithSelectionProps,
  EdgeModel,
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  TopologyControlBar,
  TopologyView,
  EdgeTerminalType,
  withTargetDrag,
  DragObjectWithType,
  EdgeStyle,
  EdgeAnimationSpeed,
  ColaLayout as LayoutSelected,
  ComponentFactory,
  GraphModel
} from '@patternfly/react-topology';

import { GraphController } from './services';

import './topologyAdaptor.css';

const FIT_SCREEN_CACHE_KEY_SUFFIX = '-fitScreen';
const ZOOM_CACHE_KEY_SUFFIX = '-graphZoom';
const ICON_SIZE = 15;
const ARROW_SIZE = 8;
const FIT = 1;
const ZOOM_IN_RATE = 4 / 3;
const ZOOM_OUT_RATE = 3 / 4;

const LAYOUT_TYPE = 'Cola';
const LAYOUT_OPTIONS = {
  layoutOnDrag: false,
  maxTicks: 0
};

const GRAPH_PARAMS = {
  id: 'g1',
  type: 'graph',
  layout: LAYOUT_TYPE
};
interface CustomNodeProps {
  element: Node;
}

interface DataEdgeProps {
  element: Edge;
}

const CustomEdge: FC<DataEdgeProps & WithSelectionProps> = function ({ element, onSelect, selected, ...rest }) {
  return (
    <DefaultEdge
      element={element}
      endTerminalType={EdgeTerminalType.directionalAlt}
      endTerminalSize={ARROW_SIZE}
      onSelect={onSelect}
      selected={selected}
      {...rest}
    />
  );
};

const CustomNode: FC<CustomNodeProps & WithSelectionProps & WithDragNodeProps & WithDndDropProps> = function ({
  element,
  selected,
  //I'm considering using this callback instead of addEventListener(SELECTION_EVENT, ...) to handle edges, nodes, and groups separately. However, it appears that I am unable to achieve this using the current examples, as I require a callback from the parent for these events
  // ....or I can put this Component inside the TopologyAdaptor Component. However I don't think this is the best way.
  // The problem with using addEventListener(SELECTION_EVENT, ...) is that it only passes IDs as parameters. This makes it difficult to identify whether the event corresponds to a node or an edge. In my case, I was fortunate because the edge IDs had a different format compared to node IDs
  onSelect,
  ...rest
}) {
  const data = element.getData();
  const Icon = data?.icon;

  return (
    <DefaultNode
      element={element}
      showStatusDecorator
      onSelect={onSelect}
      selected={selected}
      className="topology_node-default"
      {...rest}
    >
      <g transform={`translate(15, 15)`}>
        <Icon style={{ color: '#393F44' }} width={ICON_SIZE} height={ICON_SIZE} />
      </g>
    </DefaultNode>
  );
};

const customLayoutFactory: LayoutFactory = (_: string, graph: Graph): Layout | undefined =>
  new LayoutSelected(graph, LAYOUT_OPTIONS);

const CONNECTOR_TARGET_DROP = 'connector-target-drop';
// I had to use "any". This code is coming from an example in PF doc that doesn't use "any". But without any , typescript scream
const customComponentFactory: ComponentFactory = (kind: ModelKind, t: string): any => {
  switch (t) {
    case 'group':
      return withDndDrop(groupDropTargetSpec)(
        // Mastering and gaining confidence in these functions from the documentation may not happen instantaneously
        withDragNode<any>({
          item: nodeDragSourceSpec('group'),
          end: (_, __, { element: group }: any) => {
            console.log('Drag end Group called');
            persistNodes(group);
          }
        })(withSelection()(DefaultGroup))
      );
    default:
      switch (kind) {
        case ModelKind.graph:
          return withDndDrop(graphDropTargetSpec())(withPanZoom()(GraphComponent));
        case ModelKind.node:
          return withDndDrop(nodeDropTargetSpec([CONNECTOR_TARGET_DROP]))(
            withDragNode({
              item: nodeDragSourceSpec('node') as any,
              end: (_, __, { element }: { element: Node }) => {
                console.log('Drag end Node called');

                persistNodes(element);
              }
            })(withSelection()(CustomNode))
          );
        case ModelKind.edge:
          return withTargetDrag<
            DragObjectWithType,
            Node,
            { dragging?: boolean },
            {
              element: Edge;
            }
          >({
            item: { type: CONNECTOR_TARGET_DROP },
            begin: (_, props) => {
              props.element.raise();

              return props.element;
            },
            drag: (event, _, props) => {
              props.element.setEndPoint(event.x, event.y);
            },
            end: (dropResult, monitor, props) => {
              if (monitor.didDrop() && dropResult && props) {
                props.element.setTarget(dropResult);
              }
              props.element.setEndPoint();
            },
            collect: (monitor) => ({
              dragging: monitor.isDragging()
            })
          })(withSelection()(CustomEdge));
        default:
          return undefined;
      }
  }
};

const TopologyAdaptor: FC<{
  nodes: NodeModel[];
  edges: EdgeModel[];
  itemSelected?: string;
  onClickNode: Function;
  onClickCombo?: Function;
  onClickEdge?: Function;
  onGetZoom: Function;
  config?: {
    zoom?: string | null;
    positions?: string | null;
    fitCenter?: boolean | null;
  };
}> = function ({ nodes, edges, onClickNode, onClickCombo, onClickEdge, onGetZoom, config }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLayoutSimulationEnd, setIsLayoutSimulationEnd] = useState(false);
  const nodesRef = useRef(nodes);

  const handleEndLayout = useCallback(
    ({ graph }: { graph: Graph }) => {
      console.log('graph end layout handler called');

      graph.getNodes().flatMap(persistNodes);
      setIsLayoutSimulationEnd(true);
    },
    [config?.positions, config?.zoom]
  );

  const handleSelectElement = useCallback(
    (ids: string[]) => {
      console.log('select handler called');

      const idSelected = ids[0];

      if (idSelected) {
        // select and edge. TODO: identify an edge using split('-to-') is not the proper way. Probably I Need an element/s more than ids
        if (onClickEdge && idSelected.split('-to-').length > 1) {
          const edge = edges.find(({ id }) => id === idSelected);
          setSelectedIds([idSelected]);

          return onClickEdge({ id: edge?.id, source: edge?.source });
        }

        // select a node
        const node = nodes.find(({ id }) => id === idSelected);

        if (onClickCombo && node?.type === 'group') {
          onClickCombo(node);
        } else {
          //if id !== frontend-xxxx process or id !== recommendation-service-xxx
          if (
            idSelected !== '99d0b02a-5a1b-47e7-8687-2e6f8c7e8c8b' &&
            idSelected !== '3861f850-687e-4f77-83cc-22074992c555'
          ) {
            onClickNode(node);
          }
        }
        setSelectedIds([idSelected]);
        mouseOverNodeBehaviour(controller, idSelected);
      }
    },
    [onClickEdge, nodes, onClickCombo, edges, onClickNode]
  );

  // Initialization
  const controller = useMemo(() => {
    console.log('init topology');

    let graphModel = GRAPH_PARAMS as GraphModel;

    if (config?.zoom && config?.positions) {
      const positions = config?.positions ? JSON.parse(config?.positions) : { x: 0, y: 0 };
      const scale = Number(config?.zoom || 1);
      graphModel = { ...GRAPH_PARAMS, x: positions.x, y: positions.y, scale };
    }

    const model: Model = {
      nodes,
      edges,
      graph: graphModel
    };

    const newController = new Visualization();
    newController.registerLayoutFactory(customLayoutFactory);
    newController.registerComponentFactory(customComponentFactory);

    newController.addEventListener(GRAPH_LAYOUT_END_EVENT, handleEndLayout);
    newController.addEventListener(SELECTION_EVENT, handleSelectElement);

    newController.fromModel(model, true);

    return newController;
  }, []);

  // Case: update the status of the topology. It happens when we a node is added/removed or when byte/rate from nodes changes (this happen only if we check the checkbox 'show metric')
  useEffect(() => {
    if (isLayoutSimulationEnd && controller && JSON.stringify(nodesRef.current) !== JSON.stringify(nodes)) {
      console.log('update model effect called');

      controller.fromModel({ ...controller.toModel().graph, nodes, edges }, true);
      nodesRef.current = nodes;
    }
  }, [isLayoutSimulationEnd, controller, nodes, edges]);

  const graph = controller.getGraph();

  return (
    <TopologyView
      controlBar={
        <TopologyControlBar
          controlButtons={createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            zoomInCallback: action(() => {
              graph.scaleBy(ZOOM_IN_RATE);
              onGetZoom(graph.getScale(), graph.getPosition());
            }),
            zoomOutCallback: action(() => {
              graph.scaleBy(ZOOM_OUT_RATE);
              onGetZoom(graph.getScale(), graph.getPosition());
            }),
            fitToScreenCallback: action(() => {
              graph.fit(FIT);
              // persist fit
              onGetZoom(graph.getScale(), graph.getPosition());
            }),
            resetViewCallback: action(() => {
              GraphController.cleanPositionsFromLocalStorage();
              GraphController.cleanPositionsControlsFromLocalStorage(FIT_SCREEN_CACHE_KEY_SUFFIX);
              GraphController.cleanPositionsControlsFromLocalStorage(ZOOM_CACHE_KEY_SUFFIX);
              graph.reset();
              graph.layout();
            }),
            legend: false
          })}
        />
      }
    >
      <VisualizationProvider controller={controller}>
        <VisualizationSurface state={{ selectedIds }} />
      </VisualizationProvider>
    </TopologyView>
  );
};

export default TopologyAdaptor;

// An external utility  store the nodes and their respective positions in the local storage.
function persistNodes(node: Node) {
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
}

// This behavior emulates the current mouseover effect in the current Skupper console.
function mouseOverNodeBehaviour(controller: Visualization, idSelected: string) {
  // should be placed in controller.graph this method?
  const nodeSelected = controller.getNodeById(idSelected);
  const allNodes = controller.getGraph().getNodes();

  const nodesFromSelectedNode = nodeSelected?.getSourceEdges().map((e) => e.getTarget()) || [];
  const nodesToSelectedNode = nodeSelected?.getTargetEdges().map((e) => e.getSource()) || [];

  const neighbors = [...nodesFromSelectedNode, ...nodesToSelectedNode];
  const neighborsIds = neighbors.map((edge) => edge.getId());

  //This is only a simulation if you click on the process frontend-xxxx or recommendation-service-xxx
  // after 6 seconds we restore the default state of the topology
  if (idSelected === '99d0b02a-5a1b-47e7-8687-2e6f8c7e8c8b' || idSelected === '3861f850-687e-4f77-83cc-22074992c555') {
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
