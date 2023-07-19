import { Graph, Layout, LayoutFactory, ColaLayout as LayoutSelected } from '@patternfly/react-topology';

const LAYOUT_OPTIONS = {
  layoutOnDrag: false
};
export const LAYOUT_TYPE = 'Cola';

const CustomLayoutFactory: LayoutFactory = (_: string, graph: Graph): Layout | undefined =>
  new LayoutSelected(graph, LAYOUT_OPTIONS);

export default CustomLayoutFactory;
