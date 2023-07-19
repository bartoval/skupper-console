import {
  DefaultGroup,
  Edge,
  GraphComponent,
  graphDropTargetSpec,
  groupDropTargetSpec,
  ModelKind,
  Node,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withDndDrop,
  withDragNode,
  withPanZoom,
  withSelection,
  withTargetDrag,
  DragObjectWithType,
  ComponentFactory
} from '@patternfly/react-topology';

import CustomEdge from './CustomEdge';
import CustomNode from './CustomNode';
import { GraphController } from './services';

const CONNECTOR_TARGET_DROP = 'connector-target-drop';

const CustomComponentFactory: ComponentFactory = (kind: ModelKind, t: string): any => {
  switch (t) {
    case 'group':
      return withDndDrop(groupDropTargetSpec)(
        // Mastering and gaining confidence in these functions from the documentation may not happen instantaneously
        withDragNode<any>({
          item: nodeDragSourceSpec('group'),
          end: (_, __, { element: group }: any) => {
            console.log('Drag end Group called');
            GraphController.persistNodes(group);
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

                GraphController.persistNodes(element);
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

export default CustomComponentFactory;
