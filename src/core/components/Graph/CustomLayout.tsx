import { Graph, Layout, LayoutFactory, ColaLayout as LayoutSelected } from '@patternfly/react-topology';

export const LAYOUT_TYPE = 'Cola';

const LAYOUT_OPTIONS = {
  layoutOnDrag: false
};

const CustomLayoutFactory: LayoutFactory = (_: string, graph: Graph): Layout | undefined =>
  new LayoutSelected(graph, LAYOUT_OPTIONS);

export default CustomLayoutFactory;
