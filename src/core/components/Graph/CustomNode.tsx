import { FC } from 'react';

import { DefaultNode, WithDndDropProps, WithDragNodeProps, WithSelectionProps, Node } from '@patternfly/react-topology';

const ICON_SIZE = 15;

interface CustomNodeProps {
  element: Node;
}

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

export default CustomNode;
