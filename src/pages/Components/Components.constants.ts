import { SKTableColumn } from 'types/SkTable.interfaces';

import { ComponentLabels, ComponentRoutesPaths } from './Components.enum';
import SkEndTimeCell from '../../core/components/SkEndTimeCell';
import SkLinkCell, { SkLinkCellProps } from '../../core/components/SkLinkCell';
import { ComponentResponse, PairsResponse } from '../../types/REST.interfaces';

export const ComponentsPaths = {
  path: ComponentRoutesPaths.Components,
  name: ComponentLabels.Section
};

export const CustomComponentCells = {
  TimestampCell: SkEndTimeCell,
  ComponentNameLinkCell: (props: SkLinkCellProps<ComponentResponse>) =>
    SkLinkCell({
      ...props,
      type: 'component',
      link: `${ComponentRoutesPaths.Components}/${props.data.name}@${props.data.identity}`
    }),
  ProcessCountCell: (props: SkLinkCellProps<ComponentResponse>) =>
    SkLinkCell({
      ...props,
      link: `${ComponentRoutesPaths.Components}/${props.data.name}@${props.data.identity}?type=${ComponentLabels.Processes}`
    })
};

export const CustomComponentPairCells = {
  ConnectedLinkCell: (props: SkLinkCellProps<PairsResponse>) =>
    SkLinkCell({
      ...props,
      type: 'component',
      link: `${ComponentRoutesPaths.Components}/${props.data.destinationName}@${props.data.destinationId}?type=${ComponentLabels.Pairs}`
    })
};

export const ComponentColumns: SKTableColumn<ComponentResponse>[] = [
  {
    name: ComponentLabels.Name,
    prop: 'name' as keyof ComponentResponse,
    customCellName: 'ComponentNameLinkCell'
  },
  {
    name: ComponentLabels.Count,
    prop: 'processCount' as keyof ComponentResponse,
    customCellName: 'ProcessCountCell',
    modifier: 'fitContent'
  },
  {
    name: ComponentLabels.Created,
    prop: 'startTime' as keyof ComponentResponse,
    customCellName: 'TimestampCell',
    modifier: 'fitContent'
  }
];
