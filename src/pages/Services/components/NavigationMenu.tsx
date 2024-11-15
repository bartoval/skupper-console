import { FC } from 'react';

import { Tab, TabTitleText, Tabs } from '@patternfly/react-core';

import useUpdateQueryStringValueWithoutNavigation from '../../../hooks/useUpdateQueryStringValueWithoutNavigation';
import { TopologyURLQueyParams } from '../../Topology/Topology.enum';
import { TAB_0_KEY, TAB_1_KEY, TAB_2_KEY, TAB_3_KEY, TAB_4_KEY, TAB_5_KEY } from '../Services.constants';
import { ServicesLabels } from '../Services.enum';

interface NavigationMenuProps {
  hasListenersOrConnectors: boolean;
  hasApplicationProtocol: boolean;
  serverCount: number;
  requestsCount: number;
  tcpActiveConnectionCount: number;
  tcpTerminatedConnectionCount: number;
  menuSelected: string;
  onMenuSelected?: (index: string) => void;
}
const NavigationMenu: FC<NavigationMenuProps> = function ({
  hasListenersOrConnectors,
  serverCount,
  requestsCount,
  tcpActiveConnectionCount,
  tcpTerminatedConnectionCount,
  hasApplicationProtocol,
  menuSelected,
  onMenuSelected
}) {
  useUpdateQueryStringValueWithoutNavigation(TopologyURLQueyParams.Type, menuSelected, true);

  const handleMenuClick = (tabIndex: string | number) => {
    onMenuSelected?.(tabIndex as string);
  };

  return (
    <Tabs activeKey={menuSelected} onSelect={(_, index) => handleMenuClick(index)} component="nav">
      <Tab eventKey={TAB_0_KEY} title={<TabTitleText>{`${ServicesLabels.Overview}`}</TabTitleText>} />
      <Tab
        isDisabled={!hasListenersOrConnectors}
        eventKey={TAB_5_KEY}
        title={<TabTitleText>{`${ServicesLabels.ListenersAndConnectors} `}</TabTitleText>}
      />
      <Tab
        isDisabled={!serverCount}
        eventKey={TAB_1_KEY}
        title={<TabTitleText>{`${ServicesLabels.Pairs} `}</TabTitleText>}
      />
      <Tab
        isDisabled={!tcpActiveConnectionCount}
        eventKey={TAB_3_KEY}
        title={<TabTitleText>{ServicesLabels.OpenConnections}</TabTitleText>}
      />
      <Tab
        isDisabled={!tcpTerminatedConnectionCount}
        eventKey={TAB_4_KEY}
        title={<TabTitleText>{ServicesLabels.OldConnections}</TabTitleText>}
      />
      {hasApplicationProtocol && (
        <Tab
          isDisabled={!requestsCount}
          eventKey={TAB_2_KEY}
          title={<TabTitleText>{ServicesLabels.Requests}</TabTitleText>}
        />
      )}
    </Tabs>
  );
};

export default NavigationMenu;
