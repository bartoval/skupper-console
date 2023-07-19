import { FC } from 'react';

import { DefaultEdge, Edge, EdgeTerminalType, WithSelectionProps } from '@patternfly/react-topology';

const ARROW_SIZE = 8;

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

export default CustomEdge;
