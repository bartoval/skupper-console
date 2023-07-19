import { FC } from 'react';

import {
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  TopologyControlBar,
  Graph
} from '@patternfly/react-topology';

import { GraphController } from './services';

const FIT_SCREEN_CACHE_KEY_SUFFIX = '-fitScreen';
const ZOOM_CACHE_KEY_SUFFIX = '-graphZoom';

const FIT = 1;
const ZOOM_IN_RATE = 4 / 3;
const ZOOM_OUT_RATE = 3 / 4;

const CustomControllers: FC<{ graph: Graph; onGetZoom: Function }> = function ({ graph, onGetZoom }) {
  return (
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
  );
};

export default CustomControllers;
