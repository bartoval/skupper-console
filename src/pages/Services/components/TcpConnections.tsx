import { FC } from 'react';

import { tcpBiFlowColumns, tcpSelectOptions } from '../../../core/components/SkBiFlowList/BiFlowList.constants';
import { setColumnVisibility } from '../../../core/components/SkTable/SkTable.utils';
import BiFlowLogs from '../../shared/BiFlowLogs';
import { initActiveConnectionsQueryParams } from '../Services.constants';

interface TcpConnectionsProps {
  routingKey: string;
}

const TcpConnections: FC<TcpConnectionsProps> = function ({ routingKey }) {
  return (
    <BiFlowLogs
      options={tcpSelectOptions}
      columns={setColumnVisibility(tcpBiFlowColumns, { duration: false, endTime: false })}
      filters={{ ...initActiveConnectionsQueryParams, routingKey }}
    />
  );
};

export default TcpConnections;