import { NodeModel, EdgeModel } from '@patternfly/react-topology';

export interface LocalStorageDataSavedPayload {
  x: number;
  y: number;
}

export interface LocalStorageDataSaved {
  [key: string]: LocalStorageDataSavedPayload;
}

export interface LocalStorageData extends LocalStorageDataSavedPayload {
  id: string;
}

export interface LocalStorageDataWithNullXY extends Omit<LocalStorageData, 'x' | 'y'> {
  x: number | undefined;
  y: number | undefined;
}

export interface TopologyAdapterProps {
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
}
